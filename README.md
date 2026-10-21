# Open Source Higgsfield: two entries, one repo (for now)

Two apps for Comfy Org's [Open Source Higgsfield](https://comfy.org/open-source-higgsfield/) competition, built side by side so we can share workflows and the style board. **We split this into two repos before submitting** (see below).

| Folder | What | Owner |
|---|---|---|
| `studio/` | Cinema studio: mood board → keyframes → shots, plus Edit Anything | dvs |
| `adstudio/` | Ad studio: product photo → ads in 3 aspect ratios | partner |
| `shared/` | ComfyUI workflows + contract, comfy-sdk scripts, style board, placeholder renderer | both |
| `archive/` | Concept wireframes and mockups from ideation (frozen) | — |
| `notes/` | One running-notes file per project | each owns theirs |

**Competing for:** Open Weights Only (fully open source) · LTX VFX bonus · Most Innovative. **Rules: [`RULES.md`](RULES.md).**

**Read first:** [`DEADLINES.md`](DEADLINES.md) (dates we must hit) and [`PLAN.md`](PLAN.md) (what to build, in priority order).

## Run locally
The apps open as static pages with placeholders. For **real generation** they need the local runtime in `shared/runtime/`:

```
browser  →  shared/runtime/serve.py (comfy-sdk)  →  comfy-api-proxy :8189  →  your ComfyUI :8188
```

1. Run ComfyUI (any install: Desktop, portable or git) on `127.0.0.1:8188`.
2. Fetch the dev models into its `models/` folder (skips files you already have):
   ```bash
   python shared/runtime/fetch_models.py --models-dir "<ComfyUI>/models" --dry-run
   ```
   Drop `--dry-run` to actually download. Models, licenses and sizes are listed in `shared/runtime/models.json` (~30 GB total).
3. Install the runtime and start it (it also starts `comfy-api-proxy`):
   ```bash
   python -m venv .venv
   .venv/Scripts/pip install -r shared/runtime/requirements.txt
   .venv/Scripts/python shared/runtime/serve.py
   ```
   On macOS/Linux use `.venv/bin/` instead of `.venv/Scripts/`.
4. Open http://localhost:8765/. The Director header shows **● local ComfyUI** when it's connected.

Outputs land in `outputs/` (gitignored). Workflow details and timings: `shared/workflows/CONTRACT.md`.

## Rules that keep the split easy
1. A project only loads files from **its own folder** and **`shared/`** (as `../shared/...`). Never from the other project.
2. Anything both projects use goes in `shared/`. Change it only with a note in both `notes/` files.
3. Each person edits only their own project folder and notes file. Write requests for the other person at the bottom of *their* notes file.

## Splitting into two repos (Oct 28)
Uses [git-filter-repo](https://github.com/newren/git-filter-repo) (`pip install git-filter-repo`). History is kept.

```bash
git clone https://github.com/dvsll/open-higgsfield studio-repo && cd studio-repo
git filter-repo --path studio/ --path shared/ --path notes/studio.md --path LICENSE --path DEADLINES.md
```

For the ad studio, do the same with `--path adstudio/ --path notes/adstudio.md`. Each repo keeps `shared/` next to its app folder, so the `../shared/` paths still work. Then add a project README at the root, set the repo public, and submit.

## License
MIT. See [LICENSE](LICENSE).
