import { existsSync, readFileSync } from "node:fs";

const localDatabaseHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const localDatabasePort = "55435";
const secretPlaceholders = new Set([
  "afterservice-local-development-secret",
  "afterservice-local-production-build-secret-placeholder",
]);

export function parseEnvFile(filePath) {
  const parsed = {};

  if (!existsSync(filePath)) {
    return parsed;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(
      /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/,
    );

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

export function redactedUrl(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//<redacted>@${url.hostname}${
      url.port ? `:${url.port}` : ""
    }${url.pathname}`;
  } catch {
    return "<invalid-url>";
  }
}

export function productionDatabaseUrlIssue(databaseUrl) {
  if (!databaseUrl?.trim()) {
    return "DATABASE_URL is required for production.";
  }

  let parsed;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    return "DATABASE_URL must be a valid URL.";
  }

  if (
    localDatabaseHosts.has(parsed.hostname) ||
    parsed.port === localDatabasePort
  ) {
    return `DATABASE_URL points at a local development database (${redactedUrl(
      databaseUrl,
    )}). Production must use the hosted database URL.`;
  }

  return null;
}

export function assertProductionDatabaseUrl(env, source = "production env") {
  const issue = productionDatabaseUrlIssue(env.DATABASE_URL);

  if (issue) {
    throw new Error(`${source}: ${issue}`);
  }
}

export function validateProductionEnv(env) {
  const issues = [];
  const databaseIssue = productionDatabaseUrlIssue(env.DATABASE_URL);
  const authSecret = env.BETTER_AUTH_SECRET?.trim() || env.AUTH_SECRET?.trim();
  const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();

  if (databaseIssue) {
    issues.push(databaseIssue);
  }

  if (!authSecret) {
    issues.push("BETTER_AUTH_SECRET or AUTH_SECRET is required.");
  } else {
    if (authSecret.length < 32) {
      issues.push("BETTER_AUTH_SECRET/AUTH_SECRET must be at least 32 chars.");
    }

    if (secretPlaceholders.has(authSecret)) {
      issues.push("BETTER_AUTH_SECRET/AUTH_SECRET cannot be a placeholder.");
    }
  }

  if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
    issues.push(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together.",
    );
  }

  return issues;
}
