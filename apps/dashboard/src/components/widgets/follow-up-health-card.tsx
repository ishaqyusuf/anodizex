"use client";

import { Card, CardContent, CardHeader, CardTitle, cn } from "@anodizex/ui";
import {
  followUpStatusLabels,
  toFollowUpStatus,
} from "@/hooks/use-follow-up-filter-params";
import { statusTone } from "./constants";
import type { DashboardOverviewData } from "./overview-types";

function BreakdownRow({
  color,
  label,
  total,
  value,
}: {
  color: string;
  label: string;
  total: number;
  value: number;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <span className={cn("size-2", color)} />
          {label}
        </span>
        <span className="text-muted-foreground">
          {value} · {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden bg-muted">
        <div className={cn("h-full", color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function FollowUpHealthCard({ data }: { data: DashboardOverviewData }) {
  const totalFollowUps = data.followUpStatuses.reduce(
    (total, item) => total + item.count,
    0,
  );

  return (
    <Card>
      <CardHeader className="border-b pb-5">
        <CardTitle className="mb-1 text-base">Follow-up health</CardTitle>
        <p className="text-sm text-muted-foreground">
          Status mix across all follow-ups.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {data.followUpStatuses.map((item) => {
          const status = toFollowUpStatus(item.status);

          return (
            <BreakdownRow
              color={
                status ? statusTone[status] : "bg-muted-foreground"
              }
              key={item.status}
              label={status ? followUpStatusLabels[status] : item.status}
              total={totalFollowUps}
              value={item.count}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
