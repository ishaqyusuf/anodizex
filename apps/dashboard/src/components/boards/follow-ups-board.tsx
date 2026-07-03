"use client";

import type { AppRouter } from "@anodizex/api/router";
import { Badge, Button, Card, CardContent, Skeleton } from "@anodizex/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import {
  followUpChannelLabels,
  toFollowUpChannel,
} from "@/hooks/use-follow-up-filter-params";
import { useFollowUpParams } from "@/hooks/use-follow-up-params";
import { resolveTemplate } from "@/lib/dashboard-format";
import { useTRPC } from "@/trpc/client";

type FollowUpsBoardData =
  inferRouterOutputs<AppRouter>["followUps"]["listBoard"];
type FollowUpsBoardColumns = FollowUpsBoardData["columns"];
type BoardItem = FollowUpsBoardColumns[keyof FollowUpsBoardColumns][number];

const boardColumns = ["due", "upcoming", "waiting", "replied", "closed"];
const boardCardSkeletons = ["first", "second", "third"];

export function FollowUpsBoard() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.followUps.listBoard.queryOptions());
  const { columns } = data;

  if (!columns) return null;

  const totalItems =
    columns.dueToday.length +
    columns.upcoming.length +
    columns.waiting.length +
    columns.replied.length +
    columns.closed.length;

  if (totalItems === 0) {
    return <FollowUpsBoardEmptyState />;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
      <BoardColumn title="Due today" items={columns.dueToday} />
      <BoardColumn title="Upcoming" items={columns.upcoming} />
      <BoardColumn title="Waiting" items={columns.waiting} />
      <BoardColumn title="Replied" items={columns.replied} />
      <BoardColumn title="Closed" items={columns.closed} />
    </div>
  );
}

export function FollowUpsBoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
      {boardColumns.map((column) => (
        <div
          key={column}
          className="flex w-[300px] shrink-0 snap-start flex-col rounded-lg bg-muted/50 p-3"
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="space-y-3">
            {boardCardSkeletons.map((card) => (
              <div
                key={`${column}-${card}`}
                className="rounded-md border border-border bg-card p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="mb-3 h-3 w-36" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FollowUpsBoardEmptyState() {
  const { setParams } = useFollowUpParams();

  return (
    <Card>
      <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
          <ClipboardList className="size-5" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-medium">No follow-ups</h2>
          <p className="text-sm text-muted-foreground">
            Create a follow-up to keep the next customer check-in visible.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setParams({ createFollowUp: true })}
        >
          Create follow-up
        </Button>
      </CardContent>
    </Card>
  );
}

function BoardColumn({ items, title }: { items: BoardItem[]; title: string }) {
  return (
    <div className="flex flex-col w-[300px] shrink-0 snap-start bg-muted/50 rounded-lg p-3">
      <h2 className="text-sm font-semibold mb-3 flex items-center justify-between px-1">
        {title}
        <span className="bg-background text-muted-foreground px-2 py-0.5 rounded-full text-xs">
          {items.length}
        </span>
      </h2>
      <div className="space-y-3 flex-1 overflow-y-auto min-h-[100px]">
        {items.map((item) => (
          <FollowUpCard item={item} key={item.id} />
        ))}
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No follow-ups in this stage.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FollowUpCard({ item }: { item: BoardItem }) {
  const channel = toFollowUpChannel(item.channel);
  const body = resolveTemplate(
    item.notes ?? "Checking in after your service.",
    {
      businessName: "afterservice",
      customerName: item.customerName,
      serviceName: item.serviceTitle,
    },
  );

  return (
    <Link
      href={`?followUpId=${item.id}`}
      scroll={false}
      className="block bg-card rounded-md border border-border p-3 shadow-sm hover:border-primary/50 transition-colors text-left"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-medium truncate">
          {item.customerName}
        </span>
        <Badge variant="outline" className="shrink-0">
          {channel ? followUpChannelLabels[channel] : item.channel}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground mb-2 truncate">
        {item.serviceTitle}
      </div>
      <p className="text-sm line-clamp-2 text-foreground/80">{body}</p>
    </Link>
  );
}
