# Project Quotation System

## Purpose
Give Anodizex dashboard users a workspace-scoped quotation workflow for aluminium windows, sliding systems, doors, facades, and related project units.

## Current Implementation
- Dashboard route: `/quotations`.
- Navigation: dashboard sidebar includes `Quotations`.
- Data access: protected tRPC procedures under `quotations` and `quotations.materials`.
- Forms: dashboard forms use the local `useZodForm` pattern with shared Zod schemas from `@anodizex/api/schemas`.
- UI: built with existing dashboard/shadcn-style components.
- Database: Prisma models store material library records, supplier-specific material prices, supplier price history, default material cost history, quotation headers, BOQ units, and material line snapshots.

## User Flow
- Owner/admin adds material records with category, unit, default unit cost, supplier, and notes.
- Owner/admin adds supplier-specific prices for each material, including supplier name, supplier SKU, unit cost, currency, lead time, preferred flag, and notes.
- Owner/admin updates supplier prices; each price change writes a supplier-specific pricing history record.
- Marking a supplier price as preferred updates the material's default current cost for quick quoting.
- Owner/admin creates a project quotation with project/client details, validity date, markup percentage, BOQ units, labor cost, and material lines.
- Each BOQ unit can store dimensions, quantity, system type, notes, and multiple material lines with optional supplier price selections.
- The API calculates material subtotal, labor subtotal, markup, and final total server-side.
- Saved quotations can be listed, opened, and moved between draft, sent, approved, declined, and expired.

## Calculation Rules
- Money is stored in integer cents.
- Material line quantity is per repeated unit and is multiplied by the BOQ unit quantity.
- Labor cost is stored per BOQ unit and multiplied by quantity.
- Markup is stored as basis points derived from the dashboard markup percentage.
- Material line snapshots preserve material name, supplier name/SKU, unit, and unit cost at quote creation/update time.

## Permissions
- Quotation and material management require authenticated owner/admin workspace membership.
- Staff users do not manage quote pricing in the first pass.
- API procedures derive workspace from the session and do not accept client workspace IDs.

## Local Database
- Local Docker Postgres uses `postgresql://anodizex:anodizex@localhost:55435/anodizex`.
- `bun run db:local:push` synced the schema to the local Docker database on 2026-07-02.
- Root `db:migrate`/`db:push` attempts reached Prisma through Turbo but failed with `P1001`; formal migration history remains a follow-up.

## Follow-Ups
- Add PDF/export support.
- Add quote email delivery to customers.
- Add taxes, discounts, revision history, and richer saved-quote editing.
- Connect quotes to a dedicated Anodizex project entity once that domain model exists.
- Add supplier contact records and purchase-order workflows if procurement becomes part of the dashboard.
