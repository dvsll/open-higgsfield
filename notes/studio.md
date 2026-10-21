# studio notes (owner: dvs)

Append dated decisions, render times and requests here. Only the studio owner edits this file; the partner adds requests at the bottom.

## 2026-10-21: local generation works (RTX 4070 Super, ComfyUI 0.41.3)
- Keyframes: Z-Image Turbo, 768×448, 8 steps → ~7 s warm (18 s cold).
- Shots: LTX-Video 2B 0.9.8 distilled, keyframe guides → 3 s clip in ~20 s; 4 s incl. 2 missing keyframes ~32 s.
- Path: Director → serve.py → comfy-sdk 0.5.0 → comfy-api-proxy 0.1.6 → ComfyUI. Rules-compliant (SDK + open models).
- Elements are prompt text only for now (no reference conditioning yet).

## Requests from partner
