"use client";

import { TableSkeleton } from "@/components/tables/core";
import { STICKY_COLUMNS } from "@/utils/table-configs";
import { columns } from "./columns";

export function JobsTableSkeleton() {
  return (
    <TableSkeleton
      columns={columns}
      rowCount={12}
      stickyColumnIds={STICKY_COLUMNS.jobs.map((column) => column.id)}
    />
  );
}
