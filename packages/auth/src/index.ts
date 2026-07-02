import { getDbClient } from "@afterservice/db";
import {
  getDevAppUrlStrings,
  resolveEmailRecipients,
} from "@afterservice/utils";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

function unique(values: Array<string | undefined>) {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];
}

function readNonEmptyEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const authRoutes = {
  dashboardHome: "/",
  onboarding: "/onboarding",
  signIn: "/sign-in",
  signUp: "/sign-up",
} as const;

export const localAuthOrigins = [
  "http://localhost:4100",
  "http://localhost:4101",
  "http://127.0.0.1:4100",
  "http://127.0.0.1:4101",
] as const;

export const portlessAuthOrigins = [
  "http://afterservice.localhost:1355",
  "http://app-afterservice.localhost:1355",
] as const;

export function getTrustedOrigins() {
  const urls = getDevAppUrlStrings();

  return unique(
    [
      urls.site,
      urls.dashboard,
      ...localAuthOrigins,
      ...portlessAuthOrigins,
      process.env.BETTER_AUTH_TRUSTED_ORIGINS,
      process.env.AUTH_TRUSTED_ORIGINS,
    ].flatMap((value) =>
      value?.split(",").map((origin: string) => origin.trim()),
    ),
  );
}

export function getAuthBaseUrl() {
  const isLocalRuntime =
    process.env.AFTERSERVICE_ENV_MODE === "local" ||
    process.env.NODE_ENV !== "production";
  const devUrls = isLocalRuntime ? "http://localhost:4101" : undefined;

  if (devUrls) {
    return readNonEmptyEnv("BETTER_AUTH_LOCAL_URL") ?? devUrls;
  }

  return (
    readNonEmptyEnv("BETTER_AUTH_URL") ??
    readNonEmptyEnv("NEXT_PUBLIC_DASHBOARD_URL") ??
    undefined
  );
}

function getAuthSecret() {
  return (
    readNonEmptyEnv("BETTER_AUTH_SECRET") ??
    readNonEmptyEnv("AUTH_SECRET") ??
    (process.env.NEXT_PHASE === "phase-production-build"
      ? "afterservice-local-production-build-secret-placeholder"
      : undefined) ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "afterservice-local-development-secret")
  );
}

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: getAuthBaseUrl(),
  database: prismaAdapter(getDbClient(), {
    provider: "postgresql",
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const resendApiKey = readNonEmptyEnv("RESEND_API_KEY");
      if (resendApiKey) {
        const recipientResolution = resolveEmailRecipients(user.email);

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:
              readNonEmptyEnv("EMAIL_FROM_ADDRESS") ??
              "noreply@afterservice.app",
            to: recipientResolution.recipients,
            subject: "Reset your password",
            html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
          }),
        });
      } else {
        console.log(`[PASSWORD RESET] Send this link to ${user.email}: ${url}`);
      }
    },
  },
  socialProviders: {
    google: {
      clientId: readNonEmptyEnv("GOOGLE_CLIENT_ID") ?? "",
      clientSecret: readNonEmptyEnv("GOOGLE_CLIENT_SECRET") ?? "",
    },
  },
  secret: getAuthSecret(),
  trustedOrigins: getTrustedOrigins(),
});

export type AuthenticatedUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session;
