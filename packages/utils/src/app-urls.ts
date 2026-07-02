import {
  buildRuntimeAppUrl,
  normalizeRuntimeHost,
  stripPortFromRuntimeHost,
} from "./runtime-url";

export const siteRootDomain = "afterservice.app";
export const dashboardRootDomain = "dashboard.afterservice.app";
export const apiRootDomain = dashboardRootDomain;
const apiProductionBasePath = "/api";

export const sitePortlessRootDomain = "afterservice.localhost";
export const dashboardPortlessRootDomain = "app-afterservice.localhost";
export const apiPortlessRootDomain = "api-afterservice.localhost";

export const sitePort = 4100;
export const dashboardPort = 4101;
export const apiPort = 4102;

export type AppUrlKind = "site" | "dashboard" | "api";

function resolveAppPort(kind: AppUrlKind) {
  switch (kind) {
    case "site":
      return Number(process.env.SITE_PORT ?? sitePort);
    case "dashboard":
      return Number(process.env.DASHBOARD_PORT ?? dashboardPort);
    case "api":
      return Number(process.env.API_PORT ?? process.env.PORT ?? apiPort);
  }
}

function resolveAppPortlessRootDomain(kind: AppUrlKind) {
  switch (kind) {
    case "site":
      return process.env.SITE_PORTLESS_ROOT_DOMAIN ?? sitePortlessRootDomain;
    case "dashboard":
      return (
        process.env.DASHBOARD_PORTLESS_ROOT_DOMAIN ??
        dashboardPortlessRootDomain
      );
    case "api":
      return process.env.API_PORTLESS_ROOT_DOMAIN ?? apiPortlessRootDomain;
  }
}

function resolveAppProductionRootDomain(kind: AppUrlKind) {
  switch (kind) {
    case "site":
      return process.env.SITE_ROOT_DOMAIN ?? siteRootDomain;
    case "dashboard":
      return process.env.DASHBOARD_ROOT_DOMAIN ?? dashboardRootDomain;
    case "api":
      return process.env.API_ROOT_DOMAIN ?? apiRootDomain;
  }
}

function resolveAppPublicUrl(kind: AppUrlKind) {
  switch (kind) {
    case "site":
      return process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_PUBLIC_URL;
    case "dashboard":
      return (
        process.env.NEXT_PUBLIC_DASHBOARD_URL ??
        process.env.DASHBOARD_PUBLIC_URL
      );
    case "api":
      return process.env.NEXT_PUBLIC_API_URL ?? process.env.API_PUBLIC_URL;
  }
}

export function getAppUrlConfig(kind: AppUrlKind) {
  return {
    appPort: resolveAppPort(kind),
    appRootDomain: resolveAppPortlessRootDomain(kind),
    defaultProtocol: (process.env.NODE_ENV === "production"
      ? "https"
      : "http") as "http" | "https",
    isProduction: process.env.NODE_ENV === "production",
    portlessRootDomain: resolveAppPortlessRootDomain(kind),
    productionRootDomain: resolveAppProductionRootDomain(kind),
    publicUrl: resolveAppPublicUrl(kind),
  };
}

export type BuildAppUrlOptions = {
  currentHost?: string | null;
  currentProtocol?: string | null;
  currentUrl?: string | null;
  path?: string;
};

function normalizePath(path?: string) {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null;

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function appendPath(baseUrl: string, path?: string) {
  const normalizedPath = normalizePath(path);

  if (
    baseUrl.endsWith(apiProductionBasePath) &&
    normalizedPath.startsWith(`${apiProductionBasePath}/`)
  ) {
    return `${baseUrl}${normalizedPath.slice(apiProductionBasePath.length)}`;
  }

  return `${baseUrl}${normalizedPath}`;
}

function isProductionMode() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.AFTERSERVICE_ENV_MODE === "production"
  );
}

function normalizeProtocol(value?: string | null) {
  const protocol = value?.trim().replace(/:$/, "").toLowerCase();
  return protocol === "https" ? "https" : "http";
}

function getHostPort(host: string) {
  if (host.startsWith("[")) {
    return host.match(/]:(\d+)$/)?.[1] ?? "";
  }

  return host.match(/:(\d+)$/)?.[1] ?? "";
}

function hostMatches(host: string, root: string) {
  const normalizedHost = normalizeRuntimeHost(host);
  const normalizedRoot = normalizeRuntimeHost(root);

  if (!normalizedHost || !normalizedRoot) return false;

  const hostWithoutPort = stripPortFromRuntimeHost(normalizedHost);
  const rootWithoutPort = stripPortFromRuntimeHost(normalizedRoot);

  return (
    normalizedHost === normalizedRoot ||
    hostWithoutPort === rootWithoutPort ||
    hostWithoutPort.endsWith(`.${rootWithoutPort}`)
  );
}

