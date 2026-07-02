# Feature: Auth Session Loop Fix

## Status
Implemented and verified on 2026-05-30.

## Problem
Signing in could redirect back to `/sign-in` even after Better Auth created a valid session. The dashboard proxy only recognized non-secure cookie names, while local env could make Better Auth emit `__Secure-better-auth.session_token`.

## Fix
- Dashboard auth endpoints are mounted same-origin at `/api/auth/**`.
- Dashboard sign-in/sign-up call same-origin auth routes.
- Proxy session detection accepts secure-prefixed Better Auth cookie names.
- Local auth base URL defaults to `http://localhost:4102` so production API URLs in `.env` do not force secure cookies during local development.

## Verification
Local HTTP smoke with a disposable account:
- `POST /api/auth/sign-up/email` returned `200` and set a session cookie.
- `POST /api/onboarding` returned `200`.
- `GET /` with the same cookie returned `200` instead of `307 /sign-in?return_to=/`.
