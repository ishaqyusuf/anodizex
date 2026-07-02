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
  templateChannelLabels,
  toTemplateChannel,
} from "@/hooks/use-template-filter-params";

type TemplatesListPage = inferRouterOutputs<AppRouter>["templates"]["list"];
type Template = TemplatesListPage["items"][number];

export const columns: ColumnDef<Template>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    size: 250,
    minSize: 200,
    maxSize: 400,
    enableResizing: true,
    meta: {
      sticky: true,
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "Name",
      className:
        "w-[250px] min-w-[200px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-[#0f0f0f] z-20",
    },
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
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
      const channel = toTemplateChannel(row.original.channel);

      return (
        <Badge variant="outline">
          {channel ? templateChannelLabels[channel] : row.original.channel}
        </Badge>
      );
    },
  },
  {
    id: "subject",
    accessorKey: "subject",
    header: "Subject",
    size: 250,
    minSize: 200,
    maxSize: 400,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-40" },
      headerLabel: "Subject",
      className: "w-[250px] min-w-[200px]",
    },
    cell: ({ row }) => <span className="truncate block w-full">{row.original.subject ?? "-"}</span>,
  },
  {
    id: "body",
    accessorKey: "body",
    header: "Body",
    size: 300,
    minSize: 200,
    maxSize: 600,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-64" },
      headerLabel: "Body",
      className: "w-[300px] min-w-[200px]",
    },
    cell: ({ row }) => <span className="truncate block w-full">{row.original.body}</span>,
  },
  {
    id: "isDefault",
    accessorKey: "isDefault",
    header: "Default",
    size: 100,
    minSize: 80,
    maxSize: 150,
    enableResizing: true,
    meta: {
      skeleton: { type: "badge" },
      headerLabel: "Default",
      className: "w-[100px] min-w-[80px]",
    },
    cell: ({ row }) => (
      row.original.isDefault ? <Badge variant="secondary">Yes</Badge> : "-"
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created at",
    size: 150,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Created at",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => {
      const date = row.original.createdAt;
      if (!date) return "-";
      return format(new Date(date), "MMM d, yyyy");
    },
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
                table.options.meta?.archiveTemplate?.(row.original.id);
              }}
            >
              Archive template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
