import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const apiBaseUrl =
  process.env.API_PROXY_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4102"
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4102"));

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      afterFiles: [
        {
          destination: `${apiBaseUrl}/trpc/:path*`,
          source: "/trpc/:path*",
        },
      ],
    };
  },
};

const isProduction = process.env.NODE_ENV === "production";
const sentryRelease =
  process.env.SENTRY_RELEASE || process.env.GIT_COMMIT_SHA || undefined;

export default isProduction
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      ...(sentryRelease ? { release: { name: sentryRelease } } : {}),
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
    })
  : nextConfig;
