# Qwen in the Hero workspace

This milestone connects the existing official Qwen-Image-Edit-2511 FP8 graph to the real application. **Real app Qwen generation is NOT yet verified.** Tests use explicitly mocked inference; no GPU, model download, Runpod provisioning or paid call occurred.

## Data path and changed files

- `adstudio/src/hero-ui.ts`, `brief-ui.ts`, `adstudio/index.html`: explicit Qwen/Z-Image selection, honest availability, primary direction review and collapsed advanced controls. Generate sends the selected reference, original bytes and exact reviewed prompt. Progress uses the existing activity events. No new navigation or redesign.
- `shared/lib/product-brief.ts`: optional concise-v2 prompt/decisions, with the original evidence-rich form and legacy prompt retained. Old v1 drafts/review snapshots stay valid. The model prompt excludes default website narratives, hashes, evidence IDs, notes and repeated review warnings. Selected owner tone/visual guidance and observed facts feed the prompt. Explicit edits to preservation/transformation/composition/background/texture/avoid sections become model-facing overrides; evidence sections remain internal, with physical facts edited in the primary source fields. Direction/section edits invalidate review. Shorter prompts are **not** claimed to improve fidelity.
- `shared/lib/hero-ad.ts`: optional imageModel selector; old projects/takes remain compatible. `adstudio/src/hero-delivery.ts` verifies delivered SHA256/dimensions/reference provenance before creating a take. Existing project repository saves immutable raw output Blobs and keeps previous takes/original assets.
- `shared/runtime/qwen-hero.ts`: source/review validation, pinned workflow/model checks, raw PNG decoding/CRC/executed-workflow validation, immutable source copies and complete local provenance. It has no HTTP-selected mock mode or image fallback.
- `shared/runtime/qwen-sdk.ts`: actual Comfy SDK submit/events/wait/result/SaveImage transport through the existing proxy. One submit, no automatic retry. Failed jobs attempt exact-job cancellation, never a global interrupt.
- `shared/runtime/api.ts`, `client.ts`: additive `/api/hero/qwen`, hero capability metadata and tracked progress. Same serialized generation queue; existing Director APIs remain. Z-Image explicitly rejects Qwen requests rather than treating them as Z-Image.
- `shared/workflows/hero_qwen2511_contract.json`: pinned hashes/sizes/sources for the same three approved FP8 components and existing graph bytes. The benchmark graph, sampler, model weights and Director defaults are unchanged. No new dependency/model.
- `adstudio/scripts/qwen-adapter.test.mjs`: MOCK CPU-only adapter/SDK/client/delivery/project tests. Earlier compiler/regression suites remain.

## Request and validation

`OSH.qwenHero(image, settings, originalDataURL)` calls `POST /api/hero/qwen`. The 20MB bounded JSON body holds an API-owned normalized PNG URL, HeroSettings with `imageModel: 'qwen-fp8'`, reviewed brief and the saved original PNG/JPEG/WebP bytes (up to10MB). Original bytes are used for identity/hash provenance, not automatically enhanced or substituted. The official graph receives the normalized original reference unchanged; its own reference-scaling node remains intact.

The server validates matching source/product/brand IDs, original provenance, current seed, review snapshot, brief/section/decision freshness, and exact model-facing prompt. It hashes both received files against the reviewed draft and copies the validated reference bytes before SDK upload. Hashes attest byte identity, not that the owner-described facts are true or that the original and resized file depict the same product; those remain user review responsibilities.

Availability checks actual `/object_info`, required model names/nodes/options and local file sizes. Before inference, the server streams SHA256 verification of all three pinned files, caching unchanged file fingerprints. Names/file sizes alone are never called hash verification. Configure the models folder for the **same connected ComfyUI** using existing setup or `COMFYUI_MODELS_DIR`. The API must be able to read those weights; a loopback tunnel alone cannot verify a remote filesystem. No model install/download action is exposed here.

