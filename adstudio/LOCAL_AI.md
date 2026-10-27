# Local AI background generation — verified 2026-10-27

The existing Product-safe workflow is retained. **Automatic** now prefers a
verified, admitted **FLUX.2 Klein 4B FP8** background engine. The original product
photograph stays in a separate frame; only the surrounding image is generated.
Klein does not edit or relight the product in this adapter. Typography stays in
the existing deterministic compositor. Explicit AI selection never silently falls
back; Automatic uses Product-safe when AI is unavailable.

## Installed and exercised

- Official distilled FP8 checkpoint, Apache-2.0:
  https://huggingface.co/black-forest-labs/FLUX.2-klein-4b-fp8
- VAE from the Apache-2.0 Comfy-Org Klein pack. Newly downloaded total:
  **4,406,835,812 bytes** (checkpoint 4,070,624,520; VAE 336,211,292).
- Reused Qwen3 4B FP8 mixed encoder: 5,631,994,051 bytes. Total components:
  10,038,829,863 bytes. No additional inference dependencies or competing packs.
- Pins, revisions, sizes and SHA256: `shared/workflows/klein4b_fp8_contract.json`.
  Native loader type `flux2` selects Klein's encoder/tokenizer for the detected
  Qwen3 4B architecture (2,560-wide embeddings, 36 layers, outputs 9/18/27).
  Compatibility was verified in installed Comfy source and real inference.
