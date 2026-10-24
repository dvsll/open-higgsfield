# Cross-project engineering handoff

2026-10-24. Owners: Cinema/Director `studio/` (dvs), Ad Studio `adstudio/` (partner). Both now publish on `main`; fetch/reconcile before pushing, never force-push. Keep each application independent: own folder plus `shared/`, separate project identities/storage. No cloud permission is inherited from another owner's benchmark.

## What was reconciled

Ad Studio through6f6b29b and Studio through eb57686 are retained. Four initial conflicts: `shared/runtime/api.ts` keeps the prompt-rewriter argument and Qwen relay; `client.ts` unions caption/Qwen progress tracking and both methods; `CONTRACT.md` and `notes/studio.md` retain both additions. The concurrent eb57686 Comfy-native prompt change was then reconciled, with one notes-only conflict. No Studio application edits were authored by Ad Studio.

Existing shot model-string/options, explicit frames/FPS and new optional text-device settings coexist with audio, captions, precision edit, brand, composition, product-video and Hero routes. API signatures are additive. Qwen accepts optional project metadata; existing three-argument SDK calls remain valid. Only the paid acceptance gate requires the exact reviewed project/brand/source binding.

Fresh-checkout testing caught a real pin defect: Qwen graph pin b77823... described a CRLF working file, while Git/archive and existing `.gitattributes` use LF. Corrected to SHA2568dc8cda519f67c812b77543990d14adb647ff413f92423718bf889515bed1bd6. Workflow graph content/sampler/models are unchanged; strict byte validation remains. Regression checks the actual Git blob, not just one working copy. Runtime requirements and official upstream workflow pins also match their tracked bytes.

## Ad Studio patterns available to Cinema

| Pattern | Reusable boundary | Important limit |
|---|---|---|
| Source-grounded provenance | `shared/runtime/qwen-hero.ts`, `qwen-sdk.ts`; `adstudio/src/hero-delivery.ts` | Records original/reference/model/workflow/prompt/seed/job/output hashes and timings; CRC/pixel/executed-graph checks do not establish visual fidelity. Adapt records to keyframes/Elements/takes without importing Ad Studio UI or its DB. |
| Reviewed decisions | `shared/lib/product-brief.ts`, `adstudio/src/brief-ui.ts` | Separates observations, sourced brand evidence, suggestions and exact model instructions; changed inputs invalidate review. Source facts are manually confirmed, not machine vision. Use analogous identity/revision binding for characters/scene references. |
| Capability honesty | Qwen availability + pinned weights; `shared/runtime/model-catalog.ts`, `client.ts` | Distinguish names/nodes/file sizes from hash verification and successful inference. Missing/incompatible Qwen never substitutes Z-Image/finishing. Apply the same rule to editing/reference/video features. |
| Bounded remote sessions | `qwen-app-session.ts`, `qwen-relay.ts`, `adstudio/benchmark/qwen-{guard,app-monitor,app-ssh}.py` | Separate explicit approval, exact Pod, independent heartbeat/deadline/cost cap, one-job receipts, durable local collection and verified DELETE404. No implicit cloud authorization. PC loss may sacrifice uncollected results to preserve cleanup. |

## Cinema patterns available to Ad Studio

| Capability | Existing paths | Reuse / actual limits |
|---|---|---|
| React view/service separation | `studio/src/react/{boot,render,popup}.tsx`, `panel-lifecycle.ts`; `notes/design/studio-react-architecture.md` | Typed view models, one root per host, explicit startup errors, shared modal focus/Escape/backdrop handling and busy guards. Services own media/state; views own controls. Copy small patterns locally, never import Studio controllers/docking or its registry. Current controller lifetimes require full reload; cleanup is not yet universally remount-safe. |
| History and project interaction | `edit-history-tree.ts`, `projects.ts`, `react/{history,projects}.tsx` | Explicit restore/undo, source identity and isolated stores. Do not share project IDs/namespaces or duplicate the whole registry. |
| Masked Z-Image editing | `shared/runtime/precision-image.ts`, API `/api/precision-image`, `shared/workflows/precision_zimage.json` | Source/noise mask plus final source composite preserves unselected working pixels. Existing Studio notes record real image/API/browser runs. Working area <=768x768 total pixels; semantic subject selection/temporal video masks are unavailable. **Not integrated into Ad Studio in this task.** |
| Prompt assistance | `shared/runtime/prompt-rewriter.ts`, `prompt_polish.json`, `studio/src/prompt-assistant.ts` | Latest eb57686 supersedes the old Qwen2.5-1.5B/llama.cpp worker with Qwen3 4B through Comfy SDK/proxy. Text-only scene/motion/audio extraction, explicit Advanced review and stale-result guards. CPU-only TextGenerate is rejected; managed GPU/offload is required. It is not vision or deep brand understanding. Future evidence-to-text briefs could reuse the boundary after separate validation; no new analysis/generation here. |
| Audio/captions/timeline | `/api/audio`, `/api/captions`, `captions_whisper.json`, `shared/comfy-nodes/osh_captions/`; `studio/src/{audio-track,captions,caption-state,sequence-layers}.ts` | Stable Audio generation, Whisper Tiny transcription, editable phrase groups/SRT and project history. Existing owner notes record real runs. Caption/overlay display is currently preview-only in Studio; burn-in export/multitrack composited export remains pending. Ad Studio Composer already supports local music/rendering; do not advertise the future integrations as available. |

