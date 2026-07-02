# Feature Request Plan: Portless Runtime URLs And Auth Dev Experience

## Feature
Name: Portless runtime URLs, proxy alignment, and auth quick-fill experience
Status: planned
Phase: Phase 7 enablement / auth UX hardening
Owner: next implementation agent
Created: 2026-05-30

## Objective
Add the same style of local development ergonomics used in Plot Keys and School Clerk: Portless-powered named dev URLs, a shared runtime/dev URL library, proxy files that understand local/Portless/production hosts, and polished sign-up/sign-in pages with dev-only quick-fill and quick-sign-in tools. The goal is a handoff-ready plan that another agent can execute without rediscovering the patterns.

## Assumptions
- The project remains a three-app workspace: `apps/website`, `apps/dashboard`, and `apps/api`.
- Better Auth remains the auth provider and continues to be mounted by `apps/api` under `/api/auth/*`.
- The dashboard remains the primary auth UI owner for `/sign-in`, `/sign-up`, and `/onboarding`.
- Portless host names should be stable, memorable, and app-specific.
- Dev-only helpers must never ship as active production behavior.
- Existing unrelated local changes must not be reverted. Current unrelated dirty files observed before this plan: `apps/dashboard/next-env.d.ts`, `brain/marketing/content-bank.md`, and `brain/marketing/experiments.md`.

## Reference Patterns To Reuse
- Plot Keys Portless scripts:
  - `/Users/M1PRO/Documents/code/plot-keys/package.json`
  - `/Users/M1PRO/Documents/code/plot-keys/apps/website/package.json`
  - `/Users/M1PRO/Documents/code/plot-keys/apps/dashboard/package.json`
  - `/Users/M1PRO/Documents/code/plot-keys/apps/api/package.json`
- Plot Keys runtime URL helpers:
  - `/Users/M1PRO/Documents/code/plot-keys/packages/utils/src/runtime-url.ts`
  - `/Users/M1PRO/Documents/code/plot-keys/packages/utils/src/tenant-domains.ts`
- Plot Keys dashboard proxy and auth dev tooling:
  - `/Users/M1PRO/Documents/code/plot-keys/apps/dashboard/src/proxy.ts`
  - `/Users/M1PRO/Documents/code/plot-keys/apps/dashboard/src/components/dev/quick-fill.ts`
  - `/Users/M1PRO/Documents/code/plot-keys/apps/dashboard/src/components/auth/sign-up-form.tsx`
  - `/Users/M1PRO/Documents/code/plot-keys/apps/dashboard/src/components/auth/sign-in-form.tsx`
  - `/Users/M1PRO/Documents/code/plot-keys/apps/dashboard/src/components/dev/dev-signup-fab.tsx`
- School Clerk Portless scripts and proxy host compatibility:
  - `/Users/M1PRO/Documents/code/school-clerk/apps/web/package.json`
  - `/Users/M1PRO/Documents/code/school-clerk/apps/api/package.json`
  - `/Users/M1PRO/Documents/code/school-clerk/scripts/dev-dashboard.sh`
  - `/Users/M1PRO/Documents/code/school-clerk/apps/dashboard/src/proxy.ts`
  - `/Users/M1PRO/Documents/code/school-clerk/packages/utils/src/runtime-url.ts`
  - `/Users/M1PRO/Documents/code/school-clerk/apps/dashboard/src/features/signup/tenant-urls.ts`
  - `/Users/M1PRO/Documents/code/school-clerk/apps/dashboard/src/components/dev-tenant-quick-login-fab.tsx`

## Current Afterservice State
- Root scripts already include fixed-port dev commands:
  - `dev:website` -> `4100`
  - `dev:dashboard` -> `4101`
  - `dev:api` -> `4102`
  - `dev:websites` -> website + dashboard
- `packages/utils/src/env.ts` currently has only strict public app URL parsing through `getAppUrls`.
- `apps/dashboard/src/lib/api-url.ts` currently returns `""`, meaning browser auth calls are same-origin.
- `apps/dashboard/src/lib/auth-form.tsx` is functional but placeholder-like:
  - sign-up calls `/api/auth/sign-up/email`
  - sign-in calls `/api/auth/sign-in/email`
  - redirects to `/onboarding` or safe `return_to`
- `apps/dashboard/src/proxy.ts` exists and protects dashboard routes, but it fetches `/api/auth/get-session` from the current dashboard origin. This must be revisited because Better Auth is mounted in `apps/api`, not the dashboard app.
- `apps/website` has `/login` and `/signup` routes, but the next implementation must confirm they hand off correctly to dashboard auth URLs in fixed-port, Portless, preview, and production contexts.

