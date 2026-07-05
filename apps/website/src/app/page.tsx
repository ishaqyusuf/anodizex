import type { Metadata } from "next";
import { JsonLd } from "../components/json-ld";
import { type LandingPageContent, LaunchedPage } from "../components/launched";
import { createPageMetadata, organizationJsonLd } from "../lib/seo";
import { getQueryClient, trpc } from "../trpc/server";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "Anodizex | Aluminium windows, doors, sliders, and facades",
    description:
      "Premium aluminium windows, sliding systems, doors, facades, and architectural aluminium systems for residential and commercial projects.",
    path: "/",
  });
}

export default async function HomePage() {
  const content = await getQueryClient().fetchQuery(
    trpc.website.getLanding.queryOptions(),
  );

  return (
    <>
      <JsonLd data={[organizationJsonLd()]} />
      <LaunchedPage content={content.item as LandingPageContent} />
    </>
  );
}
