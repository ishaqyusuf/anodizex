import { z } from "zod";

export const followUpScheduledSchema = z.object({
  users: z.array(z.any()), // will be strongly typed in use
  jobId: z.string().optional(),
  customerId: z.string(),
  dueAt: z.string(),
  notes: z.string().optional(),
  channel: z.enum(["email", "sms", "whatsapp", "phone"]).optional(),
});

export const followUpMessageSentSchema = z.object({
  users: z.array(z.any()),
  followUpId: z.string(),
  customerId: z.string(),
  body: z.string(),
  channel: z.enum(["email", "sms", "whatsapp", "phone"]),
  recipient: z.string(),
});

export const jobCompletedCheckInSchema = z.object({
  users: z.array(z.any()),
  jobId: z.string(),
  customerId: z.string(),
  completedAt: z.string(),
});

export type NotificationTypes = {
  followup_scheduled: z.infer<typeof followUpScheduledSchema>;
  followup_message_sent: z.infer<typeof followUpMessageSentSchema>;
  job_completed_checkin: z.infer<typeof jobCompletedCheckInSchema>;
};
