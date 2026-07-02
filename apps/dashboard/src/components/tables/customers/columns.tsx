"use client";

import type { AppRouter } from "@afterservice/api/router";
import { Badge } from "@afterservice/ui";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import { MoreHorizontal, Mail, Phone, Building } from "lucide-react";
import { Button } from "@afterservice/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@afterservice/ui";

type CustomersListPage = inferRouterOutputs<AppRouter>["customers"]["list"];
type Customer = CustomersListPage["items"][number];

export const columns: ColumnDef<Customer>[] = [
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
    id: "companyName",
    accessorKey: "companyName",
    header: "Company",
    size: 200,
    minSize: 150,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Company",
      className: "w-[200px] min-w-[150px]",
    },
    cell: ({ row }) => (
      <div className="flex items-center text-muted-foreground">
        {row.original.companyName ? (
          <>
            <Building className="mr-2 h-4 w-4" />
            {row.original.companyName}
          </>
        ) : (
          "-"
        )}
      </div>
    ),
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
    size: 220,
    minSize: 150,
    maxSize: 350,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-32" },
      headerLabel: "Email",
      className: "w-[220px] min-w-[150px]",
    },
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.email ? (
          <>
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${row.original.email}`} className="hover:underline">
              {row.original.email}
            </a>
          </>
        ) : (
          "-"
        )}
      </div>
    ),
  },
  {
    id: "phone",
    accessorKey: "phone",
    header: "Phone",
    size: 150,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-24" },
      headerLabel: "Phone",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => (
      <div className="flex items-center">
        {row.original.phone ? (
          <>
            <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
            <a href={`tel:${row.original.phone}`} className="hover:underline">
              {row.original.phone}
            </a>
          </>
        ) : (
          "-"
        )}
      </div>
    ),
  },
  {
    id: "lastServiceAt",
    accessorKey: "lastServiceAt",
    header: "Last service",
    size: 150,
    minSize: 120,
    maxSize: 200,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-20" },
      headerLabel: "Last service",
      className: "w-[150px] min-w-[120px]",
    },
    cell: ({ row }) => {
      const date = row.original.lastServiceAt;
      if (!date) return "-";
      return format(new Date(date), "MMM d, yyyy");
    },
  },
  {
    id: "openFollowUpCount",
    accessorKey: "openFollowUpCount",
    header: "Follow-ups",
    size: 120,
    minSize: 100,
    maxSize: 150,
    enableResizing: true,
    meta: {
      skeleton: { type: "text", width: "w-10" },
      headerLabel: "Follow-ups",
      className: "w-[120px] min-w-[100px]",
    },
    cell: ({ row }) => {
      const count = row.original.openFollowUpCount;
      if (count === 0) return "-";
      return (
        <Badge variant="secondary">
          {count} open
        </Badge>
      );
    },
  },
  {
    id: "tags",
    accessorKey: "tags",
    header: "Tags",
    size: 200,
    minSize: 150,
    maxSize: 300,
    enableResizing: true,
    meta: {
      skeleton: { type: "tags" },
      headerLabel: "Tags",
      className: "w-[200px] min-w-[150px]",
    },
    cell: ({ row }) => {
      const tags = row.original.tags;
      if (!tags || tags.length === 0) return "-";
      return (
        <div className="flex gap-1 flex-wrap">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      );
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
                table.options.meta?.archiveCustomer?.(row.original.id);
              }}
            >
              Archive customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
