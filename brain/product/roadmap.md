# Product Roadmap

## Purpose

This file is the canonical product and implementation roadmap for afterservice.

## Current MVP State

As of 2026-05-30, the local MVP implementation covers phases 1-17 and the core operator journey: sign up, onboard a workspace, manage customers, log jobs, create/work follow-ups, manage templates, view billing/limits, run manual-send messaging logs, and execute cron-protected follow-up job dry-runs. Remaining post-MVP work is deeper automated browser coverage, provider-specific production observability wiring, and production secret/domain configuration.

As of 2026-06-03, the public website no longer uses an `IS_LAUNCHED` release flag or prelaunch homepage branch. The root marketing page renders the main afterservice landing experience directly.

As of 2026-06-04, the public launch posture is free beta / early access, not a paid free-trial launch. Public plan names are Free Beta, Starter, Shop, and Growth. Internal workspace plan enums remain `starter`, `growth`, and `pro` for now, mapped publicly as Free Beta/Starter, Shop, and Growth.

As of 2026-06-04, the beta roadmap is captured in `brain/product/beta-roadmap.md`: MVP-ready, free beta now, habit validation before broad paid launch, and a private paid pilot before public pricing.

As of 2026-06-04, dashboard route protection follows the Midday-style pattern: the dashboard proxy remains a fast unauthenticated redirect, the `(sidebar)` layout performs a real server-side session and workspace membership check, and API `protectedProcedure` remains the source of truth for workspace-scoped data access.

As of 2026-06-09, organic search strategy is captured in `brain/marketing/seo-roadmap.md`: focus on the narrow wedge of post-job follow-up software for local service operators, build technical SEO foundation first, then publish segment and workflow pages grounded in beta learnings.

As of 2026-06-09, onboarding business type and service category fields use creatable autocomplete suggestions. Business type defaults are curated system suggestions, and service category defaults now change based on the selected business type while still allowing custom operator input.

As of 2026-06-09, a post-MVP customer self-onboarding job flow is planned in `brain/features/customer-self-onboarding-job-flow.md`: operators can start a job from only phone/email, then invite the customer to complete profile and service details through a tokenized afterservice link.

## Phase 1: Repo Bootstrap

Status: complete.

Goal: create a clean standalone Bun/Turbo monorepo.

Deliverables:

- Repo at `/Users/M1PRO/Documents/code/micro-startups/after-service`.
- Apps: website, dashboard, API.
- Packages: auth, db, jobs, notifications, site-nav, tsconfig, ui, utils.
- Package namespace `@afterservice/*`.
- Root scripts for dev, build, typecheck, lint, format.
- Root `.env`, `.env.production`, `.env.example`.
- Git initialized on `main`.

Acceptance:

