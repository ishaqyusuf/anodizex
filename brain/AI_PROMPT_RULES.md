# AI Prompt Rules

## Purpose
Rules for AI agents working in this repository.

## Non-Negotiable Architecture Rules
- Midday is the primary standard for pages, tables, modals, sheets, sidebar, forms, onboarding, layouts, tRPC calls, loading states, error states, and caching patterns.
- Use shadcn standard components and patterns for UI. Never directly modify shadcn source components; create wrapper components for project-specific behavior.
- Use GND as the reference for the standard notification package system.
- Use Plot Keys as the reference for local URL handling, portless/proxy support, and generated links.
- Add `app/[...slug]/page.tsx` as a catch-all route that redirects to `/` unless the repository has an explicit reason to diverge.
- For Prisma database updates, when the repository root has `db:migrate` and `db:push` scripts, run `bun db:migrate` and `bun db:push` after schema changes; do not manually create migration files.

## Product Rules
- Product direction is Anodizex: aluminium windows, sliding systems, doors, façades, and architectural aluminium systems.
- Competitor/reference companies are Schüco, Reynaers Aluminium, Kawneer, TECHNAL, and AluK.
- Do not assume copied `afterservice` terminology is final; preserve it only until a focused rename or deletion pass.

## Global Personal Coding Rules
<!-- managed-global-personal-coding-rules:start -->
- Always consult `/Users/M1PRO/.me/coding-standards/global.md`.
- For this copied Next.js/React web monorepo, also consult `/Users/M1PRO/.me/coding-standards/nextjs.md`.
<!-- managed-global-personal-coding-rules:end -->
