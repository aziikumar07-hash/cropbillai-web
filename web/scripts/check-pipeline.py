"""Acceptance cases use only disposable, tool-created directories."""
from pathlib import Path
import json
import subprocess
import tempfile

root = Path(__file__).resolve().parents[2]
builder = root / 'tools' / 'build_cinematic_assets.py'
manifest = root / 'web' / 'public' / 'cinematic' / 'manifest.json'
before = (manifest.read_bytes(), manifest.stat().st_mtime_ns)
def check(out, mode, count, fallback=None):
    m = json.loads((out / 'cinematic' / 'manifest.json').read_text())
    assert m['mode'] == mode and len(m['scenes']) == count
    for i, scene in enumerate(m['scenes']):
        assert scene['origin'] == ('fallback-frames' if i == fallback else 'video')
        for variant in m['variants']:
            assert len(list((out / 'cinematic' / variant / m['version'] / str(i)).glob('*.webp'))) == scene['frames']
    print('PASS', mode, fallback, flush=True)
check(root / 'web' / 'public', 'continuous', 1)
with tempfile.TemporaryDirectory(prefix='cropbill-pipeline-', dir=Path.home() / 'AppData' / 'Local' / 'Temp' / '2' / 'opencode') as temp:
    base = Path(temp)
    for n, fail in enumerate(['', '1', '2:read', 'continuous:read']):
        out = base / str(n)
        source = 'auto' if fail == 'continuous:read' else 'clips'
        command = ['python', str(builder), '--source', source, '--only', 'cinematic', '--out', str(out)]
        if fail:
            command += ['--simulate-decode-failure', fail]
        result = subprocess.run(command, cwd=root, capture_output=True, text=True)
        print(result.stdout, flush=True)
        assert result.returncode == 0, result.stderr
        check(out, 'clips', 4, int(fail[0]) if fail in ['1', '2:read'] else None)
    empty = base / 'empty'; empty.mkdir()
    out = base / 'missing'
    result = subprocess.run(['python', str(builder), '--source', 'continuous', '--media-dir', str(empty), '--out', str(out)], cwd=root, capture_output=True, text=True)
    assert result.returncode == 1 and 'continuous.mp4 not found or not decodable' in result.stderr
    assert not (out / 'cinematic').exists()
    print('PASS missing continuous input', flush=True)
assert before == (manifest.read_bytes(), manifest.stat().st_mtime_ns)
print('PASS production public assets unchanged', flush=True)
