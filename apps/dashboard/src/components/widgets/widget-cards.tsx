"use client";

import { cn } from "@afterservice/ui";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { DashboardOverviewData } from "./overview-types";

interface WidgetCardProps {
  detail: string;
  href: string;
  label: string;
  tone: string;
  value: number;
}

function WidgetCard({ detail, href, label, tone, value }: WidgetCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-[116px] flex-col justify-between border border-border bg-background p-5 transition-colors hover:border-muted-foreground/30 hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div>
        <div className={cn("text-3xl font-semibold tracking-tight", tone)}>
          {value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
    </Link>
  );
}

export function WidgetCards({ data }: { data: DashboardOverviewData }) {
  const { counts } = data;
  const attentionCount = counts.overdueFollowUps + counts.dueToday;
  const metrics = [
    {
      detail:
        attentionCount > 0 ? `${attentionCount} need attention` : "Clear today",
      href: "/follow-ups",
      label: "Due today",
      tone: attentionCount > 0 ? "text-amber-600" : "text-emerald-600",
      value: counts.dueToday,
    },
    {
      detail:
        counts.overdueFollowUps > 0 ? "Past due follow-ups" : "Nothing overdue",
      href: "/follow-ups",
      label: "Overdue",
      tone: counts.overdueFollowUps > 0 ? "text-red-600" : "text-emerald-600",
      value: counts.overdueFollowUps,
    },
    {
      detail: `${counts.upcomingFollowUps} due next 7 days`,
      href: "/follow-ups",
      label: "Open follow-ups",
      tone: "text-sky-600",
      value: counts.openFollowUps,
    },
    {
      detail: `${counts.completedThisWeek} completed this week`,
      href: "/jobs",
      label: "Completed jobs",
      tone: "text-teal-600",
      value: counts.jobs,
    },
    {
      detail: "Active customer records",
      href: "/customers",
      label: "Customers",
      tone: "text-violet-600",
      value: counts.customers,
    },
    {
      detail:
        counts.sentThisWeek > 0 ? "Messages sent this week" : "No sends yet",
      href: "/templates",
      label: "Sent this week",
      tone: "text-stone-700",
      value: counts.sentThisWeek,
    },
  ];

  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Workspace metrics"
    >
      {metrics.map((metric) => (
        <WidgetCard key={metric.label} {...metric} />
      ))}
    </section>
  );
}
