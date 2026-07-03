# Feature: Dashboard Sheet Standardization

## Status
In progress. Primary dashboard sheet forms aligned on 2026-06-09.

## Scope
- Customer create/edit sheets.
- Job create sheet.
- Follow-up create, schedule, and work sheets.
- Template create/edit sheets.

## Architecture
- Sheets remain in `apps/dashboard/src/components/sheets`.
- Sheet open state remains URL-backed through existing domain hooks or nearby `nuqs` query state.
- Primary dashboard sheets share `apps/dashboard/src/components/sheets/dashboard-sheet-content.tsx` for scrollable content, visible header copy, accessible sheet titles, and body spacing.
- Forms use the typed `useZodForm` helper with API schemas where available.
- Fields use `@anodizex/ui/form` primitives and shared UI controls instead of raw labels, native selects, or direct `form.register` markup.
- Loading states use `apps/dashboard/src/components/sheets/sheet-form-skeleton.tsx` instead of centered text placeholders.

## Current State
- Template creation now follows the Midday sheet composition pattern: the URL-backed sheet stays thin and renders a dedicated form component from `components/forms`.
- Template editing now follows the same composition pattern, and the edit sheet reads the same `templateId` URL param written by the templates table.
- Template create/edit sheets already use shared shadcn-style form primitives.
- Record-backed customer, follow-up work, schedule follow-up, and template edit sheets render the shared card-style missing-record state with a close action when URL params point at archived or removed records.
- Customer creation and editing now follow the same composition pattern, and the edit sheet reads the same `customerId` URL param written by the customers table.
- Customer create/edit sheets now use `FormField`, `FormItem`, `FormLabel`, `FormControl`, and `FormMessage`.
- Job creation now follows the same composition pattern while preserving create-first customer, service-title, and category autocomplete behavior.
- Job create service-title and category autocomplete create callbacks trim and guard values like customer creation.
- Job create amount now uses the shared `CurrencyInput` primitive instead of a native number input while preserving the existing dollars-to-cents submit conversion.
- Follow-up creation now follows the same composition pattern while preserving create-first customer autocomplete behavior.
- Schedule follow-up now follows the same composition pattern while preserving job/template loading in the sheet.
- Jobs table rows and the jobs action menu now open the schedule follow-up sheet through the `schedule_follow_up` URL key.
- Follow-up work now follows the same composition pattern, and the work sheet reads the same `followUpId` URL param written by the follow-ups table.
- Follow-up board cards now use the same `followUpId` URL param as the follow-up table rows and priority widget.
- Follow-up create uses the shared combobox autocomplete for customer lookup with create-first customer creation; follow-up schedule uses shared `Select` controls.
- Follow-up create due date now uses the shared calendar-popover control instead of a native date input, matching the job create sheet date fields.
- Schedule follow-up and follow-up work reschedule dates now use the same shared calendar-popover control, so follow-up sheet date fields no longer rely on native date inputs.
- Follow-up work sheet mini-forms now use shared form primitives.
- Shared `useZodForm` carries Zod form output types without local `any` casts.
- Job create sheet has the same descriptive sheet-header pattern as the other primary create sheets.
- Edit/work sheets now use shared skeleton loading states while fetching records.
- Edit/work sheets no longer use loading skeletons as the final fallback for missing records.
- Customer, job, follow-up, schedule, and template form sheets use scrollable `SheetContent` so long forms remain usable on shorter viewports.
- Customer, job, follow-up, schedule, and template form sheets now consume the shared dashboard sheet content wrapper instead of repeating `SheetContent`, `SheetHeader`, title, and description wiring locally.
- Schedule follow-up sheet descriptions avoid loading prose because fetch loading is represented by the sheet skeleton.
- Create sheets use stable select/autocomplete placeholders while option queries load; disabled state communicates loading instead of field text changing to loading prose.
- Sheet titles now use sentence-case copy consistently across customer, follow-up, job, and template sheets.
- Sheet action copy uses sentence case, and create-first customer comboboxes disable while customer creation is pending.
- Template edit sheet archive action uses archive-oriented copy to match its API mutation.
- Follow-up sheet copy uses consistent hyphenated follow-up language.
- Template and follow-up sheet forms now derive channel select options from the same shared channel label maps used by their filters.
- Follow-up create and schedule forms use controlled channel selects so sheet resets and record changes cannot leave stale UI state.
- Mobile left/right sheets now use the full viewport width below the `sm` breakpoint while preserving the Midday-style `sm:w-3/4` and desktop max-width behavior.

## Remaining Work
- Continue the page and filter/filter-option sweep.
- Audit any newly added non-sheet forms against the same primitive standard.
