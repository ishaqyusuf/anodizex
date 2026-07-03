import type { Prisma, PrismaClient } from "@anodizex/db";
import { WhatsAppService } from "@anodizex/whatsapp";
import type {
  NotificationHandler,
  NotificationOptions,
  NotificationResult,
  UserData,
} from "./base";
import type { NotificationTypes } from "./schemas";
import { EmailService } from "./services/email-service";
import { followUpMessageSent } from "./types/followup-message-sent";
import { followUpScheduled } from "./types/followup-scheduled";
import { jobCompletedCheckIn } from "./types/job-completed-checkin";

const handlers = {
  followup_scheduled: followUpScheduled,
  followup_message_sent: followUpMessageSent,
  job_completed_checkin: jobCompletedCheckIn,
} as const;

type ParsedNotificationPayload = {
  users?: UserData[];
} & Record<string, unknown>;

function stringField(data: Record<string, unknown> | undefined, key: string) {
  const value = data?.[key];
  return typeof value === "string" ? value : undefined;
}

function jsonObject(
  data: Record<string, unknown> | undefined,
): Prisma.InputJsonObject | undefined {
  if (!data) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Prisma.InputJsonObject;
}

export class Notifications {
  #db: PrismaClient;
  #emailService: EmailService;
  #whatsappService: WhatsAppService | null = null;

