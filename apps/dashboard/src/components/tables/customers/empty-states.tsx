"use client";

import {
  EmptyState as TableEmptyState,
  NoResults as TableNoResults,
} from "@/components/tables/core/empty-states";
import { useCustomerFilterParams } from "@/hooks/use-customer-filter-params";
import { useCustomerParams } from "@/hooks/use-customer-params";

export function EmptyState() {
  const { setParams } = useCustomerParams();

  return (
    <TableEmptyState
      title="No customers"
      description="Create a customer record to attach jobs, follow-ups, and message history."
      actionLabel="Create customer"
      onAction={() => setParams({ createCustomer: true })}
    />
  );
}

export function NoResults() {
  const { setFilter } = useCustomerFilterParams();

  return <TableNoResults onClear={() => setFilter(null)} />;
}
