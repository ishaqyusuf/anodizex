import type { NotificationHandler, TeamContext, UserData } from "../base";
import { followUpMessageSentSchema, type NotificationTypes } from "../schemas";

type Data = NotificationTypes["followup_message_sent"];

export const followUpMessageSent: NotificationHandler<Data> = {
  schema: followUpMessageSentSchema,
  createActivity: (data: Data, user: UserData) => ({
    type: "followup_message_sent",
    workspaceId: user.workspace_id,
    metadata: {
      followUpId: data.followUpId,
      customerId: data.customerId,
      channel: data.channel,
      recipient: data.recipient,
    },
  }),
  createEmail: (data: Data, user: UserData, team: TeamContext) => ({
    user,
    data: {
      customerId: data.customerId,
      followUpId: data.followUpId,
      body: data.body,
    },
    subject: `Update from ${team.name}`,
    template: "followup-message",
  }),
  createSms: (data: Data, user: UserData, _team: TeamContext) => ({
    user,
    data,
    body: data.body,
  }),
  createWhatsApp: (data: Data, user: UserData, _team: TeamContext) => ({
    user,
    data,
    body: data.body,
  }),
};
