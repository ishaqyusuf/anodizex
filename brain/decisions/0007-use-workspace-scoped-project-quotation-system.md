# ADR: Use Workspace-Scoped Project Quotations

## Status
Accepted

## Context
Anodizex needs a dashboard quotation workflow for aluminium project work. Quotes must use current material costs while preserving historical totals, support BOQ-style units, and stay consistent with the existing monorepo architecture that routes domain mutations through tRPC and Prisma.

## Decision
Model quotations as workspace-scoped Prisma records owned by the API layer. Store a material cost library with cost history, quote headers, BOQ units, and material line snapshots. Calculate quote totals server-side in tRPC procedures and expose the dashboard workflow through Zod-backed forms and existing shadcn-style UI components.

## Consequences
- Saved quotations keep stable totals even when material costs change later.
- Material price changes become auditable through cost-history records.
- Quote pricing remains protected behind owner/admin tRPC procedures.
- The first pass does not yet include PDF export, quote emailing, taxes, discounts, revision history, or a dedicated project entity.

## Alternatives Considered
- Dashboard-only calculator: rejected because totals would not be durable or auditable.
- Reusing `ServiceJob`: rejected because Anodizex quotations are pre-sale project estimates, not after-service job records.
- Linking directly to a future project model now: deferred because that domain model is not implemented yet.

## Date
2026-07-02
