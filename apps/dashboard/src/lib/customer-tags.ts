import type { Option } from "@anodizex/ui/multiple-selector";

export const SYSTEM_CUSTOMER_TAGS = [
  "vip",
  "warranty",
  "fleet",
  "follow-up",
  "repeat",
  "priority",
  "inspection",
  "maintenance",
  "review-request",
  "callback",
] as const;

type TagOptionSource = "system" | "existing" | "selected";

export type CustomerTagOption = Option & {
  source: TagOptionSource;
};

export function parseCustomerTags(value: string | null | undefined) {
  return dedupeTags(value?.split(",") ?? []);
}

export function formatCustomerTags(tags: string[]) {
  return dedupeTags(tags).join(", ");
}

export function toCustomerTagOptions(
  tags: readonly string[],
  source: TagOptionSource,
): CustomerTagOption[] {
  return dedupeTags(tags).map((tag) => ({
    label: tag,
    source,
    value: tag,
  }));
}

export function mergeCustomerTagOptions(
  groups: CustomerTagOption[][],
): CustomerTagOption[] {
  const seen = new Set<string>();
  const options: CustomerTagOption[] = [];

  for (const option of groups.flat()) {
    const value = option.value.trim();
    const key = value.toLowerCase();

    if (!value || seen.has(key)) {
      continue;
    }

    seen.add(key);
    options.push({ ...option, label: value, value });
  }

  return options;
}

function dedupeTags(tags: readonly string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const value = tag.trim();
    const key = value.toLowerCase();

    if (!value || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(value);
  }

  return result;
}
