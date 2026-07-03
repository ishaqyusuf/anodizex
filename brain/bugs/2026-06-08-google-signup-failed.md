# Bug: Google Sign-Up Failed Inline

## Status
Code fix implemented on 2026-06-08. Local OAuth initiation is working as of 2026-06-09 after adding Google OAuth env values and running both dashboard and API dev servers. Production auth initiation still depends on Cloudflare/Vercel TLS/origin health.

## Symptom
Clicking "Sign up with Google" on the dashboard sign-up page stays on the page and shows the generic Google sign-up failure message instead of redirecting to Google.

## Diagnosis
- The failure occurs before the browser leaves the sign-up page, so the failing path is OAuth initiation at `/api/auth/sign-in/social`.
- Production browser OAuth must use the dashboard origin for both initiation and callback: `https://dashboard.afterservice.app/api/auth/callback/google`.
- Production Google OAuth authorized origins are `https://www.afterservice.app` and `https://dashboard.afterservice.app`; the authorized redirect URI is `https://dashboard.afterservice.app/api/auth/callback/google`.
- The production public API base is `https://dashboard.afterservice.app/api`; `api.afterservice.app` is not the canonical API URL.
- Live HTTP probing from the debugging environment returned Cloudflare `525 SSL handshake failed` for dashboard/API auth checks. If the same occurs for users, this is an infrastructure TLS/origin issue rather than a React form issue.
- Local dashboard probing from `http://localhost:4101/sign-in` returned `500` from `/api/auth/sign-in/social` when local mode lacked `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and also when the API server on `localhost:4102` was not running.
- The workspace env wrapper was vulnerable to Bun's automatic `.env` loading: `bun scripts/with-workspace-env.mjs --mode production` could let `.env` values override `.env.production` values before spawning the real command.

## Fix Notes
- The dashboard Better Auth client now uses Better Auth's same-origin browser default instead of a compiled public URL.
- Google sign-up/sign-in requests now ask for a non-auto-redirect response and redirect manually after receiving the provider URL.
- Production env validation now requires Google OAuth credentials and an explicit `BETTER_AUTH_URL` matching `NEXT_PUBLIC_DASHBOARD_URL`.
- The env wrapper now drops auto-loaded `.env` values when another mode file provides a different value for the same key, while preserving external deployment secrets.
- `.env.example` now includes `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` placeholders so local OAuth setup is visible.
- `.env.production` now uses `NEXT_PUBLIC_SITE_URL=https://www.afterservice.app` and explicitly sets both auth trusted-origin env vars to `https://www.afterservice.app,https://dashboard.afterservice.app`.
- Sign-in reads `return_to` after mount to avoid server/client markup drift, and dev quick sign-in catches invalid stored credentials instead of surfacing an unhandled rejection.
- Dashboard rewrites no longer proxy broad `/api/*` traffic to the API service. The dashboard must own `/api/auth/*` so Better Auth can initiate Google OAuth from `dashboard.afterservice.app` without looping through `api.afterservice.app`.
- Shared API URL helpers and production env now treat `https://dashboard.afterservice.app/api` as the public API base, while local development can still use the API service on `localhost:4102`.
- Temporary production diagnostics can be enabled with `AFTERSERVICE_AUTH_DEBUG=true`. The dashboard auth route logs method, path, response status, and a truncated response body for non-2xx `/api/auth/*` responses; thrown errors include stack traces only when the flag is enabled. Google sign-in/sign-up also logs Better Auth client errors to the browser console with the prefix `[afterservice-auth-debug]`.

## Verification
- 2026-06-09 local repro: clicking "Continue with Google" on `http://localhost:4101/sign-in` stays on the page and shows `Google sign-in failed.`
- 2026-06-09 local HTTP repro: `POST http://localhost:4101/api/auth/sign-in/social` returns `500` when Google OAuth credentials are absent from local env.
- 2026-06-09 local fix check: after adding local Google OAuth credentials and starting `@anodizex/api` on `4102`, `POST http://localhost:4101/api/auth/sign-in/social` returns `200` with a Google Accounts URL and `redirect_uri=http://localhost:4101/api/auth/callback/google`.
- 2026-06-09 browser check: clicking "Continue with Google" in the in-app browser redirects from `http://localhost:4101/sign-in` to Google Accounts.
- 2026-06-09 local DB check: the configured local Postgres URL responds to a Prisma `select 1`, so the OAuth callback has a reachable database for user/session writes.
- 2026-06-09 production env check: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DASHBOARD_URL`, `BETTER_AUTH_URL`, `AUTH_TRUSTED_ORIGINS`, and `BETTER_AUTH_TRUSTED_ORIGINS` match the configured Google OAuth origins/redirect. Validator reports no URL invalids, but unrelated production secrets remain missing in the local `.env.production` copy.
- 2026-06-09 sign-in page check: `GET /sign-in?return_to=/jobs%3FjobId%3Dlocal-test` returns `200`, dashboard typecheck passes, and bad email/password credentials return a controlled Better Auth `401`.
- 2026-06-09 live repro: `POST https://dashboard.afterservice.app/api/auth/sign-in/social` returns Cloudflare `525 SSL handshake failed`, so the browser receives an auth initiation failure before Google redirect.
- 2026-06-09 live retry after local/env fixes: production still returns Cloudflare `525` for dynamic auth initiation while the cached sign-up page returns `200`.
- 2026-06-09 live retry later returned Vercel `508 INFINITE_LOOP_DETECTED` for `POST https://dashboard.afterservice.app/api/auth/sign-in/social`, confirming the dashboard auth path was being routed through the hosting/proxy layer instead of handled by the dashboard app route.
- 2026-06-09 rewrite fix check: with only the local dashboard running, `POST http://localhost:4101/api/auth/sign-in/social` returns `200` with a Google URL and the dashboard log shows `POST /api/auth/sign-in/social 200`, not an API proxy attempt.
- 2026-06-09 live check: `GET https://dashboard.afterservice.app/sign-up` returns `200` from cached Vercel/Cloudflare content, while dynamic dashboard auth and API auth routes return `525`.
- 2026-06-09 live check: `app.afterservice.app` also returns `525`, so the issue is not limited to the canonical dashboard hostname used by Better Auth.
- 2026-06-09 DNS check: `dashboard.afterservice.app`, `app.afterservice.app`, and `afterservice.app` resolve through the same Cloudflare proxy IPs. Fix should focus on Cloudflare SSL/origin routing for dashboard/API origins, then re-run the auth initiation probe.
- `bun --filter @anodizex/dashboard typecheck` passed.
- `bun --filter @anodizex/auth typecheck` passed.
- `bun --filter @anodizex/utils typecheck` passed.
- `bun scripts/with-workspace-env.mjs --mode production -- bun -e ...` now resolves both `NEXT_PUBLIC_DASHBOARD_URL` and `BETTER_AUTH_URL` to `https://dashboard.afterservice.app`.
- Production env validation has no auth URL mismatch. It still reports missing placeholder secrets in the local `.env.production` copy.
- Production browser retry remains pending after deployment/TLS health is confirmed.
