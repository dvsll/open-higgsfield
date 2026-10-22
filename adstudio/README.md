# Ad Studio

Real product-image-to-video development flow using the shared Comfy SDK integration. No simulated video or closed generation APIs.

1. Follow the root README local setup (Node 22.18+, `npm ci`, ComfyUI on 127.0.0.1:8188, models from `shared/runtime/models.json`, and comfy-api-proxy).
2. Run `npm run dev`, then open http://127.0.0.1:8288/adstudio/.
3. Choose a product photo (PNG/JPEG/WebP, up to 10 MB). The browser normalizes it to PNG, at most 1536 pixels per side, flattening transparency onto white.
4. Write a motion brief, choose length, seed and formats, then Generate video. The API stores the reference locally and passes it through SDK assets to the existing LTX guide workflow. Formats render sequentially; successful videos remain available if a later job fails.
5. Preview and download silent WebM files. Keep the tab open during generation. Results and uploads live in gitignored `outputs/`; the current page does not restore results after reload.

Development dimensions: landscape 512×288, vertical 288×512, square 384×384. Each format is a separate render with a center-cropped reference; this is not outpainting. Keep the product centered. Same seeds aid repeatability, but do not guarantee product/label fidelity or matching motion across formats.

Checks: `npm run typecheck`, `npm run build`, and (with dev server running) `node adstudio/scripts/smoke.mjs`. Smoke checks validate real HTTP upload/storage and rejection paths without requiring a GPU; they do not establish video generation success.

Current model is the shared LTX-Video 2B 0.9.8 distilled development workflow. Final LTX-2.5 migration, tagline compositing and MP4 export remain required P0 work. See `notes/adstudio.md` for local verification and blockers.
