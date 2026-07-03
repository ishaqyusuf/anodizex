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

As of 2026-07-02, the Anodizex website CMS follows the same architecture: public website pages call typed public tRPC procedures for landing/project/blog/contact behavior, while dashboard owner/admin users manage website settings, gallery, roadmap projects, project media, blog posts, and enquiries through protected tRPC procedures. Media records store provider-neutral URLs, with Vercel Blob client uploads available through an authenticated dashboard route.

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

Public website pages can call public tRPC procedures for published CMS content and contact submission. Public contact submissions do not accept client-provided workspace scope; the API resolves the website workspace or stores fallback public inquiry data.

Project quotation pages call protected tRPC procedures. The API resolves the active workspace, enforces owner/admin access, fetches material costs, calculates totals, and persists quote units and material line snapshots in a single transaction.

## Local Infrastructure
Local development uses the root `compose.yaml` Postgres service on host port `55435`, matching `DATABASE_URL=postgresql://anodizex:anodizex@localhost:55435/anodizex`. The root `bun run db:start` script starts the Docker database and waits for the container health check before Prisma or app commands use it.

## Boundary Rules
- UI never trusts client-provided workspace IDs without server-side membership checks.
- Billing UI can start checkouts, but only webhooks update entitlements.
- Jobs can read due follow-ups, but message sending must be behind provider configuration.
