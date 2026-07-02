import type { Metadata } from "next";
import { JsonLd } from "../components/json-ld";
import { landingFaqs } from "../components/landing/faq";
import { LaunchedPage } from "../components/launched";
import { getPricingResolution } from "../lib/pricing-request";
import {
  createPageMetadata,
  faqJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
} from "../lib/seo";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "afterservice | Post-job follow-up board for service shops",
    description:
      "Join the free beta for a manual-first follow-up board built for repair shops, installers, contractors, and local service teams.",
    path: "/",
  });
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const initialPricing = await getPricingResolution(searchParams);

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          softwareApplicationJsonLd(),
          faqJsonLd(landingFaqs),
        ]}
      />
      <LaunchedPage initialPricing={initialPricing} />
    </>
  );
}
