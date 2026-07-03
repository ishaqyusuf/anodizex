# API Permissions

## Purpose
This file defines authorization rules.

## Roles
- `owner`: full workspace access, billing, team management.
- `admin`: operational access and team management, no ownership transfer.
- `staff`: operational access to assigned/visible customers, jobs, follow-ups.

## Public Routes
- Website pages.
- Website content reads: `website.getLanding`, `website.getProject`, and `website.getBlogPost`.
- Website contact submission: `website.submitContact` through the website `/api/contact` adapter.
- Sign-up/sign-in pages.
- API health.
- Lemon Squeezy webhook endpoint with signature verification.

## Internal Routes
- `POST /api/jobs/follow-ups/dry-run` requires `CRON_SECRET` through a bearer token or `x-cron-secret` header.
- Internal job routes do not use browser session auth and must not accept untrusted customer-facing side effects.

## Authenticated Routes
- Workspace onboarding.
- Dashboard session.

## Workspace Routes
Require active membership:
- Customers
- Service jobs
- Follow-ups
- Templates
- Settings

## Owner/Admin Routes
- Billing checkout creation.
- Billing portal access.
- Team invites.
- Workspace-level settings.
- Website CMS management under `website.admin.*`.
- Dashboard Vercel Blob upload token route at `/api/website/blob/upload`.
- Project quotation, quotation material, and supplier material pricing management under `quotations.*`.

## Enforcement Rules
- Never trust workspace ID from the client without membership lookup.
- Permission checks must run in API procedures.
- UI gates are helpful but not security boundaries.
- Public website contact submissions may create `ContactInquiry` records but cannot choose workspace scope.
- Vercel Blob upload tokens are only generated after Better Auth session validation and owner/admin membership lookup.
- Quotation create/update/status/material/supplier-price mutations are owner/admin operations because they affect pricing and customer-facing commercial terms.

## Auth Proxy Behavior
- Browser OAuth:
  - Google sign-up/sign-in starts from the dashboard origin and must use `BETTER_AUTH_URL=https://dashboard.afterservice.app` in production.
  - The authorized Google redirect URI is `https://dashboard.afterservice.app/api/auth/callback/google`.
  - Keep OAuth session cookies scoped to the dashboard origin; API routes may validate sessions but must not be the browser OAuth callback origin.
- Dashboard proxy:
  - Public routes: `/sign-in`, `/sign-up`, `/onboarding`, `/api/`, `/_next/`, `/favicon`.
  - Uses cookie presence for redirect gating.
  - Accepted session cookie names: `better-auth.session_token`, `__Secure-better-auth.session_token`, `__Host-better-auth.session_token`, `better-auth-session_token`, and `afterservice.session_token`.
  - Authenticated users on auth routes are redirected to `return_to` or `/`.
  - Unauthenticated users on protected routes are redirected to `/sign-in` with `return_to`.
  - Full session validation still happens in Better Auth/server code; proxy gating is only a fast redirect guard.
- Website proxy:
  - `/login` and `/sign-in` redirect to dashboard `/sign-in`.
  - `/signup` and `/sign-up` redirect to dashboard `/sign-up`.
  - Uses `buildDashboardUrl` from `@anodizex/utils` for correct host resolution.
- Trusted origins:
  - Local: `http://localhost:4100`, `http://localhost:4101`, `http://127.0.0.1:4100`, `http://127.0.0.1:4101`.
  - Portless: `http://afterservice.localhost:1355`, `http://app-afterservice.localhost:1355`.
  - Env-provided: `BETTER_AUTH_TRUSTED_ORIGINS`, `AUTH_TRUSTED_ORIGINS` (comma-separated).
- Safe redirect validation:
  - Only allow same-origin relative paths beginning with `/`.
  - Reject `//evil.com`, absolute URLs, and backslash variants.