## Licenses / source of existing components

No new dependency/model was added. Installed package metadata and existing model manifests are the sources here.

- React/React DOM19.3.1, MIT: https://github.com/facebook/react . SDK0.5.0, MIT: https://github.com/Comfy-Org/comfy-typescript-sdk . parse5 8.0.0, MIT: https://github.com/inikulin/parse5 . resvg-js2.6.2, **MPL-2.0**: https://github.com/yisibl/resvg-js . Preserve MPL file notices if adapting its source.
- Qwen-Image-Edit-2511 FP8 components, Apache-2.0: `hero_qwen2511_contract.json`, https://huggingface.co/Comfy-Org/Qwen-Image-Edit . Official workflow template MIT notice retained in `adstudio/benchmark/QWEN_WORKFLOW_LICENSE.txt`.
- Z-Image Turbo and Qwen3, Apache-2.0: `shared/runtime/models.json`, https://huggingface.co/Tongyi-MAI/Z-Image-Turbo and https://huggingface.co/Qwen . Whisper code/weights MIT: https://github.com/openai/whisper ; existing caption setup is opt-in, never run by acceptance.
- LTX video uses the LTXV Open Weights License; Stable Audio Open uses Stability AI Community License. Exact repositories, versions and license labels are in `shared/runtime/models.json`; these have distinct terms, not a blanket MIT/Apache claim. ComfyUI GPL-3.0: https://github.com/Comfy-Org/ComfyUI . Existing FFmpeg build/license decision remains in both notes; no FFmpeg install/change here.

## Validation and operational handoff

- Both apps build/typecheck. Studio's18 regression files and Ad Studio pure/adapter/relay/workflow regressions cover the merged runtime. CPU FFmpeg/API integration verifies silent/audio edits/exports, product ratios, recovery and original hashes. Qwen SDK/HTTP inference fixtures are explicitly MOCK; they are not new photographs.
- Latest local read-only8301 discovery reports Comfy/proxy healthy but **Qwen, native prompt polishing, precision editing and captions unavailable on that connected instance**. Retained endpoint/code capability is not proof its required weights/nodes are currently installed. No model installation or inference was attempted.
- Owner freshly authorized unpaid browser control. Computer Use later stopped on insufficient URL confidence while selecting an existing tab. No alternate-controller retry. Only an old8300 Composer project was observed. Target8301 Hero/review/refresh/isolation and browser IndexedDB acceptance remain **NOT RUN**. Exact remaining steps: `adstudio/BROWSER_ACCEPTANCE.md`.
- Genuine owner-reviewed request JSON is **not obtained / not ready**. Export now identifies real project/brand/source, and one-job gates reject mismatches. Do not manufacture an approved request. Budget remains a proposal: one A40, one image, $2/2h, stop near$1.80, reserve$4; fresh checks and explicit paid/upload approval are still required.
- Active integration worktree: `outputs/adstudio-main-integration` on main; original dirty feature checkout is untouched. Its outputs junction retains existing local media at the same8301 origin. Server uses existing nonsecret Comfy/FFmpeg paths; credentials are not copied. Test reports/server logs stay gitignored under `outputs/integration-p0/`. Do not recursively copy/walk the outputs junction. No cloud actions or new model downloads.

## Coordination checklist for the next agent

Read AGENTS + both Where-we-left-off sections, this file and CONTRACT. Confirm main/dirty state and running8301 before editing. Preserve pending saves, original Blobs, all old takes and project namespaces. For a shared change, add a backward-compatible contract, both-client tests and short links in both notes. Record whether evidence is source inspection, mock/CPU, real model, or browser. Obtain fresh permission after any Computer Use stop. Next product milestone is actual one-job Hero acceptance, **then** the reversible service-first React plan in `adstudio/REACT_MIGRATION.md`.
