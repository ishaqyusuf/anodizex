"use client";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
} from "@afterservice/ui";
import Link from "next/link";
import {
  followUpChannelLabels,
  toFollowUpChannel,
} from "@/hooks/use-follow-up-filter-params";
import type { DashboardOverviewData } from "./overview-types";

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function WorkloadRow({
  color,
  href,
  label,
  maxValue,
  value,
}: {
  color: string;
  href: string;
  label: string;
  maxValue: number;
  value: number;
}) {
  return (
    <Link href={href} className="block space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden bg-muted">
        <div
          className={cn("h-full", color)}
          style={{
            width: `${Math.max((value / maxValue) * 100, value ? 8 : 0)}%`,
          }}
        />
      </div>
    </Link>
  );
}

export function WorkloadCard({ data }: { data: DashboardOverviewData }) {
  const { counts, followUpChannels, followUpStatuses, workspace } = data;
  const totalFollowUps = followUpStatuses.reduce(
    (total, item) => total + item.count,
    0,
  );
  const attentionCount = counts.overdueFollowUps + counts.dueToday;
  const resolvedRate =
    totalFollowUps > 0
      ? Math.round((counts.resolvedFollowUps / totalFollowUps) * 100)
      : 0;
  const busiestChannel = [...followUpChannels].sort(
    (a, b) => b.count - a.count,
  )[0];
  const topChannel = toFollowUpChannel(busiestChannel?.channel);
  const defaultDelay =
    workspace?.defaultFollowUpDelayDays == null
      ? "Not set"
      : `${workspace.defaultFollowUpDelayDays}d`;
  const workload = [
    {
      color: "bg-red-500",
      href: "/follow-ups",
      label: "Overdue",
      value: counts.overdueFollowUps,
    },
    {
      color: "bg-amber-500",
      href: "/follow-ups",
      label: "Due today",
      value: counts.dueToday,
    },
    {
      color: "bg-sky-500",
      href: "/follow-ups",
      label: "Next 7 days",
      value: counts.upcomingFollowUps,
    },
  ];
  const maxWorkload = Math.max(...workload.map((item) => item.value), 1);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 border-b pb-5">
        <div>
          <CardTitle className="mb-1 text-base">Today&apos;s queue</CardTitle>
          <p className="text-sm text-muted-foreground">
            What needs operator attention before tomorrow.
          </p>
        </div>
        <Badge
          className={cn(
            "border-transparent",
            attentionCount > 0
              ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
          )}
        >
          {attentionCount > 0 ? `${attentionCount} active` : "Clear"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {workload.map((item) => (
          <WorkloadRow
            href={item.href}
            key={item.label}
            label={item.label}
            color={item.color}
            value={item.value}
            maxValue={maxWorkload}
          />
        ))}
        <div className="grid gap-3 border-t pt-5 sm:grid-cols-3">
          <SummaryStat label="Resolved" value={`${resolvedRate}%`} />
          <SummaryStat label="Default delay" value={defaultDelay} />
          <SummaryStat
            label="Top channel"
            value={
              busiestChannel?.count
                ? topChannel
                  ? followUpChannelLabels[topChannel]
                  : busiestChannel.channel
                : "None"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
