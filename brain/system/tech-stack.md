# Tech Stack

## Purpose
This file records core technology choices.

## Runtime And Tooling
- Runtime/package manager: Bun
- Monorepo orchestration: Turborepo
- Language: TypeScript
- Formatting/linting: Biome

## Apps
- Website: Next.js App Router (`next@^16.2.9`, React 19.2.x)
- Dashboard: Next.js App Router (`next@^16.2.9`, React 19.2.x)
- API: Hono with tRPC
- Dashboard theme management: `next-themes` with class-based light/dark/system mode.
- Website and dashboard both use app-local `src/trpc` folders for Midday-style server/client tRPC calls and same-origin `/api/trpc` routes.

## Dependency Notes
- 2026-06-10: Aligned the monorepo Next.js packages on `next@^16.2.9` and React packages on 19.2.x. This keeps the website, dashboard, and shared UI package on one Next/React line.
- 2026-06-10: Website and dashboard typography should match the Midday reference project by using `Hedvig_Letters_Sans` and `Hedvig_Letters_Serif` through Next font variables `--font-hedvig-sans` and `--font-hedvig-serif`.

## Data And Auth
- Database: Postgres
- ORM: Prisma planned for Phase 5
- Auth: Better Auth-style package architecture planned for Phase 6
- API and database command/env setup follows the copied after-service behavior with an Anodizex production safety guard: production uses `.env.production`, forces its `DATABASE_URL` over inherited process env when present, local uses `.env` with inherited env overrides, and Prisma generation runs through local workspace env mode.
- The website and dashboard package-level build scripts intentionally stay simple as `bun next build --turbopack`; deployment/build runners must provide the required production env directly.
- `bun run env:prod:check` validates the production env file before deploy-sensitive work. It rejects missing, invalid, localhost, `127.0.0.1`, `::1`, or local port `55435` `DATABASE_URL` values; it also checks for a configured high-entropy Better Auth secret and paired Google OAuth credentials when either Google value is present.
- `DATABASE_URL` is the only required variable in the shared environment validator. Public app URLs, auth/email/job secrets, and optional providers such as Google OAuth, Polar billing, and Twilio/WhatsApp are configured when the matching feature is enabled.

## Billing
- Provider: Polar
- Model: recurring subscriptions
- Entitlements: persisted from webhook-confirmed subscription state

## Local Ports
- Website: `4100`
- Dashboard: `4101`
- API: `4102`
- Default local dev command: `bun run dev` runs the portless stack. The standard port-based scripts remain available as `dev:website`, `dev:dashboard`, and `dev:api`.

## Domains
- Website: `afterservice.app`
- Dashboard: `dashboard.afterservice.app`
- Public API base: `dashboard.afterservice.app/api`
- Local portless domains: `afterservice.localhost`, `app-afterservice.localhost`, and `api-afterservice.localhost`.
