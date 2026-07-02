"use client";

import { Card, CardContent } from "@afterservice/ui";
import {
  followUpChannelLabels,
  toFollowUpChannel,
} from "@/hooks/use-follow-up-filter-params";
import type { DashboardOverviewData } from "./overview-types";

function ChannelCard({
  label,
  total,
  value,
}: {
  label: string;
  total: number;
  value: number;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{percent}%</p>
        </div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <p className="text-2xl font-semibold">{value}</p>
          <div className="h-10 w-20 bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChannelCards({ data }: { data: DashboardOverviewData }) {
  const totalFollowUps = data.followUpStatuses.reduce(
    (total, item) => total + item.count,
    0,
  );

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {data.followUpChannels.map((item) => {
        const channel = toFollowUpChannel(item.channel);

        return (
          <ChannelCard
            key={item.channel}
            label={
              channel ? followUpChannelLabels[channel] : item.channel
            }
            value={item.count}
            total={totalFollowUps}
          />
        );
      })}
    </section>
  );
}
