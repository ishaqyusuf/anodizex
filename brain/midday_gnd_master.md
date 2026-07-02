# Midday-GND Master Coding And Architecture Guide

Sources analyzed:

- `/Users/M1PRO/Documents/code/_kitchen_sink/midday`
- `/Users/M1PRO/Documents/code/_turbo/gnd`

This is the merged master standard. Midday provides the architectural discipline: clear ownership boundaries, package-first domain logic, explicit API contracts, URL-driven UI state, thin route handlers, strong validation, and premium interface composition.

GND adds the opinionated product patterns that better fit its operational surface: Prisma, Better Auth, page-list API helpers, reusable server-loaded filters, `SearchFilterTRPC`, `@gnd/ui/data-table`, and `@gnd/notifications`.

Use this file as the project guide, AI prompt, code review rubric, and feature implementation standard for GND.

## 1. Operating Principle

GND should use Midday's layer discipline, not Midday's exact implementation choices.

Midday's core lesson is ownership:

- apps compose user entrypoints, screens, routes, request context, hydration, and orchestration
- packages own durable product logic
- database access is centralized
- API contracts are validated
- background work is pushed into jobs
- UI primitives are shared, but feature workflows remain feature-owned

GND's core adaptation is product fit:

- use Prisma instead of Drizzle
- use Better Auth instead of Supabase auth or new NextAuth work
- use GND page-list helpers for operational list pages
- use GND server-loaded filters for rich dashboard filtering
- use GND's table and notification packages where they already create leverage

When building in this standard, ask:

1. Which layer owns this behavior?
2. Is this durable domain logic or app orchestration?
3. Is the API input validated with Zod?
4. Is auth/session/permission context resolved centrally?
5. Is the database query bounded, indexed, and shaped with `select` where possible?
6. Is list/filter/table state encoded in URL params when it affects navigation?
7. Is the feature using the shared GND page-list, filter, table, and notification contracts where appropriate?
8. Is the smallest useful validation command enough to prove the change?

## 2. Repository Shape

GND should remain a Bun + Turborepo monorepo.

Recommended shape:

```txt
apps/
  api/            Hono/tRPC API, request context, routers, app adapters
  www/            main Next.js workspace app
  dealership/     dealer-facing app surface
  worker/         background worker surface where applicable

packages/
  db/               Prisma client, schema, migrations, query exports
  auth/             Better Auth web/dealer instances and auth utilities
  ui/               shared UI primitives and GND data table library
  notifications/    typed notification channels and delivery workflows
  logger/           structured logging
  utils/            shared non-domain utilities
  sales/            durable sales domain logic when promoted from app code
  dealership/       durable dealer domain logic when promoted from app code
  ...               focused domain packages as the system matures
```

GND-specific app/API folders:

```txt
apps/api/src/page-lists/<domain>/
apps/api/src/filters/common/
apps/api/src/filters/<page>.ts
apps/api/src/trpc/routers/
apps/www/src/components/search-filter/
apps/www/src/components/tables/<feature>/
```

Rule: app-owned query code is acceptable during migration, but stable durable behavior should graduate toward `@gnd/db/queries` or feature packages.

## 3. Dependency And Import Rules

Follow this dependency direction:

```txt
apps/* -> packages/*
packages/* -> focused packages and utilities
packages/db -> Prisma, schema, migrations, DB utilities, DB query exports
packages/auth -> Better Auth instances and auth utilities
packages/ui -> reusable UI primitives, no app-specific product workflows
packages/notifications -> notification channel contracts and delivery logic
```

Rules:

- Use `@gnd/*` for workspace package imports.
- Use app aliases only inside their app boundary.
- Do not import from another package's private `src` path unless that entrypoint is explicitly exported.
- Do not put durable business logic in Next pages, React components, route handlers, or raw tRPC procedures.
- Add package exports deliberately.
- Prefer existing package APIs over new dependencies.
- Avoid introducing duplicate auth/database patterns.

## 4. Technology Choices

GND standard stack:

- Bun
- Turborepo
- TypeScript strict mode
- Biome
- Next.js App Router for product surfaces
- Hono/tRPC for API surfaces
- React Query
- Zod
- Prisma
- Better Auth
- MySQL-compatible Prisma provider where current schema requires it
- Trigger.dev for async workflows
- `@gnd/ui` for shared UI
- `@gnd/notifications` for notification workflows
- structured logger package for production-safe logging

