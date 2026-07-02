import { resolveEmailRecipients } from "@afterservice/utils";
import type { EmailInput } from "../base";

type EmailSendResult = {
  error?: unknown;
  originalRecipients: string[];
  providerId?: string;
  recipients: string[];
  status: "sent" | "failed" | "skipped";
  wasRecipientOverridden: boolean;
};

function readNonEmptyEnv(key: string) {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function emailBodyFromInput(email: EmailInput) {
  const body = email.data.body;

  if (typeof body === "string" && body.trim()) {
    return textToHtml(body);
  }

  return `<pre>${escapeHtml(JSON.stringify(email.data, null, 2))}</pre>`;
}

export class EmailService {
  async send(email: EmailInput): Promise<EmailSendResult> {
    const apiKey = readNonEmptyEnv("RESEND_API_KEY");
    const from = email.from || readNonEmptyEnv("EMAIL_FROM_ADDRESS");
    const recipients = resolveEmailRecipients(email.user.email);

    if (!apiKey || !from || recipients.recipients.length === 0) {
      return {
        originalRecipients: recipients.originalRecipients,
        recipients: recipients.recipients,
        status: "skipped",
        wasRecipientOverridden: recipients.isOverridden,
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        body: JSON.stringify({
          from,
          html: emailBodyFromInput(email),
          subject: email.subject,
          to: recipients.recipients,
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: unknown;
        id?: string;
      } | null;

      if (!response.ok || payload?.error) {
        return {
          error: payload?.error ?? response.statusText,
          originalRecipients: recipients.originalRecipients,
          recipients: recipients.recipients,
          status: "failed",
          wasRecipientOverridden: recipients.isOverridden,
        };
      }

      return {
        originalRecipients: recipients.originalRecipients,
        providerId: payload?.id,
        recipients: recipients.recipients,
        status: "sent",
        wasRecipientOverridden: recipients.isOverridden,
      };
    } catch (error) {
      return {
        error,
        originalRecipients: recipients.originalRecipients,
        recipients: recipients.recipients,
        status: "failed",
        wasRecipientOverridden: recipients.isOverridden,
      };
    }
  }
}
