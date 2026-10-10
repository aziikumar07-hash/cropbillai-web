# CropBillAI — Deep Analysis (read-only)

## Summary

CropBillAI is a pre-launch marketing and waitlist site for a planned app aimed at small Indian farmers. The idea: photograph farm bills (seed, fertilizer, labour, diesel), let AI file each one under a crop and season, then show profit per crop. There is no product code in the repo. Everything here is landing-page work and the media pipeline behind it.

- `site/` is the real, current frontend. It's a hand-written static site (vanilla JS + CSS, no build step) built around a scroll-scrubbed "cinematic": 4 scenes × 90 WebP frames drawn on a `<canvas>`. A product preview and a Netlify Forms waitlist follow it.
- `cropbillai-web/` is an abandoned scaffold. It's a Create React App + react-three-fiber page that still shows a placeholder cube ("Your 3D Model Here"). Its copy describes a different product (US-style "AgFinOps": B2B invoicing, grant matching). `site/` doesn't use it. It builds, but it doesn't belong in a release.
- The root Python scripts are one-off asset tools. Only `build_cinematic_assets.py` produced anything the live site uses (`site/assets/cinematic/**`). The two Blender scripts would fail if run as they are: their inputs are missing, and Blender isn't on PATH.
- Biggest issues:
  1. About 181 MB of the 209 MB `site/` folder is unused (source MP4s, the old JPG frame set, unused PNGs, screenshots) and would ship if `site/` is the publish directory.
  2. About 6 MB of PNGs load before the user scrolls, including a 1.8 MB preload that's never displayed.
  3. Up to 22 MB of frames stream in as the user scrolls, with no smaller set for mobile.
  4. Story chapters are hidden from screen readers unless the user is scrolled to them.
  5. There's no git, no README, no requirements.txt and no deploy config.
  6. There's no privacy notice, although the form collects phone numbers and emails.
  7. `site/previous-design/` contains a made-up testimonial and unverified security claims.

## How I verified things

| Verified by running it | Inferred from reading |
|---|---|
| File inventory and sizes (PowerShell `Get-ChildItem`, summed per folder) | What each part is for, and the order things were made in (from file timestamps) |
| MD5 duplicates: `…whe (1).mp4` = `…whe.mp4`; `hero-reveal.png` = `Golden Wheat in Sunset Glow Image I.png` | Runtime behaviour of `cinematic.js` / `main.js` (no browser was run) |
| Frame dimensions 1280×720 (cv2 read of `cinematic/0/000.webp`, `frames/frame_0001.jpg`); source PNGs 1672×941 | Likely Blender failures (Blender not installed, so not run) |
| `npm ls --depth=0`, `npm audit --omit=dev` (99 vulns), `npm run build` (OK, 1 ESLint warning) | Contrast ratios (my own calculation, not a tool) |
| No `.git` (`git status` → "not a git repository") | Licensing notes |
| Python 3.14.8 with `cv2` 5.0.0 importable; `ffmpeg` and `blender` not on PATH | Rendered layout and visuals (I only saw the existing `site/preview-*.png` and the contact sheet) |
| `C:\Users\Administrator\Downloads\CropBillAI-3D-assets` doesn't exist; the Playwright path used by `validate.cjs` does exist | |

I didn't run `site/validate.cjs`: it overwrites `site/preview-*.png`, which would break the read-only constraint. `cropbillai-web/build/` didn't exist before, so I deleted it after the build.

---

## 1. Product and how the repo fits together