GND should not add new Drizzle, Supabase-auth, or NextAuth patterns for new work. Existing legacy usage can remain only as compatibility until migrated.

## 5. Backend Architecture

The backend should be thin at the edge and strong in its contracts.

tRPC routers should:

- validate input with colocated Zod schemas
- resolve auth through shared context/middleware
- delegate real work to query helpers or domain functions
- return DTOs suitable for the frontend
- avoid embedding large business workflows inline

Preferred router shape:

```ts
export const salesRouter = createTRPCRouter({
  orders: protectedProcedure
    .input(getOrdersSchema)
    .query(({ ctx, input }) => getOrders(ctx, input)),
});
```

Procedures:

- `publicProcedure` means truly public
- `protectedProcedure` requires a valid workspace user session
- `dealerProtectedProcedure` requires a valid dealer auth session and active linked dealer
- permission checks belong in middleware or domain services

API context should expose:

```ts
type TRPCContext = {
  db: Database;
  userId?: number;
  dealerAuthUserId?: string;
  dealer?: ActiveDealer | null;
};
```

Header/JWT parsing can exist as a migration bridge, but new protected APIs should resolve identity from Better Auth sessions wherever possible.

## 6. Auth And Database

GND standardizes on Prisma and Better Auth.

Prisma owns:

- generated DB types
- schema and migrations
- singleton DB client
- transaction boundaries
- soft-delete behavior
- query helper exports

Better Auth owns:

- workspace sessions
- dealer sessions
- app-owned auth tables
- login flows
- password migration
- magic links
- password reset
- session revocation
- auth event hooks

Recommended package boundaries:

```txt
packages/db/
  src/index.ts
  src/schema/*.prisma
  src/queries/index.ts

packages/auth/
  src/better-auth/www.ts
  src/better-auth/dealership.ts
  src/new-device-login.ts
  src/utils.ts
```

The web and dealer auth surfaces should stay separate:

```ts
export const webAuth = betterAuth({
  appName: "GND Workspace",
  database: prismaAdapter(db as never, { provider: "mysql" }),
  user: { modelName: "WebAuthUser" },
  session: { modelName: "WebAuthSession" },
  account: { modelName: "WebAuthAccount" },
});

export const dealerAuth = betterAuth({
  appName: "GND Dealership",
  database: prismaAdapter(db as never, { provider: "mysql" }),
  user: { modelName: "DealerAuthUser" },
  session: { modelName: "DealerAuthSession" },
  account: { modelName: "DealerAuthAccount" },
});
```

Why this beats copying Midday exactly:

| Area | Midday | GND Standard |
| --- | --- | --- |
| ORM | Drizzle | Prisma |
| Auth | Supabase auth | Better Auth |
| Strength | explicit SQL-shaped query control | generated client, relation ergonomics, large-schema fit |
| Risk | more manual query work | hidden over-fetching through broad `include` |
| GND choice | use as discipline reference | use as implementation standard |

Optimization rules:

- prefer `select` over broad `include`
- review every count, aggregate, relation load, and raw query for soft-delete behavior
- add indexes for auth lookup, session lookup, dealer lookup, page-list filters, and sort fields
- use `$transaction` for multi-write workflows
- instrument slow Prisma queries through structured logging
- immediately respect revoked access when caching session-shaped data

## 7. Database Query And Page-List Architecture

Midday's pattern is to put DB logic in `packages/db/src/queries/*`. GND should follow that ownership principle while using Prisma and its own page-list helper contract.

For operational list pages, use:

```txt
Zod schema
filter params parser
where/query adapter
composeQueryData
Prisma list query
row normalizer
response(data)
optional summary helper
server prefetch + hydration
```

Example:

```ts
export const getOrdersSchema = z
  .object(orderFilterShape)
  .extend(paginationSchema.shape);

export async function getOrders(ctx: TRPCContext, query: GetOrdersSchema) {
  const { response, searchMeta, where } = await composeQueryData(
    query,
    whereSales(query),
    ctx.db.salesOrders,
  );

  const rows = await ctx.db.salesOrders.findMany({
    where,
    ...searchMeta,
    select: salesOrderRowSelect,
  });

  return response(rows.map(normalizeOrderRow));
}
```

