# Feature: Workspace Settings

## Status
Implemented for MVP and updated on 2026-06-09 to follow the Midday settings-page structure with structured loading state.

## Scope
- Workspace profile editing.
- Business type and service category editing with creatable autocomplete suggestions.
- Default follow-up delay selection.
- Workspace update tracking event.

## Architecture
- Page owner: `apps/dashboard/src/app/(sidebar)/settings/page.tsx`.
- Form owner: `apps/dashboard/src/components/forms/update-workspace-form.tsx`.
- API owner: `apps/api/src/routers/_app.ts` `workspace` router.
- Validation owner: `apps/api/src/schemas/index.ts` `updateWorkspaceSettingsSchema`.

## Rules
- Settings page uses a constrained Midday-style settings column.
- The page does not render a separate hero/header; settings cards provide the section structure inside the shell padding.
- Workspace settings render as a card-style settings section alongside the appearance card.
- Form fields use shared shadcn-style primitives instead of raw HTML controls.
- Workspace settings loading uses a card-shaped, field-shaped skeleton instead of a text placeholder.
- Business type changes clear the service category so suggestions stay contextual.
