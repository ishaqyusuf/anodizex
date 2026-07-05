# ADR: Use Public Website tRPC Prefetch And Database Fallbacks

## Status
Accepted

## Context
The public website previously mixed direct server-side calls with the new website tRPC stack. Deployment failures showed `website.getLanding` could take down public rendering when the production runtime resolved a local development database URL such as `127.0.0.1:55435`. The dashboard already uses a Midday-style tRPC flow with server prefetch, hydration, and client-side query consumption.

## Decision
Use the same tRPC pattern for public website pages: server components prefetch tRPC query options, wrap content in `HydrateClient`, and client content components consume the same query options. Keep website-specific tRPC files under `apps/website/src/trpc`.

Public website read procedures for landing, project, and blog content catch database connection failures and return curated Anodizex fallback content. Public contact submissions remain persistent writes, so they return a friendly retryable server error if the database is unreachable. Production env tooling validates that deploy-sensitive commands do not use localhost or local port `55435` database URLs.

## Consequences
- Public marketing pages can still render during database connection outages or misconfigured database hosts.
- Contact enquiries are never reported as successful when they were not persisted.
- Website and dashboard data-fetching patterns stay aligned, making future tRPC changes easier to apply consistently.
- Production launch and env-check scripts catch the specific local database URL class that caused the deployment issue before app startup.
- The fallback read behavior is intentionally scoped to public website content and should not be copied to authenticated admin or billing writes.

## Alternatives Considered
- Keep direct server-side public website fetches: simpler, but diverges from the requested dashboard/Midday tRPC pattern.
- Allow contact submissions to degrade to email-only behavior: avoids a visible error, but risks losing canonical inquiry history.
- Require the database for every public read: stricter, but fragile for a marketing site that already has curated fallback content.

## Date
2026-07-05
