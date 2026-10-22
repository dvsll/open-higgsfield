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

**Local infrastructure / blockers:** RTX 3080 10 GB detected. Node v22.14.0 is below repo's declared >=22.18 requirement, though build passed; upgrade before clean-machine validation. PowerShell blocks npm.ps1, so use npm.cmd. Neither ComfyUI :8188 nor proxy :8189 is running. User confirmed ComfyUI is not installed yet and will report when ready. Do not download large models or rent GPUs without further setup direction. Current shared workflow is LTX-Video 2B, not the required final LTX-2.5. No render time claimed on this machine.

**Running:** Vite dev server started on http://127.0.0.1:8288/ (Ad Studio at /adstudio/); it reports ComfyUI unavailable. After installing ComfyUI and proxy, restart Vite so proxy auto-start runs, then Check connection in Ad Studio.

**Next steps:** (1) verify ComfyUI nodes/models and proxy, render one owned product photo at 512×288 / 2 s, check actual downloaded WebM and record timing; (2) render vertical and square, assess reference fidelity and 10 GB GPU memory; (3) tagline + MP4 export with ffmpeg; (4) coordinate LTX-2.5 final workflow on suitable hardware. Results currently live in page memory; files persist in outputs/ but there is no results restoration after reload. Failures expose the shared runtime's generic server error; inspect server logs.
