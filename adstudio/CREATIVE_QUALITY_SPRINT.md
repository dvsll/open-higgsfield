# Creative quality sprint — prepared, paid inference awaiting approval

2026-10-24. Baseline e835d19, feat/adstudio-workspace. No new Pod, weights, private upload, GPU job, generated hero or final ad in this preparation. The owner rejected the previous two candidates; they remain intact and are not relabeled as this sprint's results.

Implemented a deterministic Qwen-specific creative-brief compiler (`benchmark/creative-brief.mjs`) with traceable facts, preserve/change lists, camera/composition/light/environment, forbidden inventions, copy space and explicit uncertainties. Evidence is manually verified photograph observations plus saved website extraction/`brandContext()`. No AI vision/brand-analysis model was run. The nine-roll tray is not mapped to the website's two-roll SKU; pack sizes, prices, ingredients and pickup claims are excluded from ad copy.

Three compiled concepts in private `outputs/creative-quality-sprint/campaign.json`:

| Concept | Reference and direction |
|---|---|
| Authenticity | Full original nine-roll pan, overhead, soft window light, pale stone, retain irregular dough/frosting/baking marks; quiet upper area. |
| Intimate | Exact original-pixel crop of the middle-right roll, editorial close-up and three-quarter exploration, natural frosting texture and restrained focus falloff. Newly revealed geometry is inferred. |
| Campaign | Original full-pan reference, diagonal three-quarter composition, dark warm-charcoal bakery counter, directional window shaft, deep readable shadows and empty upper third. New viewpoint/detail fidelity is unproven. |

All use seed42 and the proven official Qwen FP8 graph:40steps/CFG4/euler/simple/denoise1/shift3.1/CFGNorm1. Only prompt, genuine reference pixels and output prefix vary. Previous workflow/pins/two-case fallback remain intact. Briefs constrain intent; they cannot guarantee product identity.

`creative-prepare.py` creates a lossless genuine crop and resized full guide; `creative-prepare.mjs` compiles briefs, exact prompts, workflow hashes and a **reference-only** review page. `qwen-render-runpod.mjs --check-plan outputs/creative-quality-sprint/campaign.json` validates all prompts/graphs/original and crop hashes without network or inference. The optional `--plan` route runs exactly3 cases through the existing SDK/proxy. `QWEN_SESSION_DIR` must select a separate private `outputs/.../session` folder; old results are not moved or overwritten. Existing exact-Pod guards,50min setup cutoff,2h/$2 lease bounds and finally-termination remain in force. Fresh allocation/price/diagnostic/watchdog checks are required after approval.

Logo: genuine artwork retained inside its original circular seal, outer square corners made transparent. Original and inner RGB pixels match exactly; no lettering redrawn or recolored. Private `brand-seal.png` and `logo-treatment-review.jpg` show the treatment. Also fixed the actual hero exporter to respect alpha by removing its forced black logo rectangle; real raster regression verifies transparent corners expose the photo. Existing signatures/default photo rendering and Director are preserved. Final1080x1350 composition waits for actual candidate QA/selection, so its type placement can serve the photograph. Sourced “Leave nothing behind.” is available; no invented offer or ingredient claim.

Private review: `outputs/creative-quality-sprint/brief-review.html`, each concept's brief/prompt/workflow, crop, logo treatment, asset-verification and read-only account evidence. These are prepared inputs, not generated previews. Raw output gallery supports original plus3 actual candidates and refuses missing/corrupt results. Gallery tests use explicitly synthetic CPU fixtures only.

Validation:15 Python guard/cleanup/gallery tests, brief/compiler/model-pin tests, original/crop/logo pixel and source-hash checks, real logo-alpha PNG regression, typecheck/build and existing app compatibility tests. Prior raw PNG hashes and9 unrelated working files preserved. New inference and browser acceptance NOT RUN; no publishability/fidelity approval claimed.

Approval gate: live catalog A40 Secure$0.59/h, CA-MTL-1 LOW/EU-SE-1 HIGH; read-only account balance$8.3366180835, auto-pay off, current spend0, complete Pod list empty. Quote is not a reservation. Proposed one session: **max$2 and2h**, same30.17GB pinned download, original/full-guide and genuine crop uploads, one seed per concept, collect3 raw PNGs then terminate all session resources; preserve$4. Conservative GPU+local-disk allowance$0.61/h gives$1.22/2h, subject to fresh checks. No deployment until the owner explicitly authorizes this new run/cap. PR3 remains draft.
