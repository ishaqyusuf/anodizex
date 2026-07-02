# Feature: Signed-In User Marketing And Notification System

## Status
Planned on 2026-06-09.

## Objective
Build a professional engagement system for signed-in afterservice users that supports in-app notifications, weekly product emails, lifecycle education, beta feedback prompts, and carefully controlled promotional campaigns without compromising user trust or deliverability.

## Product Context
afterservice is in free beta / early access. The current product principle is manual workflows first, automation second, and customer messaging should never surprise the operator. This system must therefore distinguish clearly between product/transactional notifications, lifecycle education, weekly summaries, and promotional messages.

## Recommended Architecture

Use a hybrid architecture:

- Keep user preferences, segmentation, campaign definitions, event triggers, delivery ledger, and suppression rules inside afterservice.
- Use a dedicated email provider for actual email delivery once domain authentication is configured.
- Continue using OpenPanel for analytics and product event measurement.
- Keep customer-facing follow-up messaging separate from signed-in-user marketing. The signed-in marketing system sends to afterservice users and workspace members, not to the operator's end customers.

This keeps afterservice in control of consent, workspace context, and product-aware targeting while avoiding custom SMTP/deliverability work.

## Message Classes

### 1. Transactional And Account Messages
Purpose:
- Authentication, account security, billing, membership invites, workspace-critical alerts, and service availability.

Rules:
- Sent even if marketing is disabled when legally and operationally appropriate.
- No promotional subject lines.
- No hidden upsell as the main purpose.
- Logged with durable provider status.

Examples:
- Verify email.
- Password reset.
- Workspace invite.
- Billing payment failure.
- Plan limit reached.

### 2. Product Workflow Notifications
Purpose:
- Help operators complete work they already started.

Rules:
- Triggered by workspace state.
- Preference-controlled by channel and category where practical.
- Never create outbound customer contact automatically.

Examples:
- Due follow-ups waiting today.
- Missed follow-ups summary.
- A team member assigned you a follow-up.
- A template is missing for the preferred channel.

### 3. Weekly Product Email
Purpose:
- Make the product habit-forming by summarizing concrete workspace progress and prompting next action.

Recommended cadence:
- Weekly, Monday morning in the workspace timezone.
- For beta, keep to one weekly email unless the user opts into more frequent tips.

Content structure:
- Subject: "Your afterservice week: {openFollowUps} follow-ups waiting"
- Header: workspace name and reporting period.
- Metrics: customers added, jobs completed, follow-ups created, follow-ups sent, missed follow-ups.
- Priority actions: up to three follow-ups due or missed.
- Learning prompt: one short beta feedback question.
- CTA: open the follow-up board.

Suppression:
- Do not send if the user has no workspace activity and no due work for two consecutive weeks, unless this is part of a reactivation sequence.
- Do not send to users who disabled weekly summaries.

### 4. Lifecycle Education
Purpose:
- Convert signup into activated usage and repeated weekly usage.

Sequences:
- Welcome: immediately after signup/onboarding.
- Activation: first 7 days, focused on one customer, one job, one follow-up.
- Habit: weeks 2-4, focused on weekly board review and templates.
- Beta feedback: after meaningful use, ask one product-learning question.
- Reactivation: after 14-21 days of inactivity, send one plain, useful nudge.

Rules:
- Stop lifecycle nudges once the user completes the target behavior.
- Frequency-cap lifecycle emails to avoid more than two non-transactional emails per week during beta.
- Prefer behavioral triggers over calendar-only drip campaigns.

### 5. Promotional Campaigns
Purpose:
- Communicate planned paid plans, founder-rate beta offers, feature launches, and upgrade opportunities.

Rules:
- Promotional messages require explicit campaign approval before send.
- Only send to users who have not opted out of marketing.
- Respect plan, role, usage, lifecycle stage, and suppression lists.
- Do not send broad paid-plan promotions until beta paid-intent gates are met.

Examples:
- Founder-rate paid pilot invitation for highly active beta workspaces.
- New template pack announcement.
- Early access to integrations or automation.
- Plan upgrade prompt when usage indicates real need.

## Data Model Plan

Add these concepts before sending real promotional email:

### UserCommunicationPreference
Tracks a signed-in user's channel and category settings.

