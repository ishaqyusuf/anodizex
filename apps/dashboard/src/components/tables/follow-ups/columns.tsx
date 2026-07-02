"use client";

import type { AppRouter } from "@afterservice/api/router";
import { Badge } from "@afterservice/ui";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@afterservice/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@afterservice/ui";
import {
  followUpChannelLabels,
  followUpStatusLabels,
  toFollowUpChannel,
  toFollowUpStatus,
} from "@/hooks/use-follow-up-filter-params";

type FollowUpsListPage =
  inferRouterOutputs<AppRouter>["followUps"]["listTable"];
type FollowUp = FollowUpsListPage["items"][number];

export const columns: ColumnDef<FollowUp>[] = [
  {
    id: "customer",
    accessorKey: "customerName",
    header: "Customer",
    size: 250,
    minSize: 200,
    maxSize: 400,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "Customer",
      className:
        "w-[250px] min-w-[200px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => (
      <span className="font-medium">{row.original.customerName}</span>
    ),
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
      const status = toFollowUpStatus(row.original.status);

      return (
        <Badge
          variant={
            status === "closed" || status === "replied"
              ? "secondary"
              : "default"
          }
        >
          {status ? followUpStatusLabels[status] : row.original.status}
        </Badge>
      );
    },
  },
  {
    id: "channel",
    accessorKey: "channel",
    header: "Channel",
    size: 150,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "badge" },
      headerLabel: "Channel",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => {
      const channel = toFollowUpChannel(row.original.channel);

      return (
        <Badge variant="outline">
          {channel ? followUpChannelLabels[channel] : row.original.channel}
        </Badge>
      );
    },
  },
  {
    id: "dueAt",
    accessorKey: "dueAt",
    header: "Due at",
    size: 150,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Due at",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => {
      const date = row.original.dueAt;
      if (!date) return "-";
      return format(new Date(date), "MMM d, yyyy");
    },
  },
  {
    id: "job",
    accessorKey: "serviceTitle",
    header: "Job",
    size: 200,
    minSize: 150,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "Job",
      className: "w-[200px] min-w-[150px]",
    },
    cell: ({ row }) => (
      <span className="truncate block w-full">
        {row.original.serviceTitle ?? "-"}
      </span>
    ),
  },
  {
    id: "notes",
    accessorKey: "notes",
    header: "Notes",
    size: 300,
    minSize: 200,
    maxSize: 500,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-64" },
      headerLabel: "Notes",
      className: "w-[300px] min-w-[200px]",
    },
    cell: ({ row }) => <span className="truncate block w-full">{row.original.notes ?? "-"}</span>,
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
                table.options.meta?.closeFollowUp?.(row.original.id);
              }}
            >
              Close follow-up
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
