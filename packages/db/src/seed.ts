import type { FollowUpChannel } from "../generated/prisma/enums";

export type StarterTemplate = {
  body: string;
  channel: FollowUpChannel;
  isDefault: boolean;
  name: string;
  sortOrder: number;
  subject?: string;
};

export const starterFollowUpTemplates = [
  {
    body: "Hi {{customer.name}}, checking in after your recent {{job.title}}. Is everything working well?",
    channel: "email",
    isDefault: true,
    name: "Post-service check-in",
    sortOrder: 10,
    subject: "Checking in after your service",
  },
  {
    body: "Hi {{customer.name}}, just following up on {{job.title}}. Reply here if you need anything.",
    channel: "sms",
    isDefault: true,
    name: "Quick SMS follow-up",
    sortOrder: 20,
  },
  {
    body: "Call {{customer.name}} about {{job.title}} and record the outcome in the follow-up timeline.",
    channel: "phone",
    isDefault: false,
    name: "Phone call reminder",
    sortOrder: 30,
  },
] satisfies StarterTemplate[];

export function buildWorkspaceTemplateSeed(workspaceId: string) {
  return starterFollowUpTemplates.map((template) => ({
    ...template,
    workspaceId,
  }));
}
