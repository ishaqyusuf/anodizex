# API Contracts

## Purpose
This file records implemented request/response standards for API and dashboard callers.

## Contract Rules
- Use Zod validation for all external input.
- Return workspace-scoped records only.
- Dates returned to the dashboard are ISO strings.
- List responses use `{ items, nextCursor? }`.
- Mutations use `{ item }`.
- Billing checkout uses `{ checkoutUrl }`.
- Keep provider payloads out of dashboard responses unless needed for support/debugging.

## Common Response Patterns
```ts
type ListResult<T> = {
  items: T[];
  nextCursor?: string | null;
};

type MutationResult<T> = {
  item: T;
};
```

## Workspace
Workspace onboarding and settings reject reserved platform/system workspace names such as `afterservice`, `admin`, `api`, `dashboard`, `support`, `system`, `test`, and `demo`.

```ts
type WorkspaceCurrent = {
  item: {
    id: string;
    name: string;
    slug: string;
    role: "owner" | "admin" | "staff";
    businessType: string | null;
    serviceCategory: string | null;
    defaultFollowUpDelayDays: number;
    plan: "starter" | "growth" | "pro";
    planStatus: "trialing" | "active" | "past_due" | "canceled";
  };
};
```

## Customers
```ts
type CustomerSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  tags: string[];
  notes: string | null;
  archivedAt: string | null;
  lastServiceAt: string | null;
  openFollowUpCount: number;
};

type CustomerTagsResult = {
  items: string[];
};
```

## Service Jobs
```ts
type ServiceJobSummary = {
  id: string;
  title: string;
  serviceCategory: string | null;
  completedAt: string | null;
  amountCents: number | null;
  notes: string | null;
  status: "completed" | "needs_follow_up" | "resolved";
  customer: {
    id: string;
    name: string;
  };
};
```

## Follow-Ups
```ts
type FollowUpItem = {
  id: string;
  customerName: string;
  serviceTitle: string | null;
  channel: "email" | "sms" | "phone" | "whatsapp";
  dueAt: string;
  status: "open" | "scheduled" | "sent" | "replied" | "closed" | "missed";
  assignedMemberId: string | null;
  lastContactedAt: string | null;
  repliedAt: string | null;
  closedAt: string | null;
  notes: string | null;
  events: Array<{
    id: string;
    type: string;
    note: string | null;
    createdAt: string;
  }>;
};

type FollowUpBoard = {
  columns: {
    dueToday: FollowUpItem[];
    upcoming: FollowUpItem[];
    waiting: FollowUpItem[];
    replied: FollowUpItem[];
    closed: FollowUpItem[];
  };
};
```

## Templates
```ts
type FollowUpTemplateDto = {
  id: string;
  name: string;
  channel: "email" | "sms" | "phone" | "whatsapp";
  subject: string | null;
  body: string;
  isDefault: boolean;
  archivedAt: string | null;
};
```

## Project Quotations
Quotation inputs use Zod schemas from `@anodizex/api/schemas`. Currency values are stored and returned as integer cents.

```ts
type QuotationMaterialDto = {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentUnitCostCents: number;
  supplier: string | null;
  notes: string | null;
  archivedAt: string | null;
  supplierPrices: QuotationMaterialSupplierPriceDto[];
  costHistory: Array<{
    id: string;
    unitCostCents: number;
    supplier: string;
    note: string;
    createdAt: string;
    effectiveAt: string;
  }>;
};

type QuotationMaterialSupplierPriceDto = {
  id: string;
  materialId: string;
  supplierName: string;
  supplierSku: string;
  unitCostCents: number;
  currency: string;
  leadTimeDays: number | null;
  isPreferred: boolean;
  archivedAt: string | null;
  history: Array<{
    id: string;
    previousUnitCostCents: number | null;
    unitCostCents: number;
    note: string;
    createdAt: string;
    effectiveAt: string;
  }>;
};

type ProjectQuotationDto = {
  id: string;
  projectName: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  projectAddress: string | null;
  status: "draft" | "sent" | "approved" | "declined" | "expired";
  validUntil: string | null;
  markupPercent: number;
  materialSubtotalCents: number;
  laborSubtotalCents: number;
  markupCents: number;
  totalCents: number;
  units: ProjectQuotationUnitDto[];
};

type ProjectQuotationUnitDto = {
  id: string;
  label: string;
  systemType: string;
  widthMm: number;
  heightMm: number;
  quantity: number;
  laborCostCents: number;
  materialSubtotalCents: number;
  totalCents: number;
  materialLines: ProjectQuotationMaterialLineDto[];
};

type ProjectQuotationMaterialLineDto = {
  id: string;
  materialId: string | null;
  supplierPriceId: string | null;
  materialName: string;
  supplierName: string;
  supplierSku: string;
  unit: string;
  quantity: number;
  unitCostCents: number;
  wastePercent: number;
  totalCents: number;
};
```

## Billing
```ts
type BillingPlanDto = {
  plan: "starter" | "growth" | "pro";
  planStatus: "trialing" | "active" | "past_due" | "canceled";
  limits: {
    customers: number;
    followUps: number;
    templates: number;
    teamMembers: number;
  };
  usage: {
    customers: number;
    followUps: number;
    templates: number;
    teamMembers: number;
  };
};

type CheckoutResult = {
  checkoutUrl: string;
};
```

## Website
Public website reads return serialized dates as ISO strings and use fallback Anodizex demo content when a workspace has not created CMS data yet.

```ts
type WebsiteLanding = {
  item: {
    settings: WebsiteSettingsDto;
    gallery: WebsiteGalleryItemDto[];
    projects: WebsiteProjectDto[];
    blogPosts: BlogPostDto[];
  };
};

type WebsiteSettingsDto = {
  id: string;
  workspaceId: string;
  companyName: string;
  headline: string;
  description: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  country: string;
  officeHours: string;
  heroImageUrl: string;
};

type WebsiteProjectDto = {
  id: string;
  slug: string;
  title: string;
  year: number;
  summary: string;
  description: string;
  log: string;
  coverImageUrl: string;
  serviceType: string;
  media: WebsiteProjectMediaDto[];
};
```

Website admin mutations use shared Zod schemas from `@anodizex/api/schemas`. Sort mutations accept ordered ID arrays:

```ts
type ReorderWebsiteItemsInput = {
  ids: string[];
};
```

Contact form submission:

```ts
type ContactInquiryInput = {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  projectType?: string;
  message: string;
};

type ContactInquiryResult = {
  item: {
    id: string;
    status: "new" | "reviewed" | "replied" | "archived";
    adminEmailStatus: string;
    customerEmailStatus: string;
  };
};
```

## Billing Webhooks
Webhook processing stores:
- Provider event ID.
- Event type.
- Raw payload.
- Processing status.
- Related workspace when resolvable from metadata.
- Subscription and workspace plan/status updates from verified events.
