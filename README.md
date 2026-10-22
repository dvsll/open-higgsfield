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
One Vite + TypeScript dev server runs the whole repo (studio, adstudio, archive) with hot reload, and mounts the generation API:

```
browser → Vite :8288 ─ pages (HMR)
                      └ /api, /outputs → shared/runtime/api.ts → @comfyorg/sdk → comfy-api-proxy :8189 → ComfyUI :8188
```

1. **Node 22.18+** and `npm install`.
2. Run ComfyUI (any install: Desktop, portable or git) on `127.0.0.1:8188`.
3. Fetch the dev models into its `models/` folder (skips files you already have; ~30 GB, list in `shared/runtime/models.json`):
   ```bash
   npm run models -- --models-dir "<ComfyUI>/models" --dry-run
   ```
   Drop `--dry-run` to actually download.
4. Install the Comfy API proxy once (the only non-Node piece; it's a pip tool the dev server starts for you):
   ```bash
   pip install -r shared/runtime/requirements.txt
   ```
   Or put it in a `.venv` at the repo root, or point `COMFY_API_PROXY` in `.env` at it.
5. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://127.0.0.1:8288/. The Director header shows **● local ComfyUI** when generation is available.

Other scripts: `npm run typecheck`, `npm run build` (to `dist/`), `npm run preview`.
Outputs land in `outputs/` (gitignored). Workflow details and timings: `shared/workflows/CONTRACT.md`.

### Security
- ComfyUI and the proxy only listen on `127.0.0.1`. Only Vite is ever exposed.
- `/api` works from localhost only. From any other host it needs `OSH_TOKEN` (set in `.env`, never committed). Share links as `https://<host>/?token=<OSH_TOKEN>`; that sets an HttpOnly cookie and strips the token from the URL.
- Vite only answers hostnames listed in `OSH_ALLOWED_HOSTS` and refuses to serve `.env*`, keys, `.git`, `.venv`, `.claude`.
- Inputs are validated; generation/export JSON is capped at 64 KB. PNG upload JSON is capped at 8 MB (5 MB decoded image, dimensions at most 2048×2048). Jobs run one at a time (max 4 queued), and `/outputs` serves API-owned PNG/WebM/MP4 files. Optional Ad Studio MP4 export uses local FFmpeg with a 90-second timeout; set `FFMPEG_PATH` in `.env` if it is not on PATH.
- To share: copy `.env.example` to `.env`, set `OSH_HOST=0.0.0.0`, `OSH_ALLOWED_HOSTS` and a long random `OSH_TOKEN`, then `npm run dev`.

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
