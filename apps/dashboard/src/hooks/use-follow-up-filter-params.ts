import { useQueryStates } from "nuqs";
import { createLoader, parseAsString } from "nuqs/server";

export const followUpStatuses = [
  "open",
  "scheduled",
  "sent",
  "replied",
  "closed",
  "missed",
] as const;

export const followUpChannels = ["email", "sms", "phone", "whatsapp"] as const;

export type FollowUpStatus = (typeof followUpStatuses)[number];
export type FollowUpChannel = (typeof followUpChannels)[number];

export const followUpStatusLabels: Record<FollowUpStatus, string> = {
  closed: "Closed",
  missed: "Missed",
  open: "Open",
  replied: "Replied",
  scheduled: "Scheduled",
  sent: "Sent",
};

export const followUpChannelLabels: Record<FollowUpChannel, string> = {
  email: "Email",
  phone: "Phone",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

const followUpFilterParamsSchema = {
  q: parseAsString,
  channel: parseAsString,
  start: parseAsString,
  status: parseAsString,
  end: parseAsString,
};

export function toFollowUpStatus(value: string | null | undefined) {
  return followUpStatuses.includes(value as FollowUpStatus)
    ? (value as FollowUpStatus)
    : undefined;
}

export function toFollowUpChannel(value: string | null | undefined) {
  return followUpChannels.includes(value as FollowUpChannel)
    ? (value as FollowUpChannel)
    : undefined;
}

export function useFollowUpFilterParams() {
  const [filter, setFilter] = useQueryStates(followUpFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters:
      Boolean(filter.q) ||
      Boolean(toFollowUpChannel(filter.channel)) ||
      Boolean(toFollowUpStatus(filter.status)) ||
      Boolean(filter.start) ||
      Boolean(filter.end),
  };
}

export const loadFollowUpFilterParams = createLoader(followUpFilterParamsSchema);