**Product, as described in the copy** (`site/index.html`, `site/previous-design/index.html`):
- Tagline: "Grow more. Guess less." The older version said "Snap your farm bills. Know your profit per crop."
- Clearly aimed at India: ₹ formatting with `Intl.NumberFormat('en-IN')`, Rabi/Kharif seasons, wheat/rice/cotton, phone-number signup, "+91" placeholder, domain `cropbillai.me` (old design's `og:url`).
- The current site is careful with claims: "ILLUSTRATIVE PREVIEW", "CREATIVE VISUALIZATION · NOT LIVE FARM DATA", "Not a yield forecast or financial advice".

**Branding** (`brand/logo-concepts.jpg`): four logo concepts. The favourite looks like scan-corner brackets around a leaf. `render_3d_logo.py` encodes it as 4 bracket strokes (#1F4D2B), a leaf (#3FA34D) and a vein (#FBF8F1), matching `previous-design` `theme-color #1F4D2B`. The current site doesn't use any logo. It shows a "⌁" glyph in a circle (`.brand-mark`) and a gold/forest palette (`--forest:#101c15`, `--gold:#e9cd86`).

**Timeline** (from file timestamps):

| When | What |
|---|---|
| 10‑09 18:38 | `render_3d_logo.py` |
| 10‑09 20:18 | CRA app `cropbillai-web` |
| 10‑09 21:16 | `render_golden_hour.py` |
| 10‑09 21:49 | `get_yt.py` |
| 10‑09 22:38 – 23:38 | AI-generated PNGs and MP4s in `site/assets` |
| 10‑10 11:42 – 11:44 | `extract_*.py` + snapshot into `site/previous-design/` |
| 10‑10 20:29 – 20:34 | `build_cinematic_assets.py`, current `site/` code, validation screenshots |

**How the pieces relate:**
```
Adobe Firefly / AI MP4s (site/assets/*.mp4)
   ├─ extract_cv2.py ──► site/assets/frames/frame_0001..0241.jpg  (used only by previous-design + commented-out code)
   ├─ extract_frames.py (ffmpeg, never effective here: no ffmpeg; would write .webp the site never reads)
   └─ build_cinematic_assets.py ──► site/assets/cinematic/{0..3}/000..089.webp + manifest.json + contact-sheet.jpg  ◄── used by site/cinematic.js
Blender scripts (render_3d_logo.py → site/assets/logo-3d.png; render_golden_hour.py → site/assets/smart-farm-golden-hour.png)  — neither output exists
get_yt.py — scrapes one YouTube page title; nothing downstream
cropbillai-web/ — separate React/three.js prototype; no link to site/ or the Python outputs
```
`cropbillai-web` and `site/` were two competing approaches. The static site won.

## 2. Python scripts

None of the scripts has a `requirements.txt`, CLI arguments or a `__main__` guard.

| Script | Purpose | Inputs → Outputs | Deps | Hardcoded paths / issues |
|---|---|---|---|---|
| `build_cinematic_assets.py` | Builds the live 4-scene sequence | 4 MP4s in `site/assets` → `site/assets/cinematic/{0-3}/NNN.webp` (90 each, 1280 wide, WebP q73), `manifest.json`, `contact-sheet.jpg` (4×3 thumbnails) | `cv2` (opencv-python) | Paths relative to `__file__`, so this one is portable. Trusts `CAP_PROP_FRAME_COUNT`, which often overcounts, so the last target frame can raise "Cannot decode". Doesn't clear stale frames. Thumbnails are forced to 400×225, which distorts non‑16:9 sources. The contact sheet assumes exactly 12 thumbnails. |
| `extract_cv2.py` | First single-scene extraction | Firefly push-in MP4 → `site/assets/frames/frame_0001..0241.jpg` (JPG q80, 1280×720; confirmed 241 frames, matches 10.04 s ≈ 24 fps) | `cv2` | Absolute path `C:\Users\Administrator\Desktop\CropBillAI\site\assets`. Output is now unused by the live site (35.5 MB). |
| `extract_frames.py` | ffmpeg version of the above | same MP4 → `frames/frame_%04d.webp` @24 fps | `ffmpeg` binary (not on PATH) | Same absolute path. Output format (.webp) doesn't match what the consumers expect (`.jpg`). The broad `except Exception` turns a missing ffmpeg into a printed message. Superseded, effectively dead. |
| `get_yt.py` | Checks whether YouTube video `TnduiS4kyg8` is available and prints its title | HTTP GET → stdout | stdlib | Scrapes YouTube HTML, which is against YouTube's ToS. It downloads nothing, and no asset traces back to it. Low risk. Delete it. |
| `render_3d_logo.py` | Renders an extruded 3D version of the logo SVG | `site/assets/logo-mark.svg` (**missing**) → `site/assets/logo-3d.png` (**missing**) | Blender `bpy` (run as `blender -b -P …`) | `bpy.data.filepath` is empty after `read_factory_settings`, so the base path is the process cwd. Bugs: (a) `origin_set` gives each curve its own origin, then every curve gets `location.x = y = 0`, so the brackets collapse onto the centre and the layout is lost; (b) `bpy.ops.transform.resize/rotate` in background mode usually fail their view3d context check; (c) `curves[0]` throws `IndexError` if the SVG is missing or empty; (d) assigning materials by sorted name depends on the importer's naming. |
| `render_golden_hour.py` | Renders a golden-hour scene from GLB models | `C:\Users\Administrator\Downloads\CropBillAI-3D-assets\{smart-farm,plant,receipt}.glb` (**folder doesn't exist**) → `site/assets/smart-farm-golden-hour.png` (**missing**) | Blender `bpy`, `mathutils` | Absolute paths outside the repo. The camera is fixed at (8,‑8,6) whatever the model size. All three models import at the origin and overlap. |

**Licensing:**
- File names start with "Firefly…", which points to Adobe Firefly video generation. The other MP4s and PNGs look AI-generated too, judging by their prompt-style names. Commercial-use rights depend on the Firefly plan or terms in effect when they were generated. Check that and keep a record (inferred, not checked).
- The scene 4 frames show what look like invented investment widgets ("Total Returns", "Invested", "Current Value ₹12,48,320", "+11.2%" in the contact sheet). That clashes with the site's "not financial advice" positioning and could look like an investment pitch.
- Nothing is downloaded from YouTube.

## 3. Frontends

### 3a. `site/` (live)

- **Stack:** plain HTML + 2 deferred IIFE scripts (`main.js`, `cinematic.js`) + 2 stylesheets (`styles.css` as the base, `cinematic.css` as overrides). No framework, no bundler, no GSAP. Google Fonts load DM Sans and Manrope. The form is handled by Netlify Forms (`data-netlify="true"`, honeypot `bot-field`, AJAX POST to `/`).
- **Layout** (`index.html`):
  - `section#story.cinematic` is 650vh tall (540vh at ≤1000px, 450vh at ≤700px). It holds a sticky `.story-stage`, which contains `.film-window > canvas#farm-canvas`.
  - The hero `<section class="hero">` with the `<h1>` sits inside the story stage. The indentation suggests it was pasted there.
  - Below the stage: shade, 4 `article.chapter` elements, chapter counter and progress bar.
  - After the story come `#product` (sample dashboard), `.manifesto` and `#waitlist`.
- **Cinematic engine** (`cinematic.js`):
  - Progress: `updateTarget()` turns scroll into `target` in [0,1]. `tick()` eases `displayed` toward it, roughly exponential with τ = 75 ms, on rAF, and stops once it settles.
  - Opening, p 0–0.12: a circular "portal" `clip-path: circle()` opens on `.film-window`. A matching `radial-gradient` mask cuts the black hero.
  - Film, p 0.12–0.87: 4 scenes. `index = round(local*89)`. Inside the first 12% of a scene, it cross-fades from the previous scene's frame 89 through a growing circular clip (`cover(..., clip)`).
  - Exit, p 0.91–1: the stage scales down to a rounded card.
  - Loading: `queue()` asks for the current frame plus offsets ±1, 2, 3, 5, 8. `pump()` keeps at most 5 requests in flight through `new Image()` and keeps an LRU-ish cache of 44 images. `nearest()` falls back to the closest cached frame. Failed frames go into `failed` and are never retried.
  - Loading pauses when the tab is hidden, the story is out of view, or reduced motion is on. Canvas DPR is capped at 1.25.
  - Chapter headings are split into `.word-mask` spans for a word-by-word reveal.
  - `assets/cinematic/manifest.json` is **never fetched**. The 90 frames per scene and the URL pattern are hardcoded.
- **Reduced motion** (`cinematic.css` last media query and the `visuals()` early return): becomes a static layout with stacked chapters on frames `044`/`089` as backgrounds. Done well.
- **`main.js`:**
  - Hero pointer "spotlight" reveal, mouse only.
  - Sample crop dashboard with `aria-pressed` toggle buttons. Sums check out: wheat profit ₹48,200 and rice ₹58,000, matching `validate.cjs`.
  - Waitlist validation (email, or 10–15 digit phone). It refuses to submit on `file:`/localhost.
  - About 90 lines of commented-out "legacy single-scene implementation" (dead code).
- **`validate.cjs`:** a hand-rolled Playwright smoke test.
  - It `require`s Playwright from `C:/Users/Administrator/AppData/Local/Temp/2/opencode/cropbill-validation/node_modules/playwright`, a temp folder that won't survive and isn't in the repo.
  - It must run from the workspace root.
  - It writes 9 screenshots (8.1 MB) into `site/`.
  - It covers crop switching, chapter sync, reverse scrubbing, local-form handling, mobile overflow and reduced motion. That's good coverage for something that isn't in CI.
- **`site/previous-design/`:** the earlier GSAP/ScrollTrigger version (CDN, no SRI) that preloads all 241 JPGs at once.
  - Broken where it sits: it uses relative paths `assets/logo-mark.svg`, `assets/logo-3d.png`, `assets/frames/...`, but `previous-design/assets/` doesn't exist, and `logo-mark.svg` / `logo-3d.png` don't exist anywhere.
  - Content risk: it has a made-up testimonial ("Rajesh K., Farmer") and FAQ claims ("encrypted", "English and Hindi", offline storage) with no product behind them.
  - Bug: it puts `id="waitlist"` on the hero and references a missing `#reveal-layer`.

### 3b. `cropbillai-web/` (prototype)

- **Versions installed** (verified with `npm ls`): react 19.3.0, react-dom 19.3.0, react-scripts 5.0.1, three 0.186.1, @react-three/fiber 9.8.1, @react-three/drei 10.7.9, cra-template 1.3.0. `npm outdated` reported nothing.
- **Tooling:** Create React App (`react-scripts` 5.0.1). CRA is no longer maintained, and its toolchain is the source of the audit findings.
- **`src/App.js`:**
  - A `<Canvas>` with an ambient and a directional light.
  - `<Environment preset="city">`: drei fetches the HDRI from an external CDN at runtime (inferred from drei's behaviour).
  - `ModelPlaceholder` draws a green box. The `useGLTF` import is unused, and `public/models/` is **empty**.
  - `ContactShadows`, and `OrbitControls autoRotate`.
  - The "Join the Waitlist" `<button>` has no handler.
- **`public/index.html`:** references `favicon.ico`, `logo192.png` and `manifest.json`, none of which exist, so you'd get 404s. It loads the Inter font.
- **`src/index.js`:** imports `App.css` a second time.
- **No tests:** the `test` script exists, but there are no test files.

## 4. Quality assessment

### Build and dependencies (verified)

**`npm run build`:**
- Result: **succeeds**, "Compiled with warnings".
- Warning: `src\App.js Line 3:38: 'useGLTF' is defined but never used`. With `CI=true`, which most CI hosts set, CRA treats warnings as errors and the build **fails**.
- Output: main bundle 337.71 kB gzip (1.26 MB raw), CSS 840 B. That's heavy for a page that shows one cube, since all of three.js and drei ship.

**`npm audit --omit=dev`: 99 vulnerabilities (3 low, 33 moderate, 63 high).**
- Why `--omit=dev` didn't help: `react-scripts` is in `dependencies`, so its whole toolchain counts as production.
- Examples: webpack-dev-middleware path traversal, underscore DoS, uuid, sprintf-js, workbox chain.
- Practical exposure: mostly build-time and dev-server, not in the shipped bundle. The only "fix" npm offers is `--force` to `react-scripts@0.0.0`, which isn't real.

`node_modules` is 573 MB.

### Bugs and likely runtime problems (inferred unless noted)

1. **`index.html:12` preload is wasted.** It preloads `Golden Wheat in Sunset Glow Image I.png` (1.82 MB). In cinematic mode, `cinematic.css:8` replaces `.hero-image`'s background with a gradient, and `cinematic.js` sets it to `#000`. So the image downloads at top priority and is never shown. Chrome will log "preloaded but not used".
2. **The "Discover the idea ↓", "SCROLL TO SEE WHAT GROWS" and nav "The story" links do nothing at the top of the page.** They point to `#story`, which is the section the hero lives inside and starts at offset 0.
3. **The page's `<h1>` gets `aria-hidden="true"` and `inert` once the intro passes 80%** (`cinematic.js`, `hero.inert=intro>.8`). Screen-reader heading navigation loses the page title after the user scrolls.
4. **`failed` frames are never retried** (`cinematic.js` `pump`). One network blip leaves that frame permanently on its nearest neighbour.
5. **Duplicate IDs and dead CSS:**
   - `styles.css` still has `.story-stage{background:… url('assets/frames/frame_0001.jpg')}`. It's overridden by `cinematic.css:4`, so it isn't fetched, but it's dead.
   - `.field-note`, `.corner` and `.hero-shade` styles in `styles.css` are unused or hidden.
6. **Inline styles are rewritten every animation frame** across ~40 word spans, 4 chapters (`setAttribute('aria-hidden')` + `inert` each frame) and a viewport-sized `mask-image` radial gradient. This can be costly on low-end Android while easing. Cache the last values and write only when they change.
7. **`cropbillai-web`:** dead CTA, 404 icons, unused import (the `CI=true` failure above), placeholder model.

### Performance and asset weight (verified sizes)

| Group | Files | Size | Used by live site? |
|---|---|---|---|
| `site/assets/cinematic/0..3/*.webp` | 360 (1280×720, avg 61 KB, max 94 KB; per scene 7.21 / 6.36 / 5.33 / 3.05 MB) | **21.96 MB** | Yes, streamed while scrolling |
| PNGs actually referenced (`Golden Wheat in Sunset Glow…`, `Golden Wheat Agritech Dashboard…`, `Futuristic Precision Farming…`, each 1672×941) | 3 | 6.04 MB | Yes, loaded at page load (one wasted, see bug 1) |
| Source MP4s (incl. byte-identical duplicate `…whe (1).mp4`, 28.7 MB) | 6 | **121.6 MB** | No |
| `site/assets/frames/*.jpg` | 241 | 35.5 MB | No (only previous-design and commented code) |
| Other unused PNG/JPG (`hero-base.jpg`, `hero-reveal.png` = duplicate, `Holographic…`, `Luminous…`, `Neon Green…`, `Neon Sprout…`, `Smart Sensors…`) | 7 | 15.7 MB | No |
| `site/preview-*.png` (validation screenshots) | 9 | 8.07 MB | No |
| `contact-sheet.jpg` | 1 | 0.53 MB | No |
| **`site/` total** | | **209.4 MB** | ~28 MB needed; **~181 MB unused** |

**First load:** about 6 MB of PNG (desktop) plus fonts plus `0/000.webp`, before any scrolling. All three PNGs are full-colour PNGs used as photos. As WebP or AVIF they'd be roughly 10× smaller.

**Scrolling through:** up to about 22 MB more. The 44-image cache means scrolling back re-requests frames, so it depends on the HTTP cache. Netlify's default `Cache-Control` for assets is `max-age=0, must-revalidate`, which means a revalidation round-trip per frame. Set immutable caching for `/assets/cinematic/*`.

**Mobile:**
- The same 1280-wide frames are sent to a 390 px phone, where the canvas is ≤ 1.25 × viewport.
- There's no `navigator.connection.saveData` check and no lighter frame set.
- A 640-wide set (~5–6 MB total) would be enough there.

### Accessibility

**Good:**
- Skip link, `lang="en"`, labelled landmarks and sections, `aria-pressed` crop toggles.
- `aria-live` on the dashboard and form status, `aria-invalid` on bad input, visible `:focus-visible` outline.
- Decorative canvas and images are `aria-hidden`.
- Full `prefers-reduced-motion` path.

**Problems:**
- **Story content is hidden from AT unless scrolled into place.** Chapters get `aria-hidden="true"` and `inert` whenever opacity < 0.1. A screen-reader user reading linearly skips all four chapters, and keyboard users can't reach chapter 4's "Explore the preview" link. Keep the chapters in the accessibility tree (visually hidden instead), or put the text in an always-available off-screen list.
- **Tiny text:** 6–9 px in several places (`.film-caption` 6 px and `.portal-label` 6 px on mobile, `.sample-badge` 7 px, `.dashboard-note` 8 px, `.tiny-label` and eyebrows 7–10 px, `.hero-bottom a` 8 px).
- **Contrast** (my own approximate calculation, not a tool): `.dashboard-note` #77816b on #fafbf6 ≈ 3.9:1; `.tiny-label` #68745f on cream ≈ 4.4:1; `.sample-badge` #657751 ≈ 4.3:1. All are below the WCAG AA 4.5:1 for small text. Semi-transparent text over video (e.g. `#e0e6d9cc`, `#c2cebb8f` in the footer) needs checking against actual frames.
- **Form:** one field takes email or phone but has `autocomplete="email"`, and there's no `inputmode`. Acceptable, but phone users get an email keyboard hint.
- Full WCAG validation needs manual testing with assistive technology. The above comes from reading the code.

### SEO and metadata (`site/index.html`)

- Has: title, description, theme-color.
- Missing: Open Graph and Twitter tags (the previous design had `og:*`), canonical URL, favicon, `robots.txt`, `sitemap.xml`, structured data (`Organization`/`WebSite`).
- All story copy is in the HTML, which is good for indexing.

### Security and privacy

- No secrets, API keys or tokens found (grep across the repo, excluding `node_modules`).
- No `innerHTML` sinks. `main.js` builds the dashboard with `createElement`/`textContent`.
- No Content-Security-Policy or security headers (no `netlify.toml` / `_headers`).
- Google Fonts are loaded from Google, which sends visitors' IP addresses to a third party. Self-hosting fixes this.
- `previous-design` loads GSAP from cdnjs without SRI.
- **PII:** the waitlist collects phone numbers and emails through Netlify Forms with no privacy notice, consent wording or retention statement. Since the audience is India-focused, consider India's Digital Personal Data Protection (DPDP) Act notice requirements. This is a flag, not legal advice.

### Code organisation

- **`site/`:** compact and readable, but minified-style one-line CSS (`styles.css`, `cinematic.css` ~47 very long lines) and dense JS make review and diffs hard.
- The `cinematic.css`-overrides-`styles.css` layering leaves a lot of dead base CSS.
- Generated media, source media, screenshots and test scripts all sit inside the publish folder.

## 5. Missing pieces

- **Version control:** none. There's no `.git` (verified) and no `.gitignore`. That's 573 MB of `node_modules` and 121 MB of MP4s with no history or backup.
- **Docs:** no README in any folder. Nothing explains the asset pipeline or how to deploy.
- **Python:** no `requirements.txt` (needs `opencv-python`); Blender scripts have no version notes; no `tools/` folder.
- **Tests:**
  - `site/validate.cjs` is the only test, and it relies on a temp-folder Playwright install.
  - `cropbillai-web` has none.
  - No CI.
- **Lint/format:** only CRA's built-in ESLint. Nothing for `site/` or the Python.
- **Deployment:** no `netlify.toml` (publish dir, headers, caching), no `_headers`, `_redirects` or 404 page. The Netlify Forms markup implies Netlify, but nothing configures it.
- **Brand assets:** `logo-mark.svg`, `logo-3d.png` and `smart-farm-golden-hour.png` are referenced by scripts and markup but don't exist. There's no favicon for the live site.

## 6. Build check

`cropbillai-web`: `npm run build` → exit 0. Compiled with 1 ESLint warning (`useGLTF` unused). Output 337.71 kB gzip JS + 840 B CSS. `build/` didn't exist before, so I deleted it afterwards (confirmed with `Test-Path build` → False). `site/` has no build step.

## 7. Recommendations

### High
1. **Put the project under git** with a `.gitignore` (`node_modules/`, `build/`, `site/preview-*.png`, source media or Git LFS). Today nothing is backed up or versioned.
2. **Move non-shipping media out of `site/`.**
   - Move `site/assets/*.mp4` (121.6 MB, including the duplicate `…whe (1).mp4`), `site/assets/frames/` (35.5 MB), the unused PNG/JPGs, `site/preview-*.png`, `site/assets/cinematic/contact-sheet.jpg` and `site/validate.cjs` into e.g. `media-src/` and `tools/`.
   - Archive or delete `site/previous-design/`. It's broken and contains a fake testimonial and unverified claims.
   - This shrinks the deploy from 209 MB to about 28 MB.
3. **Remove the dead preload and convert the PNGs.**
   - Drop `site/index.html:12`.
   - Convert `Golden Wheat Agritech Dashboard Image II.png` and `Futuristic Precision Farming at Sunrise Image I.png` to WebP/AVIF at the size they're displayed.
   - Load the hero-reveal image only when a mouse pointer is present (e.g. set it from `main.js` on the first `pointermove`).
4. **Fix screen-reader access to the story** (`site/cinematic.js` `visuals()`).
   - Stop setting `aria-hidden`/`inert` on chapters and on the hero `<h1>` based on opacity.
   - Hide them visually only, or provide an always-readable copy.
5. **Add a privacy notice and consent text** next to the waitlist form (`site/index.html` `#waitlist`), plus a privacy page.
6. **Add `netlify.toml`.**
   - Set `publish = "site"`.
   - Add `Cache-Control: public, max-age=31536000, immutable` for `/assets/cinematic/*` (rename on regeneration, or add a version folder).
   - Add security headers: CSP, `X-Content-Type-Options`, `Referrer-Policy`.

### Medium
7. **Mobile and low-data frame set.**
   - Extend `build_cinematic_assets.py` to also write 640-wide frames (e.g. `cinematic/m/{scene}/`).
   - Choose the set in `cinematic.js` based on `stage.clientWidth*dpr` and `navigator.connection?.saveData`.
   - Read `manifest.json` instead of hardcoding `sceneFrames=90`.
8. **`cinematic.js` robustness and performance.**
   - Retry failed frames once after a delay.
   - Only write inline styles and attributes when the value changes.
   - Point the hero links at the first chapter's scroll position (e.g. a `#chapter-1` anchor) instead of `#story`.
9. **Fix contrast and minimum sizes.** Raise the ≤ 9 px labels to ≥ 11–12 px and darken `.dashboard-note`, `.tiny-label` and `.sample-badge` to ≥ 4.5:1 (`site/styles.css`, `site/cinematic.css`).
10. **Make the asset tools reproducible.**
    - Add `requirements.txt` (`opencv-python==<pinned>`).
    - Move scripts to `tools/`. Delete `extract_frames.py`, `extract_cv2.py` and `get_yt.py`, or mark them legacy.
    - In `build_cinematic_assets.py`, handle frame-count overestimation (clamp to the last decoded frame) and clear stale output.
11. **Turn `validate.cjs` into a real test:** add a root `package.json` with pinned `@playwright/test`, a relative `site/` path, screenshots written to an ignored folder, and an npm script.
12. **Decide what happens to `cropbillai-web`.** If the static site is the product site, archive or remove it: its copy describes a different product, it has 99 audit findings, and it ships a 338 kB bundle for a placeholder cube. If the 3D approach is wanted later, start on Vite rather than the unmaintained CRA. At minimum, remove the unused `useGLTF` import (`src/App.js:3`) so `CI=true` builds pass, and add the missing `favicon.ico`, `logo192.png` and `manifest.json`.

### Low
13. **Branding.** Pick a concept from `brand/logo-concepts.jpg`, create the missing `logo-mark.svg`, and use it for the favicon and `.brand-mark` instead of "⌁". Add OG and Twitter tags plus an OG image, a canonical URL (`https://cropbillai.me`), and `robots.txt`/`sitemap.xml`.
14. **Fix or delete the Blender scripts.**
    - `render_3d_logo.py`: keep the relative positions instead of zeroing each curve's location; join the curves or parent them to an empty before transforming; set transforms directly instead of `bpy.ops.transform.*`; resolve paths relative to `__file__`.
    - `render_golden_hour.py`: move the inputs into the repo and frame the camera from the model bounding boxes.
15. **Content review.** Scene 4 frames show investment-style widgets ("Total Returns / Invested / Current Value"). Consider regenerating them to show crop profit, to match the site's "not financial advice" stance. Record Adobe Firefly licence and terms for all generated media.
16. **Readability.** Format the one-line CSS and dense JS (Prettier), and delete the commented-out legacy block in `site/main.js`. Self-host the fonts.
