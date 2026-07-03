import type { AppRouter } from "@anodizex/api/router";
import type { inferRouterOutputs } from "@trpc/server";

export type DashboardOverviewData =
  inferRouterOutputs<AppRouter>["dashboard"]["overview"];
