import type { Metadata } from "next";
import { JsonLd } from "../components/json-ld";
import { LaunchedPage, type LandingPageContent } from "../components/launched";
import {
  createPageMetadata,
  organizationJsonLd,
} from "../lib/seo";
import { getWebsiteCaller } from "../lib/server-trpc";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "Anodizex | Aluminium windows, doors, sliders, and facades",
    description:
      "Premium aluminium windows, sliding systems, doors, facades, and architectural aluminium systems for residential and commercial projects.",
    path: "/",
  });
}

export default async function HomePage() {
  const caller = await getWebsiteCaller();
  const content = await caller.website.getLanding();

  return (
    <>
      <JsonLd data={[organizationJsonLd()]} />
      <LaunchedPage content={content.item as LandingPageContent} />
    </>
  );
}
