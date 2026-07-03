# ADR 0006: Use Dedicated Local Docker Postgres

## Status
Accepted

## Context
Anodizex needs a reliable local Postgres database for Prisma validation, local schema sync, and app development. The copied scaffold already had an older local `afterservice-postgres` container using host port `55433`, which can collide with this repository when both environments exist on the same machine.

## Decision
Use the root `compose.yaml` Postgres service as the Anodizex local database and expose it on host port `55435`.

The local database URL is:

```bash
postgresql://anodizex:anodizex@localhost:55435/anodizex
```

Root scripts manage the local database:

- `bun run db:start`
- `bun run db:status`
- `bun run db:stop`
- `bun run db:local:migrate`
- `bun run db:local:push`

## Consequences
- Anodizex local database work no longer depends on or conflicts with an older copied `afterservice-postgres` container on `55433`.
- Local Prisma commands can run without a committed `.env` by using the `db:local:*` scripts.
- Developers still need to keep `.env` aligned with `.env.example` when running the regular app dev scripts.
