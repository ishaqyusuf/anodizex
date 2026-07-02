# Execution Roadmap

## Purpose
This file tracks phase execution status for afterservice.

## Phase 1: Repo Bootstrap
Status: done.

Tasks:
- [x] Create repo directory.
- [x] Initialize Git on `main`.
- [x] Add Bun/Turbo root config.
- [x] Add website app.
- [x] Add dashboard app.
- [x] Add API app.
- [x] Add shared packages.
- [x] Add root env files and example.
- [x] Install dependencies.
- [x] Verify typecheck, lint, build, and local smoke checks.

## Phase 2: Environment System
Status: done.

Tasks:
- [x] Add workspace env runner.
- [x] Update app/package scripts to use env runner.
- [x] Split local and production env loading behavior.
- [x] Add env validation helpers.
- [x] Expand `.env.example`.
- [x] Document env usage in README and brain.
- [x] Verify dev/build with env runner.

## Phase 3: App Shells
Status: done.

Tasks:
- [x] Add website routes.
- [x] Add dashboard routes.
- [x] Add API tRPC mount.
- [x] Add auth placeholder routes.
- [x] Add Lemon Squeezy webhook placeholder.
- [x] Add shared app metadata.
- [x] Verify every route boots.

## Phase 4: Design System And Navigation
Status: done.

Tasks:
- [x] Build base UI components.
- [x] Build dashboard shell.
- [x] Build website nav/footer.
- [x] Build shared nav registry.
- [x] Add responsive layout rules.
- [x] Verify dashboard scanability.

## Phase 5: Database Foundation
Status: done.

Tasks:
- [x] Add Prisma.
- [x] Configure Postgres datasource.
- [x] Add auth/workspace models.
- [x] Add customer/job/follow-up/template/event/message models.
- [x] Add billing models.
- [x] Add initial migration.
- [x] Add generated client export.
- [x] Add seed helper for default templates.

## Phase 6: Authentication And Workspace Onboarding
Status: done.

Tasks:
- [x] Add auth package implementation.
- [x] Add sign-up page.
- [x] Add sign-in page.
- [x] Add session resolver.
- [x] Add API auth context.
- [x] Add onboarding flow.
- [x] Create workspace and owner membership.
- [x] Seed default templates after onboarding.

## Phase 7: Customer Management MVP
Status: done.

Tasks:
- [x] Add customers router.
- [x] Add customer list page.
- [x] Add customer create/edit forms.
- [x] Add customer detail/history surface.
- [x] Add search and filters.
- [x] Add archive behavior.
- [x] Verify workspace scoping through API session context.

## Phase 8: Service Job MVP
Status: done.

Tasks:
- [x] Add service jobs router.
- [x] Add jobs table.
- [x] Add job create/edit forms.
- [x] Add job detail/action surface.
- [x] Add mark completed action.
- [x] Add create follow-up from job action.
- [x] Verify customer history integration path.

## Phase 9: Follow-Up Board MVP
Status: done.

Tasks:
- [x] Add follow-ups router.
- [x] Add board view.
- [x] Add table view.
- [x] Add filters/status-aware grouping.
- [x] Add status transitions.
- [x] Add reschedule/assign actions.
- [x] Add follow-up detail/work surface.

## Phase 10: Follow-Up Templates
Status: done.

Tasks:
- [x] Add templates router.
- [x] Add template manager page.
- [x] Add starter templates.
- [x] Add merge tag resolver.
- [x] Add template picker.
- [x] Add draft preview.

## Phase 11: Lemon Squeezy Subscriptions
Status: done.

Tasks:
- [x] Add Lemon Squeezy env validation/config handling.
- [x] Add billing router.
- [x] Add checkout creation.
- [x] Add webhook signature verification.
- [x] Add idempotent billing event storage.
- [x] Sync subscription state to workspace entitlements.
- [x] Add billing page integration.

## Phase 12: Plan Gates And Entitlements
Status: done.

Tasks:
- [x] Define plan limits.
- [x] Add entitlement helpers.
- [x] Enforce limits in API.
- [x] Add usage summary UI.
- [x] Add upgrade prompts.
- [x] Verify webhook-updated entitlement path in code.

## Phase 13: Notifications And Messaging Foundation
Status: done.

Tasks:
- [x] Add message payload contracts.
- [x] Add message log creation.
- [x] Add manual sent logging.
- [x] Add provider abstraction.
- [x] Add follow-up timeline events.
- [x] Add no-send local safety.

## Phase 14: Jobs And Automation Readiness
Status: done.

Tasks:
- [x] Add due follow-up finder.
- [x] Add overdue/missed updater.
- [x] Add dry-run job.
- [x] Add automation hook interfaces.
- [x] Add dry-run result logging contract.
- [x] Verify no accidental outbound messaging.

## Phase 15: Marketing Website
Status: done.

Tasks:
- [x] Build polished home page.
- [x] Build pricing page.
- [x] Add signup/login CTAs.
- [x] Add optional feature/customer pages.
- [x] Add terms/privacy placeholders or pages.
- [x] Verify product copy uses afterservice.


## Phase 16: QA, Verification, And Hardening
Status: done.

Tasks:
- [x] Add full verification checklist in MVP handoff.
- [x] Add local auth/session smoke testing.
- [x] Add API smoke tests.
- [x] Add billing webhook smoke tests.
- [x] Add auth/permission smoke tests.
- [x] Run naming scan.
- [x] Run full build.
- [x] Run browser smoke for sign-up, onboarding, and dashboard landing.

## Phase 17: Deployment Preparation
Status: done.

Tasks:
- [x] Add production env checklist in MVP handoff.
- [x] Document domain mappings.
- [x] Document Lemon Squeezy webhook URL.
- [x] Add deployment commands.
- [x] Add observability notes.
- [x] Verify production build.
