import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactPageContent } from "@/components/contact-page-content";
import { createPageMetadata } from "@/lib/seo";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "Contact Anodizex | Aluminium project enquiries",
    description:
      "Contact Anodizex for aluminium windows, sliding systems, doors, facades, and architectural aluminium project support.",
    path: "/contact",
  });
}

export default async function ContactPage() {
  await prefetch(trpc.website.getLanding.queryOptions());

  return (
    <HydrateClient>
      <Suspense fallback={null}>
        <ContactPageContent />
      </Suspense>
    </HydrateClient>
  );
}
