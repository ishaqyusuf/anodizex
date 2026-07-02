import { useQueryStates } from "nuqs";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
} from "nuqs/server";

export const serviceJobStatuses = [
  "completed",
  "needs_follow_up",
  "resolved",
] as const;

export type ServiceJobStatus = (typeof serviceJobStatuses)[number];

export const serviceJobStatusLabels: Record<ServiceJobStatus, string> = {
  completed: "Completed",
  needs_follow_up: "Needs follow-up",
  resolved: "Resolved",
};

const jobFilterParamsSchema = {
  q: parseAsString,
  categories: parseAsArrayOf(parseAsString),
  customers: parseAsArrayOf(parseAsString),
  status: parseAsString,
  start: parseAsString,
  end: parseAsString,
};

export function toServiceJobStatus(value: string | null | undefined) {
  return serviceJobStatuses.includes(value as ServiceJobStatus)
    ? (value as ServiceJobStatus)
    : undefined;
}

export function useJobFilterParams() {
  const [filter, setFilter] = useQueryStates(jobFilterParamsSchema, {
    clearOnDefault: true,
  });

  return {
    filter,
    setFilter,
    hasFilters:
      Boolean(filter.q) ||
      Boolean(filter.categories?.length) ||
      Boolean(filter.customers?.length) ||
      Boolean(toServiceJobStatus(filter.status)) ||
      Boolean(filter.start) ||
      Boolean(filter.end),
  };
}

export const loadJobFilterParams = createLoader(jobFilterParamsSchema);
