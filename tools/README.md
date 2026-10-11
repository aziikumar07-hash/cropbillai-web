# tools

Asset scripts for the new site in `web/`. The backup `site/` is read-only.

Install: `python -m pip install -r tools/requirements.txt`

| Script | Status | Notes |
|---|---|---|
| `build_cinematic_assets.py` | Active | Continuous MP4 → 210 desktop/mobile WebP frames, hash-versioned paths + manifest, stills/OG, hero, backgrounds and icons under `web/public/`. Falls back to clips/existing backup frames. Run: `python tools/build_cinematic_assets.py` |
| `extract_cv2.py` | Legacy | Old single-scene JPG extraction (output now in `media-src/assets/frames/`). Hardcoded absolute paths. |
| `extract_frames.py` | Legacy | ffmpeg variant of the above; never effective (no ffmpeg). |
| `get_yt.py` | Legacy | Scrapes a YouTube page title; nothing downstream. |
| `render_3d_logo.py` | Legacy | Blender script; inputs missing and known bugs. |
| `render_golden_hour.py` | Legacy | Blender script; input GLBs live outside the repo and don't exist. |

Legacy scripts are kept for reference only and are not maintained.

CLI: `--source auto|continuous|clips`, `--only all|cinematic|images`, `--frames 210`, `--beats '[0,0.30,0.55,0.76]'`, `--hero-source auto|png`, `--out <path>`, `--media-dir <path>`. Output is staged until every encoding succeeds. Only the generated cinematic subtree is cleared on promotion; source files and optional assets are never removed. Actual reads determine frame count, not optimistic codec metadata.

`--simulate-decode-failure 1`, `2:read`, or `continuous:read` are acceptance-test hooks. `python web/scripts/check-pipeline.py` exercises them in disposable directories and verifies production manifest bytes/mtime are unchanged. Default output is about 20 MB; defaults do not upscale source images.
