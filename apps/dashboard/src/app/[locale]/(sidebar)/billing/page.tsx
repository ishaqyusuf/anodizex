import {
  getHeaderPricingHints,
  resolvePricingRegion,
} from "@anodizex/plans";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import {
  BillingOverview,
  BillingOverviewSkeleton,
} from "@/components/billing-overview";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { ScrollableContent } from "@/components/scrollable-content";
import { batchPrefetch, HydrateClient, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Billing | afterservice",
  description: "Manage your subscription and billing details.",
};

type BillingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function BillingPage({ params }: BillingPageProps) {
  const { locale } = await params;
  const headerList = await headers();
  const { acceptLanguage, continent, country } =
    getHeaderPricingHints(headerList);
  const initialPricing = resolvePricingRegion({
    acceptLanguage,
    continent,
    country,
    routeLocale: locale,
  });

  batchPrefetch([
    trpc.billing.getCurrentPlan.queryOptions(),
    trpc.billing.getPortalUrl.queryOptions(),
  ]);

  return (
    <HydrateClient>
      <ScrollableContent>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <Suspense fallback={<BillingOverviewSkeleton />}>
            <BillingOverview initialPricing={initialPricing} />
          </Suspense>
        </ErrorBoundary>
      </ScrollableContent>
    </HydrateClient>
  );
}
