# API Endpoints

## Purpose
This file tracks implemented HTTP and tRPC endpoints.

Production public API base: `https://dashboard.afterservice.app/api`.

## HTTP
- `GET /health`: API service health.
- `POST /webhooks/lemon-squeezy`: Lemon Squeezy webhook receiver. Requires a valid `x-signature` HMAC signature and stores idempotent `BillingEvent` records.
- `POST /api/jobs/follow-ups/dry-run`: cron/internal follow-up job endpoint. Requires `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret`, runs a due follow-up dry-run by default, and can mark overdue follow-ups missed with `{ markMissed: true }`.
- `/api/auth/**`: Better Auth handler. Mounted in `apps/api` and mirrored by the dashboard same-origin route at `apps/dashboard/src/app/api/auth/[...all]/route.ts`.
- `POST /api/onboarding`: dashboard same-origin onboarding adapter. Requires a valid Better Auth session, creates a workspace, owner membership, starter subscription state, and starter templates.

## tRPC Routers
Canonical production tRPC base: `https://dashboard.afterservice.app/api/trpc`.
The API service also keeps `/trpc/*` as a legacy/local compatibility mount, but browser and dashboard-facing code should use `/api/trpc`.

`health`
- `health`: returns service status.

`workspace`
- `getCurrent`: returns the current workspace, role, plan state, and settings.
- `updateSettings`: owner/admin update for workspace name, business type, service category, and default cadence.

`customers`
- `list`: search/list active or archived customers.
- `tags`: list distinct workspace customer tags for autocomplete.
- `get`: fetch one workspace-scoped customer.
- `create`: create customer with entitlement limit enforcement.
- `update`: update customer fields.
- `archive`: soft archive customer.

`serviceJobs`
- `list`: list workspace jobs with customer summary.
- `get`: fetch one workspace-scoped job.
- `create`: create completed job.
- `update`: update job fields.
- `markCompleted`: mark a job completed.
- `createFollowUp`: create a follow-up from a job.

`followUps`
- `listBoard`: returns Due Today, Upcoming, Waiting, Replied, and Closed columns.
- `listTable`: returns filterable follow-up rows.
- `create`: create manual follow-up.
- `update`: update follow-up fields.
- `reschedule`: update due date and log timeline event.
- `assignOwner`: assign a member and log timeline event.
- `markSent`: manual-send log, message log creation, and status update.
- `markReplied`: mark replied and log timeline event.
- `close`: close follow-up and log timeline event.

`templates`
- `list`: list active templates.
- `create`: create template with entitlement limit enforcement.
- `update`: update template and default flag.
- `archive`: soft archive template.
- `setDefault`: make one template default for its channel.

`billing`
- `getCurrentPlan`: returns workspace plan, status, usage, and limits.
- `createCheckout`: returns `{ checkoutUrl }` for a configured Lemon checkout URL.
- `getPortalUrl`: optional portal URL response. Returns `null` until configured.

## Endpoint Rules
- Mutations require auth unless explicitly public.
- Workspace routes derive workspace from server-side session context.
- Client-provided workspace IDs are never trusted for scoping.
- Billing webhooks use signature verification, not session auth.
- Cron job endpoints use `CRON_SECRET` and must not send outbound messages.
