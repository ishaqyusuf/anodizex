import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { ProjectQuotationManager } from "@/components/quotations/project-quotation-manager";
import { ScrollableContent } from "@/components/scrollable-content";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Quotations | Anodizex",
  description: "Build project quotations, BOQs, and material cost histories.",
};

export default async function QuotationsPage() {
  await Promise.all([
    prefetch(trpc.quotations.list.queryOptions({ limit: 50 })),
    prefetch(
      trpc.quotations.materials.list.queryOptions({
        includeArchived: false,
      }),
    ),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="flex max-w-[1400px] flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Project quotations
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Build BOQs for aluminium window, door, facade, and sliding system
              projects using workspace material costs and saved cost history.
            </p>
          </div>
          <ErrorBoundary fallback={<ErrorFallback />}>
            <ProjectQuotationManager />
          </ErrorBoundary>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
