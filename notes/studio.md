# studio notes (owner: dvs)

Append dated decisions, render times and requests here. Only the studio owner edits this file; the partner adds requests at the bottom.

## Where we left off (update this before switching agents)
_Latest work 2026-10-22 by Codex:_ built compact image/video chooser dialogs with per-model estimate ranges, capability chips and hover/focus usage help. Removed the chip scrollbar per screenshot feedback; remaining page scrollbars are thin/dark. Capability clicks select the corresponding model and focus its input (or open the shot timeline). Added separate Shot prompt (`s.prompt`) and Motion prompt (`s.m`) fields; combined text reaches the existing LTX prompt. Image prompt remains separate. Capability metadata controls field visibility; unavailable JSON posing/LoRA controls are not offered as functional inputs. Renamed visible Stylemaxxer to Stylization and Style fit to Palette match; existing variation search remains prompt/palette based.

**Tests:** build/typecheck, estimate scaling/cap tests, shared client compatibility, and live HTTP smoke pass. Browser verified chooser layout, capability help and Motion prompt focus. Local test server at http://127.0.0.1:8292 (session 31172), ComfyUI/proxy :8188/:8189 connected. Live browser generation of four keyframes passed; the image estimate adapted from 7–20s to 4–11s/image using four local observations. `GET /api/models` now adds capability/timing metadata and a separate `research` list without changing generation request signatures. Timings use prior 4070 measurements and learn from successful browser renders; defaults are estimates, not promises.

**Assets:** Tiny-SD complete (1.06 GB), 40 CC0 original/sketch images + captions complete (16 train and 4 holdout subjects, paired variants kept in the same split), hashes/revisions in `outputs/lora-lab/manifest.json`. Small-SD download continues in session 44179. Downloader is resumable by validated files/chunks, with parallel ranged transfers and final LFS hash checks. No training run or training-dependency installation yet. `studio/LORA-LAB.md` documents the bounded experiment and compatibility limits; research models are not runnable app choices.

_2026-10-22 test-asset decision before downloads:_ Segmind Tiny-SD and Small-SD, CreativeML OpenRAIL-M, https://huggingface.co/segmind/tiny-sd and https://huggingface.co/segmind/small-sd . Compact Diffusers research/training bases; their pruned architectures are not interchangeable with normal SD1.5 checkpoints, so they will not be advertised as runnable in the current Comfy workflows. Training source: https://github.com/segmind/distill-sd . Image test set: HugGAN Smithsonian butterfly lowres (dataset declares CC0-1.0), https://huggingface.co/datasets/huggan/smithsonian-butterfly-lowres . Download a small original/sketch subset with held-out examples, captions and hashes. This is a bounded adapter-learning test, not evidence of general artistic-style transfer. No training dependencies are being added in this step. Assets go under gitignored outputs/lora-lab/; no model files are committed.
_Last updated 2026-10-21 by Codex._

**Latest — Ad Studio merge:** user requested merging `origin/feat/adstudio-p0` (through `d610772`) into main. Resolved shared API/client/contract and adstudio-note conflicts by retaining model discovery/selection together with PNG upload, optional shot dimensions, and MP4 export. `OSH.shot` fifth argument accepts model ID or size/model options, preserving both apps' call sites. Added `adstudio/scripts/client-compat.mjs`; smoke test supports `OSH_TEST_URL` for testing a separate server.

**Merge validation:** typecheck/build pass (the previous adstudio classic-script warning is now fixed by the branch). Client compatibility regression, live HTTP smoke, 22-model discovery and real MP4 export pass on the merged server at http://127.0.0.1:8290. Port 8288 is occupied by an older server; the prior Codex server session 63561 exited during reload with a port conflict. Test server session 4971 uses :8290; local ComfyUI/proxy remain :8188/:8189. Live SDK shot checks exercise Director defaults and vertical Ad Studio dimensions. Product-fidelity limits and browser acceptance gaps documented by the partner remain open; merging is not an acceptance signoff. No new dependencies/models.

**Current session — local model selection:** attached to the already-running ComfyUI on 127.0.0.1:8188. Director has persistent keyframe/video selectors and a refreshable inventory (22 model files in 9 categories reported by ComfyUI). Only installed, workflow-compatible models with supporting models/nodes present can generate: currently Z-Image Turbo and LTX-Video 2B distilled. Other files are visible in the inventory; arbitrary architectures need their own workflow integration. No models or dependencies downloaded/added. Selectors apply to direct generation, missing keyframes, and Stylemaxx. New typed UI module: `studio/src/models.ts`.

**Shared runtime change (2026-10-21):** `GET /api/models` reads ComfyUI `/models` + `/object_info`; optional `model` on keyframe/shot POST is validated against the installed compatible catalog and set on the workflow loader. Existing callers still use installed defaults. Proxy health now uses `/api/v2/health`, and refresh can reconnect/start the proxy when ComfyUI becomes available later. Generation still goes through SDK → proxy → ComfyUI.

**Current validation/running:** Vite running at http://127.0.0.1:8288 (Codex process session 63561), ComfyUI :8188 and proxy :8189 both healthy. Typecheck/build pass (existing adstudio classic-script warning remains). Browser verified selectors and 22-file inventory count. Live selected-model API render: 256×256 keyframe in 20.7s (`outputs/c4fd937ba045c469.png`); one-second/25-frame shot in 15.9s (`outputs/553da7528965b16c.webm`). Unsupported model selection returns HTTP 400 before generation. Outputs remain gitignored.

