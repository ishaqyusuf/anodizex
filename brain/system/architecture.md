# Architecture

## Purpose
This file documents the intended technical architecture for afterservice.

## Monorepo
The repo is a Bun/Turbo workspace with:
- `apps/website`
- `apps/dashboard`
- `apps/api`
- `packages/auth`
- `packages/db`
- `packages/jobs`
- `packages/notifications`
- `packages/site-nav`
- `packages/tsconfig`
- `packages/ui`
- `packages/utils`

## Apps
`apps/website` is a Next.js marketing app. It owns public content, pricing, and signup entry points.

`apps/dashboard` is a Next.js authenticated app. It owns operator workflows: onboarding, customers, service jobs, follow-up board, templates, billing, and settings.

`apps/api` is a Hono/tRPC API. It owns typed business operations, auth context, workspace permissions, billing webhooks, and future job endpoints.

As of 2026-07-05, the Anodizex website CMS follows the same tRPC surface pattern as the dashboard. `apps/website/src/trpc` owns the website server/client tRPC utilities, public website pages call typed public tRPC procedures directly for landing/project/blog behavior, and the contact form submits through the website same-origin `/api/trpc` route. Public website routes prefetch tRPC query options on the server, hydrate through `HydrateClient`, and consume the same query options in client components. Dashboard owner/admin users manage website settings, gallery, roadmap projects, project media, blog posts, and enquiries through protected tRPC procedures. Media records store provider-neutral URLs, with Vercel Blob client uploads available through an authenticated dashboard route.

As of 2026-07-02, the dashboard project quotation system also follows the API-first architecture. The dashboard `/quotations` page uses tRPC and Zod-backed forms, while the API owns material library writes, supplier-specific material pricing, pricing-history writes, quote status transitions, and server-side quotation totals. Quote material lines snapshot material names, supplier name/SKU, units, and unit costs so saved quotations do not drift when the material library or supplier pricing changes.

## Shared Packages
- `auth`: session resolution, auth routes, workspace membership helpers.
- `db`: Prisma/Postgres schema, generated client, query helpers, domain types.
- `ui`: shared React components.
- `utils`: pure shared utilities.
- `notifications`: message contracts and provider abstractions.
- `jobs`: scheduled/background job primitives.
- `site-nav`: dashboard and website navigation constants.
- `tsconfig`: shared TypeScript presets.

Workspace package names use the `@anodizex/*` scope.

## Data Flow
Dashboard pages call typed tRPC procedures. API procedures resolve session and workspace membership, enforce permissions, perform database operations, and return typed results. Billing webhooks update persisted subscription state, which API entitlement helpers use for feature gates.

Public website pages call public tRPC procedures for published CMS content, and public contact submissions go through `website.submitContact` on the website `/api/trpc` route. Public landing, project, and blog reads catch database connection failures and return curated Anodizex fallback content instead of taking down the public marketing pages. Public contact submissions do not accept client-provided workspace scope; the API resolves the website workspace or stores fallback public inquiry data. Contact writes still require a reachable database and return a friendly server error when the database is unavailable. `DATABASE_URL` is the only environment variable required by the shared validator; public app URLs and provider credentials are optional configuration with built-in defaults or feature-specific checks. Production-mode workspace commands force `DATABASE_URL` from `.env.production` when present so local database URLs cannot override production scripts, and production env checks reject localhost or port `55435` database URLs.

Project quotation pages call protected tRPC procedures. The API resolves the active workspace, enforces owner/admin access, fetches material costs, calculates totals, and persists quote units and material line snapshots in a single transaction.

## Local Infrastructure
Local development uses the root `compose.yaml` Postgres service on host port `55435`, matching `DATABASE_URL=postgresql://anodizex:anodizex@localhost:55435/anodizex`. The root `bun run db:start` script starts the Docker database and waits for the container health check before Prisma or app commands use it.

## Boundary Rules
- UI never trusts client-provided workspace IDs without server-side membership checks.
- Billing UI can start checkouts, but only webhooks update entitlements.
- Jobs can read due follow-ups, but message sending must be behind provider configuration.
