# Feature: Dashboard Overview

## Status
Implemented on 2026-06-09.

## Purpose
Give operators a dense, scannable home dashboard that summarizes today's after-service workload and points them toward the next action.

## Scope
- Show workspace identity and service category context.
- Show Midday-style clickable metric widgets for due work, overdue work, open follow-ups, completed jobs, customers, and sent messages.
- Show today's queue split by overdue, due today, and upcoming follow-ups.
- Show follow-up health by status and channel mix.
- Show priority follow-ups and recent completed jobs using live dashboard API data.

## Architecture
- Page owner: `apps/dashboard/src/app/(sidebar)/page.tsx`.
- UI owner: `apps/dashboard/src/components/widgets/*`, following the Midday overview widget folder pattern.
- Data query owner: `packages/db/src/queries/dashboard-overview.ts`.
- API owner: `apps/api/src/routers/_app.ts` under `dashboard.overview`; the route stays thin and delegates to the DB query module.
- The dashboard remains a client component backed by tRPC server state.

## Product Rule
The dashboard should stay operational, not decorative: it should help a local service operator decide what to do next within a few seconds.
