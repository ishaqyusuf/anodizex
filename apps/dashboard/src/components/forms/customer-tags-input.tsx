"use client";

import MultipleSelector, {
  type Option,
} from "@afterservice/ui/multiple-selector";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  formatCustomerTags,
  mergeCustomerTagOptions,
  parseCustomerTags,
  SYSTEM_CUSTOMER_TAGS,
  toCustomerTagOptions,
} from "@/lib/customer-tags";
import { useTRPC } from "@/trpc/client";

type Props = {
  disabled?: boolean;
  onChange: (value: string) => void;
  value?: string;
};

export function CustomerTagsInput({ disabled, onChange, value }: Props) {
  const trpc = useTRPC();
  const selectedTags = parseCustomerTags(value);

  const { data } = useQuery(trpc.customers.tags.queryOptions());

  const options = useMemo(() => {
    const existingTags = data?.items ?? [];

    return mergeCustomerTagOptions([
      toCustomerTagOptions(SYSTEM_CUSTOMER_TAGS, "system"),
      toCustomerTagOptions(existingTags, "existing"),
      toCustomerTagOptions(selectedTags, "selected"),
    ]);
  }, [data, selectedTags]);

  const selectedOptions = useMemo(
    () => toCustomerTagOptions(selectedTags, "selected"),
    [selectedTags],
  );

  function handleChange(nextOptions: Option[]) {
    onChange(
      formatCustomerTags(
        nextOptions.map((option) => {
          const match = options.find(
            (candidate) =>
              candidate.value.toLowerCase() === option.value.toLowerCase(),
          );

          return match?.value ?? option.value;
        }),
      ),
    );
  }

  return (
    <MultipleSelector
      badgeClassName="capitalize"
      className="min-h-9 rounded-md border border-input bg-transparent px-2"
      commandProps={{
        className: "overflow-visible bg-transparent",
      }}
      creatable
      disabled={disabled}
      emptyIndicator="No tags found"
      groupBy="source"
      inputProps={{
        className: "py-1.5",
      }}
      onChange={handleChange}
      options={options}
      placeholder="Add tags..."
      selectFirstItem={false}
      triggerSearchOnFocus
      value={selectedOptions}
    />
  );
}
