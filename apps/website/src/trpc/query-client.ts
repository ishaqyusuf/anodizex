import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import superjson from "superjson";

type ErrorWithData = Error & {
  data?: {
    code?: unknown;
  };
};

function isUnauthorizedError(error: Error): boolean {
  const data = (error as ErrorWithData).data;

  return data?.code === "UNAUTHORIZED";
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: isServer
      ? undefined
      : new QueryCache({
          onError: (error) => {
            if (isUnauthorizedError(error)) {
              window.location.href = "/login";
            }
          },
        }),
    defaultOptions: {
      queries: {
        gcTime: 10 * 60 * 1000,
        retry: isServer
          ? false
          : (failureCount, error) => {
              if (isUnauthorizedError(error)) return false;
              return failureCount < 2;
            },
        staleTime: 2 * 60 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
