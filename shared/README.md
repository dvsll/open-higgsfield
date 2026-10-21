# shared/

Used by both `studio/` and `adstudio/`. When we split the repo, this folder is copied into both repos.
Change it only with a dated note in **both** `notes/studio.md` and `notes/adstudio.md`.

| Folder | What |
|---|---|
| `workflows/` | ComfyUI workflows in **API format** (`*.json`), plus `CONTRACT.md` listing each one's input/output node IDs |
| `runtime/` | **Generation API + tooling** (TypeScript): `api.ts` (Vite plugin: `/api/keyframe`, `/api/shot`, `/outputs`, via `@comfyorg/sdk`), `client.ts` (browser side), `models.json` + `fetch-models.ts` (`npm run models`), `requirements.txt` (only `comfy-api-proxy`) |
| `scripts/` | Extra CLI helpers (none yet) |
| `styleboard/` | Shared looks (`looks.js`): palette, sky, tint, swatches. Studio's mood board reads it. |
| `lib/` | `kit.js` / `kit.css`: the in-browser placeholder renderer the mockups use. Remove from an app once it shows real outputs. |
