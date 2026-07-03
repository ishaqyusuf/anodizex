# Feature: Billing And Entitlements MVP

## Status
Implemented foundation for MVP on 2026-05-30.

Updated on 2026-06-09 with a fuller Midday-style billing page and structured loading skeleton.

Updated on 2026-06-11 with a regional paid-pricing preview in the dashboard billing page. The preview uses the shared `@anodizex/plans` pricing catalog and automatically resolves the display currency from request region headers, then locale headers, matching the public website pricing behavior.

Updated on 2026-06-15 so planned paid prices are converted from canonical USD through the shared const currency conversion table in `@anodizex/plans`. The dashboard billing page now passes its Midday-style `[locale]` route param into pricing resolution as a pricing-only signal; no translated billing copy or language switcher was added.

## Scope
- Billing page displays plan, status, usage, limits, and checkout action.
- `billing.getCurrentPlan`, `billing.createCheckout`, and `billing.getPortalUrl` tRPC procedures.
- Lemon Squeezy webhook signature verification.
- Idempotent `BillingEvent` storage.
- Subscription and workspace plan/status updates from verified webhooks.
- Starter/Growth/Pro limits for customers, follow-ups, templates, and team members.
- Billing page now includes plan summary cards, usage meters, subscription details, checkout action, and provider portal action when available.
- Billing page suspense and client loading states use the same structured skeleton.
- Billing plan and status badges use display labels instead of raw workspace enum values.

## Architecture
- API owner: `apps/api/src/routers/_app.ts` `billing` router.
- Webhook owner: `apps/api/src/index.ts`.
- Page owner: `apps/dashboard/src/app/(sidebar)/billing/page.tsx`.
- UI owner: `apps/dashboard/src/components/billing-overview.tsx`.

## Rules
- Entitlement truth comes from verified Lemon Squeezy webhooks.
- Checkout redirects are not trusted as entitlement state.
- Owner/admin access is required for checkout and portal actions.
- Keep raw billing plan/status values in API responses, and map them to user-facing labels in the dashboard UI.

## Limits
- Starter: 100 customers, 200 follow-ups, 5 templates, 1 team member.
- Growth: 1,000 customers, 3,000 follow-ups, 25 templates, 5 team members.
- Pro: 10,000 customers, 25,000 follow-ups, 100 templates, 25 team members.
