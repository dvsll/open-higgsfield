# Creative engine V1

## Latest real activation — 2026-10-26

Owner-authorized **single encoder install completed**: 5,631,994,051bytes,
SHA256 `72450b19758172c5a7273cf7de729d1c17e7f434a104a00167624cba94f68f15`.
Existing Desktop ComfyUI/proxy started on loopback8188/8189; actual app status
passed weights/loader/text/output checks. No other weights or dependencies installed.

The real local text-only SDK check ran: native Comfy job
`e8e6c042-8973-4161-8405-1a5e67ffbca2`, about69.96s native /70.673s application.
Inference completed and produced JSON, but **usable creative planning FAILED**.
Raw keys included ` hierarchy`, ` environment`, ` camera`, ` evidenceIds`.
The output also cited the unconfirmed `photo` observation and used “organic
materials,” which the current conservative assertion filter rejects. The first
reported error was Invalid concept identity (unknown keys), not a GPU/model-load
or transport failure. No trimming, evidence relabeling or semantic repair was
applied. The app correctly returned an explicitly deterministic fallback.

Per the owner's stop-on-local-planning-failure instruction: **no Pod was created,
no private source transferred, no image job submitted, no paid approval enabled**.
Fresh No Crumbs campaign review was not claimed. No automatic inference retry.
Evidence: `outputs/creative-live-20261026/{encoder-install.json,local-inference-diagnosis.json,synthetic-model-response.txt,synthetic-planning.json}`.
Focused synthetic CPU regressions preserve rejection of these failure shapes.
The next repair needs a stricter model-facing schema/example and explicit allowed
evidence IDs, followed by a separately deliberate text validation; do not weaken
source review or the unsupported-claim gates to call this run successful.

Functional UX: `AdApplication` orchestrates inline brand creation + Develop,
source-specific fact reuse, saved stage/refinement, current-direction validation,
and `exportAndDownload` (compose→verify→durable history→readback→download request).
`downloadAdvertisement` retries only delivery of an existing verified Blob.
Copy edits merge against the latest snapshot and never call Qwen. An uncertain
submission is interrupted, not an ordinary retryable failure.

`creative/select` optionally accepts owner-corrected `facts`. It validates them,
forces `confirmed:false`, preserves the three concepts and actual `parentId`, and
recompiles a new unreviewed plan. Explicit in-app acceptance must still prepare it
through unchanged source/approval/hash/model gates. No model runs for correction.

Current UI: `src/react/entry.tsx` → `AdApplication` → `CreativeStudioService`, all
sharing `WorkspaceStore.projects`. POST `/api/creative/select` creates a new,
unreviewed immutable plan from an existing alternative; no text/image generation.
`creative/compose` accepts optional owner-edited headline/body/CTA/format only,
with existing provenance and source gates intact. Prior plans/takes remain.

Backend/application service for the current React UI. Planning never triggers an image
model, download, cloud deployment or browser storage initialization.

- `shared/lib/creative-engine.ts`: portable inputs, evidence, concepts, ranking,
  creative brief and composition contracts.
- `shared/runtime/creative-engine.ts`: private plans, native SDK text bridge,
  explicit review, existing Qwen validation and provenance-checked PNG export.
- `adstudio/src/creative-service.ts`: existing Projects/Blob store + typed SDK
  client + verified Hero delivery. No Director imports or UI mounting.

## UI integration

Pass the existing `Projects` instance to `new CreativeStudioService(projects)`.

1. `plan(projectId, originalAssetId, {productId?, facts?, request?})` saves a plan
   reference without replacing any Hero draft/take. Campaign is the default;
   `intent:'enhancement'` is a separate explicit request.
2. Show `provider`, `context` (owner/source/inferred/unconfirmed), selected concept
   and warnings. Three proposals and evaluations remain inspectable. Text planning
   has no vision: missing observations need actual owner review.
3. On a real approval action only:
   `approve(projectId, planId, {direction:true, facts:true})`. Revalidates current
   brand/source/settings, then invokes existing brief review and Qwen validation.
   Preserves previous Hero settings; returned paid/private-upload flags are false.