**Latest handoff:** pulled origin (main already current at Claude's `36f242a`). Claude also shipped Stylemaxxer, style selector/maker, Elements wall, and generation history. Fixed video history targeting: takes now follow stable shot IDs through reorder/stash/trash, and selecting a take updates the opened shot and clears the old keyframe selection. Existing history migrates by matching the current video URL; older ambiguous entries remain unavailable rather than targeting the wrong shot. IDs/migration persist on page initialization. No dependencies added.

**Previous session validation:** `npm run typecheck` and `npm run build` passed; no browser/GPU validation for the stable shot-history identity fix in that session.

**Next:** finish per-shot/per-keyframe versions and structural undo/redo below; generation history is available but is not a complete version model. Older history without a recoverable shot identity cannot safely be reassigned automatically.

**State:** the Director runs real generation locally. Z-Image keyframes take ~7 s; LTX-Video 2B shots take ~20–30 s on the 4070 Super.
Done today:
- Shared sidebar + selected-media hop between Director and Edit Anything
- AE-style sequence: double-click a shot to open it alone, double-click/Esc to exit
- "Press Generate" empty state with an arrow
- Stash tray + discreet 🗑 trash
- Rename shots (click the title / F2)
- Playback starts paused and stops at the end
- No rounded corners
- Moved to Vite + TypeScript (port 8288, HMR); Python serve.py replaced by `shared/runtime/api.ts` (TS SDK) with token-gated sharing

**Next up (suggested, in order):**
1. Versions/takes: keep every generated video per shot and every keyframe version, and pick the active one. Plus linear undo/redo (Ctrl+Z) for structural edits. (Agreed direction; not built.)
2. Element consistency: elements are only prompt text today. Try Qwen-Image-Edit 2511 (already downloaded) with reference images of Mia/Bolt for keyframes.
3. Real Edit Anything on keyframe images (Qwen-Image-Edit 2511 or LTX In-Outpainting), replacing the placeholder edits.
4. Export the sequence as one MP4 (ffmpeg concat of the shot webms).

Check `DEADLINES.md`:
- Oct 22: concept lock + Discord question
- Oct 23: first real render ✅ (done early)
- Oct 24: walking skeleton

## Local machine (dvs)
- ComfyUI Desktop install: `C:\Users\dvs\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI` (models in `C:\Users\dvs\AppData\Local\Comfy-Desktop\ComfyUI-Shared\models`).
- Start it headless (if Desktop isn't open), from that folder:
  `.venv\Scripts\python.exe main.py --listen 127.0.0.1 --port 8188 --extra-model-paths-config "C:\Users\dvs\AppData\Roaming\Comfy Desktop\instance-model-paths\inst-1792339149905.yaml" --disable-auto-launch`
- Then from the repo: `npm run dev` (Vite on 8288; starts comfy-api-proxy from `.venv` automatically).
- GPU: RTX 4070 Super 12 GB. Partner: RTX 3080.

## 2026-10-21: local generation works (RTX 4070 Super, ComfyUI 0.41.3)
- Keyframes: Z-Image Turbo, 768×448, 8 steps → ~7 s warm (18 s cold).
- Shots: LTX-Video 2B 0.9.8 distilled, keyframe guides → 3 s clip in ~20 s; 4 s incl. 2 missing keyframes ~32 s.
- Path (since 2026-10-21 evening): Director → Vite /api (shared/runtime/api.ts) → @comfyorg/sdk 0.5.0 → comfy-api-proxy 0.1.6 → ComfyUI. Rules-compliant (SDK + open models).
- Elements are prompt text only for now (no reference conditioning yet).

## Requests from partner
- 2026-10-21 (Ad Studio P0): adding `/api/upload` for bounded PNG product images and optional shot width/height for per-ratio generation. Existing shot defaults and Director calls stay compatible. Reusing the current SDK/proxy/LTX workflow; no studio files changed. See notes/adstudio.md for verification and blockers.
- 2026-10-21 (Ad Studio P0 export): adding `/api/export` for API-owned WebM + optional PNG tagline overlay → local FFmpeg H.264 MP4. Adding MP4 output serving and OSH.exportVideo; generation routes unchanged. Existing installed FFmpeg GPLv3 build, no package/model changes; FFMPEG_PATH config documented. Verification tracked in notes/adstudio.md.
- 2026-10-21 (Ad Studio verification): real SDK→proxy→LTX-Video 2B renders passed on partner RTX 3080 10 GB in all three formats. Added local FFmpeg MP4 export verified with/without transparent overlays; SDK generation defaults retained, shot image validation tightened to PNG. Build/typecheck/HTTP checks pass. No studio/ files changed. Final LTX-2.5 workflow remains pending coordination.
- 2026-10-21 (Ad Studio acceptance/review): shared API review package is adstudio/SHARED_API_REVIEW.md for draft PR #1. No new shared code or workflow changes in this milestone; fallback hash recorded there. Pastry API/media tests passed but texture/motion fidelity is limited; browser and printed-brand acceptance remain blocked. Ad Studio-only fit-reference option addresses observed center-crop subject loss; existing crop behavior retained. Please review optional shot dimensions, PNG key validation and export queue compatibility before merging shared changes.
