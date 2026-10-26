# Creative engine V1

Backend/application service for the next UI. Planning never triggers an image
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
concepts; self-scores impact, relevance, accuracy and feasibility. Deterministic
ranking selects the best score. Scores are not measured visual-quality evidence.

Response schema, supported evidence IDs, distinct setting/composition pairs,
bounded settings and conservative unsupported-claim checks are enforced. Printed
copy is selected from grounded identity/exact supported short excerpts or a small
catalog of non-factual creative headlines. Natural-language validation is not
semantic proof: proposals require review. Fidelity controls remain model requests.

Offline/missing weights/invalid output yields explicitly labeled deterministic
suggestions with the actual reason. No AI analysis or image output is simulated.
On this PC (2026-10-25), ComfyUI is offline and the required
`qwen_3_4b_fp8_mixed.safetensors` encoder is absent from configured model paths.
**Real text inference NOT RUN.** No model/dependency added or downloaded.

## Evidence

- `npm run test:creative` (Node22.20): real API/HTTP, mock native SDK/text/image,
  freshness/isolation, raw PNG/provenance, project-driver persistence, real CPU PNG
  export. Does not access the owner's IndexedDB or image models.
- `node --experimental-transform-types adstudio/scripts/creative-demo.mjs`:
  retained local No Crumbs evidence/nine-roll original →
  `outputs/creative-engine-v1/index.html`, campaign/closeup/enhancement JSON and a
  non-bakery fixture. Private sources stay gitignored; new directions unapproved.
- Browser and real local AI/image-quality acceptance remain unverified. The React
  milestone wires these existing service actions into the minimal owner journey.
