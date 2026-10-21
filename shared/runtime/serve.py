"""Local runtime for both apps.

Serves the repo as a static site and exposes a small JSON API that runs the
workflows in shared/workflows/ on a local ComfyUI through the Comfy SDK:

    browser  ->  serve.py (/api/*, comfy-sdk)  ->  comfy-api-proxy :8189  ->  ComfyUI :8188

Usage:  python shared/runtime/serve.py [--port 8765] [--host 127.0.0.1]
Env:    COMFYUI_URL (default http://127.0.0.1:8188), COMFY_BASE_URL (default http://127.0.0.1:8189)
"""
from __future__ import annotations

import argparse
import copy
import json
import os
import shutil
import subprocess
import sys
import threading
import time
import urllib.request
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # repo root
WORKFLOWS = ROOT / "shared" / "workflows"
OUTPUTS = ROOT / "outputs"                           # gitignored
COMFYUI_URL = os.environ.get("COMFYUI_URL", "http://127.0.0.1:8188")
os.environ.setdefault("COMFY_BASE_URL", "http://127.0.0.1:8189")

from comfy_sdk import Comfy  # noqa: E402  (after COMFY_BASE_URL is set)

FPS = 24
GPU_LOCK = threading.Lock()   # one generation at a time; the GPU is the bottleneck anyway
_client: Comfy | None = None


def client() -> Comfy:
    global _client
    if _client is None:
        _client = Comfy()
    return _client


def load(name: str) -> dict:
    return json.loads((WORKFLOWS / f"{name}.json").read_text(encoding="utf-8"))


def up(url: str) -> bool:
    try:
        urllib.request.urlopen(url, timeout=2)
        return True
    except urllib.error.HTTPError:
        return True          # server answered, just not on this path
    except Exception:
        return False


def ensure_proxy() -> None:
    """Start comfy-api-proxy next to ComfyUI if it isn't running yet."""
    base = os.environ["COMFY_BASE_URL"]
    if up(base):
        return
    exe = shutil.which("comfy-api-proxy") or str(Path(sys.executable).with_name("comfy-api-proxy"))
    port = base.rsplit(":", 1)[-1].strip("/")
    print(f"starting comfy-api-proxy on :{port} -> {COMFYUI_URL}")
    subprocess.Popen([exe, "run", "--comfyui", COMFYUI_URL, "--port", port])
    for _ in range(30):
        if up(base):
            return
        time.sleep(0.5)
    print("warning: comfy-api-proxy did not come up; /api calls will fail")


def local_path(url: str) -> Path:
    """'/outputs/x.png' (as returned by this server) -> file on disk, refusing anything outside outputs/."""
    p = (ROOT / url.lstrip("/")).resolve()
    if OUTPUTS.resolve() not in p.parents:
        raise ValueError(f"not an output file: {url}")
    return p


def save_outputs(result, node: str, ext: str) -> list[str]:
    OUTPUTS.mkdir(exist_ok=True)
    urls = []
    for out in result.get_outputs(node):
        name = f"{uuid.uuid4().hex[:10]}{ext}"
        out.to_file(str(OUTPUTS / name))
        urls.append(f"/outputs/{name}")
    return urls


# ---------- workflows ----------

def run_keyframe(req: dict) -> dict:
    """Prompt -> image. shared/workflows/keyframe_zimage.json (Z-Image Turbo)."""
    c = client()
    wf = c.workflows.from_file(str(WORKFLOWS / "keyframe_zimage.json"))
    wf.set_input("5", "text", req["prompt"])
    wf.set_input("8", "seed", int(req.get("seed", 1)))
    if req.get("width"):
        wf.set_input("7", "width", int(req["width"]))
    if req.get("height"):
        wf.set_input("7", "height", int(req["height"]))
    t = time.time()
    with GPU_LOCK:
        result = c.run(wf)
    return {"url": save_outputs(result, "10", ".png")[0], "seconds": round(time.time() - t, 1)}


