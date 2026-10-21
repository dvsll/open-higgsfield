# shared/

Used by both `studio/` and `adstudio/`. When we split the repo, this folder is copied into both repos.
Change it only with a dated note in **both** `notes/studio.md` and `notes/adstudio.md`.

| Folder | What |
|---|---|
| `workflows/` | ComfyUI workflows in **API format** (`*.json`), plus `CONTRACT.md` listing each one's input/output node IDs |
| `scripts/` | comfy-sdk runner(s): run a workflow from the CLI, get files back |
| `styleboard/` | Shared looks (`looks.js`): palette, sky, tint, swatches. Studio's mood board reads it. |
| `lib/` | `kit.js` / `kit.css`: the in-browser placeholder renderer the mockups use. Remove from an app once it shows real outputs. |
