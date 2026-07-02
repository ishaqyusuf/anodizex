"use client";

import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useDashboardInvalidations() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return {
    customers: (id?: string) => {
      invalidateProcedure(queryClient, ["customers", "list"]);
      invalidateProcedure(queryClient, ["customers", "tags"]);
      queryClient.invalidateQueries({
        queryKey: id
          ? trpc.customers.get.queryKey({ id })
          : trpc.customers.get.queryKey(),
      });
    },
    followUps: (id?: string) => {
      invalidateProcedure(queryClient, ["followUps", "listBoard"]);
      invalidateProcedure(queryClient, ["followUps", "listTable"]);
      queryClient.invalidateQueries({
        queryKey: id
          ? trpc.followUps.get.queryKey({ id })
          : trpc.followUps.get.queryKey(),
      });
    },
    serviceJobs: (id?: string) => {
      invalidateProcedure(queryClient, ["serviceJobs", "list"]);
      queryClient.invalidateQueries({
        queryKey: id
          ? trpc.serviceJobs.get.queryKey({ id })
          : trpc.serviceJobs.get.queryKey(),
      });
    },
    templates: (id?: string) => {
      invalidateProcedure(queryClient, ["templates", "list"]);
      queryClient.invalidateQueries({
        queryKey: id
          ? trpc.templates.get.queryKey({ id })
          : trpc.templates.get.queryKey(),
      });
    },
  };
}

function invalidateProcedure(
  queryClient: ReturnType<typeof useQueryClient>,
  path: readonly string[],
) {
  queryClient.invalidateQueries({
    predicate: (query) => queryKeyMatchesProcedure(query.queryKey, path),
  });
}

function queryKeyMatchesProcedure(queryKey: QueryKey, path: readonly string[]) {
  const strings = collectQueryKeyStrings(queryKey);
  const dottedPath = path.join(".");

  return (
    path.every((segment) => strings.includes(segment)) ||
    strings.some((value) => value.includes(dottedPath))
  );
}

function collectQueryKeyStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectQueryKeyStrings);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectQueryKeyStrings);
  }

  return [];
}
