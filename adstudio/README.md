# Ad Studio

Real product-image-to-video development flow using the shared Comfy SDK integration. No simulated video or closed generation APIs.

1. Follow the root README local setup (Node 22.18+, `npm ci`, ComfyUI on 127.0.0.1:8188, models from `shared/runtime/models.json`, and comfy-api-proxy).
2. Run `npm run dev`, then open http://127.0.0.1:8288/adstudio/.
3. Choose a product photo (PNG/JPEG/WebP, up to 10 MB). The browser normalizes it to PNG, at most 1536 pixels per side, flattening transparency onto white.
4. Write a motion brief, choose length, seed and formats, then Generate video. The API stores the reference locally and passes it through SDK assets to the existing LTX guide workflow. Formats render sequentially; successful videos remain available if a later job fails.
5. Preview and download silent WebM files. Enter an optional tagline before generation, then use **Export MP4** on a card or **Export all MP4s**. Each exported video gets a download link and becomes the card's preview. Taglines are baked into the MP4; originals stay available as WebM. Keep the tab open during generation. Results and uploads live in gitignored `outputs/`; the page does not restore results after reload.

MP4 export needs FFmpeg with libx264. Install it on PATH or set `FFMPEG_PATH` to the executable in your gitignored `.env`, then restart Vite. This machine uses `C:/ffmpeg/ffmpeg-9.0.1-essentials_build/bin/ffmpeg.exe`. Export is local CPU postprocessing, queued with other work and capped at 90 seconds. A missing executable produces a setup message without losing the generated WebM.

Development dimensions: landscape 512×288, vertical 288×512, square 384×384. Each format is a separate render with a center-cropped reference; this is not outpainting. Keep the product centered. Same seeds aid repeatability, but do not guarantee product/label fidelity or matching motion across formats.

Checks: `npm run typecheck`, `npm run build`, and (with dev server running) `node adstudio/scripts/smoke.mjs`. Smoke checks validate real HTTP upload/storage and rejection paths without requiring a GPU; they do not establish video generation success.

Current model is the shared LTX-Video 2B 0.9.8 distilled development workflow. Final LTX-2.5 migration remains required P0 work. Real-photo fidelity and browser acceptance testing are still pending. See `notes/adstudio.md` for local verification and blockers.

Verified locally on RTX 3080 10 GB / ComfyUI 0.42.4: real SDK/proxy renders of an original synthetic bottle in all three formats, 49 frames at 24 fps. Landscape first run 20.6 s; vertical and square warm runs 6.7 s each. This verifies infrastructure, not real-product fidelity. Optional GPU check: `node adstudio/scripts/render-smoke.mjs <your-normalized-photo.png> 16:9` (also 9:16 or 1:1). It writes diagnostics under outputs/ and generates a real video.

Optional real export check: `node adstudio/scripts/export-smoke.mjs /outputs/<generated-hex>.webm [overlay.png]`. All three formats were exported to H.264/yuv420p MP4, preserving 49 frames at 24 fps; transparent diagnostic tagline overlays were visually checked. The browser's canvas text renderer still needs browser acceptance testing.
