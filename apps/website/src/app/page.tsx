import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonLd } from "../components/json-ld";
import { LandingPageContentView } from "../components/landing-page-content";
import { createPageMetadata, organizationJsonLd } from "../lib/seo";
import { HydrateClient, prefetch, trpc } from "../trpc/server";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "Anodizex | Aluminium windows, doors, sliders, and facades",
    description:
      "Premium aluminium windows, sliding systems, doors, facades, and architectural aluminium systems for residential and commercial projects.",
    path: "/",
  });
}

export default async function HomePage() {
  await prefetch(trpc.website.getLanding.queryOptions());

  return (
    <>
      <JsonLd data={[organizationJsonLd()]} />
      <HydrateClient>
        <Suspense fallback={null}>
          <LandingPageContentView />
        </Suspense>
      </HydrateClient>
    </>
  );
}
