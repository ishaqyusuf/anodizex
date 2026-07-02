import type { FollowUpStatus } from "@/hooks/use-follow-up-filter-params";

export const statusTone: Record<FollowUpStatus, string> = {
  closed: "bg-emerald-500",
  missed: "bg-red-500",
  open: "bg-sky-500",
  replied: "bg-teal-500",
  scheduled: "bg-violet-500",
  sent: "bg-amber-500",
};
