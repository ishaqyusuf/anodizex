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
