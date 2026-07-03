# Feature: Dashboard Onboarding Standardization

## Status
Updated on 2026-06-09 to follow the dashboard form and loading-state standard.

## Scope
- Workspace creation onboarding form.
- Business type and service category setup.
- Default follow-up delay setup.

## Architecture
- Page owner: `apps/dashboard/src/app/onboarding/page.tsx`.
- Form owner: `apps/dashboard/src/components/forms/onboarding-form.tsx`.
- Validation owner: `apps/api/src/schemas/index.ts` `onboardingSchema`.
- Suggestion data owner: `apps/dashboard/src/lib/onboarding-suggestions.ts`.

## Current State
- Onboarding form uses shared `@anodizex/ui/form` primitives.
- Business type and service category use creatable `ComboboxDropdown` suggestions.
- Default follow-up delay uses the shared `Select` primitive and exposes a hover tooltip explaining that it controls the starting due date for new follow-ups after completed jobs.
- Business names are validated against a small reserved-name blacklist shared by onboarding and workspace settings schemas.
- Onboarding page suspense fallback uses `OnboardingFormSkeleton`.
- Direct `form.register` markup, raw labels, and native selects were removed from dashboard forms and sheets.

## Remaining Work
- Continue page shell consistency checks for authenticated pages.
- Keep onboarding submission as a simple API route POST until the API layer is migrated into the standard tRPC/form mutation flow.