Performance comparison:

| Area | Midday | GND |
| --- | --- | --- |
| Query style | explicit Drizzle query modules | reusable Prisma page-list helpers |
| Pagination | custom per query | standardized through `composeQueryData` |
| Speed to add list pages | moderate | fast and consistent |
| Risk | repeated manual patterns | accidental count/offset/over-fetch cost |

Optimization rules:

- rename offset-style `cursor` to `offset`, or implement true keyset cursor pagination
- make total count optional for expensive pages
- use sort allowlists
- split row DTO selection from detail-page selection
- parallelize independent summary aggregates
- graduate stable helpers from `apps/api/src/db/queries/*` to `@gnd/db/queries` or domain packages

## 8. Filter Architecture

GND filters are a product surface. They should be server-loaded, typed, reusable, and shaped for `SearchFilterTRPC`.

Use this default structure:

```txt
apps/api/src/filters/
  index.ts
  common/
    utils.ts
    customers.ts
    sales-reps.ts
    sales-statuses.ts
    date-ranges.ts
    search.ts
  sales-orders.ts
  sales-orders-v2.ts
  sales-quotes.ts
  dealership-orders.ts
  dealership-quotes.ts
  dealership-customers.ts
```

`filters/common/*` is for reusable builders and option loaders. `filters/<page>.ts` is for page-specific composition.

Example:

```ts
// apps/api/src/filters/sales-orders.ts
import { customerFilter } from "./common/customers";
import { salesRepFilter } from "./common/sales-reps";
import { salesStatusFilter } from "./common/sales-statuses";

export async function getSalesOrderFilters(ctx: FilterContext) {
  return [
    await customerFilter(ctx),
    await salesRepFilter(ctx),
    salesStatusFilter(),
  ];
}
```

Promote a page file into a folder only when it becomes large enough to need private helpers:

```txt
apps/api/src/filters/sales-orders.ts

becomes:

apps/api/src/filters/sales-orders/
  index.ts
  schema.ts
  options.ts
  utils.ts
```

Comparison:

| Model | Best For | Problem |
| --- | --- | --- |
| One `filters.ts` | tiny apps | becomes a high-conflict junk drawer |
| `common/*` plus `<page>.ts` | GND default | requires discipline around `common` |
| `<page>/` folders | very large pages | too heavy as the default |

Performance rules:

- use `distinct`, `groupBy`, caps, or lazy option loading instead of full-table scans
- cap option lists with a shared constant
- make customer, phone, order number, and P.O. filters lazy/searchable
- keep static statuses in code, not DB queries
- split definitions from option loaders when a filter menu needs lazy hydration

## 9. Search Filter Component Library

GND should standardize on `SearchFilterTRPC`, `FilterDefinition`, `FilterList`, and `SearchFilterProvider`.

The UI filter contract should support:

- server-loaded filter definitions
- URL param state
- saved page tabs
- option, checkbox, input, date, date-range, and custom controls
- immediate, debounced, and submit commit modes
- active-filter badges and clear actions

Recommended page usage:

```tsx
<SearchFilterProvider params={filterParams}>
  <SearchFilterTRPC
    filters={filters}
    placeholder="Search orders"
    commitMode="submit"
  />
  <SalesOrdersTable />
</SearchFilterProvider>
```

Performance comparison:

| Area | Midday | GND |
| --- | --- | --- |
| URL state | strong `nuqs` discipline | should preserve same discipline |
| Filter UI | more feature-local | reusable component library |
| Risk | less abstraction | heavier provider/render cost |

Rules:

- rename old `midday-search-filter` naming to `search-filter`
- make `FilterDefinition` the canonical UI contract
- use submit mode for expensive lists
- memoize provider values and parsed params
- virtualize long option lists
- keep page-specific copy and empty states near the feature page

## 10. DataTable Architecture

Use `@gnd/ui/data-table` for operational tables.

The table package owns:

- provider/context
- row selection
- infinite loading integration
- mobile column support
- shared rendering primitives
- common toolbar/action patterns

Feature pages own:

- columns
- row DTOs
- empty states
- page-specific actions
- filter/table composition

Recommended shape:

```tsx
<Table.Provider args={tableArgs}>
  <Table.Toolbar />
  <Table.Content />
  <Table.LoadMore />
</Table.Provider>
```