## Desired Portless Host Scheme
Use one stable name per app:
- Website: `afterservice.localhost`
- Dashboard: `app-afterservice.localhost`
- API: `api-afterservice.localhost`

Default Portless app ports should remain aligned with fixed local ports:
- Website app port: `4100`
- Dashboard app port: `4101`
- API app port: `4102`

Portless proxy defaults:
- Prefer the existing project convention used in prior work: proxy listens on `1355` when needed.
- Keep `PORTLESS_WILDCARD=1` and `PORTLESS_SYNC_HOSTS=0` as defaults, matching Plot Keys app scripts.

## Detailed Execution Plan

### 1. Add Portless Scripts
Files:
- `package.json`
- `apps/website/package.json`
- `apps/dashboard/package.json`
- `apps/api/package.json`
- `README.md`

Steps:
1. Add app-level `dev:portless` scripts:
   - Website:
     - `PORTLESS_APP_PORT=${PORTLESS_APP_PORT:-4100} PORTLESS_WILDCARD=${PORTLESS_WILDCARD:-1} PORTLESS_SYNC_HOSTS=${PORTLESS_SYNC_HOSTS:-0} portless afterservice next dev --turbopack`
   - Dashboard:
     - `PORTLESS_APP_PORT=${PORTLESS_APP_PORT:-4101} PORTLESS_WILDCARD=${PORTLESS_WILDCARD:-1} PORTLESS_SYNC_HOSTS=${PORTLESS_SYNC_HOSTS:-0} portless app-afterservice next dev --turbopack`
   - API:
     - `PORTLESS_APP_PORT=${PORTLESS_APP_PORT:-4102} PORTLESS_WILDCARD=${PORTLESS_WILDCARD:-1} PORTLESS_SYNC_HOSTS=${PORTLESS_SYNC_HOSTS:-0} portless api-afterservice bun --watch src/index.ts`
2. Add root scripts:
   - `dev:portless`
   - `dev:website:portless`
   - `dev:dashboard:portless`
   - `dev:api:portless`
   - `dev:websites:portless`
3. Add `dev:portless` to `turbo.json`:
   - `cache: false`
   - `persistent: true`
4. Document usage in `README.md`:
   - install Portless once
   - run all apps
   - run one app
   - expected URLs
5. Keep fixed-port scripts. Portless is additive, not a replacement.

Validation:
- `bun run dev:portless -- --dry-run=json` should select the three app-level `dev:portless` tasks.
- `bun run dev:websites:portless -- --dry-run=json` should select only website and dashboard.
- Start one app at a time and verify a 200 response from the named host.

### 2. Add Runtime URL And Dev URL Library
Files:
- `packages/utils/src/runtime-url.ts`
- `packages/utils/src/app-urls.ts` or `packages/utils/src/dev-urls.ts`
- `packages/utils/src/index.ts`
- `packages/utils/src/env.ts`
- `packages/utils/package.json`

Steps:
1. Port a focused version of Plot Keys / School Clerk `runtime-url.ts`:
   - `RuntimeUrlKind`
   - `RuntimeUrlConfig`
   - `normalizeRuntimeHost`
   - `stripPortFromRuntimeHost`
   - `classifyRuntimeHost`
   - `resolveRootHostFromCurrentHost`
   - `buildRuntimeAppUrl`
2. Add app-specific helpers:
   - `getSiteRuntimeUrlConfig`
   - `getDashboardRuntimeUrlConfig`
   - `getApiRuntimeUrlConfig`
   - `buildSiteUrl`
   - `buildDashboardUrl`
   - `buildApiUrl`
   - `buildAuthUrl`
3. Suggested env keys:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_DASHBOARD_URL`
   - `NEXT_PUBLIC_API_URL`
   - `SITE_PORT`
   - `DASHBOARD_PORT`
   - `API_PORT` or existing `PORT`
   - `SITE_PORTLESS_ROOT_DOMAIN`
   - `DASHBOARD_PORTLESS_ROOT_DOMAIN`
   - `API_PORTLESS_ROOT_DOMAIN`
   - `SITE_ROOT_DOMAIN`
   - `DASHBOARD_ROOT_DOMAIN`
   - `API_ROOT_DOMAIN`
4. Add `getDevAppUrls()` for local defaults:
   - fixed local URLs
   - Portless URLs
   - current request-aware URLs
5. Keep `getAppUrls()` strict for production validation, but make local helpers able to infer default local URLs when dev env is incomplete.
6. Add tests if a test harness exists. If not, add a small validation script or cover through typecheck plus explicit manual cases in docs.

Coding guide:
- Do not hardcode `http://localhost:4101` or `https://dashboard.afterservice.app` in UI components.
- Do not parse hosts ad hoc inside pages or forms.
- Components should call helper functions, passing `window.location.origin` only at the edge.
- Server code should pass request headers/host/protocol into helpers.

