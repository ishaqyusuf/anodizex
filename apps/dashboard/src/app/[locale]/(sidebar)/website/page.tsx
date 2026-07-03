import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { ScrollableContent } from "@/components/scrollable-content";
import { WebsiteContentManager } from "@/components/website/website-content-manager";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Website | Anodizex",
  description: "Manage public website content, media, roadmap, and enquiries.",
};

export default async function WebsitePage() {
  await prefetch(trpc.website.admin.getContent.queryOptions());

  return (
    <HydrateClient>
      <ScrollableContent>
        <div className="flex max-w-[1200px] flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Website</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage the landing page, contact details, gallery, roadmap
              projects, blog posts, and contact enquiries.
            </p>
          </div>
          <ErrorBoundary fallback={<ErrorFallback />}>
            <WebsiteContentManager />
          </ErrorBoundary>
        </div>
      </ScrollableContent>
    </HydrateClient>
  );
}
