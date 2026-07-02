"use client";

import {
  EmptyState as TableEmptyState,
  NoResults as TableNoResults,
} from "@/components/tables/core/empty-states";
import { useJobFilterParams } from "@/hooks/use-job-filter-params";
import { useJobParams } from "@/hooks/use-job-params";

export function EmptyState() {
  const { setParams } = useJobParams();

  return (
    <TableEmptyState
      title="No jobs"
      description="Log completed work to trigger the right customer follow-up."
      actionLabel="Create job"
      onAction={() => setParams({ createJob: true })}
    />
  );
}

export function NoResults() {
  const { setFilter } = useJobFilterParams();

  return <TableNoResults onClear={() => setFilter(null)} />;
}