Validation:
- `buildDashboardUrl({ currentUrl: "http://afterservice.localhost:1355", path: "/sign-in" })` returns the dashboard Portless URL.
- `buildApiUrl(...)` returns the API Portless URL when browsing from Portless.
- Fixed localhost stays fixed-port-compatible.
- Production envs still resolve to production domains.

### 3. Align Proxy Files And Auth Boundaries
Files:
- `apps/dashboard/src/proxy.ts`
- optional `apps/website/src/proxy.ts`
- `apps/api/src/index.ts`
- `packages/auth/src/index.ts`
- `apps/dashboard/src/lib/api-url.ts`

Dashboard proxy plan:
1. Keep public routes:
   - `/sign-in`
   - `/sign-up`
   - `/onboarding` if onboarding is allowed after sign-up but still requires session
   - static and Next internals
2. Stop using dashboard same-origin `/api/auth/get-session` unless dashboard owns a bridge route.
3. Preferred approach:
   - Use lightweight cookie presence in proxy for redirects.
   - Let server/API routes perform full Better Auth session validation.
   - Or call API auth session using `buildApiUrl({ currentUrl: request.url, path: "/api/auth/get-session" })`, with cookies forwarded.
4. Preserve `return_to` through redirects.
5. Use safe redirect validation:
   - only allow same-origin relative paths beginning with `/`
   - reject `//evil.com`, absolute URLs, and backslash variants
6. Add request headers when useful:
   - `x-pathname`
   - `x-afterservice-runtime-kind`
   - `x-afterservice-current-host`

Website proxy plan:
1. Optional but recommended: create `apps/website/src/proxy.ts` to redirect acquisition auth routes:
   - `/login` and `/sign-in` -> dashboard `/sign-in`
   - `/signup` and `/sign-up` -> dashboard `/sign-up`
2. Use runtime URL helpers so the redirect works from:
   - fixed localhost
   - Portless
   - Vercel preview
   - production

API/auth plan:
1. Update Better Auth trusted origins to include:
   - fixed local URLs
   - Portless website/dashboard URLs
   - production site/dashboard URLs
   - env-provided comma-separated overrides
2. Ensure Hono CORS allows credentials for the same trusted origin list.
3. Ensure API responses work from dashboard Portless host with `credentials: "include"`.

Validation:
- Anonymous dashboard `/customers` redirects to `/sign-in?return_to=/customers`.
- Signed-in users visiting `/sign-in` redirect to `return_to` or `/`.
- Website `/signup` redirects to the correct dashboard sign-up URL in local fixed-port and Portless modes.
- API auth endpoints accept credentialed requests from dashboard Portless origin.

### 4. Build Dev Quick-Fill Foundation
Files:
- `apps/dashboard/src/components/dev/quick-fill.ts`
- `apps/dashboard/src/components/dev/dev-form-quick-fill-button.tsx`
- `apps/dashboard/src/components/dev/dev-auth-store.ts`
- `apps/dashboard/src/components/dev/dev-login-fab.tsx`
- `apps/dashboard/src/components/dev/dev-signup-fab.tsx`
- `apps/dashboard/src/lib/auth-form.tsx` or new auth form components

Steps:
1. Create a generic `QuickFill` class like Plot Keys:
   - adapter interface with `getValues`, `reset`, and `setValue`
   - profiles:
     - `auth-sign-up`
     - `auth-sign-in`
     - `onboarding-workspace`
     - later: customer/job/follow-up forms
2. Start with explicit auth profiles:
   - sign-up: name, email, password
   - sign-in: email, password from saved dev account or static demo account
   - onboarding: businessName, businessType, serviceCategory, defaultFollowUpDelayDays
3. Create a dev-only local store:
   - localStorage key: `afterservice.dev.accounts`
   - fields: `name`, `email`, `password`, optional `workspaceName`, optional `createdAt`
   - add account after successful dev sign-up
   - never persist in production
4. Create `DevFormQuickFillButton`:
   - small secondary/ghost button
   - hidden in production
   - accessible label
5. Create `DevLoginFab`:
   - fixed bottom-right button/dropdown
   - lists saved dev accounts
   - fills sign-in form or directly posts sign-in depending on final UX decision
