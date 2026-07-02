import { useQueryStates } from "nuqs";
import { createLoader, parseAsString } from "nuqs/server";

export const templateChannels = ["email", "sms", "phone", "whatsapp"] as const;

export type TemplateChannel = (typeof templateChannels)[number];

export const templateChannelLabels: Record<TemplateChannel, string> = {
  email: "Email",
  phone: "Phone",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export function toTemplateChannel(value: string | null) {
  return templateChannels.find((channel) => channel === value);
}

const templateFilterParamsSchema = {
  channel: parseAsString,
  q: parseAsString,
};

export function useTemplateFilterParams() {
  const [filter, setFilter] = useQueryStates(templateFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters: Boolean(filter.q) || Boolean(toTemplateChannel(filter.channel)),
  };
}

export const loadTemplateFilterParams = createLoader(templateFilterParamsSchema);
