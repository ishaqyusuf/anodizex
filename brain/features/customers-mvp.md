# Feature: Customers MVP

## Status
Implemented for MVP on 2026-05-30.

Updated on 2026-06-11 to add system tag suggestions and a creatable customer tag multiselect that also loads existing workspace tags.

## Scope
- Workspace-scoped customer list/search.
- Create, update, and archive customer records.
- Customer selection in job and follow-up forms.
- Customer summary includes contact fields, tags, notes, last service date, and open follow-up count.
- Customer create/edit forms support system tag suggestions, existing workspace tag suggestions, deduped tag selection, and custom tag creation.

## Architecture
- API owner: `apps/api/src/routers/_app.ts` `customers` router.
- UI owner: `apps/dashboard/src/app/customers/page.tsx`.
- Mutations route through `apps/dashboard/src/lib/dashboard-actions.ts` and typed tRPC caller helpers.
- Workspace scope comes from Better Auth session context, not client IDs.

## Limits
- Customer creation enforces plan limits from the current workspace plan.
- Archived customers are excluded from default lists.

## Verification
- `bun run typecheck`
- `bun run lint`
- `bun run build`
