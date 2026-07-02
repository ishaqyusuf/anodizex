# Feature: Dashboard Table Standardization

## Status
In progress. Empty-state alignment, filter payload cleanup, customer tag filters, job category filters, template channel filters, table settings hydration, and infinite prefetch alignment updated on 2026-06-09.

## Scope
- Customers, jobs, follow-ups, and templates tables should use a shared Midday-style empty/no-results pattern.
- Empty-state primary actions should open the correct create sheet for the current domain.
- No-results actions should clear only table filter params, not unrelated sheet or detail state.
- Table filter payloads should match the API router inputs exactly.

## Architecture
- Shared empty-state owner: `apps/dashboard/src/components/tables/core/empty-states.tsx`.
- Shared skeleton owner: `apps/dashboard/src/components/tables/core/table-skeleton.tsx`.
- Domain wrappers:
  - `apps/dashboard/src/components/tables/customers/empty-states.tsx`
  - `apps/dashboard/src/components/tables/customers/skeleton.tsx`
  - `apps/dashboard/src/components/tables/jobs/empty-states.tsx`
  - `apps/dashboard/src/components/tables/jobs/skeleton.tsx`
  - `apps/dashboard/src/components/tables/follow-ups/empty-states.tsx`
  - `apps/dashboard/src/components/tables/follow-ups/skeleton.tsx`
  - `apps/dashboard/src/components/tables/templates/empty-states.tsx`
  - `apps/dashboard/src/components/tables/templates/skeleton.tsx`

## Current State
- Domain tables now wrap the shared empty/no-results component.
- Follow-up empty state opens `createFollowUp`.
- Template empty state opens `createTemplate`.
- Follow-up board now renders a single actionable empty state when all columns are empty instead of repeated per-column blank messages.
- Follow-up board per-column empty copy is follow-up-specific, and board cards are typed from the `followUps.listBoard` router output instead of `any`.
- No-results states clear the matching filter hook for each table.
- Customer, follow-up, and template table searches now send `search` to their routers instead of URL-only `q`.
- Jobs table filters now normalize empty URL values to `undefined` before calling the service jobs router.
- Customer filter params now expose search and tag filters backed by matching API predicates.
- Customers, jobs, follow-ups, and templates route fallbacks now render domain table skeletons.
- Follow-up table sticky/non-reorderable config now uses the real `customer` column ID.
- Customers, jobs, follow-ups, and templates now pass URL sort state through server prefetch, client table queries, and allowlisted API router order clauses.
- API table sort helpers now use Prisma order-by types instead of loose `any` return/fallback types.
- Sort toggling now starts new columns at ascending, then cycles ascending, descending, and cleared.
- Follow-up history filters now support status, channel, and due-date range with matching API predicates.
- Follow-up status and channel filters now use shared display-label maps instead of inline label construction.
- Follow-up status/channel and template channel table badges now reuse the same shared display-label maps as their filters.
- Template filters now support channel filtering with matching URL params, table query input, and API router predicates.
- Template channel filters now use a shared display-label map instead of a local label object.
- Customer search now matches name, company, email, phone, and exact tag values instead of name only.
- Customer filters now support tag filtering with matching URL params, table query input, route prefetch, filter chips, and API router predicates.
- Job filters now support service category filtering with matching URL params, table query input, route prefetch, filter chips, and API router predicates.
- Job status filters now share one allowed-status helper across filter UI, route prefetch, client table query, and API input validation.
- Job status display labels now share one map across filter options and table badges, so stored enum values do not leak underscores into the UI.
- Job rows and the jobs action menu now open the mounted schedule follow-up sheet instead of writing unused job detail URL params.
- Customer tag, job category, and job customer filter menus now use a shared compact empty state component when no options exist.
- Job completed-date and follow-up due-date filter menus now share a calendar-backed date-range filter instead of duplicated native date inputs.
- Job completed-date and follow-up due-date filter chips now collapse start/end into one Midday-style range chip and clear both date params together.
- Filter option and create/schedule form dropdown source queries now request the max supported page size so menus are less likely to omit available customers, jobs, templates, or tags.
- Customer, job, follow-up, and template filter buttons now only show active state when the selected URL filters can render as visible chips.
- Template filter active-state checks now use the shared channel coercion helper instead of duplicating enum membership logic.
- Customer, follow-up, and template table no-results detection now only counts non-empty searches, non-empty arrays, valid enum filters, and real date bounds.
- Customers, jobs, follow-ups, and templates route pages now load persisted table settings from the table-settings cookie and pass them into the table components.
- Customers, jobs, follow-up history, and templates route pages now prefetch table data with `infiniteQueryOptions` to match their `useSuspenseInfiniteQuery` table consumers.
- Customers, jobs, follow-up history, and templates table components type paginated data from the tRPC router outputs instead of `any`, and the virtualizer fallback no longer uses misleading no-results copy.
- Customer, job, follow-up, and template table column definitions now derive row types from their matching tRPC router outputs so `ColumnDef` generics stay aligned with table data.
- Customer, job, follow-up, and template tables now use domain-specific drag-and-drop context IDs.
- Customer, job, follow-up, and template column visibility popovers use shared `Label` primitives for checkbox labels.
- Customer, follow-up, and template action menus now call real table meta actions with behavior-matched callback names.
- Customer and template archive actions now use archive-oriented labels and callback names instead of delete wording.
- Shared table action meta now only exposes active callbacks used by the standardized tables.
- Customer, job, follow-up, and template row-open handlers now only set the active detail ID in URL params and no longer carry stale `details` flag comments.
- Customer, job, follow-up, and template date column labels use sentence-case copy in both columns and visibility/sort menus.

## Remaining Work
- Continue page consistency audit for non-table dashboard pages.
