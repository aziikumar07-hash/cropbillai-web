"""Build a web-sized, four-scene sequence without modifying original media."""
from pathlib import Path
import cv2
import json

assets = Path(__file__).parent / 'site' / 'assets'
sources = [
    'Firefly Macro cinematic push-in (dolly forward) at ground level through pristine rows of healthy whe.mp4',
    'drone flight over a vibrant green agricultural field at sunri.mp4',
    'Firefly Slow, elegant cinematic orbit and subtle zoom out around a perfectly manicured square slab o.mp4',
    'The camera slowly orbits around the glowing neon gre.mp4',
]
out = assets / 'cinematic'
out.mkdir(exist_ok=True)
manifest = []
thumbnails = []
for scene, source in enumerate(sources):
    cap = cv2.VideoCapture(str(assets / source))
    if not cap.isOpened():
        raise RuntimeError(f'Cannot open {source}')
    count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    destination = out / str(scene)
    destination.mkdir(exist_ok=True)
    source_index = -1
    for i in range(90):
        target = round(i * (count-1) / 89)
        while source_index < target:
            ok, frame = cap.read()
            source_index += 1
            if not ok:
                break
        if not ok:
            raise RuntimeError(f'Cannot decode scene {scene}, frame {i}')
        h, w = frame.shape[:2]
        frame = cv2.resize(frame, (1280, round(h*1280/w)), interpolation=cv2.INTER_AREA)
        if not cv2.imwrite(str(destination / f'{i:03d}.webp'), frame, [cv2.IMWRITE_WEBP_QUALITY, 73]):
            raise RuntimeError('WebP encoding failed')
        if i in (0,44,89):
            thumb = cv2.resize(frame,(400,225))
            cv2.putText(thumb,f'Scene {scene+1} / frame {i}',(12,25),cv2.FONT_HERSHEY_SIMPLEX,.55,(255,255,255),1)
            thumbnails.append(thumb)
    cap.release()
    manifest.append({'scene':scene,'source':source,'duration':round(count/fps,2),'frames':90})
    print(f'Scene {scene+1}: {count} source frames, {count/fps:.1f}s -> 90 WebP frames')
(out / 'manifest.json').write_text(json.dumps(manifest,indent=2))
sheet = cv2.vconcat([cv2.hconcat(thumbnails[i:i+3]) for i in range(0,12,3)])
cv2.imwrite(str(out / 'contact-sheet.jpg'),sheet)
size = sum(p.stat().st_size for p in out.glob('*/*.webp'))
print(f'Total compressed sequence: {size/1024/1024:.1f} MB')
