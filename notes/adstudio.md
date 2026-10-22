# adstudio notes (owner: partner)

Append dated decisions, render times and requests here. Only the adstudio owner edits this file; the other person adds requests at the bottom.

## Requests from studio
- 2026-10-21 (Ad Studio P0): additive shared API work planned: bounded PNG product upload to `/api/upload`, plus optional shot width/height for per-ratio LTX renders. Existing Director calls keep their defaults. No new models or dependencies; reuse the documented LTX-Video development workflow. LTX-2.5 migration remains outstanding.
- 2026-10-21 (from studio): the repo now runs on **Vite + TypeScript** (`npm run dev` → http://127.0.0.1:8288) and the generation API is `shared/runtime/api.ts` (Python `serve.py` is gone). `adstudio/index.html` still loads `../shared/lib/kit.js` as a classic script: it works in dev, but `npm run build` can't bundle it. When you get to it, switch the page script to `<script type="module">` and `import '../shared/lib/kit.js'` (it sets `globalThis.K`). The browser client is `shared/runtime/client.ts` (`OSH.keyframe`, `OSH.shot`).


## Where we left off
_Last updated 2026-10-21 by Codex, on feat/adstudio-p0._

**Completed milestone:** replaced the simulated canvas/audio page with a typed product-photo → shared SDK LTX video flow. PNG/JPEG/WebP normalization, reference preview, brief/vibe/seed/2–5 s selection, three exact aspect ratios at low development resolutions, sequential real generation requests, partial-success handling, video playback and individual WebM downloads. No studio/ changes. No dependencies or models added.

**Shared coordination:** additive `/api/upload` endpoint (PNG, decoded 5 MB / 2048px maximum; existing access gate) stores opaque API-owned files. Optional `/api/shot` width/height set latent and guide scale dimensions; existing default 768×448 stays intact. Client methods and workflow contract updated. Dated coordination note added under notes/studio.md → Requests from partner. Added adstudio to TypeScript include list.

**Tests:** installed locked dependencies using npm.cmd ci; npm run typecheck and npm run build PASS. Live `node adstudio/scripts/smoke.mjs` PASS: page served, health response, PNG upload and byte-identical retrieval, malformed/oversized upload rejection, invalid shot image path, empty keyframes/prompt, remote-host denial. No mocked GPU success; browser interaction and real video rendering remain unverified.

**Local infrastructure / blockers:** RTX 3080 10 GB. ComfyUI 0.42.4 now runs on :8188; repo .venv has pinned comfy-api-proxy 0.1.6 on :8189. Both LTX development models installed. Real renders verified in all three formats (see follow-up below). Node v22.14.0 is below repo's declared >=22.18 requirement, though build passed; upgrade before clean-machine validation. PowerShell blocks npm.ps1, so use npm.cmd. Current workflow is LTX-Video 2B, not the required final LTX-2.5.

**Running:** ComfyUI Desktop :8188, foreground repo .venv proxy :8189 and Vite http://127.0.0.1:8288/ (Ad Studio at /adstudio/). API health reports both services online. On future starts Vite can auto-start the proxy from .venv.

**Next steps:** (1) tagline + MP4 export with ffmpeg; (2) real product-photo/browser acceptance test; (3) coordinate LTX-2.5 final workflow on suitable hardware. Results currently live in page memory; files persist in outputs/ but there is no results restoration after reload. Failures expose the shared runtime's generic server error; inspect server logs.

## 2026-10-21: local generation setup follow-up
- ComfyUI Desktop is now installed and running: 0.42.4 / PyTorch 2.12.1+cu130, RTX 3080 10 GB. Models path: C:\Users\osiam\AppData\Local\Comfy-Desktop\ComfyUI-Shared\models. All required LTX nodes exist; checkpoint/encoder lists initially empty.
- Installing existing pinned dependency comfy-api-proxy 0.1.6 into repo .venv (source https://pypi.org/project/comfy-api-proxy/); no requirements change. Proxy listens on loopback :8189, forwards :8188. /api/health now reports both online.
- Downloading only existing shot_ltxv models: LTX-Video 2B 0.9.8 distilled, LTXV Open Weights License, https://huggingface.co/Lightricks/LTX-Video ; T5-XXL FP8 scaled, Apache-2.0, https://huggingface.co/comfyanonymous/flux_text_encoders . Licenses/sources already in shared/runtime/models.json. No image-generator models downloaded.
- Created an original synthetic bottle diagnostic PNG in gitignored outputs/product-test.png; use this for the first real render, explicitly not a product photograph or fidelity benchmark.
- **Real render milestone verified:** `node adstudio/scripts/render-smoke.mjs outputs/product-test.png <ratio>` exercised actual upload → SDK → proxy → ComfyUI → download. Landscape 512×288: 20.6 s first run, output 8acb44a1b2791a9c.webm. Vertical 288×512: 6.7 s warm, 1419aa5d44e03e6d.webm. Square 384×384: 6.7 s warm, f80d8b8e0169cc52.webm. Each is VP9 / 24 fps / 49 frames / 2.042 s, verified with installed FFprobe. First/middle/last frames inspected: bottle remains recognizable; motion is subtle, square develops some side-label artifacts. This is infrastructure proof, not a real-photo fidelity benchmark.
- Build, typecheck and live HTTP smoke tests PASS after setup. No browser automation surface is available, so page interaction/playback remains an acceptance-test gap. Added reusable real-GPU smoke script. Download needed a resumed curl transfer after a network disconnect; final encoder is listed by ComfyUI and loaded successfully. No studio/ changes.
