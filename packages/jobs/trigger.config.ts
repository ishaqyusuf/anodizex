import { syncEnvVars } from "@trigger.dev/build/extensions/core";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { defineConfig } from "@trigger.dev/sdk/v3";

const syncedProductionEnvVars = [
  "AFTERSERVICE_ENV_MODE",
  "DATABASE_URL",
  "EMAIL_FROM_ADDRESS",
  "OPENPANEL_PROJECT_ID",
  "OPENPANEL_READ_CLIENT_ID",
  "OPENPANEL_READ_CLIENT_SECRET",
  "RESEND_API_KEY",
  "TEST_EMAIL",
] as const;

function getTriggerProjectId() {
  return process.env.TRIGGER_PROJECT_ID?.trim() || "remote-indexer-project-ref";
}

function getSyncedProductionEnv() {
  return Object.fromEntries(
    syncedProductionEnvVars.flatMap((key) => {
      const value = process.env[key]?.trim();
      return value ? [[key, value]] : [];
    }),
  );
}

export default defineConfig({
  project: getTriggerProjectId(),
  runtime: "node-22",
  logLevel: "log",
  maxDuration: 60,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    extensions: [
      syncEnvVars(() => getSyncedProductionEnv(), { override: true }),
      prismaExtension({
        directUrlEnvVarName: "DATABASE_URL",
        schema: "./src/schema.prisma",
        version: "^7.8.0",
      }),
    ],
  },
  dirs: ["./src/tasks"],
});
