# Feature: Dashboard Page Standardization

## Status
In progress. Page shell, form consistency, page skeleton fallbacks, and stale TODO cleanup updated on 2026-06-10.

## Scope
- Authenticated dashboard table pages.
- Onboarding page form.
- Shared page error handling.

## Architecture
- Route pages stay thin and compose headers, Suspense boundaries, hydrated data sections, and feature components.
- Dashboard pages use the local `apps/dashboard/src/components/error-boundary.tsx` wrapper instead of importing internal Next.js boundary modules.
- Page forms use shared `@afterservice/ui/form` primitives.

## Current State
- Customers, jobs, follow-ups, and templates pages use the local app `ErrorBoundary` with `ErrorFallback`.
- Dashboard overview, billing, settings, and onboarding pages use the same local `ErrorBoundary` with `ErrorFallback`.
- Dashboard overview, billing, and settings pages prefetch their primary tRPC queries at the route level and hydrate client consumers.
- Dashboard overview, billing, settings, and onboarding pages use static `metadata` exports like the table routes because their metadata does not depend on request data.
- Dashboard route metadata titles, including auth recovery routes, use the canonical `afterservice` product name.
- Dashboard overview, billing, and settings pages now use the shared scroll-aware `ScrollableContent` wrapper like the table routes.
- Customers, jobs, follow-ups, and templates pages use domain skeleton fallbacks for table loading.
- Follow-ups page uses a board skeleton fallback for board loading.
- Dashboard overview page uses the feature `OverviewSkeleton` instead of a raw placeholder block.
- Customers, jobs, follow-ups, and templates header controls stack on small screens and align horizontally on wider screens.
- Onboarding uses the shared form primitives and shared `Select`.
- Onboarding uses a form-shaped skeleton fallback instead of a raw placeholder block.
- Onboarding page no longer carries stale prefetch TODOs; it has no route-level tRPC data dependency.
- Sign-in, sign-up, forgot-password, and reset-password pages use a shared centered auth shell instead of duplicated split-panel layouts.
- Sign-in, sign-up, forgot-password, and reset-password forms use shared `@afterservice/ui/form` primitives with local Zod schemas.
- Sign-in and sign-up routes are thin server pages with metadata; client auth behavior lives in `sign-in-view.tsx` and `sign-up-view.tsx`.
- Settings and billing pages already use constrained Midday-style page layouts.
- Settings now groups workspace and appearance configuration as matching card-style settings sections, with a card-shaped workspace loading skeleton.
- Dashboard overview and billing client views render structured empty states instead of blank content when their primary query payload is missing.
- Dashboard overview priority follow-ups now use a structured card empty state with an action instead of an empty table row.
- Dashboard overview recent job badges now reuse shared service job status labels instead of formatting raw enum values inline.
- Dashboard overview follow-up widgets now reuse shared follow-up status and channel labels instead of local duplicate maps.
- Dashboard overview follow-up status tones now use normalized follow-up status values and a typed tone map before choosing badge/progress colors.
- Dashboard overview widget types no longer export local follow-up status/channel aliases now that shared domain helpers own those concepts.
- Follow-ups board cards now reuse shared follow-up channel labels, and the board-level empty state follows the card-style dashboard empty-state pattern.
- The shared dashboard `ErrorFallback` now renders a structured card-style retry state instead of a bare centered message.
- Settings page content now follows the quieter Midday settings rhythm with a constrained section stack instead of a duplicate page-level header.
- Dashboard shell search results and navigation icon maps avoid dashboard-local `any` types.
- Dashboard shell search shortcuts derive from shared `dashboardNavItems`, so page jump actions stay aligned with the actual dashboard routes.
- Dashboard shell search copy reflects the current page-jump behavior while global record search remains stubbed.

## Remaining Work
- Continue auditing newly added pages against the same route composition standard.
