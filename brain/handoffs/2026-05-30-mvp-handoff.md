# Handoff: MVP Implementation And Auth Loop Fix

Date: 2026-05-30

## Shipped Scope
- Fixed the sign-in redirect loop by recognizing secure-prefixed Better Auth cookies in the dashboard proxy.
- Added dashboard same-origin Better Auth and onboarding routes so browser auth cookies are scoped to the dashboard origin.
- Defaulted local auth base URL to `http://localhost:4102` to avoid production API URLs in `.env` forcing secure cookies during local development.
- Implemented MVP tRPC routers for workspace, customers, service jobs, follow-ups, templates, and billing.
- Replaced dashboard placeholders with functional operator pages for overview, customers, jobs, follow-ups, templates, billing, and settings.
- Added Lemon Squeezy webhook signature verification, idempotent billing events, and subscription/workspace plan syncing.
- Added Starter/Growth/Pro entitlement limits and enforced them in API mutations.
- Added manual-send message logging and follow-up timeline events.
- Added jobs package primitives for due follow-up discovery and missed/overdue dry runs.
- Added a cron-protected follow-up job endpoint at `POST /api/jobs/follow-ups/dry-run`.
- Added `bun run smoke:mvp` to automate auth, API, permission, entitlement, cron-job, and Lemon webhook smoke coverage.
- Added website feature, customer, privacy, and terms routes.
- Added the required dashboard catch-all route redirecting unknown dashboard paths to `/`.
- Moved dashboard forms onto shared shadcn-style field primitives from `@anodizex/ui`.
- Updated Brain API, database, feature, roadmap, and handoff docs.

## Auth Bug Root Cause
The dashboard proxy only checked `better-auth.session_token` and `afterservice.session_token`. With the local env pointing at a production HTTPS API URL, Better Auth emitted `__Secure-better-auth.session_token`. The cookie was valid, onboarding worked, but the proxy did not recognize it and redirected protected pages back to `/sign-in`.

## Verification Run
- `bun run typecheck`: passed.
- `bun run lint`: passed.
- `bun run build`: passed.
- `bun run db:validate`: passed.
- `bun run db:generate`: passed.
- `bun run smoke:mvp`: passed.
- Naming scan for inherited reference-project/product names in `apps`, `packages`, and `scripts`: passed.
- Browser smoke with the local dashboard passed for sign-up, onboarding, and authenticated dashboard landing.
- Browser smoke with the local website passed for `/features`, `/customers`, `/privacy`, and `/terms` with no console errors.
- Local HTTP auth smoke:
  - `POST /api/auth/sign-up/email`: `200`, session cookie set.
  - `POST /api/onboarding`: `200`, workspace created.
  - `GET /` with same cookie: `200`, no `/sign-in` redirect.

## Known Limitations
- Full Playwright coverage is still pending; current browser coverage is a focused local sign-up/onboarding/dashboard smoke.
- Deeper edge-case API/security test suites are post-MVP hardening.
- Lemon checkout currently depends on configured Lemon env/checkout URL.
- Billing portal URL returns `null` until a portal endpoint is configured.
- Messaging remains manual-send only by design.
- Jobs are dry-run/state-update primitives behind a cron-protected endpoint; production scheduler configuration is still deployment work.
- Production deployment still needs real `BETTER_AUTH_SECRET`, Lemon Squeezy keys, database URL, and observability settings.

## Production Env Checklist
- `NEXT_PUBLIC_SITE_URL=https://www.afterservice.app`
- `NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.afterservice.app`
- `NEXT_PUBLIC_API_URL=https://dashboard.afterservice.app/api`
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL=https://dashboard.afterservice.app`
- `BETTER_AUTH_TRUSTED_ORIGINS=https://www.afterservice.app,https://dashboard.afterservice.app`
- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_STORE_ID`
- `LEMONSQUEEZY_WEBHOOK_SECRET`
- Lemon variant IDs for Starter, Growth, and Pro.
- `CRON_SECRET`
- `NEXT_PUBLIC_SENTRY_DSN` or chosen observability keys.

## Deployment Notes
- Website domain: `afterservice.app`.
- Dashboard domain: `dashboard.afterservice.app`.
- Public API base: `dashboard.afterservice.app/api`.
- Lemon webhook target: `https://dashboard.afterservice.app/api/webhooks/lemon-squeezy`.
- Cron follow-up job target: `https://dashboard.afterservice.app/api/jobs/follow-ups/dry-run`.
- Observability baseline: retain platform logs, configure `NEXT_PUBLIC_SENTRY_DSN`, alert on API 5xxs, Lemon webhook failures, cron failures, and database connection saturation.
- Run before deploy: `bun run db:validate`, `bun run db:generate`, `bun run typecheck`, `bun run lint`, `bun run build`, `bun run smoke:mvp`.

## Next Roadmap
1. Add full Playwright browser smoke for customer, job, follow-up, template, manual send, and billing edge cases.
2. Add deeper unit/integration tests around edge cases not covered by `smoke:mvp`.
3. Configure production observability provider settings and alert routing.
4. Configure the hosted scheduler to call the cron follow-up job endpoint.
