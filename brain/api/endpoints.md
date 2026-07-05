# API Endpoints

## Purpose
This file tracks implemented HTTP and tRPC endpoints.

Production public API base: `https://dashboard.afterservice.app/api`.

## HTTP
- `GET /health`: API service health.
- `POST /api/website/blob/upload` in `apps/dashboard`: authenticated Vercel Blob client-upload token route for owner/admin users. Allows public image/video uploads for website gallery, project, blog, and settings media when `BLOB_READ_WRITE_TOKEN` is configured.
- `POST /webhooks/lemon-squeezy`: Lemon Squeezy webhook receiver. Requires a valid `x-signature` HMAC signature and stores idempotent `BillingEvent` records.
- `POST /api/jobs/follow-ups/dry-run`: cron/internal follow-up job endpoint. Requires `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret`, runs a due follow-up dry-run by default, and can mark overdue follow-ups missed with `{ markMissed: true }`.
- `/api/auth/**`: Better Auth handler. Mounted in `apps/api` and mirrored by the dashboard same-origin route at `apps/dashboard/src/app/api/auth/[...all]/route.ts`.
- `POST /api/onboarding`: dashboard same-origin onboarding adapter. Requires a valid Better Auth session, creates a workspace, owner membership, starter subscription state, and starter templates.

## tRPC Routers
Canonical production dashboard tRPC base: `https://dashboard.afterservice.app/api/trpc`.
The dashboard and website apps each expose a same-origin `/api/trpc` route backed by the shared API router. The API service also keeps `/trpc/*` as a legacy/local compatibility mount, but browser-facing app code should use `/api/trpc`.

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

`quotations`
- `list`: owner/admin list of workspace project quotations with customer summary and totals.
- `get`: owner/admin read for one workspace-scoped project quotation including units and material lines.
- `create`: owner/admin mutation to create a project quotation from BOQ units, material lines, labor cost, and markup percentage.
- `update`: owner/admin mutation to update project/client metadata, status, units, material lines, labor cost, and markup percentage.
- `updateStatus`: owner/admin mutation to move a quote between `draft`, `sent`, `approved`, `declined`, and `expired`.
- `delete`: owner/admin deletion for a workspace-scoped quotation.

`quotations.materials`
- `list`: owner/admin list of workspace material library entries, supplier prices, supplier pricing history, and recent default cost history.
- `create`: owner/admin mutation to add a material and write initial cost history.
- `update`: owner/admin mutation to update material metadata.
- `updateCost`: owner/admin mutation to change unit cost and write cost history.
- `archive`: owner/admin mutation to hide a material from active quoting.

`quotations.materials.supplierPrices`
- `create`: owner/admin mutation to add a supplier-specific price for a material and write initial supplier price history.
- `update`: owner/admin mutation to update supplier name/SKU/unit cost/lead time/preferred state and write supplier price history when pricing changes.
- `archive`: owner/admin mutation to archive a supplier price.

`billing`
- `getCurrentPlan`: returns workspace plan, status, usage, and limits.
- `createCheckout`: returns `{ checkoutUrl }` for a configured Lemon checkout URL.
- `getPortalUrl`: optional portal URL response. Returns `null` until configured.

`website`
- `getLanding`: public read for website settings, featured gallery, roadmap projects, and blog posts. Returns fallback Anodizex demo content when CMS data is empty or when the database is unreachable.
- `getProject`: public read for one roadmap project by slug. Falls back to the matching curated project when the database is unreachable.
- `getBlogPost`: public read for one blog post by slug. Falls back to the matching curated blog post when the database is unreachable.
- `submitContact`: public contact form mutation. Stores a contact inquiry and sends an admin notification plus customer confirmation email through the existing Resend email service. Requires a reachable database and returns a friendly retry message on database connection failure.

`website.admin`
- `getContent`: owner/admin read for current workspace website settings, gallery, roadmap projects/media, blog posts, and recent contact inquiries.
- `updateSettings`: owner/admin update for public contact details, hero copy, social URLs, and hero image URL.
- `createGalleryItem`, `updateGalleryItem`, `deleteGalleryItem`, `reorderGallery`: owner/admin gallery management, including tags, captured media date, featured state, and project assignment.
- `createProject`, `updateProject`, `deleteProject`, `reorderProjects`: owner/admin roadmap project management.
- `createProjectMedia`, `updateProjectMedia`, `deleteProjectMedia`, `reorderProjectMedia`: owner/admin project media management.
- `createBlogPost`, `updateBlogPost`, `deleteBlogPost`: owner/admin blog management.
- `updateInquiryStatus`: owner/admin contact inquiry status management.

## Endpoint Rules
- Mutations require auth unless explicitly public.
- Workspace routes derive workspace from server-side session context.
- Client-provided workspace IDs are never trusted for scoping.
- Billing webhooks use signature verification, not session auth.
- Cron job endpoints use `CRON_SECRET` and must not send outbound messages.
- Website admin routes derive workspace from the authenticated session and require owner/admin role.
- Public website contact submissions use `website.submitContact` through the website same-origin `/api/trpc` route.
- Public website reads use server-side prefetch plus `HydrateClient` in `apps/website`, matching the dashboard tRPC pattern.
- Public website read procedures may return curated fallback content during database connection failures; admin procedures and public contact writes do not silently succeed without persistence.
- Public contact email sends require `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS`; local/dev recipient override follows `TEST_EMAIL`.
- Quotation material and quotation mutations derive workspace from the authenticated session and require owner/admin role.

## Root Import Scripts
- `bun run media:telegram:dry-run`: reads Telegram bot updates and lists detected media/chat IDs without downloading, uploading, or writing database rows.
- `bun run media:telegram:import`: downloads media from `TELEGRAM_IMPORT_CHAT_ID`, uploads public Vercel Blob files, and creates/upserts unassigned gallery items.
- Production variants use `.env.production`: `media:telegram:prod:dry-run` and `media:telegram:prod:import`.
