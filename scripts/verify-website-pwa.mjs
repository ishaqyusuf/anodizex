#!/usr/bin/env bun

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const websiteDir = join(root, "apps/website");
const manifestPath = join(websiteDir, "src/app/manifest.ts");
const serviceWorkerPath = join(websiteDir, "public/sw.js");
const iconPaths = [
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
  "public/icons/maskable-512.png",
];
const siteUrl = process.env.PWA_SITE_URL;
const chromeDebugUrl = process.env.PWA_CHROME_DEBUG_URL;

function log(message) {
  console.log(`[pwa:verify] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readProjectFile(path) {
  return readFileSync(path, "utf8");
}

function assertIncludes(source, expected, label) {
  assert(source.includes(expected), `${label} is missing ${expected}`);
}

function verifyStaticManifest() {
  const source = readProjectFile(manifestPath);

  assertIncludes(source, 'display: "standalone"', "manifest");
  assertIncludes(source, 'display_override: ["standalone"', "manifest");
  assertIncludes(source, 'id: "/"', "manifest");
  assertIncludes(source, 'scope: "/"', "manifest");
  assertIncludes(source, 'start_url: "/?source=pwa"', "manifest");
  assertIncludes(source, "prefer_related_applications: false", "manifest");
  assertIncludes(source, "related_applications: []", "manifest");
  assertIncludes(source, 'purpose: "maskable"', "manifest");
  assertIncludes(source, 'src: "/icons/icon-192.png"', "manifest");
  assertIncludes(source, 'src: "/icons/icon-512.png"', "manifest");
  assertIncludes(source, 'src: "/icons/maskable-512.png"', "manifest");

  log("static manifest contract passed");
}

function verifyStaticServiceWorker() {
  const source = readProjectFile(serviceWorkerPath);

  assertIncludes(source, 'const START_URL = "/"', "service worker");
  assertIncludes(source, '"/manifest.webmanifest"', "service worker");
  assertIncludes(source, '"/icons/icon-192.png"', "service worker");
  assertIncludes(source, '"/icons/icon-512.png"', "service worker");
  assertIncludes(source, '"/icons/maskable-512.png"', "service worker");
  assertIncludes(source, 'self.addEventListener("install"', "service worker");
  assertIncludes(source, 'self.addEventListener("activate"', "service worker");
  assertIncludes(source, 'self.addEventListener("fetch"', "service worker");
  assertIncludes(source, 'event.request.mode === "navigate"', "service worker");
  assertIncludes(source, "cache.match(START_URL)", "service worker");
  assertIncludes(source, "status: 200", "service worker");
  assertIncludes(source, "text/html; charset=utf-8", "service worker");

  log("static service worker contract passed");
}

function verifyIconsExist() {
  for (const iconPath of iconPaths) {
    const absolutePath = join(websiteDir, iconPath);

    assert(existsSync(absolutePath), `${iconPath} does not exist`);
  }

  log("icon files exist");
}

async function verifyRuntimeUrl() {
  if (!siteUrl) {
    log("set PWA_SITE_URL to verify a running website response");
    return;
  }

  const baseUrl = new URL(siteUrl);
  const manifestUrl = new URL("/manifest.webmanifest", baseUrl);
  const serviceWorkerUrl = new URL("/sw.js", baseUrl);
  const iconUrls = iconPaths.map(
    (iconPath) => new URL(`/${iconPath.replace(/^public\//, "")}`, baseUrl),
  );

  const manifestResponse = await fetch(manifestUrl);
  assert(manifestResponse.ok, `manifest returned ${manifestResponse.status}`);
  assert(
    manifestResponse.headers
      .get("content-type")
      ?.includes("application/manifest+json"),
    "manifest response content-type is not application/manifest+json",
  );

  const manifest = await manifestResponse.json();
  assert(manifest.id === "/", "manifest id is not /");
  assert(manifest.scope === "/", "manifest scope is not /");
  assert(manifest.start_url === "/?source=pwa", "manifest start_url mismatch");
  assert(manifest.display === "standalone", "manifest display mismatch");
  assert(
    Array.isArray(manifest.display_override) &&
      manifest.display_override.includes("standalone"),
    "manifest display_override missing standalone",
  );
  assert(
    manifest.prefer_related_applications === false,
    "manifest should not prefer related applications",
  );
  assert(
    manifest.icons?.some((icon) => icon.purpose === "maskable"),
    "manifest is missing a maskable icon",
  );

  const serviceWorkerResponse = await fetch(serviceWorkerUrl);
  assert(
    serviceWorkerResponse.ok,
    `service worker returned ${serviceWorkerResponse.status}`,
  );
  assert(
    serviceWorkerResponse.headers
      .get("content-type")
      ?.includes("application/javascript"),
    "service worker response content-type is not JavaScript",
  );
  const serviceWorker = await serviceWorkerResponse.text();
  assert(
    serviceWorker.includes("status: 200") &&
      serviceWorker.includes('event.request.mode === "navigate"'),
    "service worker response does not include navigation offline handling",
  );

  for (const iconUrl of iconUrls) {
    const response = await fetch(iconUrl);
    assert(response.ok, `${iconUrl.pathname} returned ${response.status}`);
    assert(
      response.headers.get("content-type")?.includes("image/png"),
      `${iconUrl.pathname} is not served as image/png`,
    );
  }

  log(`runtime website contract passed for ${baseUrl.origin}`);
}

async function fetchJson(url) {
  const response = await fetch(url);

  assert(response.ok, `${url} returned ${response.status}`);

  return response.json();
}

function createCdpClient(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    if (!message.id || !pending.has(message.id)) {
      return;
    }

    const { reject, resolve, timeout } = pending.get(message.id);
    pending.delete(message.id);
    clearTimeout(timeout);

    if (message.error) {
      reject(new Error(JSON.stringify(message.error)));
      return;
    }

    resolve(message.result ?? {});
  });

  const opened = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return {
    close: () => socket.close(),
    send: async (method, params = {}) => {
      await opened;

      const messageId = ++id;
      socket.send(JSON.stringify({ id: messageId, method, params }));

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!pending.has(messageId)) {
            return;
          }

          pending.delete(messageId);
          reject(new Error(`${method} timed out`));
        }, 10_000);

        pending.set(messageId, { reject, resolve, timeout });
      });
    },
  };
}

