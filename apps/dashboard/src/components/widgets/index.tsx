"use client";

import { Button, Card, CardContent } from "@afterservice/ui";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { ChannelCards } from "./channel-cards";
import { FollowUpHealthCard } from "./follow-up-health-card";
import { OverviewHeader } from "./overview-header";
import { OverviewSkeleton } from "./overview-skeleton";
import type { DashboardOverviewData } from "./overview-types";
import { PriorityFollowUps } from "./priority-follow-ups";
import { RecentJobs } from "./recent-jobs";
import { WidgetCards } from "./widget-cards";
import { WorkloadCard } from "./workload-card";

const emptyCounts: DashboardOverviewData["counts"] = {
  completedThisWeek: 0,
  customers: 0,
  dueToday: 0,
  jobs: 0,
  openFollowUps: 0,
  overdueFollowUps: 0,
  resolvedFollowUps: 0,
  sentThisWeek: 0,
  upcomingFollowUps: 0,
};

function normalizeOverviewData(data: DashboardOverviewData) {
  return {
    ...data,
    counts: {
      ...emptyCounts,
      ...data.counts,
    },
    followUpChannels: data.followUpChannels ?? [],
    followUpStatuses: data.followUpStatuses ?? [],
    recentFollowUps: data.recentFollowUps ?? [],
    recentJobs: data.recentJobs ?? [],
  };
}

export function OverviewView() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.dashboard.overview.queryOptions());
  const router = useRouter();

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  if (!data) return <OverviewEmptyState onRetry={() => router.refresh()} />;

  const overviewData = normalizeOverviewData(data);

  return (
    <div className="space-y-6">
      <OverviewHeader data={overviewData} />
      <WidgetCards data={overviewData} />
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <WorkloadCard data={overviewData} />
        <FollowUpHealthCard data={overviewData} />
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <PriorityFollowUps data={overviewData} />
        <RecentJobs data={overviewData} />
      </section>
      <ChannelCards data={overviewData} />
    </div>
  );
}

function OverviewEmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="space-y-6">
      <section className="border-b border-border pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Workspace activity is not available yet.
        </p>
      </section>

      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium">No overview data found</p>
            <p className="max-w-xl text-sm text-muted-foreground">
              Refresh the dashboard to load counts, recent jobs, and follow-up
              health for this workspace.
            </p>
          </div>
          <Button variant="outline" onClick={onRetry}>
            Refresh dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
