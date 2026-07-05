"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { type LandingPageContent, LaunchedPage } from "./launched";

export function LandingPageContentView() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.website.getLanding.queryOptions());

  return <LaunchedPage content={data.item as LandingPageContent} />;
}