Fields:
- `userId`
- `workspaceId` nullable for global preferences
- `emailProductUpdates`
- `emailWeeklySummary`
- `emailPromotions`
- `emailBetaResearch`
- `inAppProductUpdates`
- `inAppWorkflowAlerts`
- `unsubscribedAt`
- `unsubscribeReason`
- `createdAt`
- `updatedAt`

### MarketingCampaign
Defines a campaign or automated sequence.

Fields:
- `id`
- `key`
- `name`
- `messageClass`
- `status`: draft, approved, active, paused, archived
- `audienceRule`
- `frequencyCap`
- `startsAt`
- `endsAt`
- `createdById`
- `approvedById`
- `createdAt`
- `updatedAt`

### MarketingMessage
Defines a single email, in-app notification, or sequence step.

Fields:
- `id`
- `campaignId`
- `channel`: email, in_app
- `subject`
- `body`
- `ctaLabel`
- `ctaUrl`
- `templateKey`
- `stepOrder`
- `createdAt`
- `updatedAt`

### UserMessageDelivery
Ledger for every attempted user-facing message.

Fields:
- `id`
- `workspaceId`
- `userId`
- `campaignId` nullable
- `messageId` nullable
- `messageClass`
- `channel`
- `recipient`
- `subject`
- `provider`
- `providerId`
- `status`: queued, sent, delivered, opened, clicked, bounced, complained, failed, suppressed
- `suppressionReason`
- `sentAt`
- `deliveredAt`
- `openedAt`
- `clickedAt`
- `createdAt`

### InAppNotification
Notification-center item for signed-in users.

Fields:
- `id`
- `workspaceId`
- `userId`
- `type`
- `title`
- `body`
- `ctaUrl`
- `readAt`
- `dismissedAt`
- `createdAt`

## Event And Segmentation Plan

Use product events and database state to derive segments:

- New signup: user created, no workspace completed.
- Onboarded not activated: workspace exists, no real customer/job/follow-up.
- Activated: at least one customer, one job, and one follow-up.
- Habit candidate: active in two separate weeks.
- High-intent beta workspace: three or more weekly active sessions and real follow-up volume.
- At risk: no dashboard visit or follow-up update in 14 days.
- Upgrade candidate: close to plan limits or team/automation demand indicated.

Required event inputs:
- Signup completed.
- Workspace onboarding completed.
- Customer created.
- Service job created/completed.
- Follow-up created/sent/closed/missed.
- Template created/used.
- Billing checkout started/completed.
- User last active date.

## API And Job Plan

Add protected dashboard procedures:
- `preferences.get`
- `preferences.update`
- `notifications.list`
- `notifications.markRead`
- `notifications.dismiss`

Add internal/admin procedures:
- `marketing.campaigns.list`
- `marketing.campaigns.createDraft`
- `marketing.campaigns.approve`
- `marketing.campaigns.pause`
- `marketing.audiences.preview`
- `marketing.messages.sendTest`

Add jobs:
- `weekly-user-summary`: builds workspace/user summaries and queues eligible emails.
- `lifecycle-user-nudges`: evaluates activation, habit, and reactivation sequences.
- `campaign-dispatch`: sends approved campaign messages with frequency caps and suppression checks.
- `delivery-sync`: processes provider webhooks for bounces, complaints, opens, clicks, and unsubscribes.

## Email Infrastructure Plan

Before real outbound email:

- Choose an email provider such as Resend or Postmark for transactional and lifecycle email.
- Send from a subdomain such as `mail.afterservice.app`.
- Authenticate SPF, DKIM, and DMARC.
- Add one-click unsubscribe headers for marketing and subscribed messages.
- Include a visible unsubscribe or preference link in marketing and weekly emails.
- Separate transactional/account email from bulk marketing reputation where the provider supports it.
- Monitor bounce rate, spam complaints, unsubscribes, and provider blocks before scaling.

## Preference Center UX

Add a settings surface for signed-in users:

- Product workflow alerts.
- Weekly workspace summary.
- Product updates and feature announcements.
- Beta research requests.
- Promotions and founder-rate offers.

The page should explain categories plainly and allow a global "unsubscribe from marketing" action while preserving necessary account/security messages.