- `bun install` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun run build` passes.
- Website, dashboard, and API health endpoint boot locally.

## Phase 2: Environment System

Goal: make environment configuration root-driven and production-ready.

Deliverables:

- Add `scripts/with-workspace-env.mjs`.
- Local/dev commands load root `.env`.
- Production commands load root `.env.production`.
- Apps can optionally layer app-local env files later, but root env remains canonical.
- `.env.example` documents all keys by section.
- Package scripts use the env runner.

Env sections:

- App URLs
- Database
- Auth
- Lemon Squeezy
- Email
- Jobs
- Observability

Acceptance:

- `bun run dev:*` works through env runner.
- `bun run build` works through production env runner.
- No secrets are committed.
- App URL constants resolve consistently across website, dashboard, and API.

## Phase 3: App Shells

Goal: turn placeholders into structured app shells.

Website deliverables:

- Public routes: `/`, `/pricing`, `/login`, `/signup`.
- Shared metadata and domain constants.
- Basic layout with nav and footer.

Dashboard deliverables:

- Routes: `/sign-in`, `/sign-up`, `/onboarding`, `/`, `/customers`, `/jobs`, `/follow-ups`, `/templates`, `/billing`, `/settings`.
- Auth-neutral shell placeholders until Phase 6.
- Dashboard layout with sidebar/topbar placeholders.

API deliverables:

- Hono server.
- tRPC router mount.
- `/health`.
- `/api/auth/**` placeholder route.
- `/webhooks/lemon-squeezy` placeholder route.

Acceptance:

- Each route returns a meaningful page or JSON placeholder.
- Dashboard can import API router types.
- No product-specific DB calls are required yet.

## Phase 4: Design System And Navigation

Goal: establish a practical operator-focused interface foundation.

Deliverables:

- `@afterservice/ui` components: Button, Input, Textarea, Select, Dialog, Dropdown, Tabs, Badge, Table, EmptyState.
- Dashboard shell: sidebar, topbar, user menu placeholder, workspace switcher placeholder, billing badge placeholder.
- `@afterservice/site-nav` dashboard nav registry.
- Website nav and CTA links.

Design rules:

- SaaS/operator UI, dense and scannable.
- Avoid decorative cards for whole-page sections.
- Use cards for repeated records and modals only.
- Use icons for tool buttons where practical.

Acceptance:

- UI components are reusable and typed.
- Dashboard navigation uses shared registry.
- Website and dashboard have distinct visual roles.

## Phase 5: Database Foundation

Goal: create the persistent model for auth, workspaces, customers, jobs, follow-ups, templates, and billing.

Deliverables:

- Add Prisma to `packages/db`.
- Add Postgres datasource.
- Add migrations and generated client.
- Export DB client/runtime helpers.
- Add seed helper for default follow-up templates.

Core models:

- `User`
- `Session`
- `Account`
- `Verification`
- `Workspace`
- `Membership`
- `TeamInvite`
- `Customer`
- `ServiceJob`
- `FollowUp`
- `FollowUpTemplate`
- `FollowUpEvent`
- `MessageLog`
- `Subscription`
- `BillingEvent`

Core enums:

- `WorkspacePlan`: starter, growth, pro.
- `WorkspacePlanStatus`: trialing, active, past_due, canceled.
- `MembershipRole`: owner, admin, staff.
- `ServiceJobStatus`: completed, needs_follow_up, resolved.
- `FollowUpStatus`: open, scheduled, sent, replied, closed, missed.
- `FollowUpChannel`: email, sms, phone, whatsapp.
- `BillingProvider`: lemon_squeezy.

Acceptance:

- Prisma schema validates.
- Initial migration applies.
- Generated client exports from `@afterservice/db`.
- Every business model is workspace-scoped.

## Phase 6: Authentication And Workspace Onboarding

Goal: allow an operator to create an account, create a workspace, and land in the dashboard.

Deliverables:

- Better Auth-style `@afterservice/auth`.
- Sign-up and sign-in pages.
- API context with session, active workspace, and membership role.
- Workspace onboarding flow.
- Owner membership creation.
- Default template seeding after onboarding.
- Starter/trial subscription state creation.

Onboarding fields:

- Business name
- Business type
- Service category
- Default follow-up delay
- Preferred channels

Acceptance:

- New user can sign up.
- New user is redirected to onboarding.
- Completed onboarding creates workspace and owner membership.
- Authenticated API routes reject anonymous requests.
- Workspace routes reject users without membership.

## Phase 7: Customer Management MVP

Goal: give operators a customer base to attach jobs and follow-ups to.

Deliverables:

- `customers` tRPC router: list, get, create, update, archive.
- Customer list page.
- Customer detail panel/page.
- Add/edit customer forms.
- Search and filters.

Fields:

- Name
- Phone
- Email
- Company/business name
- Tags
- Notes
- Last service date
- Follow-up count

Acceptance:

- Customers are CRUD-capable.
- Customer data is workspace-scoped.
- Customer records can be selected from job/follow-up forms.

## Phase 8: Service Job MVP

Goal: capture completed work as the source of follow-up.

Deliverables:

- `serviceJobs` tRPC router: list, get, create, update, mark completed, create follow-up from job.
- Jobs table.
- Create job dialog.
- Job detail panel.
- Quick actions for scheduling follow-up.

Fields:

- Customer
- Service title
- Service category
- Completion date
- Staff owner
- Amount/value optional
- Notes
- Next follow-up date
- Status

Acceptance:

- User can create a service job.
- Completed jobs can generate follow-ups.
- Jobs appear in customer history.
- Follow-up due date uses workspace default cadence.

## Phase 9: Follow-Up Board MVP

Goal: deliver the core afterservice board experience.

Deliverables:

- `followUps` tRPC router: list board, list table, create, update status, reschedule, assign owner, mark sent, mark replied, close.
- Board columns: Due today, Upcoming, Waiting, Replied, Closed.
- Table view with filters.
- Follow-up detail panel.
- Status transition helpers.

Fields:

- Customer
- Related service job
- Channel
- Due date
- Status
- Assigned member
- Message draft
- Last contacted at
- Replied at
- Closed at

Acceptance:

- Board displays real follow-ups.
- User can move follow-ups through statuses.
- User can reschedule and assign ownership.
- Board remains workspace-scoped.

## Phase 10: Follow-Up Templates

Goal: standardize message drafting before automated sending.

Deliverables:

- `templates` tRPC router: list, create, update, archive, set default.
- Template manager page.
- Template picker in follow-up flows.
- Merge tag resolver.
- Starter templates seeded per workspace.

Starter templates:

- Thanks for choosing us.
- How did everything go?
- Maintenance reminder.
- Review request.
- Issue resolution follow-up.

Merge tags:

- `{{customer_name}}`
- `{{business_name}}`
- `{{service_name}}`
- `{{completion_date}}`

Acceptance:

- Templates can be managed.
- Templates can be applied to follow-ups.
- Merge tags render safely.
- Drafts can be edited after template application.

## Phase 11: Lemon Squeezy Subscriptions

Goal: wire production-ready recurring subscriptions.

Deliverables:

- Lemon Squeezy env keys.
- Billing router: get current plan, create checkout, portal URL if available.
- Checkout creation with workspace/user metadata.
- Webhook route with signature verification.
- Idempotent billing event storage.
- Subscription and workspace entitlement updates from webhooks.

Tracked provider data:

- Lemon customer ID
- Lemon subscription ID
- Variant ID
- Plan
- Status
- Current period end
- Cancelation state

Acceptance:

- Dashboard can create hosted checkout.
- Invalid webhook signatures are rejected.
- Duplicate webhook events are harmless.
- Subscription created/updated/canceled events update workspace plan state.

## Phase 12: Plan Gates And Entitlements

Goal: make subscription state enforce product limits.

Deliverables:

- Entitlement helper package or module.
- Plan limits for customers, follow-ups, templates, team members, and advanced automation.
- API-level enforcement.
- UI upgrade prompts.
- Billing page usage summary.

Initial limits:

- Starter: small customer/follow-up/template caps.
- Growth: higher caps and team features.
- Pro: highest caps and automation-ready features.

Acceptance:

- API blocks over-limit writes.
- UI explains limits and upgrade path.
- Webhook-updated plan state changes entitlements without manual intervention.

## Phase 13: Notifications And Messaging Foundation

Goal: prepare message sending without causing accidental outbound messages.

Deliverables:

- Message payload types in `packages/notifications`.
- `MessageLog` persistence.
- Manual send logging.
- Provider abstraction for future email/SMS/WhatsApp.
- Follow-up timeline events.

Rules:

- Local/dev never sends real customer messages unless explicitly configured.
- Message sending is provider-backed and auditable.
- Manual-send mode is acceptable for MVP.

Acceptance:

- Follow-up actions create events.
- Sent messages can be logged.
- Provider implementation can be added without changing board logic.

## Phase 14: Jobs And Automation Readiness

Goal: lay the foundation for scheduled processing and automation.

Deliverables:

- `packages/jobs` job primitives.
- Find due follow-ups.
- Mark overdue/missed follow-ups.
- Dry-run command.
- Cron-protected API endpoint for dry-runs and missed-state execution.
- Future hooks for post-job completion, pre-due reminder, no-reply follow-up, reply received.

Acceptance:

- Due follow-ups can be discovered.
- Overdue states can be updated.
- Dry-run reports what would happen.
- Jobs do not send messages unless providers are configured.

## Phase 15: Marketing Website

Goal: ship a credible public site for `afterservice.app`.

Deliverables:

- Polished home page.
- Pricing page.
- Login/signup entry points.
- Optional features, customers, terms, privacy pages.
- Consistent afterservice positioning and CTA.

Messaging:

- Free early access for small service operators.
- One board for every customer follow-up after the job is done.
- Turn completed jobs into structured check-ins, review-safe requests, issue recovery, referrals, and repeat-service reminders.
- Manual workflows first; automation and provider messaging are planned after beta.

Acceptance:

- Website communicates audience, problem, and CTA clearly.
- Pricing makes Free Beta the current action and marks paid plans as planned.
- No dashboard-only explanation leaks into marketing.
- No unsupported review-gating, fake traction, or paid free-trial claims appear in active public copy.

SEO additions:

- Add sitemap, robots, canonical metadata, social metadata, and relevant structured data.
- Publish high-intent solution pages for priority service-operator segments.
- Publish practical guides around post-job follow-up, review-safe requests, issue recovery, and repeat-service reminders.
- Keep SEO content aligned to free beta until Brain changes launch posture.

## Phase 16: QA, Verification, And Hardening

Goal: prove the MVP is stable enough for continued development and deployment.

Deliverables:

- Full local verification checklist.
- Browser smoke tests for website and dashboard.
- API route tests.
- Billing webhook tests.
- Auth/session/permission tests.
- Naming scan for forbidden product names.

Acceptance:

- `bun install` passes.
- `bun run typecheck` passes.
- `bun run lint` passes.
- `bun run build` passes.
- Core journey works: signup, onboarding, customer, job, follow-up, board movement, billing page.
- Browser smoke verifies sign-up, onboarding, and authenticated dashboard landing.

## Phase 17: Deployment Preparation

Goal: prepare production deployment.

Deliverables:

- Production env checklist.
- Domain mapping notes.
- Lemon Squeezy webhook URL documentation.
- Build/deploy commands.
- Minimal observability plan.
- README deployment section.

Domains:

- `afterservice.app`: website.
- `dashboard.afterservice.app`: dashboard.
- `dashboard.afterservice.app/api`: public API.

Acceptance:

- Required env keys are documented.
- Domains are mapped to apps.
- Webhook target is documented.
- Production build is verified.
