const CACHE_NAME = "afterservice-shell-v2";
const START_URL = "/";
const OFFLINE_DOCUMENT = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>afterservice</title>
    <meta name="theme-color" content="#009b98">
  </head>
  <body>
    <main style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f6f8f7; color: #0a0a0a;">
      <section style="max-width: 420px;">
        <img src="/icons/icon-192.png" alt="" width="56" height="56" style="border-radius: 14px;">
        <h1 style="font-size: 24px; line-height: 1.1; margin: 20px 0 8px;">afterservice is offline</h1>
        <p style="font-size: 16px; line-height: 1.5; margin: 0; color: #4f5754;">Reconnect and refresh to keep working with your follow-up board.</p>
      </section>
    </main>
  </body>
</html>`;
const APP_SHELL_URLS = [
  START_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.all(
    APP_SHELL_URLS.map(async (url) => {
      try {
        const request = new Request(new URL(url, self.location.origin), {
          cache: "reload",
        });
        const response = await fetch(request);

        if (response.ok) {
          await cache.put(url, response);
        }
      } catch {
        // The offline document below keeps navigation install-safe if one asset precache misses.
      }
    }),
  );
}

async function clearOldCaches() {
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName !== CACHE_NAME)
      .map((cacheName) => caches.delete(cacheName)),
  );
}

async function cacheResponse(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);

    await cacheResponse(request, response);

    return response;
  } catch {
    const cache = await caches.open(CACHE_NAME);

    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match(START_URL)) ||
      new Response(OFFLINE_DOCUMENT, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 200,
      })
    );
  }
}

async function handleAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  await cacheResponse(request, response);

  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clearOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigation(event.request));
    return;
  }

  if (new URL(event.request.url).origin === self.location.origin) {
    event.respondWith(handleAsset(event.request));
  }
});