- Native ComfyUI 0.42.4, PyTorch 2.12.1+cu130, RTX 3080 10 GB. The graph derives
  from the official distilled [Comfy workflow](https://docs.comfy.org/tutorials/flux/flux-2-klein):
  512×640, Euler, CFG 1, four steps, native dynamic offloading. No custom node.

Three genuine local jobs completed through the production SDK adapter (one diagnostic and two controlled browser runs):

| Job | Native execution | SDK submission/output interval | Whole application |
| --- | --- | --- | --- |
| Initial background diagnostic | 7.446 s | 10.538 s | 17.362 s including pin verification |
| Initial Hero browser submission | 4.557 s | 6.843 s | 17.832 s click to completed advertisement |
| Final clean browser acceptance | 5.023 s | 6.760 s | 23.078 s click to completed advertisement |

Observed peak **total GPU usage**, including other desktop allocations: 9,305 MiB
in the first diagnostic and 9,434 MiB during initial browser acceptance (9,426 MiB in the final clean run), out of 10,240 MiB.
The first job started with about 4.7 GiB free VRAM. These are not model-only memory
requirements or universal performance promises. Admission requires a readable,
compatible queue, 3.5 GiB free/reclaimable VRAM and 4 GiB free RAM. Lower-headroom
performance has not been established. Unrelated applications are never stopped.

## Workflow and safeguards

`AdApplication.generate` → selected Klein engine → reviewed source/plan/seed
binding → `/api/hero/background` → Comfy SDK → existing proxy → ComfyUI.
The approved concept's setting, lighting and palette compile into a reviewable
background-only prompt. No product photo is sent to inference. The original and
normalized source hashes remain bound to the project, receipt and provenance.

Availability requires file sizes/SHA256, native workflow schema, runtime/GPU proof
from a completed real job, empty queue and resource headroom. Merely finding model
names never unlocks it. Admission repeats inside shared serialization. Each reviewed
background receipt can submit once; duplicate returns409. Ten-minute execution
deadline, exact-job cancellation, existing progress display and explicit Cancel
control; no retries or global interrupt. Normal Comfy model-cache release occurs
only if our own finished job is still last and the queue is empty. This avoids
retained native allocations making the next admission appear permanently busy.

Raw PNG CRC/decompression, exact executed-prompt metadata and 512×640 dimensions
are verified. Raw output, workflow, pins and project/source binding are retained
under `outputs/hero-klein/<id>/`. Project history stores the raw background as a
separate Blob plus hashes, model, prompt, seed and job identity. Composition/export
uses that saved plate; editing never reruns the model. Historical exports continue
using the original photo instead of nesting a completed advertisement inside another.
No IndexedDB version/origin change.

Private setup: `ADSTUDIO_KLEIN_MODELS_DIR` points to the existing shared Comfy models
folder; it does not change Director's setup. `install-klein.py --models-dir <folder>`
performs read-only verification. Add `--install` only when authorizing the two
pinned public downloads. A missing existing encoder, wrong existing file or partial
download stops safely; no model collection is downloaded automatically.

## Actual browser and image evidence

An authorized fresh isolated Chrome profile at `http://127.0.0.1:8301/adstudio/`
imported the cookie JPEG, developed and explicitly reviewed its facts/direction,
selected Klein, submitted **one** real background job, saved both takes, edited,
downloaded and reloaded. Actual IndexedDB checks retained original/normalized and
background hashes, model choice and export history. The owner's profile was not
opened. This is isolated automated acceptance, not owner approval of the ads.

Visual review caught a genuine defect: editorial's opaque full-frame rectangle hid
the otherwise valid AI background. The initial two exports were identical despite
successful inference. The Klein-only backdrop is now translucent. Saved assets
were re-exported in the same isolated profile, without additional inference:

- A: **Product-safe**, 1080×1350, SHA256
  `9e25a397fda79d8ebda5a87e477f91a4c994f0d50d9f9661392fd7e579bbd842`.
- B: **AI-assisted**, 1080×1350, SHA256
  `2ec84f356eafb61c2512aa74160ba6580743d09522d7814e6ef970a43faba7b1`.
- Baseline stayed byte-identical. The rendered foreground ROI is pixel-identical
  between A/B; 987,993 canvas pixels differ outside it. This proves preservation
  between these rendered layouts, not original-resolution identity after scaling.
- Final raw application background: `outputs/9c6a9ac97c68c409.png`, job
  `2a7a7854-b9fb-46c9-8fe7-9d321af0ece1`, seed42. Native history shows
  no cached nodes; four-step generation completed successfully.
- Final clean-run PNGs, comparison HTML, progress/result screenshots and full
  browser/IndexedDB receipt: `outputs/local-ai-browser-2026-10-27T11-45-12-845Z/`.
  A fresh isolated profile repeated the complete repaired journey with one real
  job. Its exported PNG hashes match the corrected re-export above exactly.
- Correction-only re-export and pixel assessment:
  `outputs/local-ai-browser-corrected-2026-10-27T11-23-57-901Z/`.
- Original UI submission/persistence receipt and screenshots:
  `outputs/local-ai-browser-2026-10-27T11-18-03-187Z/`.
- Timing, native history, VRAM, install, failure/fix and preservation receipts:
  `outputs/local-ai-20261027/`. Pre-fix outputs remain intact for audit.

The plate is coherent and free of invented products or lettering. All four cookies,
chips, tray and original tabletop remain unchanged in the framed photograph.
The photograph retains its phone-photo lighting; this is **not seamless placement
or generated premium product photography**. The example uses a manual test brand
and name lockup, not an approved branded campaign or custom logo treatment.
Owner visual approval is pending. No cloud service, paid inference or private
remote upload occurred.

## Regression status and remaining review

Typecheck/build, **69 JS files including24 Director suites**, and five CPU media
scripts pass. New coverage includes background submission/cancel contracts,
integrity/review binding, all nine layout/ratio combinations, cache-independent
source history, model choice/persistence and explicit unavailable-AI behavior.
`npm run test:local-ai` is CPU-only; `local-ai-browser.mjs` is the explicitly live
isolated test and must not be included in unattended CPU suites.

Qwen remains optional/missing weights. Its existing LF workflow pin now tolerates
CRLF normalization only; semantic edits and weight changes still fail. Remote
Qwen relay availability uses its remote admission rather than local VRAM. No
Director source changes were authored; current shared main was merged into the
Ad Studio feature branch. PR3 was already merged when inspected, so new work needs
a new draft PR, never an automatic merge.

Owner check: refresh8301, open an authorized product, Develop → review → choose
Automatic or Klein → Generate ad → inspect original/background/layout → edit and
Export PNG. Product-safe remains available without ComfyUI. Inspect quality and
approve the advertisement personally before using it publicly.
