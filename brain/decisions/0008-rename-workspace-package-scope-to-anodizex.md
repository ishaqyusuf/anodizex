# ADR: Rename Workspace Package Scope To Anodizex

## Status
Accepted

## Context
The Anodizex repository was seeded from the copied `after-service` scaffold, which used the internal package scope `@afterservice/*`. The local Docker database and product work have moved to Anodizex naming, and keeping the copied package scope creates confusion during development.

## Decision
Rename workspace package names, internal imports, TypeScript config extends, Turbo filters, package scripts, and lockfile references from `@afterservice/*` to `@anodizex/*`. Keep remaining copied route/domain strings for a later dedicated product/domain cleanup.

## Consequences
- Internal package identity now matches the Anodizex project.
- Bun workspace dependencies resolve through `@anodizex/*`.
- Historical Brain notes may still mention the copied source repo and old product context where those references are archival.
- Any external automation or deployment config that still filters on `@afterservice/*` must be updated before use.

## Alternatives Considered
- Keep `@afterservice/*` until all route/domain names are renamed: rejected because the user explicitly requested the package namespace change now.
- Rename domains, cookies, and routes in the same pass: deferred to avoid mixing package identity changes with auth/domain behavior changes.

## Date
2026-07-02
