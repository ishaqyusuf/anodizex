# Feature: Notifications MVP Foundation

## Status
Implemented manual-send foundation on 2026-05-30.
Updated on 2026-06-11 so explicit manual email sends are queued through Trigger.dev jobs and delivered with Resend, with `TEST_EMAIL` overriding recipients outside production.

## Scope
- `packages/notifications` defines message payload/provider contracts.
- Manual-only provider remains the default safe implementation.
- Resend-backed email delivery runs through the `notification` Trigger.dev task and is available only when callers pass `sendEmail: true`.
- `TEST_EMAIL` redirects all outbound email recipients in dev/local mode so the first connected email test cannot accidentally reach a customer.
- Follow-up `markSent` logs a `MessageLog` and `FollowUpEvent`.

## Architecture
- Reference standard: GND notification package architecture.
- Package owner: `packages/notifications/src/index.ts`.
- Board integration owner: `apps/api/src/routers/_app.ts`.
- Email delivery owner: `packages/jobs/src/tasks/notifications.ts`, which instantiates `@afterservice/notifications` inside the job worker.
- Production email smoke testing uses the internal `email-smoke-test` Trigger.dev task. It creates isolated test workspace/customer/follow-up records in the worker runtime database, sends one email to the explicit test recipient, and returns the resulting message-log status.
- Jobs runner: `packages/jobs` follows the GND Trigger.dev package pattern for `dev` and `deploy` scripts while preserving manual-send-only messaging.
- Local website/dashboard development should include the jobs runner: both `dev:websites` and `dev:websites:portless` run `@afterservice/jobs` alongside the public website and dashboard.
- Jobs deploy mirrors GND's Prisma packaging step: `packages/jobs/prisma.ts` refreshes `packages/jobs/src/schema.prisma` from the shared DB schema before `trigger deploy`, and `trigger.config.ts` points Trigger's Prisma build extension at that task-local schema.
- Jobs deploy pins the Trigger.dev runtime to `node-22` because Prisma 7 requires Node `20.19+`, `22.12+`, or `24.0+`; Trigger.dev 4.0.1's default `node` runtime image uses Node 21 and fails during remote image dependency installation.
- Jobs deploy syncs the production runtime variables required by the worker (`DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `TEST_EMAIL`, and `AFTERSERVICE_ENV_MODE`) through Trigger.dev's `syncEnvVars` build extension so deployed tasks use the same production database and email provider configuration as the deploy environment.
- Trigger.dev project selection is env-driven: `TRIGGER_PROJECT_ID` supplies the project ref, and `TRIGGER_PROFILE` optionally selects the CLI login profile for jobs `dev`/`deploy`. `scripts/with-trigger-profile.mjs` validates `TRIGGER_PROJECT_ID` before local `trigger dev`/`trigger deploy`; `trigger.config.ts` must remain importable without that env var because Trigger's remote deployment indexer imports the config inside the built image.

## Safety Rule
No automatic customer outbound messaging is sent in MVP. Real email is limited to explicit manual-send paths, queued through jobs, and dev/local mode must route recipients through `TEST_EMAIL` when it is set.
2026-06-18: The daily combined analytics review is an internal owner report sent directly from `packages/jobs` to `TEST_EMAIL`. It does not use `packages/notifications`, does not create customer-facing `MessageLog` records, and does not change customer notification delivery behavior.
