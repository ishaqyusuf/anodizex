"use client";

import type { AppRouter } from "@afterservice/api/router";
import { Button } from "@afterservice/ui";
import { Badge } from "@afterservice/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@afterservice/ui";
import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import {
  serviceJobStatusLabels,
  toServiceJobStatus,
} from "@/hooks/use-job-filter-params";

type JobsListPage = inferRouterOutputs<AppRouter>["serviceJobs"]["list"];
type ServiceJob = JobsListPage["items"][number];

export const columns: ColumnDef<ServiceJob>[] = [
  {
    id: "title",
    accessorKey: "title",
    header: "Title",
    size: 250,
    minSize: 200,
    maxSize: 400,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "Title",
      className:
        "w-[250px] min-w-[200px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
  },
  {
    id: "customer",
    accessorKey: "customer.name",
    header: "Customer",
    size: 200,
    minSize: 150,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Customer",
      className: "w-[200px] min-w-[150px]",
    },
    cell: ({ row }) => row.original.customer?.name ?? "-",
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    size: 150,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "badge" },
      headerLabel: "Status",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => {
      const status = toServiceJobStatus(row.original.status);

      return (
        <Badge variant={status === "completed" ? "default" : "secondary"}>
          {status ? serviceJobStatusLabels[status] : row.original.status}
        </Badge>
      );
    },
  },
  {
    id: "serviceCategory",
    accessorKey: "serviceCategory",
    header: "Category",
    size: 150,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Category",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => row.original.serviceCategory ?? "-",
  },
  {
    id: "amountCents",
    accessorKey: "amountCents",
    header: "Amount",
    size: 150,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-16" },
      headerLabel: "Amount",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => {
      const amount = row.original.amountCents;
      if (amount == null) return "-";
      return `$${(amount / 100).toFixed(2)}`;
    },
  },
  {
    id: "completedAt",
    accessorKey: "completedAt",
    header: "Completed at",
    size: 150,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Completed at",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => {
      const date = row.original.completedAt;
      if (!date) return "-";
      return format(new Date(date), "MMM d, yyyy");
    },
  },
  {
    id: "notes",
    accessorKey: "notes",
    header: "Notes",
    size: 250,
    minSize: 150,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-40" },
      headerLabel: "Notes",
      className: "w-[250px] min-w-[150px]",
    },
    cell: ({ row }) => (
      <span className="truncate block w-full">{row.original.notes ?? "-"}</span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    size: 100,
    minSize: 100,
    maxSize: 100,
    enableResizing: false,
    enableSorting: false,
    enableHiding: false,
    meta: {
      sticky: true,
      skeleton: { type: "icon" },
      headerLabel: "Actions",
      className:
        "text-right sticky right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-30 justify-center !border-l !border-border",
    },
    cell: ({ row, table }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                table.options.meta?.scheduleFollowUp?.(row.original.id);
              }}
            >
              Schedule follow-up
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