async function verifyChromeInstallability() {
  if (!chromeDebugUrl) {
    log("set PWA_CHROME_DEBUG_URL to verify Chrome installability diagnostics");
    return;
  }

  assert(siteUrl, "PWA_SITE_URL is required with PWA_CHROME_DEBUG_URL");

  const baseDebugUrl = new URL(chromeDebugUrl);
  const targets = await fetchJson(new URL("/json/list", baseDebugUrl));
  const siteOrigin = new URL(siteUrl).origin;
  const pageTarget =
    targets.find(
      (target) => target.type === "page" && target.url.startsWith(siteOrigin),
    ) ?? targets.find((target) => target.type === "page");

  assert(pageTarget, "Chrome DevTools did not expose a page target");
  assert(
    pageTarget.webSocketDebuggerUrl,
    "Chrome page target is missing a websocket debugger URL",
  );

  const cdp = createCdpClient(pageTarget.webSocketDebuggerUrl);

  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Page.navigate", { url: siteUrl });
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const manifest = await cdp.send("Page.getAppManifest");
    assert(manifest.url, "Chrome did not detect an app manifest URL");
    assert(
      Array.isArray(manifest.errors) && manifest.errors.length === 0,
      `Chrome reported manifest errors: ${JSON.stringify(manifest.errors)}`,
    );
    assert(
      manifest.manifest?.display === "kStandalone",
      "Chrome did not parse the manifest display as standalone",
    );
    assert(
      manifest.manifest?.startUrl?.endsWith("/?source=pwa"),
      "Chrome parsed an unexpected manifest start URL",
    );

    const installability = await cdp.send("Page.getInstallabilityErrors");
    assert(
      Array.isArray(installability.installabilityErrors) &&
        installability.installabilityErrors.length === 0,
      `Chrome reported installability errors: ${JSON.stringify(
        installability.installabilityErrors,
      )}`,
    );

    const runtime = await cdp.send("Runtime.evaluate", {
      awaitPromise: true,
      expression: `(async () => {
        const registration = await navigator.serviceWorker?.getRegistration("/");

        return {
          serviceWorkerSupported: "serviceWorker" in navigator,
          serviceWorkerRegistered: Boolean(registration),
          serviceWorkerScope: registration?.scope ?? null,
          serviceWorkerController: Boolean(navigator.serviceWorker?.controller),
          hasMobileMetadata: Boolean(document.querySelector("meta[name=mobile-web-app-capable]")),
          hasSignupCta: document.body.innerText.includes("Join Free Beta"),
          hasLandingCopy: document.body.innerText.includes("One board for every"),
        };
      })()`,
      returnByValue: true,
    });
    const runtimeValue = runtime.result?.value;

    assert(runtimeValue?.serviceWorkerSupported, "service workers unsupported");
    assert(
      runtimeValue.serviceWorkerRegistered,
      "service worker not registered",
    );
    assert(
      runtimeValue.serviceWorkerController,
      "service worker not controlling",
    );
    assert(runtimeValue.hasMobileMetadata, "mobile web app metadata missing");
    assert(runtimeValue.hasSignupCta, "signup CTA missing from rendered page");
    assert(
      runtimeValue.hasLandingCopy,
      "landing copy missing from rendered page",
    );
  } finally {
    cdp.close();
  }

  log(`Chrome installability diagnostics passed for ${siteUrl}`);
}

verifyStaticManifest();
verifyStaticServiceWorker();
verifyIconsExist();
await verifyRuntimeUrl();
await verifyChromeInstallability();
