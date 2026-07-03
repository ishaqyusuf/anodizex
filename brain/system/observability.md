# Observability

## Purpose
This file captures the MVP observability baseline for afterservice production readiness.

## MVP Logging
- API, dashboard, website, cron, and webhook runtime logs should be retained by the deployment platform.
- `LOG_LEVEL=info` is the default production setting.
- Billing webhooks persist every accepted provider event in `BillingEvent`.
- Follow-up status changes, reschedules, replies, closes, and manual sends are persisted as `FollowUpEvent` records.
- Manual outreach creates `MessageLog` records; automated outbound messaging remains disabled unless explicitly configured.

## Marketing Analytics
- OpenPanel owns unique visitor and first-touch tracking for the public website.
- afterservice should avoid custom first-visit cookies/localStorage unless OpenPanel cannot cover a required attribution use case.
- Dashboard signup intent and completion events are tracked through OpenPanel.
- Signup analytics record method as `email` or `google` and must not include name, email, or other PII.
- Authenticated dashboard users are identified in OpenPanel by internal user ID only.
- Dashboard analytics attach the current workspace by internal ID/slug only; user PII must not be sent in identify payloads.
- 2026-06-18: `packages/jobs` sends an internal daily combined analytics review to `TEST_EMAIL` at `08:00 Africa/Lagos`. The report covers the previous Lagos calendar day and combines OpenPanel website insights with platform database metrics.
- The daily analytics review requires `OPENPANEL_PROJECT_ID`, `OPENPANEL_READ_CLIENT_ID`, and `OPENPANEL_READ_CLIENT_SECRET`; the OpenPanel client must be `read` or `root`.
- Missing OpenPanel env should not fail the daily analytics review; the job should still produce database metrics and note the website analytics reason. Missing Resend/email env skips delivery but still returns the available database summary and missing-key reasons in the Trigger.dev run output.

## Error Monitoring
- Sentry follows the Midday dashboard pattern for `@anodizex/dashboard`.
- `NEXT_PUBLIC_SENTRY_DSN` is documented in `.env.example` for browser, server, and edge SDK initialization.
- 2026-06-11: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` are configured in the local production env and Vercel production.
- 2026-06-11: Dashboard exposes `/sentry-example-page` publicly so production error capture can be verified from `https://dashboard.afterservice.app/sentry-example-page`.
- Production builds wrap the dashboard Next config with `withSentryConfig`; `SENTRY_ORG` and `SENTRY_PROJECT` are read from the environment.
- Source maps use `SENTRY_AUTH_TOKEN` at build time and prefer `SENTRY_RELEASE`, then `GIT_COMMIT_SHA`, for release naming.
- A production deploy should configure Sentry alerts for API/dashboard exceptions before live customer data is collected.

## Alerts
- Alert on repeated 5xx responses from `dashboard.afterservice.app/api`.
- Alert on Lemon Squeezy webhook verification or processing failures.
- Alert on failed cron/job endpoint runs.
- Alert on failed `daily-analytics-review` Trigger.dev runs.
- Alert on database connection saturation or migration failures.

## Health Checks
- API health: `GET https://dashboard.afterservice.app/api/health`.
- Cron dry-run: `POST https://dashboard.afterservice.app/api/jobs/follow-ups/dry-run` with `CRON_SECRET`.
- Lemon webhook target: `POST https://dashboard.afterservice.app/api/webhooks/lemon-squeezy`.
