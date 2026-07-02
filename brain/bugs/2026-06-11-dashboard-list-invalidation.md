# Dashboard List Invalidation

## Summary
Customer creation and similar dashboard submit flows could leave visible lists stale after a successful mutation.

## Status
Fixed

## Impact
Users could create customers, jobs, follow-ups, or templates and not see the affected dashboard tables update until a later refresh.

## Steps To Reproduce
1. Open the dashboard customers table.
2. Create a customer from the create customer sheet.
3. Observe whether the customers table updates immediately.

## Expected
Successful submit and row actions should refresh the affected list, infinite table, and detail query caches.

## Actual
Some submit handlers invalidated only the plain list query key, which did not reliably cover filtered infinite table queries.

## Root Cause
Dashboard tables use parameterized infinite queries, while forms invalidated narrower list query keys. The active table cache could therefore remain fresh from React Query's perspective.

## Fix
Added a shared dashboard invalidation hook that invalidates cached queries by tRPC procedure path, covering both dropdown list queries and filtered infinite table queries. Updated customer, job, follow-up, and template submit and row-action mutations to use it.

## Verification
- `git diff --check` scoped to touched dashboard invalidation files.
- Recommended manual check: create a customer from the customers sheet and confirm the table updates immediately.
