# Dashboard Pages Redacted tRPC Prefetch Failure

## Summary
Authenticated dashboard pages failed to load in production with a Vercel server-render error showing `Error: redacted`.

## Status
Reopened on 2026-06-10 after production pages were still reported not loading. The earlier code fix remains in place, but root cause needs fresh production-env reproduction.

## Impact
Signed-in users could not load dashboard pages such as overview, jobs, customers, follow-ups, templates, billing, and settings.

## Steps To Reproduce
1. Deploy the dashboard with production env where `NEXT_PUBLIC_API_URL=https://dashboard.afterservice.app/api`.
2. Sign in and open any authenticated dashboard route.
3. Observe the Vercel server-render failure with a redacted digest.

## Expected
Dashboard routes should render, hydrate prefetched data when available, and use the public API base under `https://dashboard.afterservice.app/api`.

## Actual
Server-side React Query prefetch failures were redacted during dehydration, causing the page render to fail before the client fallback UI could recover.

## Root Cause
Dashboard SSR tRPC prefetching depended on an HTTP client URL derived from `NEXT_PUBLIC_API_URL` plus `/trpc`, while the browser client used `/trpc`. This left production behavior split between `/api/trpc` and `/trpc`, and made route rendering vulnerable to Vercel/API proxy routing failures.

## Fix
- Dashboard server prefetches now call the shared `appRouter` in-process with the current request headers, avoiding production self-fetch/proxy failures during render.
- Dashboard browser tRPC calls now use `/api/trpc`, matching the canonical public API base `https://dashboard.afterservice.app/api`.
- Dashboard exposes a same-origin `/api/trpc/[trpc]` route backed by the shared API router.
- The API service accepts both `/api/trpc/*` and legacy `/trpc/*`.

## Verification
- 2026-06-10: Linked local checkout to Vercel project `after-service-dashboard` (`prj_YBTsQyreE9GcIeEX7jFFkMmHaQ1w`) and pulled production envs into ignored root `.env.production`. Safe key check confirmed 34 keys are present, including `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`.
- 2026-06-10: Added a temporary `AFTERSERVICE_AUTH_DEBUG=true` sign-in page FAB that opens recent Better Auth DB account identifiers from the `Account` table and shows safe query errors without printing secrets.
- 2026-06-10: Added a dashboard proxy logout escape hatch. `/logout`, `/sign-out`, and `/sign-in?logout=true` expire known auth cookies and redirect to `/sign-in`, which helps recover from stale cookies that make the proxy think the user is authenticated.
- 2026-06-10: Hardened overview widgets against partial overview payloads where `workspace` is missing. The header now falls back to `Dashboard` / `Local service`, and workload default delay falls back to `Not set` instead of crashing.
- 2026-06-10: Added overview payload normalization before rendering widgets so missing `counts`, `followUpChannels`, `followUpStatuses`, `recentFollowUps`, or `recentJobs` fall back to empty/zero values instead of crashing.
- 2026-06-10: Fixed dashboard hydration mismatch by making `prefetch(...)` return its query promise and awaiting `dashboard.overview` prefetch before rendering the dashboard page. This prevents the server from rendering the overview skeleton while the client hydrates with overview data.
- 2026-06-10: Updated customers, jobs, follow-ups, and templates tables to use the Midday-style TanStack `useSuspenseInfiniteQuery(trpc.*.infiniteQueryOptions(...))` pattern instead of direct tRPC suspense-infinite hooks, fixing query option shape crashes such as undefined `length` reads.
- 2026-06-10: Added a Midday-style dashboard `useTRPC()` TanStack tRPC context so table components call `const trpc = useTRPC()` and use `trpc.*.infiniteQueryOptions(...)` / `trpc.*.mutationOptions(...)` with TanStack hooks while the rest of the app can keep the classic `trpc` React hooks for now.
- 2026-06-11: Moved the dashboard browser tRPC client into `apps/dashboard/src/trpc/client.tsx` following Midday's `src/trpc/client.tsx` architecture. The app now uses TanStack tRPC `useTRPC()` with `queryOptions`, `infiniteQueryOptions`, `mutationOptions`, and `queryKey` invalidations across dashboard components, and removed the classic `@trpc/react-query` client-provider layer.
- 2026-06-11: Matched the GND internal API pattern for dashboard tRPC. `@anodizex/api/internal-api` now exports Next route handlers backed by the shared Hono API app, and the dashboard `/api/trpc` route re-exports those handlers instead of duplicating `fetchRequestHandler` locally.
- 2026-06-10: Fixed onboarding resubmits for users who already have a workspace. Both onboarding endpoints now update the existing workspace profile fields instead of returning the existing workspace unchanged, and settings awaits the workspace prefetch so saved onboarding details are available immediately.
- Pending: reproduce locally with `.env.production` via `bun run terminal prod:dashboard`.
- Pending: deploy and open authenticated dashboard routes.
- Pending: run a production smoke check against `https://dashboard.afterservice.app/api/trpc`.

## Follow-Up Prompt
- For any future production page-load bug, run the relevant production-env terminal prompt before concluding the issue is fixed: `bun run terminal prod:dashboard` for dashboard pages or `bun run terminal prod:website` for marketing pages.