4. Only an explicit Generate action calls `generate(projectId, planId)`. It uses
   existing `OSH.qwenHero` with no alternative model, cloud setup or paid approval.
   Raw PNG delivery is byte-checked and saved as an unapproved Hero take.
5. After inspecting the generated product:
   `exportAd(projectId, planId, takeId, true)`. Checks exact project/prepared prompt,
   source hashes, executed graph and weight pins against Qwen provenance, then
   uses the existing PNG exporter. Original logo/text are composed separately.

`open(projectId, planId)` restores private full plans. Optional `project.creative`
holds versioned lightweight references in database v3. No schema/origin change,
registry replacement or clearing; previous briefs/takes/compositions/exports stay.
Missing records/Blobs fail explicitly. Source selection rejects known generated
takes, enhanced references and incorrect product-photo associations.

## HTTP contract

Existing local API access controls apply. Shared `OSH.creative*` methods are typed.

| Route | Purpose |
| --- | --- |
| GET `/api/creative/status` | Native model availability/busy state and honest fallback |
| POST `/api/creative/plan` | `{image,input:CreativeInput}` → `CreativePlan`; checks normalized PNG SHA |
| GET `/api/creative/plan/:id?projectId=...` | Project-bound plan retrieval |
| POST `/api/creative/prepare` | `{planId,current,image,original,confirmation}` → `CreativePrepared`; fresh snapshot, explicit confirmation, original/normalized SHA |
| POST `/api/creative/compose` | `{planId,preparedId,projectId,hero,provenanceId,heroAssetId,fidelityReviewed,logo?,logoAssetId?}` → actual PNG |

Plans include evidence, three proposals, chosen direction, full brief, concise
model prompt, grounded copy, ratio/layout/photo/text bounds and PNG export intent.
Website narratives, hashes and evidence IDs stay outside the image prompt. Source
facts remain verbatim internally. Seed42 defaults; overrides bind into review.
The nine-roll original is never silently relinked to Signature Duo.

## AI versus fallback

When installed, Qwen3 4B runs the existing `prompt_polish.json` native
CLIPLoader/TextGenerate/SaveText graph via Comfy SDK → proxy → ComfyUI. It receives
bounded brand evidence, observations, permissions and intent; proposes three
concepts; self-scores impact, relevance, accuracy and feasibility for inspection.
Those scores no longer choose the recommendation. A deterministic rubric checks
grounded references, objective/layout relevance, executable specificity and
constraint conflicts. Neither rubric nor model score is measured visual quality.

Response schema, supported evidence IDs, distinct setting/composition pairs,
bounded settings and conservative unsupported-claim checks are enforced. Printed
copy is selected from grounded identity/exact supported short excerpts or a small
catalog of non-factual creative headlines. Natural-language validation is not
semantic proof: proposals require review. Fidelity controls remain model requests.

Offline/missing weights/invalid output yields explicitly labeled deterministic
suggestions with the actual reason. No AI analysis or image output is simulated.
At the earlier pre-install inspection on this PC (2026-10-26), ComfyUI was offline and the required
`qwen_3_4b_fp8_mixed.safetensors` encoder is absent from configured model paths.
**At that earlier checkpoint, real text inference was NOT RUN.** Latest activation
above supersedes model availability and execution status; historical evidence remains.

## Evidence

- `npm run test:creative` (Node22.20): real API/HTTP, mock native SDK/text/image,
  freshness/isolation, raw PNG/provenance, project-driver persistence, real CPU PNG
  export. Does not access the owner's IndexedDB or image models.
- `creative-quality.test.mjs`: nine-roll, synthetic packaged goods and conflicting
  constraints, semantic-channel collapse, business-prose leakage, schema/parser,
  explicit review invalidation and scoped SDK deadline/cancellation/no retry.
- `creative-review.mjs <private-plan> <original> <reference> <outputs-directory>`
  verifies retained hashes and saves a private three-concept proposal gallery.
  It never invents browser review or grants inference/private-upload permission.
- UI concept/confirmation/historical export accepted by owner; independent browser
  automation NOT RUN. Real Ad Studio local text planning/new campaign image quality
  remain unverified. Historical Qwen app image evidence stays in notes/adstudio.md.

## Grounding and compilation

