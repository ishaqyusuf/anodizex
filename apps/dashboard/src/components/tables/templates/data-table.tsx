"use client";

import type { AppRouter } from "@afterservice/api/router";
import { Table, TableBody, TableCell, TableRow } from "@afterservice/ui/table";
import { closestCenter, DndContext } from "@dnd-kit/core";
import { useMutation, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import type { inferRouterOutputs } from "@trpc/server";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { VirtualRow } from "@/components/tables/core";
import { useDashboardInvalidations } from "@/hooks/use-dashboard-invalidations";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { useSortParams } from "@/hooks/use-sort-params";
import { useStickyColumns } from "@/hooks/use-sticky-columns";
import { useTableDnd } from "@/hooks/use-table-dnd";
import { useTableScroll } from "@/hooks/use-table-scroll";
import { useTableSettings } from "@/hooks/use-table-settings";
import {
  toTemplateChannel,
  useTemplateFilterParams,
} from "@/hooks/use-template-filter-params";
import { useTemplateParams } from "@/hooks/use-template-params";
import { useTemplatesStore } from "@/store/templates";
import { useTRPC } from "@/trpc/client";
import { STICKY_COLUMNS, SUMMARY_GRID_HEIGHTS } from "@/utils/table-configs";
import { getColumnIds, type TableSettings } from "@/utils/table-settings";
import { columns } from "./columns";
import { EmptyState, NoResults } from "./empty-states";
import { DataTableHeader } from "./table-header";

// Stable reference for non-clickable columns (avoids recreation on each render)
const NON_CLICKABLE_COLUMNS = new Set(["actions"]);

const COLUMN_IDS = getColumnIds(columns);

type Props = {
  initialSettings?: Partial<TableSettings>;
};

type TemplatesListPage = inferRouterOutputs<AppRouter>["templates"]["list"];
type TemplateRow = TemplatesListPage["items"][number];

export function DataTable({ initialSettings }: Props) {
  const trpc = useTRPC();
  const invalidate = useDashboardInvalidations();
  const { setParams } = useTemplateParams();
  const { filter, hasFilters } = useTemplateFilterParams();
  const { params } = useSortParams();
  const parentRef = useRef<HTMLDivElement>(null);
  const { setColumns } = useTemplatesStore();

  const deferredSearch = useDeferredValue(filter.q);

  // Hide header and summary grid on scroll
  useScrollHeader(parentRef, { extraOffset: SUMMARY_GRID_HEIGHTS.templates });

  // Use unified table settings hook for column state management
  const {
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    columnOrder,
    setColumnOrder,
  } = useTableSettings({
    tableId: "templates",
    initialSettings,
    columnIds: COLUMN_IDS,
  });

  const infiniteQueryOptions = trpc.templates.list.infiniteQueryOptions(
    {
      channel: toTemplateChannel(filter.channel),
      search: deferredSearch ?? undefined,
      sort: params.sort ?? undefined,
    },
    {
      getNextPageParam: (lastPage: TemplatesListPage) => lastPage.nextCursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const archiveTemplateMutation = useMutation(
    trpc.templates.archive.mutationOptions({
      onSuccess: (_data, variables) => {
        invalidate.templates(variables.id);
      },
    }),
  );

  const handleArchiveTemplate = useCallback(
    (id: string) => {
      archiveTemplateMutation.mutate({ id });
    },
    [archiveTemplateMutation],
  );

  const tableData = useMemo<TemplateRow[]>(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const setOpen = useCallback(
    (id?: string) => {
      if (id) {
        setParams({ templateId: id });
      } else {
        setParams(null);
      }
    },
    [setParams],
  );

  const tableMeta = useMemo(
    () => ({
      archiveTemplate: handleArchiveTemplate,
    }),
    [handleArchiveTemplate],
  );

  const table = useReactTable({
    data: tableData,
    getRowId: (row) => row.id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    state: {
      columnVisibility,
      columnSizing,
      columnOrder,
    },
    meta: tableMeta,
  });

  // DnD for column reordering
  const { sensors, handleDragEnd } = useTableDnd(table);

  // Sync columns to store for column visibility toggle
  useEffect(() => {
    setColumns(table.getAllLeafColumns());
  }, [table, setColumns]);

  // Use the reusable sticky columns hook
  const { getStickyStyle, getStickyClassName } = useStickyColumns({
    columnVisibility,
    table,
    stickyColumns: STICKY_COLUMNS.templates,
  });

  // Use the reusable table scroll hook
  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 1, // Skip sticky name column
  });

  const rows = table.getRowModel().rows;

  // Row virtualizer for performance
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  // Trigger infinite load when scrolling near the bottom
  useInfiniteScroll<HTMLDivElement>({
    scrollRef: parentRef,
    rowVirtualizer,
    rowCount: rows.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    threshold: 50,
  });

  if (!tableData.length && hasFilters) {
    return <NoResults />;
  }

  if (!tableData.length) {
    return <EmptyState />;
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="relative">
      <div className="w-full">
        <div
          ref={(el) => {
            if (parentRef) {
              (
                parentRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = el;
            }
            if (tableScroll.containerRef) {
              (
                tableScroll.containerRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = el;
            }
          }}
          className="overflow-auto overscroll-contain border-l border-r border-b border-border scrollbar-hide"
          style={{
            height: "calc(100vh - 350px + var(--header-offset, 0px))",
          }}
        >
          <DndContext
            id="templates-table-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table className="w-full min-w-full">
              <DataTableHeader table={table} tableScroll={tableScroll} />

              <TableBody
                className="border-l-0 border-r-0 block"
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: "relative",
                }}
              >
                {virtualItems.length > 0 ? (
                  virtualItems.map((virtualRow: VirtualItem) => {
                    const row = rows[virtualRow.index];
                    if (!row) return null;

                    return (
                      <VirtualRow
                        key={row.id}
                        row={row}
                        virtualStart={virtualRow.start}
                        rowHeight={45}
                        getStickyStyle={getStickyStyle}
                        getStickyClassName={getStickyClassName}
                        nonClickableColumns={NON_CLICKABLE_COLUMNS}
                        onCellClick={setOpen}
                        columnSizing={columnSizing}
                        columnOrder={columnOrder}
                        columnVisibility={columnVisibility}
                      />
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Preparing rows...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
          {/* Spacer ensures scrolling works when content barely overflows */}
          <div
            style={{ height: "var(--header-offset, 0px)", flexShrink: 0 }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
