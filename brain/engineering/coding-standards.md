# Coding Standards

## Purpose
Implementation-facing engineering standards for Anodizex.

## Midday Standard
- Pages, tables, modals, sheets, forms, onboarding, sidebar, sign-out, and shared dashboard components must follow Midday architecture, file naming, and coding patterns.
- Tables should follow the Midday domain table pattern: `components/tables/core`, `components/tables/<domain>/columns.tsx`, `data-table.tsx`, `table-header.tsx`, `skeleton.tsx`, `empty-states.tsx`, and `bottom-bar.tsx` or `action-menu.tsx` when needed.
- Sheets should follow the Midday global sheets pattern: `components/sheets/global-sheets.tsx`, `components/sheets/global-sheets-provider.tsx`, and domain sheet files under `components/sheets/`.
- Forms must follow Midday validation, error handling, and mutation patterns.
- Data fetching and mutations must use the standard Midday tRPC patterns, including invalidation, loading states, errors, and caching behavior.
- Prisma schema changes must be followed by root `bun db:migrate` and `bun db:push` when those scripts exist. Do not manually create migration files.

## Copied Code Rules
- Use `@anodizex/*` for internal workspace package scopes.
- Keep remaining copied `afterservice` route/domain strings until a focused rename/refactor pass.
- Delete copied flows only after the replacement Anodizex behavior is defined.
- Prefer small commits that move one product area at a time.

## Global Personal Coding Rules
<!-- managed-global-personal-coding-rules:start -->
- Always consult `/Users/M1PRO/.me/coding-standards/global.md`.
- For this copied Next.js/React web monorepo, also consult `/Users/M1PRO/.me/coding-standards/nextjs.md`.
<!-- managed-global-personal-coding-rules:end -->
