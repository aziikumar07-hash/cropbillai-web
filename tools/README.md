# tools

Asset scripts for the static site in `site/`.

Install: `python -m pip install -r tools/requirements.txt`

| Script | Status | Notes |
|---|---|---|
| `build_cinematic_assets.py` | Active | Reads MP4s from `media-src/assets/`, writes `site/assets/cinematic/{0..3}/*.webp` + `manifest.json`. Run: `python tools/build_cinematic_assets.py` |
| `extract_cv2.py` | Legacy | Old single-scene JPG extraction (output now in `media-src/assets/frames/`). Hardcoded absolute paths. |
| `extract_frames.py` | Legacy | ffmpeg variant of the above; never effective (no ffmpeg). |
| `get_yt.py` | Legacy | Scrapes a YouTube page title; nothing downstream. |
| `render_3d_logo.py` | Legacy | Blender script; inputs missing and known bugs. |
| `render_golden_hour.py` | Legacy | Blender script; input GLBs live outside the repo and don't exist. |

Legacy scripts are kept for reference only and are not maintained.
