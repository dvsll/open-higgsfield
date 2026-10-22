#!/usr/bin/env bash
# Remote only, after explicit deployment/download approval. Never called by app.
set -euo pipefail
if [[ "${1:-}" != "--approved" ]]; then
  echo 'DRY RUN: pinned source/dependency setup only. --approved is required after user approval. No action taken.'
  exit 0
fi
package="$(cd "$(dirname "$0")" && pwd)"
root=/workspace/adstudio-benchmark
[[ ! -e "$root/ComfyUI" ]] || { echo 'Existing benchmark directory: refuse to overwrite.' >&2; exit 1; }
mkdir -p "$root"
python3.12 - <<'PY'
import pathlib, shutil, torch
assert torch.__version__ == '2.10.0+cu128' and torch.version.cuda == '12.8'
assert shutil.disk_usage('/workspace').free > 150 * 1000**3
PY
readarray -t revisions < <(python3.12 -c 'import json,sys; p=json.load(open(sys.argv[1])); print(p["comfy"]); print(p["ltxNodes"])' "$package/pins.json")
git init "$root/ComfyUI"
git -C "$root/ComfyUI" remote add origin https://github.com/Comfy-Org/ComfyUI.git
git -C "$root/ComfyUI" fetch --depth 1 origin "${revisions[0]}"
git -C "$root/ComfyUI" checkout --detach FETCH_HEAD
nodes="$root/ComfyUI/custom_nodes/ComfyUI-LTXVideo"
git init "$nodes"
git -C "$nodes" remote add origin https://github.com/Lightricks/ComfyUI-LTXVideo.git
git -C "$nodes" fetch --depth 1 origin "${revisions[1]}"
git -C "$nodes" checkout --detach FETCH_HEAD
python3.12 -m venv --system-site-packages "$root/venv"
source "$root/venv/bin/activate"
# Exact digest supplies CUDA/PyTorch. Keep them; do not replace with CPU/PyPI builds.
python - "$package" <<'PY'
import hashlib,json,pathlib,sys
p=pathlib.Path(sys.argv[1]); pins=json.loads((p/'pins.json').read_text())
assert hashlib.sha256((p/'requirements.lock').read_bytes()).hexdigest()==pins['requirementsSha256']
PY
PIP_CONSTRAINT= python -m pip install --require-hashes --only-binary=:all: -r "$package/requirements.lock"
python -m pip check
python -m pip freeze --all > "$root/pip-freeze.txt"
python -c 'import torch; assert torch.__version__=="2.10.0+cu128" and torch.version.cuda=="12.8"'
echo 'Sources/dependencies ready. Weights are a separate approval-gated command. No automatic model download.'