function getCurrentParts(options: BuildAppUrlOptions) {
  const host = normalizeRuntimeHost(options.currentHost ?? options.currentUrl);
  let protocol = normalizeProtocol(options.currentProtocol);

  if (options.currentUrl) {
    try {
      protocol = normalizeProtocol(new URL(options.currentUrl).protocol);
    } catch {
      // Fall back to the explicit protocol/default above.
    }
  }

  return {
    host,
    hostWithoutPort: stripPortFromRuntimeHost(host),
    port: getHostPort(host),
    protocol,
  };
}

function getAllPortlessRootDomains() {
  return [
    resolveAppPortlessRootDomain("site"),
    resolveAppPortlessRootDomain("dashboard"),
    resolveAppPortlessRootDomain("api"),
  ];
}

function getAllProductionRootDomains() {
  return [
    resolveAppProductionRootDomain("site"),
    resolveAppProductionRootDomain("dashboard"),
    resolveAppProductionRootDomain("api"),
  ];
}

function buildSiblingAppUrl(kind: AppUrlKind, options: BuildAppUrlOptions) {
  const current = getCurrentParts(options);

  if (!current.host) return null;

  if (
    getAllPortlessRootDomains().some((root) => hostMatches(current.host, root))
  ) {
    const targetHost = resolveAppPortlessRootDomain(kind);
    const port = current.port ? `:${current.port}` : "";
    return `${current.protocol}://${targetHost}${port}${normalizePath(options.path)}`;
  }

  if (
    current.hostWithoutPort === "localhost" ||
    current.hostWithoutPort === "127.0.0.1" ||
    current.hostWithoutPort === "[::1]"
  ) {
    return `${current.protocol}://${current.hostWithoutPort}:${resolveAppPort(kind)}${normalizePath(options.path)}`;
  }

  if (
    getAllProductionRootDomains().some((root) =>
      hostMatches(current.host, root),
    )
  ) {
    const basePath = kind === "api" ? apiProductionBasePath : "";

    return appendPath(
      `${current.protocol}://${resolveAppProductionRootDomain(kind)}${basePath}`,
      options.path,
    );
  }

  return null;
}

function buildAppUrl(kind: AppUrlKind, options: BuildAppUrlOptions = {}) {
  const current = getCurrentParts(options);
  const publicUrl = normalizeBaseUrl(resolveAppPublicUrl(kind));

  if (
    publicUrl &&
    isProductionMode() &&
    (!current.host ||
      getAllProductionRootDomains().some((root) =>
        hostMatches(current.host, root),
      ))
  ) {
    return appendPath(publicUrl, options.path);
  }

  const siblingUrl = buildSiblingAppUrl(kind, options);

  if (siblingUrl) return siblingUrl;

  return buildRuntimeAppUrl({
    config: getAppUrlConfig(kind),
    currentHost: options.currentHost,
    currentProtocol: options.currentProtocol,
    currentUrl: options.currentUrl,
    path: options.path,
  });
}

export function buildSiteUrl(options: BuildAppUrlOptions = {}) {
  return buildAppUrl("site", options);
}

export function buildDashboardUrl(options: BuildAppUrlOptions = {}) {
  return buildAppUrl("dashboard", options);
}

export function buildApiUrl(options: BuildAppUrlOptions = {}) {
  return buildAppUrl("api", options);
}

export function buildAuthUrl(options: BuildAppUrlOptions = {}) {
  return buildAppUrl("api", {
    ...options,
    path: options.path ?? "/api/auth",
  });
}

export function getDevAppUrls() {
  if (process.env.NODE_ENV === "production") {
    return {
      api: normalizeRuntimeHost(process.env.NEXT_PUBLIC_API_URL) || "",
      dashboard:
        normalizeRuntimeHost(process.env.NEXT_PUBLIC_DASHBOARD_URL) || "",
      site: normalizeRuntimeHost(process.env.NEXT_PUBLIC_SITE_URL) || "",
    };
  }

  const apiHost =
    process.env.NEXT_PUBLIC_API_URL ??
    `http://localhost:${resolveAppPort("api")}`;
  const dashboardHost =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ??
    `http://localhost:${resolveAppPort("dashboard")}`;
  const siteHost =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `http://localhost:${resolveAppPort("site")}`;

  return {
    api: normalizeRuntimeHost(apiHost),
    dashboard: normalizeRuntimeHost(dashboardHost),
    site: normalizeRuntimeHost(siteHost),
  };
}
