"""Transactional, reproducible web assets. Originals and the backup site are read-only."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import struct
import tempfile
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
CLIPS = [
    'Firefly Macro cinematic push-in (dolly forward) at ground level through pristine rows of healthy whe.mp4',
    'drone flight over a vibrant green agricultural field at sunri.mp4',
    'Firefly Slow, elegant cinematic orbit and subtle zoom out around a perfectly manicured square slab o.mp4',
    'The camera slowly orbits around the glowing neon gre.mp4',
]

def resize(image, width):
    h, w = image.shape[:2]
    width = min(width, w)
    return cv2.resize(image, (width, round(h * width / w)), interpolation=cv2.INTER_AREA)

def write(path, image, quality=72):
    path.parent.mkdir(parents=True, exist_ok=True)
    params = [cv2.IMWRITE_WEBP_QUALITY, quality] if path.suffix == '.webp' else [cv2.IMWRITE_JPEG_QUALITY, 86] if path.suffix == '.jpg' else []
    if not cv2.imwrite(str(path), image, params):
        raise RuntimeError(f'Encoding failed: {path}')

def decode(path, key, failure):
    if failure == str(key):
        raise RuntimeError('SIMULATED open failure')
    cap = cv2.VideoCapture(str(path))
    frames = []
    try:
        if not cap.isOpened():
            raise RuntimeError(f'Cannot open {path}')
        fps = cap.get(cv2.CAP_PROP_FPS) or 24
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if failure == f'{key}:read':
                print(f'SIMULATED read failure for scene {key}')
                raise RuntimeError('SIMULATED read failure')
            frames.append(frame)
        if not frames:
            raise RuntimeError(f'Cannot decode {path}')
        return frames, fps
    finally:
        cap.release()

def locate(name, media):
    for base in [media / 'assets', ROOT / 'site' / 'assets']:
        path = base / name
        if path.exists():
            return path
    raise RuntimeError(f'Missing image: {name}')

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source', choices=['auto', 'continuous', 'clips'], default='auto')
    p.add_argument('--only', choices=['all', 'cinematic', 'images'], default='all')
    p.add_argument('--out', type=Path, default=ROOT / 'web' / 'public')
    p.add_argument('--media-dir', type=Path, default=ROOT / 'media-src')
    p.add_argument('--frames', type=int, default=210)
    p.add_argument('--beats', default=None)
    p.add_argument('--hero-source', choices=['auto', 'png'], default='auto')
    p.add_argument('--simulate-decode-failure', default='')
    a = p.parse_args()
    if not 2 <= a.frames <= 360:
        p.error('--frames must be between 2 and 360')
    # Decode before creating or touching the output. Actual reads, not reported count.
    continuous = None
    if a.source != 'clips' or a.only == 'images':
        try:
            continuous, fps = decode(a.media_dir / 'continuous.mp4', 'continuous', a.simulate_decode_failure)
        except RuntimeError:
            if a.source == 'continuous':
                raise RuntimeError('continuous.mp4 not found or not decodable')
            print('continuous.mp4 failed during decode, using clips')
    a.out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.cinematic-staging-', dir=a.out.parent) as tmp:
        stage = Path(tmp)
        if a.only != 'images':
            sequences, scenes = [], []
            if continuous is not None and a.source != 'clips':
                mode = 'continuous'
                sequences = [[continuous[round(i * (len(continuous)-1)/(a.frames-1))] for i in range(a.frames)]]
                scenes = [{'frames': a.frames, 'origin': 'video', 'duration': round(len(continuous)/fps, 2)}]
            else:
                mode = 'clips'
                for i, name in enumerate(CLIPS):
                    try:
                        raw, fps = decode(a.media_dir / 'assets' / name, i, a.simulate_decode_failure)
                        sequence = [raw[round(j * (len(raw)-1)/89)] for j in range(90)]
                        origin = 'video'
                    except RuntimeError:
                        paths = sorted((ROOT / 'site' / 'assets' / 'cinematic' / str(i)).glob('*.webp'))
                        if not paths:
                            raise RuntimeError(f'No fallback for scene {i}')
                        sequence = [cv2.imread(str(path)) for path in paths]
                        origin = 'fallback-frames'
                    sequences.append(sequence)
                    scenes.append({'frames': len(sequence), 'origin': origin})
            beats = json.loads(a.beats) if a.beats else ([0, .30, .55, .76] if mode == 'continuous' else [0, .25, .5, .75])
            if len(beats) != 4 or beats[0] != 0 or not all(beats[i] < beats[i+1] for i in range(3)) or beats[-1] >= 1:
                raise RuntimeError('Beats must be four increasing fractions starting at 0')
            digest = hashlib.sha256()
            for variant, width, quality in [('desktop', 1280, 72), ('mobile', 640, 70)]:
                for i, sequence in enumerate(sequences):
                    for j, frame in enumerate(sequence):
                        path = stage / 'cinematic' / variant / str(i) / f'{j:03d}.webp'
                        if variant == 'desktop' and scenes[i]['origin'] == 'fallback-frames' and frame.shape[1] == 1280:
                            path.parent.mkdir(parents=True, exist_ok=True)
                            shutil.copyfile(ROOT / 'site' / 'assets' / 'cinematic' / str(i) / f'{j:03d}.webp', path)
                        else:
                            write(path, resize(frame, width), quality)
                        digest.update(path.read_bytes())
            version = digest.hexdigest()[:12]
            for variant in ['desktop', 'mobile']:
                folder = stage / 'cinematic' / variant
                folder.rename(stage / 'cinematic' / f'{variant}-temp')
                folder.mkdir()
                (stage / 'cinematic' / f'{variant}-temp').rename(folder / version)
            for i in range(4):
                seq = sequences[0] if mode == 'continuous' else sequences[i]
                f = (beats[i] + (beats[i+1] if i < 3 else 1)) / 2 if mode == 'continuous' else .5
                write(stage / 'images' / f'still-{i}.webp', resize(seq[round(f*(len(seq)-1))], 1280))
            plots = sequences[-1][round(.92*(len(sequences[-1])-1))]
            h, w = plots.shape[:2]
            crop_h = min(h, round(w * 630/1200)); crop_w = min(w, round(h * 1200/630))
            crop = plots[(h-crop_h)//2:(h+crop_h)//2, (w-crop_w)//2:(w+crop_w)//2]
            write(stage / 'og-image.jpg', cv2.resize(crop, (1200, 630)))
            manifest = {'version': version, 'mode': mode, 'beats': beats, 'variants': ['desktop', 'mobile'], 'sizes': {'desktop': 1280, 'mobile': 640}, 'scenes': scenes}
            (stage / 'cinematic' / 'manifest.json').write_text(json.dumps(manifest, indent=2))
            print(f'{mode}: {len(scenes)} scenes, {sum(s["frames"] for s in scenes)} frames per variant, version {version}')
        if a.only != 'cinematic':
            day = continuous[0] if continuous is not None and a.hero_source == 'auto' else cv2.imread(str(locate('Golden Wheat in Sunset Glow Image I.png', a.media_dir)))
            day = resize(day, 1920)
            write(stage / 'hero' / 'day.webp', day, 78)
            # BGR cool moonlit grade. Retain enough landscape detail behind text.
            night = np.clip(day.astype(np.float32) * np.array([.62, .43, .30]) + np.array([12, 8, 3]), 0, 255).astype(np.uint8)
            write(stage / 'hero' / 'night.webp', night, 78)
            for name, output in [('Golden Wheat Agritech Dashboard Image II.png', 'carousel-bg.webp'), ('Futuristic Precision Farming at Sunrise Image I.png', 'finale-bg.webp')]:
                background = resize(cv2.imread(str(locate(name, a.media_dir))), 1440)
                # Source art contains fictional investment-style overlays. Never expose
                # those as product claims: retain colour/light only, no readable labels.
                background = cv2.GaussianBlur(background, (0, 0), 32)
                write(stage / 'images' / output, background)
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#f3f1e7"/><path d="M12 25V12h13m14 0h13v13M12 39v13h13m14 0h13V39" fill="none" stroke="#1F4D2B" stroke-width="4"/><path d="M21 43C17 25 30 18 44 20c1 15-6 25-20 23m0 0 14-15" fill="#3FA34D" stroke="#1F4D2B" stroke-width="3" stroke-linecap="round"/></svg>'
            (stage / 'icon.svg').write_text(icon)
            img = np.full((180, 180, 3), (231, 241, 243), np.uint8)
            cv2.ellipse(img, (91, 87), (24, 45), 35, 0, 360, (77, 163, 63), -1)
            cv2.line(img, (61, 125), (114, 55), (43, 77, 31), 7)
            for x, y, dx, dy in [(25,25,1,1),(155,25,-1,1),(25,155,1,-1),(155,155,-1,-1)]:
                cv2.line(img,(x,y),(x+dx*30,y),(43,77,31),6); cv2.line(img,(x,y),(x,y+dy*30),(43,77,31),6)
            write(stage / 'apple-touch-icon.png', img)
            _, png = cv2.imencode('.png', cv2.resize(img, (32,32)))
            data = png.tobytes()
            (stage / 'favicon.ico').write_bytes(struct.pack('<HHH',0,1,1)+struct.pack('<BBBBHHII',32,32,0,0,1,32,len(data),22)+data)
        # Promote only after every encode succeeds. Delete only generated cinematic tree.
        if (stage / 'cinematic').exists():
            old = a.out / 'cinematic'
            if old.exists():
                shutil.rmtree(old)
            shutil.move(str(stage / 'cinematic'), old)
        for path in list(stage.rglob('*')):
            if path.is_file():
                dest = a.out / path.relative_to(stage)
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(path, dest)
    print(f'Assets: {sum(p.stat().st_size for p in a.out.rglob("*") if p.is_file())/1024/1024:.1f} MB in {a.out}')

if __name__ == '__main__':
    main()
