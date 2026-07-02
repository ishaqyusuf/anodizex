import type { StickyColumnConfig, TableConfig } from "@/components/tables/core";
import type { TableId } from "./table-settings";

export const STICKY_COLUMNS: Record<TableId, StickyColumnConfig[]> = {
  customers: [{ id: "name", width: 250 }],
  jobs: [{ id: "title", width: 250 }],
  templates: [{ id: "name", width: 250 }],
  "follow-ups": [{ id: "customer", width: 250 }],
};

export const SORT_FIELD_MAPS: Record<TableId, Record<string, string>> = {
  customers: {
    name: "name",
    companyName: "companyName",
    email: "email",
    phone: "phone",
    createdAt: "createdAt",
  },
  jobs: {
    title: "title",
    status: "status",
    completedAt: "completedAt",
    amountCents: "amountCents",
  },
  templates: {
    name: "name",
    channel: "channel",
    subject: "subject",
  },
  "follow-ups": {
    dueAt: "dueAt",
    status: "status",
    channel: "channel",
  },
};

export const NON_REORDERABLE_COLUMNS: Record<TableId, Set<string>> = {
  customers: new Set(["name", "actions"]),
  jobs: new Set(["title", "actions"]),
  templates: new Set(["name", "actions"]),
  "follow-ups": new Set(["customer", "actions"]),
};

export const ROW_HEIGHTS: Record<TableId, number> = {
  customers: 45,
  jobs: 45,
  templates: 45,
  "follow-ups": 57,
};

export const SUMMARY_GRID_HEIGHTS: Partial<Record<TableId, number>> = {
  customers: 180,
  jobs: 180,
};

export const TABLE_CONFIGS: Record<TableId, TableConfig> = {
  customers: {
    tableId: "customers",
    stickyColumns: STICKY_COLUMNS.customers,
    sortFieldMap: SORT_FIELD_MAPS.customers,
    nonReorderableColumns: NON_REORDERABLE_COLUMNS.customers,
    rowHeight: ROW_HEIGHTS.customers,
    summaryGridHeight: SUMMARY_GRID_HEIGHTS.customers,
  },
  jobs: {
    tableId: "jobs",
    stickyColumns: STICKY_COLUMNS.jobs,
    sortFieldMap: SORT_FIELD_MAPS.jobs,
    nonReorderableColumns: NON_REORDERABLE_COLUMNS.jobs,
    rowHeight: ROW_HEIGHTS.jobs,
    summaryGridHeight: SUMMARY_GRID_HEIGHTS.jobs,
  },
  templates: {
    tableId: "templates",
    stickyColumns: STICKY_COLUMNS.templates,
    sortFieldMap: SORT_FIELD_MAPS.templates,
    nonReorderableColumns: NON_REORDERABLE_COLUMNS.templates,
    rowHeight: ROW_HEIGHTS.templates,
  },
  "follow-ups": {
    tableId: "follow-ups",
    stickyColumns: STICKY_COLUMNS["follow-ups"],
    sortFieldMap: SORT_FIELD_MAPS["follow-ups"],
    nonReorderableColumns: NON_REORDERABLE_COLUMNS["follow-ups"],
    rowHeight: ROW_HEIGHTS["follow-ups"],
  },
};

export function getTableConfig(tableId: TableId): TableConfig {
  return TABLE_CONFIGS[tableId];
}
