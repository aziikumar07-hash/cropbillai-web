# New CropBillAI site

See root `README.md` for setup, asset swaps, Netlify configuration and launch TODOs. All dependency versions are exact, with a committed npm lockfile. Optional asset flags are generated on prebuild/predev; they are not committed.

## Scripts

`dev` starts Next; `build` exports production HTML with Webpack; `serve` / `start` serves `out/` with production CSP and compression; `test:unit` runs Node's pure-logic tests; `test:e2e` runs desktop and mobile Chromium through Playwright's static server lifecycle.

## Dependency audit

11 October 2026: `npm audit --omit=dev` → **found 0 vulnerabilities**. No dependency version updates were forced. npm install also reported 0 vulnerabilities across the complete dependency set. The initial install timeout left an incomplete `@types/three` folder; reinstalling the same exact version restored it (no pin changes).

## Verification

Production build passed with zero TypeScript errors. Next 16.4.0 emits `out/privacy.html` with `trailingSlash: false`; the static test server maps `/privacy` to that file. All 18 Node unit tests passed. Browser suite: 26 passed, 4 project-conditional skips, 0 failed (desktop + mobile Chromium, including reduced-motion, no-JS, missing-manifest, optional audio/model, and first-load byte budget under production CSP). Baseline desktop first-load wire bytes 370,841 (images 125,515; Brotli HTML), within budget. Export uses plain anchors between `/` and `/privacy`; no RSC route prefetch. No real waitlist submission is made during tests. Screenshots are written to `web/test-artifacts/` but could not be viewed by the agent (image input unsupported in the build environment); a human must review them.

Build note: Next 16.4.0's native Windows SWC binary failed to load on this host. `--webpack` is the supported fallback and avoids requiring native Turbopack. This changes only the build tool, not the static-export architecture.

## Deliberate boundaries

The original sprout is a procedural seed with two leaves, eyes and a paper bill. Its poster remains the sprout after a GLB swap. Audio playback is off on load; a saved ON choice resumes only after a user gesture, and the last manual choice is stored locally. No decoder, HDRI, remote font, analytics or OCR request runs in the browser. Local photo fields explicitly say “Not read in this preview”.

TODO before launch: monitored privacy mailbox, legal notice review, live Netlify Forms submission/deletion check, real Safari/Firefox/Android testing. TestSprite is optional and not configured (requires account and third-party sharing); see root README.
