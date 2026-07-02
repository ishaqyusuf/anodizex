# Feature: Follow-Up Templates MVP

## Status
Implemented for MVP on 2026-05-30.

Updated on 2026-06-09 to align create/edit sheets with the standard shadcn form primitives and add Midday-style channel filtering.

## Scope
- List, create, update, archive, and set-default templates.
- Starter templates are seeded on onboarding.
- Template preview resolves merge tags against sample customer/job/workspace data.
- Templates can be selected when creating follow-ups from jobs and follow-up forms.
- Create and edit sheets use `FormField`, `Select`, and `Checkbox` primitives instead of raw HTML controls.
- The templates table supports URL-backed channel filtering with a matching API predicate.

## Architecture
- API owner: `apps/api/src/routers/_app.ts` `templates` router.
- UI owner: `apps/dashboard/src/app/templates/page.tsx`.
- Sheet owners: `apps/dashboard/src/components/sheets/template-create-sheet.tsx` and `apps/dashboard/src/components/sheets/template-sheet.tsx`.
- Filter owner: `apps/dashboard/src/components/templates-search-filter.tsx`.

## Merge Tags
- `{{customer_name}}`
- `{{business_name}}`
- `{{service_name}}`
- `{{completion_date}}`

## Limits
Template creation enforces current plan limits.
