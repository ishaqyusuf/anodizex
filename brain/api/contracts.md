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

## Billing Webhooks
Webhook processing stores:
- Provider event ID.
- Event type.
- Raw payload.
- Processing status.
- Related workspace when resolvable from metadata.
- Subscription and workspace plan/status updates from verified events.