Performance comparison:

| Area | Midday | GND |
| --- | --- | --- |
| Table ownership | feature-local tables | shared table library |
| Consistency | manual consistency | stronger shared UX |
| Risk | repeated code | shared abstraction can become too broad |

Rules:

- high-volume pages must support virtualization
- row DTOs must be narrow
- column definitions stay feature-owned
- avoid global table features until two or more real pages need them
- test selection, infinite loading, mobile columns, and empty states

## 11. Notification Architecture

GND should keep notification workflows in `@gnd/notifications`.

The package owns:

- typed channel names
- per-channel payload schemas
- channel handlers
- channel configs
- activity creation
- email delivery
- WhatsApp delivery
- recipient resolution
- Trigger.dev async delivery
- direct-recipient channels

Recommended flow:

```txt
app/domain event
  -> tasks.trigger("notification", payload)
  -> @gnd/notifications validates channel payload
  -> resolves recipients/preferences
  -> creates activity
  -> sends email/WhatsApp when configured
```

Performance comparison:

| Area | Midday | GND |
| --- | --- | --- |
| Notification model | clean team-scoped notifications | richer channel/recipient model |
| Delivery | activity/email | activity/email/WhatsApp/direct recipients |
| Risk | simpler | more DB work per event |

Rules:

- no ad hoc notification sending from UI components
- use idempotency keys for retry-sensitive channels
- replace package `console.log` with structured logger calls
- dedupe recipients before delivery
- add registry tests proving every channel has schema, handler, config, and trigger mapping

## 12. Jobs And Background Work

Use jobs for slow, retryable, or side-effect-heavy work.

Move these out of request/response paths:

- notification delivery
- payment reminders
- email/WhatsApp sends
- exports
- imports
- PDFs
- sync tasks
- scheduled cleanup
- expensive reconciliation

Rules:

- validate job payloads with schemas
- make jobs idempotent where retries can duplicate side effects
- log structured metadata
- keep job handlers thin and delegate domain work to packages

## 13. Dashboard And Page Architecture

Use server pages for initial data, client components for interaction, and URL state for navigation-relevant state.

Standard operational list page:

```txt
page.tsx
  parse search params
  prefetch list query
  prefetch summary query if needed
  prefetch filters
  hydrate React Query
  render filter provider + data table

components/
  columns.tsx
  data-table.tsx
  empty-state.tsx
  row-actions.tsx
```

Rules:

- URL params own filters, tabs, sort, visible sheets, and pagination state that should survive refresh/share
- React Query owns server data caching
- local state owns ephemeral UI only
- feature pages should remain readable and orchestration-focused

## 14. UI And Design System

GND should inherit Midday's premium restraint.

Rules:

- use shared primitives from `@gnd/ui`
- keep operational screens dense, calm, and scan-friendly
- avoid decorative layouts on internal tools
- use icons for tool actions where obvious
- avoid nesting cards inside cards
- keep page-specific workflows out of the UI package
- make empty/loading/error states explicit
- preserve responsive table and filter behavior

UI package rule:

```txt
@gnd/ui owns reusable primitives.
Feature folders own product meaning.
```

## 15. Error Handling And Logging

Use structured logging for production-relevant events.

Rules:

- no noisy `console.log` in packages
- log auth events, notification failures, job failures, slow DB queries, and external API failures
- include stable identifiers, not full sensitive payloads
- return user-safe errors from API boundaries
- preserve original errors in logs where safe

## 16. Performance Standards

Database:

- prefer `select`
- avoid broad `include`
- cap list and filter option queries
- use indexes for sort/filter/session/auth lookups
- avoid deep offset pagination for large tables
- make counts optional where possible
- batch or parallelize independent aggregates

Frontend:

- server-prefetch expensive first-screen data
- use React Query stale/gc times intentionally
- use submit mode for expensive filters
- virtualize long tables and option lists
- memoize provider values and column definitions

Jobs:

- make retry-sensitive side effects idempotent
- dedupe recipients and expensive lookup work
- push slow work out of request paths

## 17. Testing Standard

Test the behavior that protects architecture.

Minimum tests by area:

