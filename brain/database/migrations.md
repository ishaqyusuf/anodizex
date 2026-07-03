# Migrations

## Purpose
Tracks database migration workflow and migration history notes.

## Prisma Migration Workflow
- If repository root scripts `db:migrate` and `db:push` exist, run `bun db:migrate` and `bun db:push` after Prisma schema/database updates.
- Do not manually create migration files; use the repository scripts and Prisma workflow.
- Keep migration commands aligned with root `package.json` and `packages/db` scripts.

## Current State
- Database files are copied from `after-service`.
- Do not rename or delete schema models until Anodizex domain modeling is planned.

## Local Docker Database
- The root `compose.yaml` defines the local Postgres service exposed on host port `55435`.
- `bun run db:start` starts the service and waits for Docker health status.
- The matching local URL is `postgresql://anodizex:anodizex@localhost:55435/anodizex`.
- `bun run db:local:migrate` and `bun run db:local:push` start the local database first, then run Prisma against the Docker database without requiring `.env`.

## 2026-07-02 Local Docker Database Setup
- Added root database scripts for starting, stopping, checking, and tailing the local Docker Postgres service.
- Removed the hard-coded Compose container name so this repo can run beside older copied `afterservice` containers.
- Moved the Anodizex local database port to `55435` to avoid an existing local container on `55433`.
- `bun run db:start` started `anodizex-postgres-1` successfully.
- Package-level Prisma validation passed before and after the local database name was corrected to `anodizex`.
- `bun run db:local:push` synced the current Prisma schema to the local Docker database.

## 2026-07-02 Website CMS Schema Update
- Added Prisma models for website settings, roadmap projects, project media, gallery items, blog posts, and contact inquiries.
- Added `WebsiteMediaType` and `ContactInquiryStatus` enums.
- Required commands were attempted from the repository root:
  - `bun db:migrate`: initially blocked by Turbo terminal UI requirement; rerun with `TURBO_UI=true` reached Prisma but failed because `DATABASE_URL` was not available.
  - `bun db:push`: initially blocked by Turbo terminal UI requirement; rerun with `TURBO_UI=true` reached Prisma but failed because `DATABASE_URL` was not available.
- No manual migration file was created, per project policy.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/anodizex bun --filter @anodizex/db db:generate` was run only to refresh the ignored local generated Prisma client.
- Follow-up after the local Docker setup: generate the formal Prisma migration history for the website CMS schema through the Prisma migrate workflow before shipping database changes beyond local dev.

## 2026-07-02 Project Quotation Schema Update
- Added workspace-scoped material library, material cost history, project quotations, quotation units, and quotation material line snapshots.
- Added `ProjectQuotationStatus`.
- Local Docker database identity was corrected to `anodizex`; `bun run db:start` reports `postgresql://anodizex:anodizex@localhost:55435/anodizex`.
- Package-level Prisma validation and generated client refresh passed against the local Anodizex database.
- `bun run db:local:push` synced the current schema to the local Docker database.
- Required root scripts were attempted with the Anodizex `DATABASE_URL`; both `bun run db:migrate` and `bun run db:push` reached Prisma through Turbo but failed with Prisma `P1001` against `localhost:55435`. The package-level local push succeeded, so this appears to be a root/Turbo execution environment issue to resolve before formal migration history is shipped.
- No manual migration file was created, per project policy.

## 2026-07-02 Supplier-Based Material Pricing Schema Update
- Added workspace-scoped `QuotationMaterialSupplierPrice` and `QuotationMaterialSupplierPriceHistory` models.
- Added supplier price references and supplier name/SKU snapshots to `ProjectQuotationMaterialLine`.
- Supplier prices can be marked preferred; preferred supplier pricing updates the material default current cost.
- Required root scripts were attempted with `DATABASE_URL=postgresql://anodizex:anodizex@localhost:55435/anodizex`:
  - `bun run db:migrate -- --ui=tui`: reached Prisma and failed with `P1001` against `localhost:55435`.
  - `bun run db:push -- --ui=tui`: reached Prisma and failed with `P1001` against `localhost:55435`.
- Docker health still reported `anodizex-postgres-1` healthy and `pg_isready -U anodizex -d anodizex` accepting connections after the failures.
- Formal migration history still depends on resolving the root Prisma/Turbo `P1001` issue. No manual migration file was created.
