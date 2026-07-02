import type { Metadata } from "next";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { ScrollableContent } from "@/components/scrollable-content";
import { CustomersHeader } from "@/components/customers-header";
import { DataTable } from "@/components/tables/customers/data-table";
import { CustomersTableSkeleton } from "@/components/tables/customers/skeleton";
import { loadCustomerFilterParams } from "@/hooks/use-customer-filter-params";
import { loadSortParams } from "@/hooks/use-sort-params";
import { batchPrefetch, HydrateClient, trpc } from "@/trpc/server";
import { getInitialTableSettings } from "@/utils/table-settings-server";

export const metadata: Metadata = {
  title: "Customers | afterservice",
  description: "Manage your customer base.",
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function CustomersPage(props: Props) {
  const searchParams = await props.searchParams;

  const filter = loadCustomerFilterParams(searchParams);
  const { sort } = loadSortParams(searchParams);
  const initialSettings = await getInitialTableSettings("customers");

  batchPrefetch([
    trpc.customers.list.infiniteQueryOptions(
      {
        search: filter.q ?? undefined,
        includeArchived: false,
        sort: sort ?? undefined,
        tags: filter.tags ?? undefined,
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
          <CustomersHeader />

          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<CustomersTableSkeleton />}>
              <DataTable initialSettings={initialSettings} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
