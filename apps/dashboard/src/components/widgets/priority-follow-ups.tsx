"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@afterservice/ui";
import { ArrowUpRight, Clock3 } from "lucide-react";
import Link from "next/link";
import {
  followUpStatusLabels,
  toFollowUpStatus,
} from "@/hooks/use-follow-up-filter-params";
import { formatDate } from "@/lib/dashboard-format";
import type { DashboardOverviewData } from "./overview-types";

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = toFollowUpStatus(status);
  const className =
    normalizedStatus === "missed"
      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-50"
      : normalizedStatus === "replied" || normalizedStatus === "closed"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
        : normalizedStatus === "sent"
          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
          : "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50";

  return (
    <Badge className={className}>
      {normalizedStatus ? followUpStatusLabels[normalizedStatus] : status}
    </Badge>
  );
}

export function PriorityFollowUps({ data }: { data: DashboardOverviewData }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b pb-5">
        <div>
          <CardTitle className="mb-1 text-base">Priority follow-ups</CardTitle>
          <p className="text-sm text-muted-foreground">
            Earliest open check-ins across active customers.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/follow-ups">
            View all
            <ArrowUpRight className="ml-2 size-3.5" />
          </Link>
        </Button>
      </CardHeader>
      {data.recentFollowUps.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="w-[90px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentFollowUps.map((followUp) => (
                <TableRow key={followUp.id}>
                  <TableCell className="font-medium">
                    {followUp.customerName}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-muted-foreground">
                    {followUp.serviceTitle ?? "General check-in"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={followUp.status} />
                  </TableCell>
                  <TableCell>{formatDate(followUp.dueAt)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/follow-ups?followUpId=${followUp.id}`}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
          <Clock3 className="size-6 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">No open follow-ups yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Schedule a follow-up to keep the next customer check-in visible.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/follow-ups">Open follow-ups</Link>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
