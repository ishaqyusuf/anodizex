import type { Metadata } from "next";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { ScrollableContent } from "@/components/scrollable-content";
import { TemplatesHeader } from "@/components/templates-header";
import { DataTable } from "@/components/tables/templates/data-table";
import { TemplatesTableSkeleton } from "@/components/tables/templates/skeleton";
import {
  loadTemplateFilterParams,
  toTemplateChannel,
} from "@/hooks/use-template-filter-params";
import { loadSortParams } from "@/hooks/use-sort-params";
import { batchPrefetch, HydrateClient, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/table-settings-server";

export const metadata: Metadata = {
  title: "Templates | afterservice",
  description: "Manage your follow-up templates.",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function TemplatesPage(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadTemplateFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);
  const initialSettings = await getInitialTableSettings("templates");

  batchPrefetch([
    trpc.templates.list.infiniteQueryOptions(
      {
        channel: toTemplateChannel(filter.channel),
        search: filter.q ?? undefined,
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
          <TemplatesHeader />

          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<TemplatesTableSkeleton />}>
              <DataTable initialSettings={initialSettings} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
