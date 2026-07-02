import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_BASE_NAMES = [
  "better-auth.session_token",
  "better-auth-session_token",
  "afterservice.session_token",
] as const;

const BETTER_AUTH_COOKIE_BASE_NAMES = [
  "better-auth.session_token",
  "better-auth.session_data",
  "better-auth.account_data",
  "better-auth.dont_remember",
  "better-auth-session_token",
  "afterservice.session_token",
] as const;

const COOKIE_PREFIXES = ["", "__Secure-", "__Host-"] as const;

export const ACCEPTED_SESSION_COOKIE_NAMES = SESSION_COOKIE_BASE_NAMES.flatMap(
  (name) => COOKIE_PREFIXES.map((prefix) => `${prefix}${name}`),
);

export const AUTH_COOKIE_EXPIRY_NAMES = BETTER_AUTH_COOKIE_BASE_NAMES.flatMap(
  (name) => COOKIE_PREFIXES.map((prefix) => `${prefix}${name}`),
);

export function hasAcceptedSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => ACCEPTED_SESSION_COOKIE_NAMES.includes(cookie.name));
}

export function appendAuthCookieExpiryFallbacks(response: Response) {
  const nextResponse = new NextResponse(response.body, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });

  for (const name of AUTH_COOKIE_EXPIRY_NAMES) {
    nextResponse.cookies.set(name, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: name.startsWith("__Secure-") || name.startsWith("__Host-"),
    });
  }

  return nextResponse;
}
