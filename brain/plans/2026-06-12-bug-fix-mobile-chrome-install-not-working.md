# Plan: Fix Mobile Chrome Install Not Working

## Type
Bug Fix

## Status
Implemented - Pending Device Verification

## Created Date
2026-06-12

## Last Updated
2026-06-15

## Goal Or Problem
The mobile Chrome install flow for afterservice is not working. The issue is specifically with the website PWA install path, not a general mobile Chrome page-load failure.

## Current Context
- afterservice is a Bun/Turbo monorepo with Next.js App Router apps for `apps/website` and `apps/dashboard`.
- Project domains are `afterservice.app` for the marketing website and `dashboard.afterservice.app` for the dashboard.
- Website PWA install code lives in `apps/website`.
- The website has `apps/website/src/app/manifest.ts`, `apps/website/public/sw.js`, and `apps/website/src/components/landing/mobile-install-top-sheet.tsx`.
- Chrome installability relies on a valid linked manifest and browser support for install promotion. The custom `beforeinstallprompt` UI only appears after Chrome decides the app is installable.
- The project rule for production page-load failures still applies if the investigation turns into a page-load failure:
  - Marketing pages: `bun run terminal prod:website`
- Website local port is `4100`; dashboard local port is `4101`.
- Styling is Tailwind CSS in the app packages.

## Proposed Approach
Harden the website PWA install path by making the service worker satisfy Chrome install/offline expectations, making the manifest metadata explicit, and ensuring the mobile install sheet does not fail silently when the browser prompt is unavailable, already consumed, or unsupported on the current mobile Chrome platform.

## Implementation Steps
- [x] Update `apps/website/public/sw.js` so the service worker caches the app shell/start URL and can return a 200 response for navigation while offline.
- [x] Update `apps/website/src/app/manifest.ts` with explicit app id, launch behavior, related-app preference, and icon purpose metadata that supports Chrome install prompts.
- [x] Update `apps/website/src/components/landing/mobile-install-top-sheet.tsx` so install prompt failures are handled visibly and telemetry captures unavailable/failed prompt states.
- [x] Verify the website typecheck and production build.
- [x] Verify manifest and service worker responses from the built website.
- Re-test mobile Chrome install behavior on Android Chrome or Chrome DevTools mobile emulation.

## Affected Files Or Areas
- `apps/website`
- `apps/website/src/app/manifest.ts`
- `apps/website/public/sw.js`
- `apps/website/src/components/landing/mobile-install-top-sheet.tsx`
- `brain/tasks/in-progress.md`

## Acceptance Criteria
- Mobile Chrome can install the afterservice website when installability criteria are met.
- The custom install sheet only calls the browser install prompt when a valid deferred prompt exists.
- Prompt failures or unsupported prompt states do not silently break the UI.
- The service worker controls the website and can serve the start URL/offline fallback for navigation.
- Desktop website behavior remains unchanged.

## Test Plan
- Run `bun --filter @anodizex/website typecheck`.
- Run `bun run --filter @anodizex/website build`.
- Start the production website locally and verify `/`, `/manifest.webmanifest`, icons, and `/sw.js` respond successfully.
- In mobile Chrome or Chrome DevTools, verify the app meets installability criteria and the install action opens the browser install dialog.
- Verify no visible regression on the mobile landing page.

## Implementation Update - 2026-06-15
- `apps/website/public/sw.js` now uses an updated shell cache, precaches the start URL/manifest/icons without failing the install if one request misses, and returns a 200 HTML offline document for navigation when no cached app shell is available.
- `apps/website/src/app/manifest.ts` now starts installed sessions at `/?source=pwa`, keeps explicit app identity/scope metadata, declares launch display fallback order, and explicitly declares no related native applications.
- `apps/website/src/components/landing/mobile-install-top-sheet.tsx` now guards against double prompt calls, tracks prompt-unavailable and prompt-failed states separately from user dismissal, and keeps a visible fallback message when Chrome does not provide or cannot open a prompt.
- `packages/events/src/events.ts` now includes `PWA Install Failed` and `PWA Install Unavailable` events.
- `scripts/verify-website-pwa.mjs` and `apps/website` script `pwa:verify` now provide repeatable static, runtime, and optional Chrome DevTools installability checks for the manifest, service worker, icon contract, rendered mobile metadata, and Chrome installability errors.

## Verification - 2026-06-15
- `bun --filter @anodizex/website typecheck` passed.
- `bun run --filter @anodizex/website build` passed.
- `bun --filter @anodizex/events typecheck` passed.
- `bun --filter @anodizex/website pwa:verify` passed.
- `PWA_SITE_URL=http://127.0.0.1:4103 bun --filter @anodizex/website pwa:verify` passed against the built production server.
- `PWA_SITE_URL=http://127.0.0.1:4103/ PWA_CHROME_DEBUG_URL=http://127.0.0.1:9223 bun --filter @anodizex/website pwa:verify` passed against system Chrome DevTools Protocol; Chrome reported zero manifest errors, zero installability errors, standalone display parsing, the expected PWA start URL, and a registered/controlling service worker.
- `bunx biome check apps/website/public/sw.js apps/website/src/app/manifest.ts apps/website/src/components/landing/mobile-install-top-sheet.tsx packages/events/src/events.ts` passed.
- Built production server response checks on `127.0.0.1:4103` returned 200 for `/`, `/manifest.webmanifest`, `/sw.js`, `/icons/icon-192.png`, and `/icons/maskable-512.png`; manifest JSON includes `start_url: "/?source=pwa"`, `display: "standalone"`, `display_override`, and icon purposes.
- Direct system Chrome headless DOM/CDP smoke loaded `http://127.0.0.1:4103/` with a Pixel-style mobile user agent and confirmed the rendered page includes the manifest link, mobile metadata, landing content, signup CTA, and Chrome installability diagnostics with no errors.
- Android emulator follow-up: `Pixel_3a_API_34` exists and booted, Android Chrome `113.0.5672.136` is installed, and the local production site was launched through `http://10.0.2.2:4103/`. The emulator then hit a System UI ANR and black-screen state, Android Chrome DevTools did not expose a usable HTTP diagnostics endpoint, and `uiautomator` could not return a root node. Native Android Chrome install-dialog verification remains external until a stable device/emulator is available.
- Broad `bun --filter @anodizex/website lint` and `bun --filter @anodizex/events lint` still fail on pre-existing unrelated import-order/non-null assertion issues outside this patch.
- Playwright-controlled browser verification was not completed because Playwright's bundled browser binary is not installed, and using system Chrome through the REPL sandbox aborts. Direct system Chrome headless DOM/CDP verification did run, including Chrome installability diagnostics, but the native Android Chrome install dialog still needs a physical/emulated Android Chrome pass.

## Risks / Edge Cases
- The issue may only reproduce on a physical Android Chrome device and not in browser emulation.
- Chrome on iOS does not support the same PWA install prompt path as Android Chrome.
- Chrome will not fire `beforeinstallprompt` if the app is already installed, if installability criteria fail, or if the device/browser disallows install prompts.
- Production-only environment variables or asset URLs may differ from local development.
- Local install testing requires HTTPS, `localhost`, or `127.0.0.1`.
- TODO: Exact device, Chrome version, and production install failure symptom.

## Open Questions
- TODO: Is the failing device Android Chrome or iOS Chrome?
- TODO: Does the install sheet fail to appear, or does tapping `Install now` fail to open the browser dialog?
- TODO: Is the failure only on `afterservice.app` production or also on local `localhost:4100`?

## Linked Task
- Task Title: Fix Mobile Chrome Install Not Working
- Task File: brain/tasks/in-progress.md
