# Anodizex

![Anodizex README banner](.github/assets/readme-banner.svg)

Anodizex is an aluminium systems platform for windows, sliding systems, doors, façades, project showcases, customer enquiries, and project quotations.

The product is built for architectural aluminium operators who need a public project website, content management, enquiry capture, and dashboard workflows for quoting and project follow-up.

## Current Capabilities

- Public landing website for aluminium windows, sliding systems, doors, façades, and architectural project positioning.
- Contact enquiry flow that stores customer messages and can send admin/customer emails when email provider env is configured.
- Gallery, blog, and completed-project roadmap pages backed by dashboard-managed CMS data.
- Roadmap project detail pages with project logs, images, videos, and published project metadata.
- Authenticated dashboard for website settings, gallery, roadmap projects, project media, blog posts, and contact enquiries.
- Project quotation system with BOQ units, dimensions, labor, materials, markup, totals, and quote status workflow.
- Supplier-based material pricing with supplier-specific unit costs, preferred supplier prices, supplier SKU snapshots, and pricing history.
- Existing copied customer, job, follow-up, template, billing, notifications, and Trigger.dev job foundations remain available while the product is reshaped around Anodizex.

## Product Workflow

1. Manage public website content, contact details, gallery media, roadmap projects, and blog posts from the dashboard.
2. Capture website contact enquiries and store them for admin review.
3. Maintain a material library with supplier-specific pricing and price history.
4. Build BOQ-style project quotations for aluminium units such as windows, doors, sliding systems, and façade bays.
5. Review saved quotations, totals, status, supplier snapshots, and customer/project follow-up records.

## Monorepo

This repository is a private Bun/Turbo workspace.

| Path | Purpose |
| --- | --- |
| `apps/website` | Public Anodizex website for landing content, contact enquiries, gallery, roadmap projects, and blog posts. |
| `apps/dashboard` | Authenticated operator dashboard for website CMS, customers, jobs, follow-ups, templates, billing, settings, and project quotations. |
| `apps/api` | Hono/tRPC API for business operations, auth context, permissions, webhooks, and job endpoints. |
| `packages/auth` | Session, auth, and workspace membership helpers. |
| `packages/db` | Prisma/Postgres schema, generated client, query helpers, and domain types. |
| `packages/events` | Analytics/event contracts and helpers. |
| `packages/jobs` | Trigger.dev scheduled and background job logic. |
| `packages/notifications` | Message contracts and notification provider abstractions. |
| `packages/plans` | Shared plan and entitlement definitions. |
| `packages/site-nav` | Website and dashboard navigation registries. |
| `packages/ui` | Shared React UI components. |
| `packages/utils` | Pure shared utilities, including runtime URL helpers. |
| `packages/whatsapp` | WhatsApp integration client scaffolding. |
| `brain` | Durable project memory: product direction, architecture, decisions, tasks, API, and database docs. |

## Local Development

Requirements:

- Bun `1.3.9`
- Docker for the local Postgres database, or another Postgres-compatible database
- Project environment variables in `.env`

Install dependencies:

```bash
bun install
```

Start the local Docker Postgres database:

```bash
bun run db:start
```

The local database is exposed at:

```bash
DATABASE_URL=postgresql://anodizex:anodizex@localhost:55435/anodizex
```

Start the full local stack:

```bash
bun run dev
```

`bun run dev` starts website, dashboard, API, and jobs. The jobs package requires `TRIGGER_PROJECT_ID`; for normal website/dashboard work without Trigger.dev configured, run the relevant app scripts below instead.

Run one surface at a time:

```bash
bun run dev:website
bun run dev:dashboard
bun run dev:api
bun run dev:jobs
```

Fixed-port localhost URLs:

| App | URL |
| --- | --- |
| Website | `http://localhost:4100` |
| Dashboard | `http://localhost:4101` |
| API health | `http://localhost:4102/health` |

## Portless Dev URLs

