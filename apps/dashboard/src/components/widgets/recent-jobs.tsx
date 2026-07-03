"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@anodizex/ui";
import { Send } from "lucide-react";
import Link from "next/link";
import {
  serviceJobStatusLabels,
  toServiceJobStatus,
} from "@/hooks/use-job-filter-params";
import { formatDate } from "@/lib/dashboard-format";
import type { DashboardOverviewData } from "./overview-types";

export function RecentJobs({ data }: { data: DashboardOverviewData }) {
  return (
    <Card>
      <CardHeader className="border-b pb-5">
        <CardTitle className="mb-1 text-base">Recent jobs</CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest completed work feeding the follow-up loop.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {data.recentJobs.length > 0 ? (
          <div className="divide-y">
            {data.recentJobs.map((job) => (
              <RecentJobLink key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
            <Send className="size-6 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No jobs logged yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Log completed work to create reliable follow-up moments.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/jobs">Open jobs</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type RecentJob = DashboardOverviewData["recentJobs"][number];

function RecentJobLink({ job }: { job: RecentJob }) {
  const status = toServiceJobStatus(job.status);

  return (
    <Link
      className="flex items-start justify-between gap-4 p-4 transition-colors hover:bg-muted/40"
      href="/jobs"
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium">{job.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {job.customerName} · {formatDate(job.completedAt)}
        </p>
      </div>
      <Badge variant="outline">
        {status ? serviceJobStatusLabels[status] : job.status}
      </Badge>
    </Link>
  );
}
