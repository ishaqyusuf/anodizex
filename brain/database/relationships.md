# Database Relationships

## Purpose
This file documents intended entity relationships.

## Workspace
- A `Workspace` has many `Memberships`.
- A `Workspace` has many `Customers`.
- A `Workspace` has many `ServiceJobs`.
- A `Workspace` has many `FollowUps`.
- A `Workspace` has many `FollowUpTemplates`.
- A `Workspace` has many `QuotationMaterials`, `QuotationMaterialCostHistories`, `QuotationMaterialSupplierPrices`, `QuotationMaterialSupplierPriceHistories`, and `ProjectQuotations`.
- A `Workspace` has one active `Subscription` conceptually, though historical subscription records may exist.
- A `Workspace` has one `WebsiteSettings` record.
- A `Workspace` has many `WebsiteProjects`, `WebsiteProjectMedia`, `WebsiteGalleryItems`, `BlogPosts`, and `ContactInquiries`.

## User And Membership
- A `User` can belong to many workspaces through `Membership`.
- A `Membership` belongs to one `Workspace` and one `User`.
- A `TeamInvite` belongs to one `Workspace` and may become a `Membership`.

## Customer And Service Work
- A `Customer` belongs to one `Workspace`.
- A `Customer` has many `ServiceJobs`.
- A `Customer` has many `FollowUps`.
- A `Customer` can have many `ProjectQuotations`.

## Project Quotations
- A `QuotationMaterial` belongs to one `Workspace` and can have many `QuotationMaterialCostHistory` records.
- A `QuotationMaterialCostHistory` belongs to one `Workspace` and one `QuotationMaterial`.
- A `QuotationMaterial` can have many `QuotationMaterialSupplierPrices`.
- A `QuotationMaterialSupplierPrice` belongs to one `QuotationMaterial`, one `Workspace`, and has many `QuotationMaterialSupplierPriceHistory` records.
- A `QuotationMaterialSupplierPriceHistory` belongs to one supplier price, one material, and one workspace.
- A `ProjectQuotation` belongs to one `Workspace` and may belong to one `Customer`.
- A `ProjectQuotation` has many `ProjectQuotationUnits`.
- A `ProjectQuotationUnit` belongs to one `ProjectQuotation` and one `Workspace`.
- A `ProjectQuotationUnit` has many `ProjectQuotationMaterialLines`.
- A `ProjectQuotationMaterialLine` belongs to one `ProjectQuotationUnit`, one `ProjectQuotation`, one `Workspace`, and optionally one current `QuotationMaterial` and supplier price.

## Follow-Up
- A `FollowUp` belongs to one `Workspace`.
- A `FollowUp` belongs to one `Customer`.
- A `FollowUp` may belong to one `ServiceJob`.
- A `FollowUp` may reference one `FollowUpTemplate`.
- A `FollowUp` has many `FollowUpEvents`.
- A `FollowUp` has many `MessageLogs`.

## Billing
- A `Subscription` belongs to one `Workspace`.
- A `BillingEvent` records provider webhook payloads and links to a workspace when resolvable.

## Website CMS
- `WebsiteSettings` belongs to one `Workspace` and is unique per workspace.
- `WebsiteProject` belongs to one `Workspace` and has many `WebsiteProjectMedia`.
- `WebsiteProject` can be linked from many `WebsiteGalleryItems`.
- `WebsiteProjectMedia` belongs to one `WebsiteProject` and one `Workspace`.
- `WebsiteGalleryItem` belongs to one `Workspace` and may belong to one `WebsiteProject`.
- `BlogPost` belongs to one `Workspace`.
- `ContactInquiry` may belong to one `Workspace`; it can be stored without a workspace when public contact is submitted before a CMS workspace exists.

## Invariants
- Business objects cannot cross workspaces.
- Follow-up ownership is optional at first but must reference a membership when assigned.
- Provider event IDs must be unique for idempotency.
- Website admin mutations require owner/admin membership and only mutate the active workspace.
- Public website reads return published workspace content when available and fallback Anodizex demo content when CMS data is empty.
- Quotation totals are calculated server-side from unit quantities, material snapshots, labor cost, and markup percentage.
- Quotation material lines snapshot name, unit, supplier name/SKU, and unit cost so historical quote totals remain stable when the material library or supplier pricing changes later.
- Only one active supplier price should be marked preferred for a material; setting a supplier price preferred updates the material's default current cost.
