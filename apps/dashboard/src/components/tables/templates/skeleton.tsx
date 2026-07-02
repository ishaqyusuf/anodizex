"use client";

import { TableSkeleton } from "@/components/tables/core";
import { STICKY_COLUMNS } from "@/utils/table-configs";
import { columns } from "./columns";

export function TemplatesTableSkeleton() {
  return (
    <TableSkeleton
      columns={columns}
      rowCount={12}
      stickyColumnIds={STICKY_COLUMNS.templates.map((column) => column.id)}
    />
  );
}
