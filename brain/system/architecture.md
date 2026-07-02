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

## Shared Packages
- `auth`: session resolution, auth routes, workspace membership helpers.
- `db`: Prisma/Postgres schema, generated client, query helpers, domain types.
- `ui`: shared React components.
- `utils`: pure shared utilities.
- `notifications`: message contracts and provider abstractions.
- `jobs`: scheduled/background job primitives.
- `site-nav`: dashboard and website navigation constants.
- `tsconfig`: shared TypeScript presets.

## Data Flow
Dashboard pages call typed tRPC procedures. API procedures resolve session and workspace membership, enforce permissions, perform database operations, and return typed results. Billing webhooks update persisted subscription state, which API entitlement helpers use for feature gates.

## Boundary Rules
- UI never trusts client-provided workspace IDs without server-side membership checks.
- Billing UI can start checkouts, but only webhooks update entitlements.
- Jobs can read due follow-ups, but message sending must be behind provider configuration.
