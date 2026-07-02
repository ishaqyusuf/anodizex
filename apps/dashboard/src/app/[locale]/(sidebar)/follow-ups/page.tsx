import type { Metadata } from "next";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { ScrollableContent } from "@/components/scrollable-content";
import { FollowUpsHeader } from "@/components/follow-ups-header";
import { DataTable } from "@/components/tables/follow-ups/data-table";
import { FollowUpsTableSkeleton } from "@/components/tables/follow-ups/skeleton";
import {
  FollowUpsBoard,
  FollowUpsBoardSkeleton,
} from "@/components/boards/follow-ups-board";
import {
  loadFollowUpFilterParams,
  toFollowUpChannel,
  toFollowUpStatus,
} from "@/hooks/use-follow-up-filter-params";
import { loadSortParams } from "@/hooks/use-sort-params";
import { batchPrefetch, HydrateClient, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/table-settings-server";

export const metadata: Metadata = {
  title: "Follow-ups | afterservice",
  description: "Manage and track follow-ups.",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function FollowUpsPage(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadFollowUpFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);
  const initialSettings = await getInitialTableSettings("follow-ups");

  batchPrefetch([
    trpc.followUps.listTable.infiniteQueryOptions(
      {
        channel: toFollowUpChannel(filter.channel),
        end: filter.end ?? undefined,
        search: filter.q ?? undefined,
        status: toFollowUpStatus(filter.status),
        sort: sort ?? undefined,
        start: filter.start ?? undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
    trpc.followUps.listBoard.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="flex flex-col gap-6">
          <FollowUpsHeader />

          <ErrorBoundary fallback={<ErrorFallback />}>
            <section className="space-y-8 min-w-0">
              <Suspense fallback={<FollowUpsBoardSkeleton />}>
                <FollowUpsBoard />
              </Suspense>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">Follow-up history</h2>
                <Suspense fallback={<FollowUpsTableSkeleton />}>
                  <DataTable initialSettings={initialSettings} />
                </Suspense>
              </div>
            </section>
          </ErrorBoundary>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
