"""Remote readiness check only; never queues a workflow or downloads weights."""
import hashlib, json, pathlib, subprocess, sys, urllib.request
root = pathlib.Path(__file__).resolve().parent
pins = json.loads((root / 'pins.json').read_text())
import torch
assert sys.version_info[:2] == (3, 12), sys.version
assert torch.__version__ == pins['torch'], torch.__version__
assert torch.version.cuda == pins['cuda'] and torch.cuda.is_available()
assert torch.cuda.device_count() == 1
gpu = torch.cuda.get_device_properties(0)
assert 'A100' in gpu.name and gpu.total_memory >= 79 * 1024**3, str(gpu)
ram = int(next(l for l in pathlib.Path('/proc/meminfo').read_text().splitlines() if l.startswith('MemTotal:')).split()[1]) * 1024
assert ram >= 64 * 1024**3
comfy = pathlib.Path('/workspace/adstudio-benchmark/ComfyUI')
for repo, expected in [(comfy, pins['comfy']), (comfy / 'custom_nodes/ComfyUI-LTXVideo', pins['ltxNodes'])]:
    assert subprocess.check_output(['git', '-C', str(repo), 'rev-parse', 'HEAD'], text=True).strip() == expected
for weight in pins['weights']:
    path = comfy / 'models' / weight['path']
    assert path.stat().st_size == weight['bytes'], str(path)
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(16 * 1024 * 1024), b''): h.update(block)
    assert h.hexdigest() == weight['sha256'], str(path)
for route in ['http://127.0.0.1:28188/system_stats', 'http://127.0.0.1:28189/api/v2/health']:
    with urllib.request.urlopen(route, timeout=10) as response: assert response.status == 200
subprocess.run(['python', '-m', 'pip', 'check'], check=True)
subprocess.run(['ffmpeg', '-version'], check=True, stdout=subprocess.DEVNULL)
print(json.dumps({'ready':True, 'gpu':gpu.name, 'vram':gpu.total_memory, 'ram':ram, 'torch':torch.__version__, 'cuda':torch.version.cuda}))
