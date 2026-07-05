# Website PWA Install

## Purpose
Track the marketing website install path for supported mobile browsers.

## Current Behavior
- The website exposes `/manifest.webmanifest` from `apps/website/src/app/manifest.ts`.
- The website favicon is exposed as `/favicon.png`; manifest install icons are generated from the provided Anodizex company logo artwork into `/icons/icon-192.png`, `/icons/icon-512.png`, and `/icons/maskable-512.png`.
- The website registers `/sw.js` from `apps/website/src/components/pwa-service-worker-register.tsx` on secure origins, `localhost`, and `127.0.0.1`.
- The service worker in `apps/website/public/sw.js` caches the app shell, manifest, and icons, claims clients on activation, serves same-origin cached assets, and returns a 200 HTML offline response for navigations when the network and cached shell are unavailable.
- The mobile landing install sheet in `apps/website/src/components/landing/mobile-install-top-sheet.tsx` only calls `beforeinstallprompt.prompt()` when a deferred browser prompt exists.
- If Chrome does not emit `beforeinstallprompt`, if the prompt is unavailable, or if `prompt()` fails, the sheet shows browser-specific fallback copy instead of silently disappearing.
- Install prompt shown, clicked, accepted, dismissed, failed, and unavailable states are tracked through `@anodizex/events`.
- `bun --filter @anodizex/website pwa:verify` runs the repeatable local PWA contract check. Set `PWA_SITE_URL` to a running website origin to also verify HTTP responses, and set `PWA_CHROME_DEBUG_URL` to an active Chrome DevTools endpoint to verify Chrome manifest parsing, installability errors, and service worker control.

## Constraints
- Android Chrome is the primary supported custom prompt path.
- Chrome on iOS cannot use Android Chrome's `beforeinstallprompt` install flow; the sheet directs users to Safari.
- The browser may suppress `beforeinstallprompt` when the app is already installed, installability checks fail, the prompt was previously consumed, or browser policy disallows the prompt.
- Real install success still needs verification on physical Android Chrome or a browser environment with installability diagnostics.

## Verification
- 2026-07-05: Updated the website favicon and PWA icon set to the Anodizex company mark; `bun --filter @anodizex/website typecheck`, `bun --filter @anodizex/ui typecheck`, and focused Biome checks for the touched logo/manifest files passed. Local browser verification on `http://localhost:4100/` confirmed favicon metadata, PNG icon fallback, apple touch icon metadata, and no console errors.
- 2026-07-05: Replaced the hand-traced logo approximation with the provided company logo artwork as the source for `/favicon.png`, `/icon.png`, and PWA PNG icons. Browser DOM verification confirmed favicon metadata points at `/favicon.png` and `/icons/icon-192.png`.
- 2026-06-15: `bun --filter @anodizex/website typecheck` passed.
- 2026-06-15: `bun run --filter @anodizex/website build` passed.
- 2026-06-15: `bun --filter @anodizex/events typecheck` passed.
- 2026-06-15: `bun --filter @anodizex/website pwa:verify` passed.
- 2026-06-15: `PWA_SITE_URL=http://127.0.0.1:4103 bun --filter @anodizex/website pwa:verify` passed against the built production website.
- 2026-06-15: `PWA_SITE_URL=http://127.0.0.1:4103/ PWA_CHROME_DEBUG_URL=http://127.0.0.1:9223 bun --filter @anodizex/website pwa:verify` passed against system Chrome DevTools Protocol with zero manifest errors, zero installability errors, standalone display parsing, expected start URL, and a registered/controlling service worker.
- 2026-06-15: Targeted Biome check passed for the touched PWA/event files.
- 2026-06-15: Built production responses returned 200 for `/`, `/manifest.webmanifest`, `/sw.js`, `/icons/icon-192.png`, and `/icons/maskable-512.png` on `127.0.0.1:4103`.
- 2026-06-15: Direct system Chrome headless DOM/CDP smoke loaded the local production website with a Pixel-style mobile user agent and confirmed the manifest link, mobile web app metadata, landing content, signup CTA, and installability diagnostics are healthy.
- 2026-06-15: Android emulator follow-up found `Pixel_3a_API_34`, booted it, confirmed Android Chrome `113.0.5672.136`, and launched the local production site through `http://10.0.2.2:4103/`; the emulator then hit a System UI ANR/black-screen state and Chrome DevTools did not expose a usable HTTP diagnostics endpoint, so native install-dialog verification still needs a stable Android device/emulator pass.