`shared/lib/creative-direction.ts` distinguishes identity/business facts, owner
appearance observations, positioning, explicitly declared visual preferences,
inferred hypotheses and the customer's objective. Description/story never serve
as fallback photographic tone. A deliberately limited rule vocabulary converts
declared preferences into proposed light/staging; missing preferences produce
neutral material-led direction, not fabricated deep brand understanding.

Campaign alternatives use contextual editorial, tactile material study and graphic
brand statement, with different composition/environment/light decisions. Pairwise
lexical channel checks reject collapsed AI concepts and copied business narratives.
These checks are not semantic proof or aesthetic ratings. Strict crop/background
locks may limit differentiation to lighting, and that limitation is retained.

The compiler resolves camera/crop/background permissions before emitting both
structured decisions and the concise Qwen prompt. Product count, exact arrangement,
container and printed artwork outrank proposals. Campaign can replace surroundings
and stage a new composition; enhancement remains deliberate. Source/category texture
cues are conditional, not newly observed ingredients. Existing drafts and prepared
requests are not rewritten: new plans require fresh explicit review.

Private `planning.json` records actual prompt/context, elapsed time, whether local
text inference was attempted, final provider, token limit and decoding settings.
Raw model text is retained even on failed validation. Native text uses 2400 output
tokens, no thinking, greedy sampling, a scoped180s SDK wait and15s output fetch;
failed jobs attempt only their own cancellation and are never automatically retried.
Director keeps its existing timeout/default behavior. Image pins/transport/guards
are unchanged.

## Local text planning setup

Already integrated model (no new model/dependency): **Qwen3 4B FP8 mixed**,
[Apache-2.0 Comfy encoder](https://huggingface.co/Comfy-Org/Z-Image-Turbo/blob/main/split_files/text_encoders/qwen_3_4b_fp8_mixed.safetensors),
[upstream Qwen3-4B](https://huggingface.co/Qwen/Qwen3-4B).
File `models/text_encoders/qwen_3_4b_fp8_mixed.safetensors`, approximately5.63GB;
published SHA256 `72450b19758172c5a7273cf7de729d1c17e7f434a104a00167624cba94f68f15`.
Do not download the whole Z-Image image pack just to enable text planning.

Earlier inspection: RTX3080 10GiB (~8GiB free), Desktop shared text-encoder
folder contained only T5XXL. Current core nodes imported on CPU and exported their
actual schemas: CLIPLoader lumina2/default, TextGenerate system/template/thinking/
greedy/max-token support and SaveText JSON all pass; Qwen3 weight check fails.
No model inference occurred in that schema check. Evidence:
`outputs/creative-quality-tests/installed-node-*`. The later approved installation
and real inference outcomes are recorded at the top of this document.

After separate installation approval, download **only that encoder** from the
linked official repository into the connected ComfyUI's text_encoders folder,
verify its checksum and restart idle ComfyUI. Keep existing Desktop extra-model
paths. No custom node is required. Engineering capacity estimate (not a measured
minimum): allow12GB free disk for temporary+final file,16GB RAM and8–10GB free
GPU memory for this native FP8 context. Fit/latency on this3080 remain untested.
Native TextGenerate CPU-only execution was previously unsupported; use managed
default/offload, never claim that `--cpu` schema inspection proves CPU inference.

```powershell
# Read-only availability check; no installation or generation:
node --experimental-transform-types adstudio/scripts/creative-local-check.mjs
# Only after installed local model availability passes: one genuine text-only
# request on an owned synthetic fixture, through the real app API/SDK/proxy:
node --experimental-transform-types adstudio/scripts/creative-local-check.mjs --run
```

The second command saves real provider/concepts/timing under
`outputs/creative-local-check/`; deterministic fallback exits nonzero. It never
submits Qwen image inference, invokes a remote service or prepares a reviewed
private-image request. Compare actual output against the baseline before claiming
AI planning quality. Official native [TextGenerate](https://github.com/comfyanonymous/ComfyUI/blob/master/comfy_extras/nodes_textgen.py)
and [SaveText](https://github.com/comfyanonymous/ComfyUI/blob/master/comfy_extras/nodes_text.py)
sources were checked; production still uses the repository's existing workflow.