## Initial Program Calendar

### Week 0: Signup And Onboarding
- Email: welcome to afterservice.
- In-app: finish workspace setup.
- Stop condition: onboarding completed.

### Day 1-3: Activation
- Email or in-app: add first customer.
- Email or in-app: log first completed job.
- Email or in-app: schedule first follow-up.
- Stop condition: activated workspace.

### Week 1: First Value
- Weekly email: show due work and the next best action.
- Beta prompt: ask what current follow-up workflow this replaced.

### Weeks 2-4: Habit Formation
- Weekly summary.
- Template education when no template has been used.
- Missed follow-up recovery prompt when missed items exist.

### Week 5+: Beta Learning And Paid Intent
- Ask active users about paid-plan interest.
- Invite only high-intent workspaces to founder-rate paid pilot.
- Promote planned features only when they match observed usage.

## Metrics

Activation:
- Signup to onboarding completion.
- Onboarding to first customer.
- First customer to first job.
- First job to first follow-up.
- First follow-up to first sent/closed follow-up.

Engagement:
- Weekly active workspaces.
- Weekly follow-ups created/sent/closed.
- Weekly summary open/click rate.
- In-app notification click-through.

Marketing:
- Unsubscribe rate by message class.
- Bounce rate.
- Spam complaint rate.
- Promotion conversion to paid-intent conversation.
- Founder-rate pilot acceptance.

Quality:
- Suppressed sends by reason.
- Duplicate-send prevention rate.
- Provider failure rate.
- Time from opt-out to suppression.

## Rollout Plan

### Phase 1: Preferences And In-App Notifications
Build user preferences, notification center storage, unread counts, and workflow-alert notifications. No real email sending yet.

Acceptance:
- Users can control categories.
- Workflow alerts appear in-app.
- Read/dismiss state persists.

### Phase 2: Email Delivery Foundation
Add email provider integration, DNS authentication checklist, delivery ledger, unsubscribe endpoint, provider webhook handling, and test-send tooling.

Acceptance:
- Test email sends from authenticated afterservice domain.
- Unsubscribe suppresses marketing sends.
- Bounces and complaints update delivery records.

### Phase 3: Weekly Summary
Build weekly summary generation and send only to internal/admin test users first, then beta users with preference enabled.

Acceptance:
- Summary numbers match workspace data.
- No user receives duplicate weekly emails.
- Users without meaningful activity are suppressed according to rules.

### Phase 4: Lifecycle Nudges
Add activation and reactivation sequences with behavior-based stop conditions.

Acceptance:
- Nudges stop when target behavior is completed.
- Users receive no more than the configured weekly cap.
- Events show the sequence improved activation or reactivation.

### Phase 5: Promotional Campaigns
Add campaign drafts, audience preview, approval workflow, test sends, scheduled dispatch, and reporting.

Acceptance:
- No promotional campaign can send without approval.
- Audience preview matches actual recipients.
- Opt-outs, bounces, and complaints are honored.

## Risks And Mitigations

- Deliverability damage: authenticate domain, start with low volume, monitor complaints, and separate marketing from transactional mail.
- User trust erosion: make preferences obvious, cap frequency, and keep beta messages useful and plain.
- Legal/compliance gaps: treat every promotional email as requiring unsubscribe, accurate sender identity, truthful subject, and postal address review before launch.
- Product confusion: separate signed-in-user marketing from operator-to-customer follow-up messaging in code, UI, logs, and copy.
- Over-automation too early: start with weekly summaries and behavior-triggered education before broad promotions.
- Data leakage: never include customer PII in analytics payloads; keep email content scoped to the recipient's own workspace membership.

## Implementation Notes

- Reuse `packages/notifications` for typed message contracts, but add a signed-in-user message namespace separate from customer follow-up message types.
- Reuse `packages/jobs` for scheduled weekly/lifecycle dispatchers.
- Keep `MessageLog` for operator-to-customer follow-up messaging; create a separate user-facing delivery ledger to avoid mixing customer communications with afterservice marketing.
- Keep OpenPanel analytics payloads PII-free, using internal user and workspace IDs only.
- Follow afterservice copy rules: say "Free Beta" and "free early access"; do not imply broad paid launch or fully automated messaging before those gates are met.
