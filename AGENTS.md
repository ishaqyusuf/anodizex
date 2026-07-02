# Anodizex Agent Instructions

## Brain Protocol

`brain/` is the project memory and source of truth for architecture, product state, tasks, and implementation context. Treat Brain documentation as part of the definition of done for every meaningful change.

Before starting work:

- Read the relevant Brain files for the task. Start with `brain/BRAIN.md`, `brain/SYSTEM_OVERVIEW.md`, `brain/system/overview.md`, `brain/system/architecture.md`, `brain/engineering/ai-rules.md`, `brain/engineering/coding-standards.md`, and `brain/tasks/in-progress.md`.
- For feature, product, marketing, pricing, or research work, also read the matching file under `brain/features/`, `brain/product/`, `brain/marketing/`, or `brain/research/`.
- For API, auth, permission, database, or migration work, read the matching files under `brain/api/` and `brain/database/`.
- If the repository root defines both `db:migrate` and `db:push` scripts and Prisma schema/database files are changed, run both commands after the Prisma update. Do not manually create migration files.

After code changes:

- Run a Brain documentation impact check before finishing.
- Update `brain/database/schema.md`, `brain/database/relationships.md`, or `brain/database/migrations.md` for database changes.
- For Prisma database updates, if root scripts `db:migrate` and `db:push` exist, run `bun db:migrate` and `bun db:push` after changing the schema. Do not manually create migration files.
- Update `brain/api/endpoints.md`, `brain/api/contracts.md`, or `brain/api/permissions.md` for API, contract, auth, or permission changes.
- Update or create `brain/features/<feature>.md` for feature behavior changes.
- Add an ADR under `brain/decisions/` for durable architecture, product, integration, or implementation decisions.
- Update `brain/tasks/backlog.md`, `brain/tasks/in-progress.md`, `brain/tasks/done.md`, or `brain/tasks/roadmap.md` when task state changes.
- If no Brain update is needed, state that explicitly in the final response with the reason.

Final responses must include the Brain files updated, or `No Brain documentation updates required` with a short rationale.

## Project Commands

- Package manager: `bun`.
- Start the full dev stack with `bun run dev`.
- Start dashboard work with `bun run dev:dashboard`.
- Start website work with `bun run dev:website`.
- Start jobs work with `bun run dev:jobs`.
- Prefer portless dev scripts when debugging auth or callback behavior: `bun run dev:dashboard:portless`, `bun run dev:website:portless`, or `bun run dev:websites:portless`.
- When debugging production page-load failures, reproduce with the production env first: run `bun run terminal prod:dashboard` for dashboard pages or `bun run terminal prod:website` for marketing pages.
- Validate broad changes with `bun run typecheck` and the narrowest relevant build, lint, smoke, or package-level command.

## Product And UI Rules

- The project brand is `Anodizex`.
- The product direction is aluminium windows, sliding systems, doors, façades, and related architectural aluminium systems.
- Existing `afterservice` package names, domains, and routes are copied scaffolding only; keep them until a dedicated rename/refactor pass.
- Use Tailwind CSS for UI component styling where Tailwind is configured; when it is not configured in a target app, preserve the existing styling system unless the task includes setting Tailwind up.
- Preserve the existing monorepo layout under `apps/` and `packages/`.
- Do not edit secrets in `.env*` files unless the user explicitly asks.
- Keep changes scoped to the requested task and avoid unrelated formatting churn.
