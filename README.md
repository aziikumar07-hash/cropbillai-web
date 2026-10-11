# CropBillAI — Grow more. Guess less.

A pre-launch, cinematic marketing and waitlist site for an app for small Indian farmers: photograph a bill, file it by crop and season, see profit per crop. The bill demo and dashboard are **illustrative simulations**, not working OCR, yield forecasts or financial advice.

## Folder map

| Folder | Purpose |
|---|---|
| `web/` | New Next.js App Router + TypeScript site; exports to `web/out/` |
| `site/` | Original static-site backup, untouched |
| `cropbillai-web/` | Legacy app, untouched |
| `tools/` | Python asset builder and retained legacy scripts |
| `media-src/` | Original video and unused media; nothing deleted |
| `archive/` | Previous design backup |
| `.agents/tasks/` | Authoritative brief, technical design, reviews and resolved build plan |

## Develop, build and test

Node **22.18+** (Node 24 recommended). Run these from `web/`:

```powershell
npm ci
npm run dev
npm run build
npm run serve
npm run test:unit
npx playwright install chromium
npm run test:e2e
```

The static test server binds `http://127.0.0.1:4173`, compresses text and applies the production headers from root `netlify.toml`. Playwright manages its own server lifecycle. Build before E2E tests. Browser screenshots are saved to gitignored `web/test-artifacts/`.

The build uses `next build --webpack`: this Windows environment cannot load Next's native SWC binary, so Webpack uses the supported WASM fallback. Fonts (DM Sans / Manrope via `next/font`) download **at build time**, then are served locally. Build requires network access; the running site needs no third-party services except the same-origin Netlify Forms submission.

## Asset swap guide

All originals stay outside the generated output. To regenerate from the root:

```powershell
python -m pip install -r tools/requirements.txt
python tools/build_cinematic_assets.py
```

| Replace/add | Behaviour |
|---|---|
| `media-src/continuous.mp4` | Primary continuous film; rerun builder (default 210 frames). Use `--frames 180` to reduce size. |
| `web/public/hero/day.webp`, `night.webp` | Fixed-path hero images. Keep matching geometry; rebuild. Builder recreates these from film frame 0 and a moonlit grade. |
| `web/public/images/carousel-bg.webp`, `finale-bg.webp` | Backgrounds; replace and rebuild. The builder blurs source art to remove fictional forecast/projection panels; replacements must not introduce unsupported product claims. |
| `web/public/images/still-0.webp` … `still-3.webp` | Static/reduced-motion story stills. Builder samples each chapter midpoint. |
| `web/public/og-image.jpg` | 1200×630 social-sharing image; replace and rebuild. |
| `web/public/icon.svg`, `favicon.ico`, `apple-touch-icon.png` | Original scan-corner/leaf branding. |
| `web/public/audio/ambient.mp3` | Optional licensed loop, ≤2 MB; rebuild detects it. No audio is generated or downloaded. Missing → “Sound unavailable”. |
| `web/public/models/mascot.glb` | Optional original/licensed uncompressed GLB, Y-up, origin at feet, ~1 unit tall, ≤5 MB; rebuild detects it. No Draco/Meshopt. Missing/bad → original procedural sprout. See local README. |

`--beats '[0,0.30,0.55,0.76]'` retimes chapter starts without a code change. `--source clips` uses the four legacy MP4s, then existing backup WebPs if a clip cannot decode. `--only cinematic` emits frames/stills/OG; `--only images` emits hero/backgrounds/icons. `--out <folder>` builds without touching production public assets. `python web/scripts/check-pipeline.py` exercises isolated decode/fallback failure paths.

Frame folders include a content hash, making immutable caching safe. The manifest has short caching. Fixed-path replaceable images use normal caching, not immutable caching. Generated WebPs are committed so Netlify does not need Python or source MP4s. **MP4s are gitignored:** keep a separate backup or configure Git LFS before sharing source footage. Do not expect a clone to contain the MP4s.

## Netlify (not deployed by this task)

Root `netlify.toml`: base `web`, build `npm run build`, publish `out`. The site is a static export, not a Next server. Enable **Netlify form detection**. `public/__forms.html` contains the detected waitlist form; the client posts URL-encoded data to it. Localhost deliberately refuses real signups. Verify a real test submission and deletion in Netlify before launch.

Security headers include CSP, nosniff, no framing, referrer policy and restricted browser features. Static Next needs inline bootstrap scripts, so CSP explicitly allows inline scripts/styles; it does not allow third-party script, object embeds, eval or WebAssembly. No-JS and reduced-motion paths show the entire story and a horizontal category list. No Lenis: native scroll plus the cinematic engine's 75 ms easing avoids double-smoothing and preserves keyboard navigation.

## Launch checklist

- Confirm **`privacy@cropbillai.me`** is a monitored mailbox (TODO in privacy notice and `web/lib/content.ts`); get the privacy notice legally reviewed, including DPDP requirements.
- Enable Netlify Forms and verify submission, retention/deletion and spam filtering on the live domain.
- Add licensed optional sound/model if desired. The site is functional without either.
- Verify `/privacy`, headers, canonical URLs, social cards and device behaviour on the final domain. Cross-browser and Netlify runtime behaviour require live verification.
- **Open the screenshots in `web/test-artifacts/` yourself.** They were generated by the automated run but could not be viewed by the agent (the build environment rejects image input for the model), so no layout or art-direction claim here is based on eyeballing them. The background blur (see `images/` row above) was a precaution taken from source filenames, not from seeing the pixels.
- Run build, unit/E2E tests and `npm audit --omit=dev` before release.
- `dangerouslySetInnerHTML` appears exactly twice under `web/app` and `web/components`: compile-time js-class bootstrap and static JSON-LD only.
- No analytics, uploads, accounts or real AI backend are included.

TestSprite is deliberately not used: it requires an account and shares the site with a third party. If you choose to add it later, obtain consent, configure your own account and run against a preview URL without personal signup data.

Verification details and dependency audit are recorded in `web/README.md`. No deploy or push is performed.

### Local source-media inventory

`media-src/`: 180.53 MB total (265 files); 7 MP4s total 123.55 MB, 243 JPGs 37.25 MB, 15 PNGs 19.73 MB. `continuous.mp4` is 7.59 MB. Other MP4s: drone 24.28 MB; macro wheat original and `(1)` duplicate 27.35 MB each; slab orbit 27.80 MB; golden wheat 5.53 MB; neon orbit 3.67 MB. These original files were retained, not deleted. Backup `site/` remains 26.75 MB and its URL-decoded HTML asset references all exist. New generated public assets: 20.00 MB, including 420 film frames.
