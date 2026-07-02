"use client";

import {
  EmptyState as TableEmptyState,
  NoResults as TableNoResults,
} from "@/components/tables/core/empty-states";
import { useFollowUpFilterParams } from "@/hooks/use-follow-up-filter-params";
import { useFollowUpParams } from "@/hooks/use-follow-up-params";

export function EmptyState() {
  const { setParams } = useFollowUpParams();

  return (
    <TableEmptyState
      title="No follow-ups"
      description="Create a follow-up to keep the next customer check-in visible."
      actionLabel="Create follow-up"
      onAction={() => setParams({ createFollowUp: true })}
    />
  );
}

export function NoResults() {
  const { setFilter } = useFollowUpFilterParams();

  return <TableNoResults onClear={() => setFilter(null)} />;
}
