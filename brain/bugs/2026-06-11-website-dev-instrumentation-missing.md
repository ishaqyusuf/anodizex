# Website Dev Instrumentation Missing

## Summary
The website dev server failed on startup because Turbopack tried to evaluate `apps/website/src/instrumentation.ts`, but the file did not exist.

## Status
Fixed

## Impact
Developers could not run the marketing website locally with `bun run --filter @afterservice/website dev`.

## Steps To Reproduce
1. Run `bun run --filter @afterservice/website dev`.
2. Wait for Next.js to report ready.

## Expected
The website dev server should stay running on port 4100.

## Actual
Next.js exited with `MODULE_UNPARSABLE` for `[project]/apps/website/src/instrumentation.ts`.

## Root Cause
The website app had generated dev server state expecting the standard Next.js instrumentation entrypoint, but the source file was absent.

## Fix
Added a no-op `apps/website/src/instrumentation.ts` with the expected `register` export so the app has a stable instrumentation entrypoint without adding observability dependencies.

## Verification
- `bun run --filter @afterservice/website dev`
