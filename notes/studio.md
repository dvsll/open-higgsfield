# studio notes (owner: dvs)

Append dated decisions, render times and requests here. Only the studio owner edits this file; the partner adds requests at the bottom.

## Where we left off (update this before switching agents)
_Last updated 2026-10-21 by Claude Code._

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
