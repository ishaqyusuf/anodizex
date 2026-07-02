import type { AppRouter } from "@afterservice/api/router";
import type { inferRouterOutputs } from "@trpc/server";

export type DashboardOverviewData =
  inferRouterOutputs<AppRouter>["dashboard"]["overview"];
