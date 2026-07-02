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

## Workspace Scoping
- Customer, job, follow-up, template, event, message, subscription, and billing-event reads/writes are scoped by workspace.
- API procedures derive workspace from session membership and do not trust client workspace IDs.

## Index Requirements
- Workspace foreign keys on all business tables.
- Customer search fields.
- Service job completion date.
- Follow-up due date and status.
- Lemon Squeezy event ID/provider references.

## Validation
- `bunx prisma validate` in `packages/db` passed on 2026-05-30.
- `bun run db:generate` in `packages/db` passed on 2026-05-30.
