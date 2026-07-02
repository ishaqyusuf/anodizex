import type { Metadata } from "next";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { ScrollableContent } from "@/components/scrollable-content";
import { JobsHeader } from "@/components/jobs-header";
import { DataTable } from "@/components/tables/jobs/data-table";
import { JobsTableSkeleton } from "@/components/tables/jobs/skeleton";
import {
  loadJobFilterParams,
  toServiceJobStatus,
} from "@/hooks/use-job-filter-params";
import { loadSortParams } from "@/hooks/use-sort-params";
import { batchPrefetch, HydrateClient, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/table-settings-server";

export const metadata: Metadata = {
  title: "Jobs | afterservice",
  description: "Record completed services.",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function JobsPage(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadJobFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);
  const initialSettings = await getInitialTableSettings("jobs");

  batchPrefetch([
    trpc.serviceJobs.list.infiniteQueryOptions(
      {
        q: filter.q ?? undefined,
        categories: filter.categories ?? undefined,
        customers: filter.customers ?? undefined,
        status: toServiceJobStatus(filter.status),
        start: filter.start ?? undefined,
        end: filter.end ?? undefined,
        sort: sort ?? undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="flex flex-col gap-6">
          <JobsHeader />

          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<JobsTableSkeleton />}>
              <DataTable initialSettings={initialSettings} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
