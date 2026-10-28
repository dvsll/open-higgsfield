"""Run with ComfyUI Python: setup-speech.py --comfy-root /path/to/ComfyUI."""
import argparse, pathlib, shutil, subprocess, sys, urllib.request, hashlib
parser = argparse.ArgumentParser()
parser.add_argument('--comfy-root', required=True)
parser.add_argument('--skip-deps', action='store_true')
args = parser.parse_args()
root = pathlib.Path(args.comfy_root).resolve()
if not (root / 'main.py').is_file():
    raise SystemExit('Choose the ComfyUI directory containing main.py.')
if not args.skip_deps:
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', str(pathlib.Path(__file__).with_name('requirements-speech.txt'))], check=True)
models = root / 'models' / 'kokoro'
models.mkdir(parents=True, exist_ok=True)
for name, size, digest in [('kokoro-v1.0.int8.onnx', 92361271, '6e742170d309016e5891a994e1ce1559c702a2ccd0075e67ef7157974f6406cb'), ('voices-v1.0.bin', 28214398, 'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d')]:
    target = models / name
    if not target.is_file() or target.stat().st_size != size or hashlib.sha256(target.read_bytes()).hexdigest() != digest:
        temp = target.with_suffix(target.suffix + '.part')
        try:
            urllib.request.urlretrieve('https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/' + name, temp)
            if temp.stat().st_size != size or hashlib.sha256(temp.read_bytes()).hexdigest() != digest:
                raise RuntimeError('Incomplete model download: ' + name)
            temp.replace(target)
        finally:
            temp.unlink(missing_ok=True)
    print(name, hashlib.sha256(target.read_bytes()).hexdigest(), flush=True)
target = root / 'custom_nodes' / 'osh_speech'
target.mkdir(parents=True, exist_ok=True)
shutil.copy2(pathlib.Path(__file__).resolve().parents[1] / 'comfy-nodes' / 'osh_speech' / '__init__.py', target / '__init__.py')
print('Speech installed. Restart ComfyUI when idle.', flush=True)
