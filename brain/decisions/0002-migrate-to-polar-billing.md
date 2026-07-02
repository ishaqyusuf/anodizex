# 0002. Migrate to Polar Billing

**Date**: 2026-06-04

## Context
The project previously used LemonSqueezy for billing and subscription management. However, there was a decision to align closer to the Midday architecture and the user explicitly requested switching to Polar.

## Decision
We decided to replace LemonSqueezy entirely with Polar (`@polar-sh/sdk` and `@polar-sh/checkout`).

## Implications
- The `BillingProvider` enum in the Prisma schema has been updated from `lemon_squeezy` to `polar`.
- Environment variables have been replaced (removed `LEMON_SQUEEZY_*`, added `POLAR_ACCESS_TOKEN`, `POLAR_ORGANIZATION_ID`, `POLAR_WEBHOOK_SECRET`, `POLAR_STARTER_VARIANT_ID`, etc.).
- The tRPC billing router in `apps/api/src/routers/_app.ts` handles auto-creating Polar customers dynamically.
- Paid checkouts will now route to Polar generated checkout URLs instead of LemonSqueezy URLs.