6. Create `DevSignupFab` or keep sign-up quick fill inline:
   - static presets
   - random unique generated account
7. Import dev components dynamically or behind `process.env.NODE_ENV === "development"`.
8. In production, dev component modules should either never be imported or throw immediately if imported.

Coding guide:
- Prefer form-state updates (`form.reset`, state setters, or controlled props) over DOM selectors.
- Do not use placeholder-only random data. Use stable profiles with realistic local operator names.
- Quick fill must mark fields dirty/touched only when using a form library that supports that.
- Do not add dev-only accounts to the database directly. The normal sign-up flow should create users.

Validation:
- Quick fill populates sign-up fields.
- Successful dev sign-up stores account locally.
- Quick sign-in can fill or submit saved credentials.
- Dev tools do not render in production build.

### 5. Redesign Sign-Up Page And Functionality
Files:
- `apps/dashboard/src/app/sign-up/page.tsx`
- `apps/dashboard/src/components/auth/sign-up-form.tsx` or `apps/dashboard/src/lib/auth-form.tsx`
- `apps/dashboard/src/app/globals.css`
- dev quick-fill files from Phase 4

UX requirements:
1. Replace generic `PageShell` auth placeholder with a dedicated auth layout.
2. Keep SaaS UI quiet and practical:
   - logo/wordmark
   - concise headline
   - clear form
   - trust/support microcopy
   - link to sign in
3. Fields:
   - name
   - email
   - password
4. Optional future extension:
   - collect workspace/business fields after sign-up in `/onboarding`, not on sign-up, unless the product decision changes.
5. States:
   - idle
   - pending
   - field validation error
   - API error
   - success/redirecting
6. Functionality:
   - POST Better Auth sign-up endpoint
   - credentials included
   - on success redirect to `/onboarding`
   - preserve `return_to` if future flow needs it
   - in development save successful account to dev auth store
7. Quick fill:
   - inline "Quick fill" button near the form heading or top-right of form body
   - random unique email to avoid duplicate account failures

Acceptance criteria:
- [ ] `/sign-up` renders a polished dedicated auth page.
- [ ] Sign-up creates a Better Auth user.
- [ ] Duplicate email errors are readable.
- [ ] Successful sign-up redirects to `/onboarding`.
- [ ] Dev quick fill fills name/email/password.
- [ ] Dev sign-up stores account for quick sign-in.
- [ ] Production build contains no visible dev quick-fill UI.

### 6. Redesign Sign-In Page And Functionality
Files:
- `apps/dashboard/src/app/sign-in/page.tsx`
- `apps/dashboard/src/components/auth/sign-in-form.tsx` or `apps/dashboard/src/lib/auth-form.tsx`
- `apps/dashboard/src/app/globals.css`
- dev quick-login files from Phase 4

UX requirements:
1. Replace generic `PageShell` auth placeholder with a dedicated sign-in surface.
2. Include:
   - logo/wordmark
   - concise heading
   - email/password fields
   - sign-up link
   - return destination hint when `return_to` exists
3. States:
   - idle
   - pending
   - invalid credentials
   - success/redirecting
4. Functionality:
   - POST Better Auth sign-in endpoint
   - include credentials
   - safe redirect to `return_to` or `/`
   - authenticated users visiting sign-in should be redirected by proxy
5. Quick sign-in:
   - dev-only floating button or compact panel
   - lists saved accounts from dev store
   - supports "fill form" and optionally "sign in now"
   - includes one static fallback account only if the seed process creates it

Acceptance criteria:
- [ ] `/sign-in` renders a polished dedicated auth page.
- [ ] Sign-in creates a session and redirects safely.
- [ ] Invalid login errors are readable.
- [ ] `return_to=/customers` is preserved.
- [ ] Dev quick sign-in fills or submits a saved account.
- [ ] Production build contains no visible dev quick-sign-in UI.

### 7. Update Documentation And Brain
Files:
- `README.md`
- `.env.example`
- `brain/engineering/coding-standards.md`
- `brain/system/architecture.md`
- `brain/api/permissions.md`
- `brain/tasks/done.md`

Steps:
1. Document Portless commands and expected URLs in `README.md`.
2. Document runtime URL rules in `brain/engineering/coding-standards.md`:
   - no hardcoded app origins
   - proxy-relative dashboard routes when inside dashboard
   - runtime helpers for cross-app redirects
3. Document auth proxy behavior in `brain/api/permissions.md`.
4. Add a completed task entry only after implementation and verification.
5. Add any bug records if redirect loops or cookie scope issues are found.

