# Landing And Pricing Alignment Plan

Date: 2026-06-04

## Status

Implemented on 2026-06-04.

## Objective

Align the public landing page, pricing page, dashboard billing surface, plan limits, and Brain documentation around the proposed launch posture: free beta now, paid Starter/Shop/Growth plans later.

## Recommended Public Posture

- Use "Free early access" instead of "14-day free trial".
- Say "no credit card required".
- Explain that beta users will receive founder-rate pricing when paid plans launch.
- Keep future pricing visible enough to anchor the business model.
- Avoid "free forever" claims.

## Plan Mapping

- Existing `starter` code plan should represent Free Beta now and later Starter.
- Existing `growth` code plan should represent Shop.
- Existing `pro` code plan should represent Growth.
- Public copy should use Free Beta, Starter, Shop, and Growth.
- Internal enum names can remain `starter`, `growth`, and `pro` for now unless a migration is deliberately scheduled.

## Required Areas

- Landing hero/header/CTA copy.
- Landing pricing component.
- Standalone `/pricing` page.
- Landing features, FAQ, how-it-works, and metrics claims.
- Dashboard billing overview.
- Billing/entitlement labels and plan limits.
- Lemon Squeezy variant mapping and env labels.
- Product, marketing, and roadmap Brain docs.
- Analytics events for signup and pricing CTAs.

## Validation

- Run copy scan for stale phrases: "14-day", "free trial", "5-star", "private dispute", "automation platform", "v1.0 is officially live".
- Run typecheck/build after implementation.
- Browser-test homepage, pricing section, pricing page, signup CTA, and dashboard billing.

## Implementation Verification

- Focused Biome check passed for changed app, API, events, notifications, and script files.
- `bun run typecheck` passed.
- `bun run build` passed.
- Stale public-copy scan across `apps/website`, `apps/dashboard`, `apps/api`, and `packages` returned no matches.
- HTTP smoke checks confirmed `/` and `/pricing` serve the Free Beta and planned paid plan copy from the local website server.
- Full monorepo `bun run lint` still fails on existing `@anodizex/ui` animation/accessibility diagnostics outside this pricing alignment scope.
