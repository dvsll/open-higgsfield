"""Download the models listed in models.json into a ComfyUI models/ folder (skips files that exist).

Usage:  python shared/runtime/fetch_models.py --models-dir "C:/path/to/ComfyUI/models" [--only shot_ltxv] [--dry-run]
"""
import argparse
import json
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--models-dir", required=True, help="ComfyUI models folder")
    ap.add_argument("--only", help="only models used by this workflow name")
    ap.add_argument("--dry-run", action="store_true", help="list what would be downloaded")
    a = ap.parse_args()
    root = Path(a.models_dir)
    todo = [m for m in json.loads((HERE / "models.json").read_text())["models"] if not a.only or m["used_by"] == a.only]
    for m in todo:
        dst = root / m["file"]
        if dst.exists():
            print(f"have  {m['file']}")
            continue
        print(f"get   {m['file']}  ({m['size_gb']} GB, {m['license']})")
        if a.dry_run:
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        tmp = dst.with_suffix(dst.suffix + ".part")
        with urllib.request.urlopen(m["url"]) as r, open(tmp, "wb") as f:
            total, done = int(r.headers.get("Content-Length", 0)), 0
            while chunk := r.read(1 << 22):
                f.write(chunk)
                done += len(chunk)
                print(f"\r      {done / 1e9:.2f}/{total / 1e9:.2f} GB", end="")
        tmp.rename(dst)
        print()


if __name__ == "__main__":
    main()