Install [Portless](https://portless.dev) once, then run:

```bash
# All apps
bun run dev:portless

# One app at a time
bun run dev:website:portless
bun run dev:dashboard:portless
bun run dev:api:portless

# Website + dashboard + jobs
bun run dev:websites:portless
```

Expected Portless URLs, using the default proxy on port `1355`:

| App | URL |
| --- | --- |
| Website | `http://afterservice.localhost:1355` |
| Dashboard | `http://app-afterservice.localhost:1355` |
| API | `http://api-afterservice.localhost:1355` |

These local aliases are inherited from the copied scaffold and remain until the route/domain cleanup pass. Prefer the Portless scripts when debugging auth, redirects, callback behavior, or cross-app URL handling.

## Environment

Environment configuration is loaded from the workspace root.

- Local development commands load `.env`.
- Production build/start commands load `.env.production`.
- `.env.example` documents the required keys and is safe to commit.
- Do not commit real secret values.

Useful environment and database commands:

```bash
bun run db:start
bun run db:status
bun run db:validate
bun run db:generate
bun run db:migrate
bun run db:push
```

For local Docker database work without relying on `.env`, use:

```bash
bun run db:local:migrate
bun run db:local:push
```

The formal root `db:migrate`/`db:push` Prisma path is currently documented in Brain as having a local Turbo/Prisma `P1001` connection issue against `localhost:55435`; the Docker database itself can still be healthy. Do not hand-create migration files to work around that issue.

Production env sync helpers:

```bash
# Import Vercel production envs to .env.production
bun run env:prod:import

# Preview which .env.production keys would be exported back to Vercel
bun run env:prod:export

# Export .env.production keys to Vercel production
bun run env:prod:export:apply
```

The export helper skips Vercel/system-generated keys by default and does not print secret values.

## Validation

Use the root scripts for broad checks:

```bash
bun run typecheck
bun run lint
bun run build
```

Focused smoke coverage:

```bash
bun run smoke:mvp
```

`bun run smoke:mvp` expects the dashboard dev server at `http://localhost:4101` unless `SMOKE_DASHBOARD_URL` is set. It verifies the local MVP journey: sign-up, onboarding, authenticated dashboard access, workspace-scoped CRUD, follow-up status transitions, manual send logging, permission rejection, entitlement limits, cron job authorization, and billing webhook signature/idempotency behavior.

Website PWA checks:

```bash
bun --cwd apps/website run pwa:verify
```

## Terminal Helper

Use the terminal helper to discover and run common project commands:

```bash
bun run terminal
bun run terminal check
bun run terminal dashboard
bun run terminal db:validate
bun run terminal prod:dashboard
bun run terminal prod:website
bun run terminal smoke:mvp
```

Use `prod:dashboard` or `prod:website` when reproducing production-only page-load failures. They build the selected app and start it locally with root `.env.production`.

## Deployment Notes

Current copied production surfaces pending Anodizex domain cleanup:

- Website: `https://afterservice.app`
- Dashboard: `https://dashboard.afterservice.app`
- Public API: `https://dashboard.afterservice.app/api`

Operational endpoints and jobs:

- Follow-up dry-run job: `POST https://dashboard.afterservice.app/api/jobs/follow-ups/dry-run` with `CRON_SECRET`
- Billing webhook processing lives under the dashboard API surface.
- Observability should alert on API 5xxs, webhook failures, cron failures, and database connection saturation.

### Trigger.dev Jobs

`packages/jobs` reads `TRIGGER_PROJECT_ID` from the workspace env and deploys with the Trigger.dev CLI profile in `TRIGGER_PROFILE` when it is set.

If Trigger.dev reports `Project not found` while using the `default` profile:

1. Run `bun --cwd packages/jobs trigger list-profiles`.
2. Log in to the intended account with `trigger login --profile <profile>`.
3. Set `TRIGGER_PROFILE=<profile>`.
4. Replace `TRIGGER_PROJECT_ID` with the project ref from that account.

## Engineering Notes

- Use the product name `Anodizex` and package namespace `@anodizex/*`.
- Use `buildSiteUrl`, `buildDashboardUrl`, and `buildApiUrl` from `@anodizex/utils` for cross-app URL construction.
- Keep remaining copied `afterservice` route/domain strings scoped to a dedicated cleanup pass.
- Keep app-specific UI inside the owning app until it is generic enough for `packages/ui`.
- Preserve server-side workspace permission checks for all workspace-scoped operations.
- Read and update `brain/` docs for meaningful product, architecture, API, database, billing, auth, or workflow changes.
