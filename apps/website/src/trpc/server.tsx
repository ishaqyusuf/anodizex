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

type ServerPrefetchQueryOptions = Parameters<
  ReturnType<typeof getQueryClient>["prefetchQuery"]
>[0];
type ServerPrefetchInfiniteQueryOptions = Parameters<
  ReturnType<typeof getQueryClient>["prefetchInfiniteQuery"]
>[0];
type ServerPrefetchOptions =
  | ServerPrefetchQueryOptions
  | ServerPrefetchInfiniteQueryOptions;

function isQueryDescriptor(value: unknown): value is { type: string } {
  return typeof value === "object" && value !== null && "type" in value;
}

function isInfiniteQueryOptions(
  queryOptions: ServerPrefetchOptions,
): queryOptions is ServerPrefetchInfiniteQueryOptions {
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
    return queryClient.prefetchInfiniteQuery(queryOptions).catch(() => {});
  }

  return queryClient.prefetchQuery(queryOptions).catch(() => {});
}

export function batchPrefetch(queryOptionsArray: ServerPrefetchOptions[]) {
  const queryClient = getQueryClient();

  for (const queryOptions of queryOptionsArray) {
    if (isInfiniteQueryOptions(queryOptions)) {
      void queryClient.prefetchInfiniteQuery(queryOptions).catch(() => {});
    } else {
      void queryClient.prefetchQuery(queryOptions).catch(() => {});
    }
  }
}