### 8. Verification Plan
Commands:
- `bun run typecheck`
- `bun run lint`
- `bun run build`
- `bun run dev:portless`
- `bun run dev:websites:portless`
- `bun run dev:api:portless`

## Dev Startup Ports

As of 2026-06-11, root dev entrypoints use the School Clerk-style `dev:prepare` step before launching Turbo. `dev:prepare` runs `kill:ports`, which loads local workspace env through `scripts/with-workspace-env.mjs` and runs `scripts/kill-port.sh`.

- `kill-port.sh` kills the default dev ports `4100 4101 4102 5555`; it intentionally leaves the Portless proxy port `1355` alone.
- It also reads numeric `PORT` and `*_PORT` values from the loaded env, so `SITE_PORT`, `DASHBOARD_PORT`, `API_PORT`, and future app ports can override or extend the default set.
- `AFTERSERVICE_KILL_PORTS` can replace the default explicit port list for unusual local setups.

Manual checks:
- Fixed local:
  - `http://localhost:4100/signup` redirects or links to dashboard sign-up correctly.
  - `http://localhost:4101/sign-up` quick fill works.
  - `http://localhost:4101/sign-in` quick sign-in works.
  - `http://localhost:4102/health` works.
- Portless:
  - `http://afterservice.localhost:1355`
  - `http://app-afterservice.localhost:1355/sign-up`
  - `http://app-afterservice.localhost:1355/sign-in`
  - `http://api-afterservice.localhost:1355/health`
- Auth flow:
  - sign-up -> onboarding
  - sign-in -> safe return path
  - anonymous protected route -> sign-in
  - authenticated auth route -> dashboard
- Production safety:
  - dev quick-fill components are hidden or excluded in production build
  - trusted origins do not accidentally allow arbitrary origins

## Recommended File Ownership For Next Agent
Primary implementation files:
- `package.json`
- `turbo.json`
- `apps/website/package.json`
- `apps/dashboard/package.json`
- `apps/api/package.json`
- `.env.example`
- `README.md`
- `packages/utils/src/runtime-url.ts`
- `packages/utils/src/app-urls.ts`
- `packages/utils/src/index.ts`
- `packages/auth/src/index.ts`
- `apps/api/src/index.ts`
- `apps/dashboard/src/proxy.ts`
- `apps/website/src/proxy.ts`
- `apps/dashboard/src/app/sign-in/page.tsx`
- `apps/dashboard/src/app/sign-up/page.tsx`
- `apps/dashboard/src/lib/auth-form.tsx` or replacement components
- `apps/dashboard/src/components/dev/*`

Avoid touching unless required:
- Existing marketing docs currently dirty in the worktree.
- Generated `next-env.d.ts` files unless the committed project intentionally changes Next type output.
- Database schema, unless auth/session flow requires new persistent data. Dev quick-fill should use localStorage, not database migrations.

## Risks And Mitigations
- Risk: Portless and fixed localhost URL helpers disagree.
  - Mitigation: centralize URL construction in `packages/utils` and test representative hosts.
- Risk: Dashboard proxy calls the wrong origin for session checks.
  - Mitigation: either use cookie-presence gating only in proxy or build API URL through runtime helper.
- Risk: Better Auth cookies do not work across Portless hosts.
  - Mitigation: explicitly list trusted origins and test credentialed requests from dashboard to API.
- Risk: Dev quick-fill leaks into production.
  - Mitigation: dynamic dev-only imports and production guard throws in dev modules.
- Risk: Quick sign-in depends on accounts that do not exist.
  - Mitigation: save accounts only after successful sign-up and label static presets as seed-dependent.
- Risk: Redirect loops between website, dashboard, and API.
  - Mitigation: document public routes, use safe `return_to`, and test anonymous/authenticated paths in both fixed and Portless modes.

## Skills List Used
- `plan`: Used because the request asked for a detailed feature request plan before implementation.
- `handoff`: Used because the plan is intended for another agent/session to continue from.
- Project brain integration: Used because this plan is stored inside `brain/` and aligned to current project state.

## Handoff Summary
The next agent should implement this in order:
1. Add Portless scripts and docs.
2. Add shared runtime URL helpers.
3. Update trusted origins, CORS, and proxy behavior.
4. Build dev quick-fill and quick-sign-in primitives.
5. Redesign sign-up and sign-in pages around those primitives.
6. Verify fixed local, Portless, and production build behavior.

Do not start by redesigning the pages without the runtime URL layer. The auth UX depends on redirects, origins, CORS, and cookie behavior being correct first.
