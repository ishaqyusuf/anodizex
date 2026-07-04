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
  "NEXT_PUBLIC_API_URL",
] as const;

const authUrlKeys = ["BETTER_AUTH_URL"] as const;

const requiredKeys = ["DATABASE_URL"] as const;

const defaultAppUrls = {
  api: "https://dashboard.afterservice.app/api",
  dashboard: "https://dashboard.afterservice.app",
  site: "https://www.afterservice.app",
} as const;

function readEnv(env: EnvSource, key: string): string | undefined {
  const value = env[key];

  if (value == null || value.trim() === "") {
    return undefined;
  }

  return value;
}

function optionalUrl(
  env: EnvSource,
  key: string,
  fallback: string,
): string {
  const value = readEnv(env, key) ?? fallback;

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL.`);
  }
}

export function getAppUrls(env: EnvSource = process.env): AppUrls {
  return {
    api: optionalUrl(env, "NEXT_PUBLIC_API_URL", defaultAppUrls.api),
    dashboard: optionalUrl(
      env,
      "NEXT_PUBLIC_DASHBOARD_URL",
      defaultAppUrls.dashboard,
    ),
    site: optionalUrl(env, "NEXT_PUBLIC_SITE_URL", defaultAppUrls.site),
  };
}

export function getDevAppUrlStrings(env: EnvSource = process.env): AppUrls {
  if (env.NODE_ENV === "production") {
    return getAppUrls(env);
  }

  const api = readEnv(env, "NEXT_PUBLIC_API_URL") ?? "http://localhost:4102";
  const dashboard =
    readEnv(env, "NEXT_PUBLIC_DASHBOARD_URL") ?? "http://localhost:4101";
  const site = readEnv(env, "NEXT_PUBLIC_SITE_URL") ?? "http://localhost:4100";

  return { api, dashboard, site };
}

export function validateWorkspaceEnv(
  env: EnvSource = process.env,
  mode: WorkspaceEnvMode = "local",
): EnvValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const key of requiredKeys) {
    if (!readEnv(env, key)) {
      missing.push(key);
    }
  }

  for (const key of [...appUrlKeys, ...authUrlKeys]) {
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
