import "server-only";

import { createContext } from "@afterservice/api/context";
import type { AppRouter } from "@afterservice/api/router";
import { appRouter } from "@afterservice/api/router";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache } from "react";
import { makeQueryClient } from "./query-client";

export const getQueryClient = cache(makeQueryClient);

const createTRPCContext = cache(async () => {
  const requestHeaders = await headers();
  const request = new Request("http://dashboard.afterservice.local/api/trpc", {
    headers: requestHeaders,
  });

  return createContext(request);
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  queryClient: getQueryClient,
  router: appRouter,
  ctx: createTRPCContext,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends { queryKey: any }>(queryOptions: T) {
  const queryClient = getQueryClient();

  if (queryOptions.queryKey[1]?.type === "infinite") {
    return queryClient
      .prefetchInfiniteQuery(queryOptions as any)
      .catch(() => {});
  }

  return queryClient.prefetchQuery(queryOptions as any).catch(() => {});
}

export function batchPrefetch<T extends { queryKey: any }>(
  queryOptionsArray: T[],
) {
  const queryClient = getQueryClient();

  for (const queryOptions of queryOptionsArray) {
    if (queryOptions.queryKey[1]?.type === "infinite") {
      void queryClient
        .prefetchInfiniteQuery(queryOptions as any)
        .catch(() => {});
    } else {
      void queryClient.prefetchQuery(queryOptions as any).catch(() => {});
    }
  }
}
