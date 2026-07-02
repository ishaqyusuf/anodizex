import type { NotificationHandler, TeamContext, UserData } from "../base";
import { followUpScheduledSchema, type NotificationTypes } from "../schemas";

type Data = NotificationTypes["followup_scheduled"];

export const followUpScheduled: NotificationHandler<Data> = {
  schema: followUpScheduledSchema,
  createActivity: (data: Data, user: UserData) => ({
    type: "followup_scheduled",
    workspaceId: user.workspace_id,
    metadata: {
      jobId: data.jobId,
      customerId: data.customerId,
      dueAt: data.dueAt,
      channel: data.channel,
    },
  }),
  createEmail: (data: Data, user: UserData, _team: TeamContext) => ({
    user,
    data: {
      customerId: data.customerId,
      dueAt: data.dueAt,
      notes: data.notes,
    },
    subject: "Follow Up Scheduled",
    template: "followup-scheduled",
  }),
  createSms: (data: Data, user: UserData, _team: TeamContext) => ({
    user,
    data,
    body: `Follow-up scheduled for customer ${data.customerId} on ${data.dueAt}.`,
  }),
};
