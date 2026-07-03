import { getDbClient } from "@anodizex/db";
import {
  Notifications,
  type NotificationTypes,
} from "@anodizex/notifications";
import { logger, task } from "@trigger.dev/sdk/v3";

type NotificationTaskPayload = {
  [Type in keyof NotificationTypes]: {
    channels?: Array<"email" | "sms" | "whatsapp" | "phone">;
    payload: NotificationTypes[Type];
    sendEmail?: boolean;
    type: Type;
    workspaceId: string;
  };
}[keyof NotificationTypes];

export const notification = task({
  id: "notification",
  maxDuration: 60,
  queue: {
    concurrencyLimit: 5,
  },
  run: async (input: NotificationTaskPayload) => {
    const notifications = new Notifications(getDbClient());

    const result = await notifications.send(
      input.type,
      input.workspaceId,
      input.payload as never,
      {
        channels: input.channels,
        sendEmail: input.sendEmail ?? false,
      },
    );

    logger.info("Processed notification", {
      dispatches: result.dispatches,
      type: input.type,
      workspaceId: input.workspaceId,
    });

    return result;
  },
});

export const emailSmokeTest = task({
  id: "email-smoke-test",
  maxDuration: 60,
  run: async (input: { email: string }) => {
    const email = input.email.trim();

    if (!email) {
      throw new Error("email is required for the email smoke test.");
    }

    const db = getDbClient();
    const timestamp = new Date();
    const suffix = timestamp.getTime().toString(36);
    const workspace = await db.workspace.create({
      data: {
        name: "afterservice email smoke test",
        slug: `email-smoke-test-${suffix}`,
      },
      select: { id: true },
    });
    const customer = await db.customer.create({
      data: {
        workspaceId: workspace.id,
        name: "afterservice email smoke test",
        email,
        notes: `Created by Trigger.dev email smoke test at ${timestamp.toISOString()}`,
        tags: ["prod-email-smoke-test"],
      },
      select: { id: true },
    });
    const followUp = await db.followUp.create({
      data: {
        workspaceId: workspace.id,
        customerId: customer.id,
        channel: "email",
        dueAt: timestamp,
        notes: `Created by Trigger.dev email smoke test at ${timestamp.toISOString()}`,
      },
      select: { id: true },
    });
    const notifications = new Notifications(db);
    const result = await notifications.send(
      "followup_message_sent",
      workspace.id,
      {
        users: [
          {
            id: customer.id,
            email,
            workspace_id: workspace.id,
          },
        ],
        followUpId: followUp.id,
        customerId: customer.id,
        body: `afterservice production email smoke test at ${timestamp.toISOString()}`,
        channel: "email",
        recipient: email,
      },
      {
        channels: ["email"],
        sendEmail: true,
      },
    );
    const messageLog = await db.messageLog.findFirst({
      where: {
        workspaceId: workspace.id,
        followUpId: followUp.id,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        provider: true,
        providerId: true,
        status: true,
        sentAt: true,
      },
    });

    logger.info("Processed email smoke test", {
      dispatches: result.dispatches,
      messageLogId: messageLog?.id,
      messageLogStatus: messageLog?.status,
      workspaceId: workspace.id,
    });

    return {
      customerId: customer.id,
      followUpId: followUp.id,
      messageLog: messageLog
        ? {
            ...messageLog,
            providerId: messageLog.providerId ? "set" : null,
          }
        : null,
      result,
      workspaceId: workspace.id,
    };
  },
});
