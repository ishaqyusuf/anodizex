# 0004 Pin Trigger Jobs Runtime To Node 22

## Status
Accepted

## Date
2026-06-18

## Context
`bun run jobs:deploy` builds `packages/jobs` through Trigger.dev. The deploy reached the remote image build but failed during dependency installation because Trigger.dev 4.0.1's default `node` runtime image uses Node `21.7.3`.

The jobs package uses Prisma `7.8.0`, whose installer only supports Node `20.19+`, `22.12+`, or `24.0+`.

## Decision
Configure `packages/jobs/trigger.config.ts` with `runtime: "node-22"`.

Keep `trigger.config.ts` import-safe when `TRIGGER_PROJECT_ID` is absent, and validate the env var in `scripts/with-trigger-profile.mjs` before local `trigger dev` or `trigger deploy` commands.

Sync the jobs worker's production runtime env vars with Trigger.dev during deploy for database and email delivery configuration.

## Consequences
- Trigger.dev job images use a Prisma-supported Node runtime.
- The deployment config stays inside the Trigger config instead of adding custom Docker/image setup.
- Trigger.dev's remote deployment indexer can import task config without needing local-only project selection env vars.
- Production job tests and task runs use the deploy environment's production database and email provider settings, reducing drift between local deploy commands and cloud workers.
- Future Prisma or Trigger.dev upgrades should re-check the runtime requirement before changing this pin.