- page-list schema parsing
- query adapter/where construction
- row normalizers
- summary aggregate helpers
- auth session resolution
- revoked workspace users
- inactive/restricted dealer users
- protected/dealer-protected procedure rejection
- soft-delete defaults on Prisma reads
- filter option caps and lazy loaders
- notification registry consistency
- table selection/infinite loading/mobile rendering where practical

Use focused tests. Do not add broad fragile tests for every implementation detail.

## 18. How To Add A Feature In This Standard

1. Define the domain boundary.

Decide whether the behavior belongs in app code, `@gnd/db/queries`, or a domain package.

2. Define schemas and contracts.

Create Zod input schemas, row DTOs, filter contracts, and notification payload schemas if needed.

3. Implement data access.

Use Prisma with narrow `select`, explicit sort allowlists, caps, and transaction boundaries.

4. Add API adapter.

Keep tRPC procedures thin. Resolve auth centrally. Delegate to query/domain functions.

5. Add filters.

Use `filters/common/*` for reusable builders and `filters/<page>.ts` for composition.

6. Add UI.

Use `SearchFilterTRPC`, `SearchFilterProvider`, URL params, React Query hydration, and `@gnd/ui/data-table` where applicable.

7. Add jobs/notifications.

Use Trigger.dev and `@gnd/notifications` for async side effects.

8. Validate.

Run the narrowest useful typecheck/test/lint commands for touched packages.

## 19. AI Prompt Contract

When asking an AI agent to build in this codebase, include this contract:

```txt
Build in the Midday-GND standard.

Use Midday's architecture discipline: app layers orchestrate, packages own durable logic, APIs validate input, UI state that affects navigation lives in URL params, and reusable behavior belongs behind explicit package/module boundaries.

Use GND's implementation choices: Prisma through @gnd/db, Better Auth through @gnd/auth, page-list helpers for operational lists, filters/common/* plus filters/<page>.ts for filter loaders, SearchFilterTRPC for dashboard filters, @gnd/ui/data-table for operational tables, and @gnd/notifications for notification workflows.

Do not add new auth, database, table, filter, or notification patterns unless there is a clear reason. Prefer existing local conventions. Keep changes scoped. Add focused validation.
```

## 20. AI Review Checklist

Architecture:

- Is durable logic outside pages/components/route handlers?
- Does package ownership make sense?
- Are imports using public package entrypoints?
- Is the feature avoiding duplicate frameworks/patterns?

Auth and DB:

- Is Better Auth the session source for protected work?
- Are Prisma queries narrow and indexed?
- Are transactions used for multi-write workflows?
- Is soft-delete behavior respected?

API:

- Are inputs validated with Zod?
- Are procedures correctly public/protected/dealer-protected?
- Are permissions checked centrally?
- Are row DTOs normalized?

Filters and tables:

- Are reusable filters in `filters/common/*`?
- Is page composition in `filters/<page>.ts`?
- Are high-cardinality options capped or lazy?
- Is `SearchFilterTRPC` used for dashboard filters?
- Is `@gnd/ui/data-table` used for operational tables?

Notifications:

- Is notification delivery routed through `@gnd/notifications`?
- Are payloads typed and validated?
- Are retry-sensitive channels idempotent?

Performance:

- Is count optional where expensive?
- Is pagination appropriate for table size?
- Are provider values memoized?
- Are long lists virtualized?

Validation:

- Was the smallest relevant test/typecheck/lint run?
- Are important edge cases covered?

## 21. Prioritized Cleanup Plan

1. Make Better Auth the canonical resolver for workspace and dealer API context.
2. Add protected/dealer-protected procedure tests for missing, revoked, and inactive sessions.
3. Create `apps/api/src/filters/common/utils.ts`.
4. Move sales order, quote, and dealership filters out of monolithic `filters.ts`.
5. Extract reusable customer, sales rep, sales status, date range, and search filters into `filters/common/*`.
6. Rename `midday-search-filter` to `search-filter`.
7. Make `FilterDefinition` the canonical filter UI contract.
8. Add lazy filter option loading for customer, phone, P.O., and order number.
9. Add optional virtualization to `@gnd/ui/data-table`.
10. Replace notification package `console.log` calls with structured logger calls.
11. Add channel registry consistency tests for `@gnd/notifications`.
12. Move stable app-owned query helpers toward `@gnd/db/queries` or domain packages.

