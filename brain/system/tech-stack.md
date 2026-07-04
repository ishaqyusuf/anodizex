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

## Dependency Notes
- 2026-06-10: Aligned the monorepo Next.js packages on `next@^16.2.9` and React packages on 19.2.x. This keeps the website, dashboard, and shared UI package on one Next/React line.
- 2026-06-10: Website and dashboard typography should match the Midday reference project by using `Hedvig_Letters_Sans` and `Hedvig_Letters_Serif` through Next font variables `--font-hedvig-sans` and `--font-hedvig-serif`.

## Data And Auth
- Database: Postgres
- ORM: Prisma planned for Phase 5
- Auth: Better Auth-style package architecture planned for Phase 6
- API and database command/env setup follows the copied after-service behavior: production uses `.env.production`, local uses `.env`, inherited process env can override wrapper file values, Prisma generation runs through local workspace env mode, and `NEXT_PUBLIC_API_URL` is required for production app URL resolution.

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
