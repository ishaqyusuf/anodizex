# ADR: Default API URL to Dashboard Same-Origin

## Status
Accepted

## Context
The Anodizex website currently follows the copied after-service app structure but does not use a separate external public API deployment for website server work. Website routes can call the tRPC router in-process, while dashboard and browser-facing API traffic can use the dashboard app's `/api` path. A Vercel website build failed when `@anodizex/auth` required `NEXT_PUBLIC_API_URL` during static analysis even though the website route did not need an external API URL.

## Decision
Treat `NEXT_PUBLIC_API_URL` as optional. Shared URL helpers resolve the API base from `NEXT_PUBLIC_API_URL` or `API_PUBLIC_URL` when provided, otherwise they derive it from `NEXT_PUBLIC_DASHBOARD_URL` plus `/api`. Better Auth trusted origins are built from browser-facing site/dashboard/auth origins and no longer require the API URL.

## Consequences
- Website production builds do not fail solely because no external API host is configured.
- The current default production API shape remains dashboard same-origin `/api`.
- A future separate API deployment can still opt in by setting `NEXT_PUBLIC_API_URL` or `API_PUBLIC_URL`.
- Auth trusted origins stay focused on browser origins instead of accepting an API path as an origin.

## Alternatives Considered
- Require `NEXT_PUBLIC_API_URL` in Vercel: rejected because Anodizex is not using a separate external API at the moment.
- Remove API URL support completely: rejected because the copied monorepo still supports a future separate API deployment.

## Date
2026-07-04