def shot_graph(n_keys: int) -> dict:
    """shot_ltxv.json has one guide (node 8). Chain one LTXVAddGuide per extra keyframe."""
    g = load("shot_ltxv")
    prev = "8"
    for i in range(1, n_keys):
        img, scale, guide = f"5{i:02d}", f"6{i:02d}", f"8{i:02d}"
        g[img] = copy.deepcopy(g["5"])
        g[scale] = copy.deepcopy(g["6"]); g[scale]["inputs"]["image"] = [img, 0]
        g[guide] = copy.deepcopy(g["8"])
        g[guide]["inputs"].update({"positive": [prev, 0], "negative": [prev, 1], "latent": [prev, 2], "image": [scale, 0]})
        prev = guide
    g["11"]["inputs"].update({"positive": [prev, 0], "negative": [prev, 1]})
    g["13"]["inputs"]["latent"] = [prev, 2]
    g["14"]["inputs"]["latent_image"] = [prev, 2]
    return g


def run_shot(req: dict) -> dict:
    """Keyframes (images at times) + motion prompt -> video. shared/workflows/shot_ltxv.json (LTX-Video)."""
    keys = sorted(req["keys"], key=lambda k: k["t"])
    if not keys:
        raise ValueError("a shot needs at least one keyframe")
    dur = float(req.get("duration", 4))
    length = max(25, min(121, round(dur * FPS / 8) * 8 + 1))          # LTX wants 8n+1 frames
    last = length - 1
    c = client()
    g = shot_graph(len(keys))
    path = WORKFLOWS / f".shot_{len(keys)}.json"                        # generated variant (gitignored)
    path.write_text(json.dumps(g), encoding="utf-8")
    wf = c.workflows.from_file(str(path))
    wf.set_input("3", "text", req.get("prompt") or "cinematic shot")
    wf.set_input("7", "length", length)
    wf.set_input("14", "noise_seed", int(req.get("seed", 1)))
    guide_ids = ["8"] + [f"8{i:02d}" for i in range(1, len(keys))]
    image_ids = ["5"] + [f"5{i:02d}" for i in range(1, len(keys))]
    for k, gid, iid in zip(keys, guide_ids, image_ids):
        f = round(float(k["t"]) * FPS / 8) * 8
        idx = -1 if f >= last - 4 else min(f, last - 8)                 # snap to latent frames; last key = end
        wf.set_input(gid, "frame_idx", idx)
        wf.set_input(gid, "strength", float(k.get("strength", 1.0)))
        wf.set_input(iid, "image", c.assets.from_file(str(local_path(k["image"]))))
    t = time.time()
    with GPU_LOCK:
        result = c.run(wf)
    return {"url": save_outputs(result, "17", ".webm")[0], "seconds": round(time.time() - t, 1), "frames": length}


API = {"keyframe": run_keyframe, "shot": run_shot}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, fmt, *args):
        if self.path.startswith("/api"):
            super().log_message(fmt, *args)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, code: int, obj: dict) -> None:
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/health":
            return self._json(200, {"comfyui": up(COMFYUI_URL + "/system_stats"), "proxy": up(os.environ["COMFY_BASE_URL"]),
                                    "workflows": sorted(p.stem for p in WORKFLOWS.glob("*.json") if not p.name.startswith("."))})
        return super().do_GET()

    def do_POST(self):
        name = self.path.removeprefix("/api/")
        if name not in API:
            return self._json(404, {"error": f"unknown endpoint {self.path}"})
        try:
            req = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            return self._json(200, API[name](req))
        except Exception as e:                                          # surface errors to the UI
            print(f"/api/{name} failed: {e!r}")
            return self._json(500, {"error": str(e)})


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--host", default="127.0.0.1")
    a = ap.parse_args()
    if not up(COMFYUI_URL + "/system_stats"):
        print(f"warning: ComfyUI not reachable at {COMFYUI_URL}. Start it, then reload the app.")
    ensure_proxy()
    print(f"serving {ROOT} on http://{a.host}:{a.port}/  (ComfyUI {COMFYUI_URL}, SDK -> {os.environ['COMFY_BASE_URL']})")
    ThreadingHTTPServer((a.host, a.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
