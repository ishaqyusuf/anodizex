import type { Metadata } from "next";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { ScrollableContent } from "@/components/scrollable-content";
import { OverviewView } from "@/components/widgets";
import { OverviewSkeleton } from "@/components/widgets/overview-skeleton";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Dashboard overview | afterservice",
  description: "Overview of your workspace performance.",
};

export default async function DashboardPage() {
  await prefetch(trpc.dashboard.overview.queryOptions());

  return (
    <HydrateClient>
      <ScrollableContent>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <Suspense fallback={<OverviewSkeleton />}>
            <OverviewView />
          </Suspense>
        </ErrorBoundary>
      </ScrollableContent>
    </HydrateClient>
  );
}
