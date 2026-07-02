# ADR: Use Plot Keys-Style Architecture

## Status
Accepted

## Context
afterservice needs a fast scaffold with marketing and dashboard apps, shared packages, root env organization, workspace-aware backend logic, and subscription billing. Plot Keys already demonstrates a nearby architecture pattern.

## Decision
Use the Plot Keys-style monorepo architecture while replacing the product domain with afterservice-specific customer, service job, follow-up, template, automation, and billing concepts.

## Consequences
- Faster scaffold and fewer architecture decisions.
- Clear separation between marketing, dashboard, API, and shared packages.
- Must actively prevent real estate concepts or Plot Keys branding from leaking into afterservice.

## Alternatives Considered
- Single Next.js app: simpler initially, but weaker separation for API/webhook/dashboard concerns.
- Add into the current larger monorepo: shares tooling but couples an independent micro-startup to an unrelated product.

## Date
2026-05-24
