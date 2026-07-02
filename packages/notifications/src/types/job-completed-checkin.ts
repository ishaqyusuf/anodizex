import type { NotificationHandler, TeamContext, UserData } from "../base";
import { jobCompletedCheckInSchema, type NotificationTypes } from "../schemas";

type Data = NotificationTypes["job_completed_checkin"];

export const jobCompletedCheckIn: NotificationHandler<Data> = {
  schema: jobCompletedCheckInSchema,
  createActivity: (data: Data, user: UserData) => ({
    type: "job_completed_checkin",
    workspaceId: user.workspace_id,
    metadata: {
      jobId: data.jobId,
      customerId: data.customerId,
    },
  }),
  createEmail: (data: Data, user: UserData, team: TeamContext) => ({
    user,
    data: {
      jobId: data.jobId,
      customerId: data.customerId,
    },
    subject: `Checking in on your recent service with ${team.name}`,
    template: "job-checkin",
  }),
  createSms: (data: Data, user: UserData, team: TeamContext) => ({
    user,
    data,
    body: `Hi from ${team.name}! We recently completed a job for you. How did everything go?`,
  }),
};