Pinned Qwen settings: FP8 editor/encoder/VAE,40steps,CFG4,euler/simple,denoise1,shift3.1,CFGNorm1; only reviewed prompt, seed and output prefix vary. Qwen ignores the legacy Z-Image change-strength field, which is hidden for Qwen. Fidelity/count/angle/crop controls are prompt instructions, **not masks or guaranteed geometry**.

On success, the exact SaveImage bytes are saved to `outputs/<opaque-id>.png`, without retouch, overlays or re-encoding. `outputs/hero-qwen/<provenanceId>/` retains the actual Comfy PNG, original/reference bytes and provenance.json (reviewed draft, both prompt forms, pinned weight hashes, graph/hash, executed graph hash, Comfy job ID and timing). Raw output must have valid PNG chunks/pixels and embedded executed graph matching the expected prompt/seed/model/settings. Missing metadata or mismatches are errors; enable Comfy SaveImage metadata. No failed/corrupt image is published to the project. Failed-job records are kept for diagnosis. If a connection fails, inspect its record/Comfy queue before manually retrying; no automatic inference retry occurs.

## Reproduce the user flow

1. Open `http://127.0.0.1:8301/adstudio/#hero`. Choose saved Brand DNA, product and an **original photograph**. The old demo initially selects a supplied AI edit; switch to its original and set provenance to Original.
2. Choose **Qwen-Image-Edit-2511 FP8**. If unavailable, inspect Model availability / requirements; Generate stays disabled. No silent fallback.
3. Check source description, visible count and arrangement, choose intent, confirm the observations and press **Prepare direction from these inputs**. Correct the short direction if needed, then **Update prompt from edited direction**. Advanced controls/evidence/full and exact model prompts are collapsed but editable. Old full prompts are not silently discarded; explicit preparation creates a separate concise form.
4. Select **Use this reviewed direction**. Any source/product/brand/seed/decision/prompt change requires new preparation/review. The Generate button enables only with a reviewed draft and available selected model.
5. **Only after separately authorizing live inference on a suitable GPU**, click Generate with Qwen. Inspect real loading/queue/sampler/decode/completion or error messages. Compare the raw output with the correct original before approving details. It is not automatically approved.
6. Refresh/switch projects: confirm the raw output, draft, prompt and previous takes remain playable/viewable; download the hero PNG and verify its raw SHA256 against provenance. Generate a second variation only when authorized; the first stays in history.

On an already approved GPU host, run this repository's existing local API/proxy beside ComfyUI with `COMFYUI_URL`, `COMFY_BASE_URL` and `COMFYUI_MODELS_DIR` set to that environment's loopback endpoints/readable models path. Access through an approved SSH loopback tunnel. This milestone does not provision that environment, transfer private photos to it, download weights, or alter its budget/watchdogs.

## Evidence and remaining acceptance

CPU tests cover successful mocked SDK delivery, unavailable nodes/models, stale source/prompt/seed/brand, corrupt/truncated/missing-metadata/wrong-workflow PNGs, interrupted inference, no retries, exact-job cancellation, recovery, original preservation, previous takes, project isolation/serialization and client request shape. Small synthetic files test actual weight verification/cache invalidation; no real30GB pack is read/downloaded in tests. UI history admits only bytes matching the server result and reference provenance.

Real local HTTP smoke: Qwen capability response, intentionally stale POST409 before any inference, activity error, malformed body400 and Hero module delivery. Local evidence/logs: `outputs/qwen-adapter-v1/`. **Browser acceptance NOT RUN**: accessible browser inventory was empty. DOM-independent tests and HTTP smoke are not browser acceptance. Manually verify collapsed controls, direction edits, model switching invalidation, refresh/project isolation, successful real image delivery, missing-file errors and storage-failure warnings.

Remaining GPU gate: connect a separately approved compatible ComfyUI/proxy and readable verified pinned FP8 weights (the current local capability reports unavailable), then run one authorized job **through this application** and inspect actual raw quality, source fidelity, timing and persistence. Prior standalone benchmark success does not prove this new app path end-to-end. PR3 stays draft; Director source and production keyframe/video defaults remain untouched.
