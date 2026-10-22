# Workflow contract

One section per workflow. The apps only talk to workflows through what is listed here.
Export workflows from ComfyUI with **Save (API format)** and commit the JSON next to this file.

## Template

### `<name>.json`
- **Used by:** studio / adstudio
- **Models:** e.g. LTX-2.5 + IC-LoRA … (open weights? yes/no)
- **Inputs:** node `<id>` `<field>`: image (PNG) / text / number …
- **Outputs:** node `<id>`: MP4 / PNG
- **Render time:** `<seconds>` on `<GPU>` at `<resolution, length>`
- **Notes:**

## Workflows

### Local model discovery and selection
- `GET /api/models`: returns `keyframe`/`video` arrays of `{id, label}` for installed workflow-compatible models, plus `inventory` groups `{category, files}` from the connected ComfyUI. Config/custom-node source files are excluded from model inventory. Supporting models and workflow node classes must exist before a choice is offered.
- `POST /api/keyframe` and `POST /api/shot` accept optional `model` (the catalog ID). Missing IDs use the first compatible installed choice; unsupported/unavailable IDs return HTTP 400 before generation. The selected ID sets the workflow's UNET/checkpoint loader. Discovery downloads nothing and does not imply every listed model has an app workflow.
- Browser methods: `OSH.models()`, `OSH.keyframe(prompt, seed, size, model?)`, `OSH.shot(keys, prompt, duration, seed, model?)`.

Dev set: small + fast, for iterating locally on 12 GB cards (4070 Super; should fit a 3080 with ComfyUI offloading, untested).
Swap to LTX-2.5 + IC-LoRAs on a rented 32 GB+ GPU for final renders.

### `keyframe_zimage.json`
- **Used by:** studio (Generate keyframe, missing keyframes before a shot); available to adstudio
- **Models:** Z-Image Turbo bf16 + Qwen3-4B fp8 text encoder + ae VAE (Apache-2.0, open)
- **Inputs:** node `5` `text` (prompt) · node `8` `seed` · node `7` `width`/`height` (default 768×448)
- **Outputs:** node `10`: PNG
- **Render time:** ~7 s warm, ~18 s cold, 768×448, 8 steps, RTX 4070 Super (2026-10-21)

### `shot_ltxv.json`
- **Used by:** studio (Generate shot); the same pattern works for adstudio's product shots
- **Models:** LTX-Video 2B 0.9.8 distilled + T5-XXL fp8 (open weights)
- **Inputs:** node `3` `text` (motion prompt) · node `7` `length` (frames, 8n+1, 24 fps) · node `14` `noise_seed` · keyframe *i*: image node `5` / `5NN`, guide node `8` / `8NN` (`frame_idx`, `strength`)
  - The file has one keyframe guide. `shared/runtime/api.ts` clones nodes 5/6/8 per extra keyframe (`shotGraph()`) and snaps `frame_idx` to multiples of 8 (last key = `-1`).
- **Outputs:** node `17`: WEBM (VP9)
- **Render time:** ~20 s for 3 s (73 frames) from 2 keyframes; ~32 s for 4 s including generating 2 missing keyframes. 768×448, 8 steps, RTX 4070 Super (2026-10-21)
