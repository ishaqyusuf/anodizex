export type EnvSource = Record<string, string | undefined>;

export type WorkspaceEnvMode = "local" | "production";

export type AppUrls = {
  api: string;
  dashboard: string;
  site: string;
};

export type EnvValidationResult = {
  invalid: string[];
  missing: string[];
  ok: boolean;
};

const appUrlKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_DASHBOARD_URL",
] as const;

const optionalAppUrlKeys = ["NEXT_PUBLIC_API_URL", "API_PUBLIC_URL"] as const;
const authUrlKeys = ["BETTER_AUTH_URL"] as const;

const productionRequiredKeys = [
  "AUTH_SECRET",
  "BETTER_AUTH_URL",
  "DATABASE_URL",
  "EMAIL_FROM_ADDRESS",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "POLAR_ACCESS_TOKEN",
  "POLAR_ORGANIZATION_ID",
  "POLAR_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "CRON_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_WHATSAPP_NUMBER",
] as const;

function readEnv(env: EnvSource, key: string): string | undefined {
  const value = env[key];

  if (value == null || value.trim() === "") {
    return undefined;
  }

  return value;
}

function requireEnv(env: EnvSource, key: string): string {
  const value = readEnv(env, key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function requireUrl(env: EnvSource, key: string): string {
  const value = requireEnv(env, key);

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL.`);
  }
}

function optionalUrl(env: EnvSource, key: string): string | undefined {
  const value = readEnv(env, key);

  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL.`);
  }
}

function resolveApiUrl(env: EnvSource, dashboardUrl: string): string {
  const configuredApiUrl =
    optionalUrl(env, "NEXT_PUBLIC_API_URL") ?? optionalUrl(env, "API_PUBLIC_URL");

  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  return new URL("/api", `${dashboardUrl}/`).toString().replace(/\/$/, "");
}

export function getAppUrls(env: EnvSource = process.env): AppUrls {
  const dashboard = requireUrl(env, "NEXT_PUBLIC_DASHBOARD_URL");

  return {
    api: resolveApiUrl(env, dashboard),
    dashboard,
    site: requireUrl(env, "NEXT_PUBLIC_SITE_URL"),
  };
}

export function getDevAppUrlStrings(env: EnvSource = process.env): AppUrls {
  if (env.NODE_ENV === "production") {
    return getAppUrls(env);
  }

  const dashboard =
    readEnv(env, "NEXT_PUBLIC_DASHBOARD_URL") ?? "http://localhost:4101";
  const api =
    readEnv(env, "NEXT_PUBLIC_API_URL") ??
    readEnv(env, "API_PUBLIC_URL") ??
    "http://localhost:4102";
  const site = readEnv(env, "NEXT_PUBLIC_SITE_URL") ?? "http://localhost:4100";

  return { api, dashboard, site };
}

export function validateWorkspaceEnv(
  env: EnvSource = process.env,
  mode: WorkspaceEnvMode = "local",
): EnvValidationResult {
  const requiredKeys =
    mode === "production"
      ? [...appUrlKeys, ...productionRequiredKeys]
      : [...appUrlKeys, "DATABASE_URL"];
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const key of requiredKeys) {
    if (!readEnv(env, key)) {
      missing.push(key);
    }
  }

  for (const key of [...appUrlKeys, ...optionalAppUrlKeys, ...authUrlKeys]) {
    const value = readEnv(env, key);

    if (!value) {
      continue;
    }

    try {
      new URL(value);
    } catch {
      invalid.push(key);
    }
  }

  if (mode === "production") {
    const authUrl = normalizeUrl(readEnv(env, "BETTER_AUTH_URL"));
    const dashboardUrl = normalizeUrl(readEnv(env, "NEXT_PUBLIC_DASHBOARD_URL"));

    if (authUrl && dashboardUrl && authUrl !== dashboardUrl) {
      invalid.push("BETTER_AUTH_URL");
    }
  }

  return {
    invalid,
    missing,
    ok: missing.length === 0 && invalid.length === 0,
  };
}

function normalizeUrl(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

export function assertWorkspaceEnv(
  env: EnvSource = process.env,
  mode: WorkspaceEnvMode = "local",
): void {
  const result = validateWorkspaceEnv(env, mode);

  if (result.ok) {
    return;
  }

  const details = [
    result.missing.length > 0
      ? `missing: ${result.missing.join(", ")}`
      : undefined,
    result.invalid.length > 0
      ? `invalid: ${result.invalid.join(", ")}`
      : undefined,
  ]
    .filter(Boolean)
    .join("; ");

  throw new Error(`Invalid afterservice environment (${mode}): ${details}`);
}
