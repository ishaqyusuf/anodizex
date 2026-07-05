import "server-only";

import { createContext } from "@anodizex/api/context";
import type { AppRouter } from "@anodizex/api/router";
import { appRouter } from "@anodizex/api/router";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache } from "react";
import { makeQueryClient } from "./query-client";

export const getQueryClient = cache(makeQueryClient);

type ServerPrefetchOptions = { queryKey: readonly unknown[] };
type QueryClient = ReturnType<typeof getQueryClient>;
type ServerPrefetchQueryOptions = Parameters<QueryClient["prefetchQuery"]>[0];
type ServerPrefetchInfiniteQueryOptions = Parameters<
  QueryClient["prefetchInfiniteQuery"]
>[0];

function isQueryDescriptor(value: unknown): value is { type: string } {
  return typeof value === "object" && value !== null && "type" in value;
}

function isInfiniteQueryOptions(
  queryOptions: ServerPrefetchOptions,
): queryOptions is ServerPrefetchOptions & { queryKey: readonly unknown[] } {
  const descriptor = queryOptions.queryKey[1];

  return isQueryDescriptor(descriptor) && descriptor.type === "infinite";
}

const createTRPCContext = cache(async () => {
  const requestHeaders = await headers();
  const request = new Request("http://www.afterservice.local/api/trpc", {
    headers: requestHeaders,
  });

  return createContext(request);
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  ctx: createTRPCContext,
  queryClient: getQueryClient,
  router: appRouter,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch(queryOptions: ServerPrefetchOptions) {
  const queryClient = getQueryClient();

  if (isInfiniteQueryOptions(queryOptions)) {
    return queryClient
      .prefetchInfiniteQuery(
        queryOptions as unknown as ServerPrefetchInfiniteQueryOptions,
      )
      .catch(() => {});
  }

  return queryClient
    .prefetchQuery(queryOptions as unknown as ServerPrefetchQueryOptions)
    .catch(() => {});
}

export function batchPrefetch(queryOptionsArray: ServerPrefetchOptions[]) {
  const queryClient = getQueryClient();

  for (const queryOptions of queryOptionsArray) {
    if (isInfiniteQueryOptions(queryOptions)) {
      void queryClient
        .prefetchInfiniteQuery(
          queryOptions as unknown as ServerPrefetchInfiniteQueryOptions,
        )
        .catch(() => {});
    } else {
      void queryClient
        .prefetchQuery(queryOptions as unknown as ServerPrefetchQueryOptions)
        .catch(() => {});
    }
  }
}
