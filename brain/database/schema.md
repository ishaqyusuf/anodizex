# Database Schema

## Purpose
This file documents the implemented Prisma/Postgres schema in `packages/db`.

## Auth Models
- `User`: Better Auth identity record.
- `Session`: Better Auth session.
- `Account`: provider/account link.
- `Verification`: email or token verification.

## Workspace Models
- `Workspace`: business account, default follow-up cadence, and current entitlement plan/status.
- `Membership`: user membership in workspace with role.
- `TeamInvite`: invite flow for future team seats.

## Product Models
- `Customer`: workspace-scoped customer/contact record.
- `ServiceJob`: completed or tracked service work tied to a customer.
- `FollowUp`: after-service action tied to a customer and optionally a service job.
- `FollowUpTemplate`: reusable message template scoped to workspace and channel.
- `FollowUpEvent`: audit timeline for follow-up state changes.
- `MessageLog`: record of manual or provider-sent messages.

## Project Quotation Models
- `QuotationMaterial`: workspace-scoped material cost library for aluminium profiles, glass, accessories, and installation inputs.
- `QuotationMaterialCostHistory`: audit history for material unit-cost changes.
- `QuotationMaterialSupplierPrice`: supplier-specific material offer with supplier name, SKU, unit cost, currency, lead time, preferred flag, and archived state.
- `QuotationMaterialSupplierPriceHistory`: audit history for supplier-specific price changes.
- `ProjectQuotation`: generated project quotation with project/client fields, status, totals, validity date, and notes.
- `ProjectQuotationUnit`: BOQ line for a window, door, sliding system, facade unit, or other quoted project unit.
- `ProjectQuotationMaterialLine`: material snapshot attached to a quotation unit, including supplier price selection, supplier name/SKU snapshot, quantity, unit cost, and calculated line total.

## Website CMS Models
- `WebsiteSettings`: workspace-scoped public website contact details, hero copy, social links, and hero image URL.
- `WebsiteProject`: completed-project roadmap entries with year, slug, summary, description, log, cover image, status, and publish date.
- `WebsiteProjectMedia`: image/video media attached to a roadmap project page.
- `WebsiteGalleryItem`: public gallery image/video items, optionally linked to a roadmap project, with sortable ordering.
- `BlogPost`: public blog posts with slug, excerpt, content, cover image, author, sort order, and publish date.
- `ContactInquiry`: public contact form submissions with admin/customer email delivery status.

## Billing Models
- `Subscription`: current Lemon Squeezy-backed plan state.
- `BillingEvent`: idempotent Lemon Squeezy webhook event log.

## Enums
- `WorkspacePlan`: `starter | growth | pro`
- `WorkspacePlanStatus`: `trialing | active | past_due | canceled`
- `MembershipRole`: `owner | admin | staff`
- `ServiceJobStatus`: `completed | needs_follow_up | resolved`
- `FollowUpStatus`: `open | scheduled | sent | replied | closed | missed`
- `FollowUpChannel`: `email | sms | phone | whatsapp`
- `BillingProvider`: `lemon_squeezy`
- `WebsiteMediaType`: `image | video`
- `ContactInquiryStatus`: `new | reviewed | replied | archived`
- `ProjectQuotationStatus`: `draft | sent | approved | declined | expired`

## Workspace Scoping
- Customer, job, follow-up, template, event, message, subscription, and billing-event reads/writes are scoped by workspace.
- Project quotations, quote units, quote material lines, material libraries, supplier prices, supplier price histories, and material cost histories are scoped by workspace.
- Website settings, project, project media, gallery, blog, and contact-inquiry dashboard reads/writes are scoped by workspace.
- API procedures derive workspace from session membership and do not trust client workspace IDs.

## Index Requirements
- Workspace foreign keys on all business tables.
- Customer search fields.
- Service job completion date.
- Follow-up due date and status.
- Lemon Squeezy event ID/provider references.
- Website project slugs per workspace.
- Blog post slugs per workspace.
- Website media ordering by workspace/project.
- Contact inquiry creation date and status.
- Quotation materials by workspace/name and archived state.
- Quotation supplier prices by workspace/material/supplier and archived state.
- Quotation supplier price history by workspace/material/effective date.
- Project quotations by workspace/status/creation date.
- Quotation units by quotation/order.
- Quotation material lines by quotation unit/order.

## Validation
- `bunx prisma validate` in `packages/db` passed on 2026-05-30.
- `bun run db:generate` in `packages/db` passed on 2026-05-30.
- `DATABASE_URL=postgresql://anodizex:anodizex@localhost:55435/anodizex bun run db:validate` in `packages/db` passed on 2026-07-02 after the website CMS and project quotation schema additions.
- `DATABASE_URL=postgresql://anodizex:anodizex@localhost:55435/anodizex bun --filter @anodizex/db db:generate` passed on 2026-07-02.
