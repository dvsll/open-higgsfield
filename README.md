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
One Vite + TypeScript dev server runs the whole repo and mounts the generation API. Studio uses React components in `studio/src/react/`; Ad Studio keeps its own frontend. Studio code changes reload the page to keep native media/controller lifetimes consistent, while CSS updates live:

```
browser → Vite :8288 ─ pages (HMR)
                      └ /api, /outputs → shared/runtime/api.ts → @comfyorg/sdk → comfy-api-proxy :8189 → ComfyUI :8188
```

1. Install **Node 22.18+**, then run `npm install` and `npm run dev`.
2. Open http://127.0.0.1:8288/studio/director.html. Click **Local setup** in the header. It opens automatically when the local runtime or video models are missing.
3. Choose a setup path:
   - **Use existing ComfyUI:** start your Desktop, portable or manual instance, enter its local URL (default `http://127.0.0.1:8188`), and connect. Existing models are reused. Enter its actual `models` folder only if you want Studio to download missing packs into it. Studio installs an isolated SDK connector only when needed.
   - **Set up a local instance:** with **Python 3.12/3.13 and Git** available, choose NVIDIA, Apple Silicon or CPU and click **Download & install ComfyUI**. Studio installs pinned ComfyUI v0.41.3 and its dependencies separately under `.runtime/`, binds it to loopback, and saves the selected release/connection locally. Existing ComfyUI installations are left alone. AMD/Intel users can install [ComfyUI Desktop](https://www.comfy.org/download), then use the existing-instance path.
4. Select only the model packs you want. The setup screen lists missing file sizes, licenses and sources, and shows actual download bytes. Video needs roughly **11.5 GB**; image and audio packs are optional. Interrupted model downloads resume; complete files are reused; incomplete existing files are reported without overwriting them.
5. Generate after setup completes. **Downloading**, **installing**, **preparing models**, **generating** and **encoding** are separate statuses. First-time model loading can take minutes. The generation counter only labels a stage as generation when the runtime reports it; an older proxy without detailed progress gets an explicit coarse-progress message.

The **Local setup** button stays available for reconnecting, changing models folders, starting the managed runtime, and downloading additional packs. Setup operations are only available from this computer and the app’s own origin; remote shared viewers cannot install software or write model files. Setup and generation cannot change the runtime underneath one another.

Connection settings live in gitignored `outputs/runtime-config.json`; optional managed software is in gitignored `.runtime/`. The setup does not rewrite `.env`. The managed runtime starts again with the dev server after a successful install.

Manual fallback remains supported:
```bash
pip install -r shared/runtime/requirements.txt
npm run models -- --models-dir "<ComfyUI>/models" --only shot_ltxv --dry-run
```
Drop `--dry-run` to download. The CLI and setup UI use the same resumable model downloader. Environment overrides remain documented in `.env.example`. Runtime installer sources and licenses are recorded in [Studio notes](notes/studio.md).

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

## Studio URLs

Studio uses `/studio/director`, `/studio/edit` and `/studio/design-lab`. Dev and `npm run preview` serve these routes and redirect old `.html` links while preserving query strings. Other production hosts must map those three clean paths to their corresponding built `.html` files (and redirect old URLs); do not send unknown/API paths to the Director. Source HTML files remain Vite build entry points.

## Optional local prompt helper

Studio starts with one expanding Prompt box. In simple view, auto-fill uses the main prompt after a pause in typing, and Generate waits for current details. Expand **Advanced** to inspect the video model, generated video/motion/audio prompts and audio controls. Advanced pauses automatic rewriting: **Polish prompt** sends the current boxes back to the local helper and returns its result for review, without generating media. Edit the result, polish again, or press **Generate video** to send the reviewed boxes directly, skipping the rewriter. Edits made during polishing are preserved. Turn off **Auto-fill in simple view** to use manual prompts without the helper. Rewriting never starts image/video/audio generation itself.

On Windows x64, explicitly install the helper from the repo root:

```powershell
powershell -File shared/runtime/install-prompt-rewriter.ps1
```

This downloads the pinned [llama.cpp CPU runtime](https://github.com/ggml-org/llama.cpp/releases/tag/b11669) (MIT, about20MB) and [Qwen2.5-1.5B-Instruct Q4_K_M](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF) (Apache-2.0, about1.12GB), checks SHA256, and stores them in ignored `.runtime/prompt-rewriter/`. It runs on CPU at loopback11435 with a per-process API key, starts on demand and exits after two idle minutes or server shutdown. No weights enter Git, no cloud API is used, and generation does not download anything. Non-Windows setups may place a compatible `llama-server` at `.runtime/prompt-rewriter/bin/llama-server` and the same GGUF at `.runtime/prompt-rewriter/model.gguf`.

Model-generated details are suggestions. Expand Advanced to review them; a small local model can misunderstand a prompt. Missing/failed rewriting shows an error and preserves authored text, with manual mode available.

## License
MIT. See [LICENSE](LICENSE).