  constructor(db: PrismaClient) {
    this.#db = db;
    this.#emailService = new EmailService();
    // We optionally initialize it if env vars exist
    if (
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER
    ) {
      this.#whatsappService = new WhatsAppService(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
        process.env.TWILIO_WHATSAPP_NUMBER,
      );
    }
  }

  async send<T extends keyof NotificationTypes>(
    type: T,
    workspaceId: string,
    payload: NotificationTypes[T],
    options?: NotificationOptions,
  ): Promise<NotificationResult> {
    const handler = handlers[
      type
    ] as unknown as NotificationHandler<ParsedNotificationPayload>;

    if (!handler) {
      throw new Error(`Unknown notification type: ${String(type)}`);
    }

    try {
      // 1. Validate Payload
      const validatedData = handler.schema.parse(payload);

      // 2. Fetch Team/Workspace Info
      const workspace = await this.#db.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
      });

      const teamContext = {
        id: workspace.id,
        name: workspace.name,
        defaultFollowUpDelayDays: workspace.defaultFollowUpDelayDays,
      };

      // 3. Prepare Activities and Dispatches
      const users = Array.isArray(validatedData.users)
        ? validatedData.users
        : [];
      const activitiesToCreate = [];

      const emailDispatches = [];
      const smsDispatches = [];
      const whatsappDispatches = [];

      for (const user of users) {
        // Record Activity
        const activityInput = handler.createActivity(validatedData, user);
        activitiesToCreate.push(activityInput);

        const channels = options?.channels || ["email"]; // default channel

        if (channels.includes("email") && handler.createEmail) {
          const emailInput = handler.createEmail(
            validatedData,
            user,
            teamContext,
          );
          emailDispatches.push(emailInput);
        }

        if (channels.includes("sms") && handler.createSms) {
          const smsInput = handler.createSms(validatedData, user, teamContext);
          smsDispatches.push(smsInput);
        }

        if (channels.includes("whatsapp") && handler.createWhatsApp) {
          const whatsappInput = handler.createWhatsApp(
            validatedData,
            user,
            teamContext,
          );
          whatsappDispatches.push(whatsappInput);
        }
      }

      // 4. Save Activities
      for (const activity of activitiesToCreate) {
        // Find existing follow up or job to tie event
        const followUpId = stringField(activity.metadata, "followUpId");

        if (followUpId) {
          await this.#db.followUpEvent.create({
            data: {
              type: activity.type,
              workspaceId: activity.workspaceId,
              followUpId,
              metadata: jsonObject(activity.metadata),
              actorId: activity.actorId,
            },
          });
        }
      }

      // 5. Execute Dispatches
      let emailsSent = 0;
      let emailsFailed = 0;
      let smsSent = 0;
      const smsFailed = 0;
      let whatsappSent = 0;
      const whatsappFailed = 0;
      const shouldSendEmail = options?.sendEmail ?? false;

      for (const dispatch of emailDispatches) {
        const result = shouldSendEmail
          ? await this.#emailService.send(dispatch)
          : undefined;
        const finalStatus = result?.status ?? "sent";
        const recipient =
          result?.recipients.join(", ") ||
          result?.originalRecipients.join(", ") ||
          dispatch.user.email;

        await this.#db.messageLog.create({
          data: {
            workspaceId: workspaceId,
            customerId: stringField(dispatch.data, "customerId"),
            followUpId: stringField(dispatch.data, "followUpId"),
            channel: "email",
            recipient,
            subject: dispatch.subject,
            body:
              typeof dispatch.data?.body === "string"
                ? dispatch.data.body
                : JSON.stringify(dispatch.data),
            provider: shouldSendEmail ? "resend" : null,
            providerId: result?.providerId ?? null,
            errorDetails: result?.error
              ? jsonObject({
                  error:
                    result.error instanceof Error
                      ? result.error.message
                      : String(result.error),
                })
              : result?.wasRecipientOverridden
                ? jsonObject({
                    originalRecipients: result.originalRecipients,
                    testEmailOverride: true,
                  })
                : undefined,
            status: finalStatus,
            sentAt: finalStatus === "sent" ? new Date() : null,
          },
        });

        if (finalStatus === "sent") {
          emailsSent++;
        } else if (finalStatus === "failed") {
          emailsFailed++;
        }
      }

      // Log SMS
      for (const dispatch of smsDispatches) {
        await this.#db.messageLog.create({
          data: {
            workspaceId: workspaceId,
            customerId: stringField(dispatch.data, "customerId"),
            followUpId: stringField(dispatch.data, "followUpId"),
            channel: "sms",
            recipient: dispatch.user.phone || dispatch.user.email,
            body: dispatch.body,
            status: "sent",
            sentAt: new Date(),
          },
        });
        smsSent++;
      }

      // Log WhatsApp
      for (const dispatch of whatsappDispatches) {
        let providerId: string | undefined;
        let finalStatus = "sent";

        if (
          this.#whatsappService &&
          (dispatch.user.phone || dispatch.user.email)
        ) {
          try {
            const result = await this.#whatsappService.send({
              to: dispatch.user.phone || dispatch.user.email,
              body: dispatch.body,
              template: dispatch.template,
            });
            providerId = result.providerId;
            finalStatus = result.status;
          } catch (err: unknown) {
            console.error("WhatsApp delivery failed:", err);
            finalStatus = "failed";
          }
        }

        await this.#db.messageLog.create({
          data: {
            workspaceId: workspaceId,
            customerId: stringField(dispatch.data, "customerId"),
            followUpId: stringField(dispatch.data, "followUpId"),
            channel: "whatsapp",
            recipient: dispatch.user.phone || dispatch.user.email,
            body: dispatch.body || "",
            status: finalStatus,
            providerId: providerId || null,
            sentAt: new Date(),
          },
        });
        whatsappSent++;
      }

      return {
        type: String(type),
        activities: activitiesToCreate.length,
        dispatches: {
          email: { sent: emailsSent, failed: emailsFailed },
          sms: { sent: smsSent, failed: smsFailed },
          whatsapp: { sent: whatsappSent, failed: whatsappFailed },
        },
      };
    } catch (error) {
      console.error(`Failed to send notification ${type}:`, error);
      throw error;
    }
  }
}

export type {
  EmailInput,
  NotificationHandler,
  NotificationOptions,
  NotificationResult,
  SmsInput,
  UserData,
  WhatsAppInput,
} from "./base";
export { EmailService };
export type { NotificationTypes } from "./schemas";
