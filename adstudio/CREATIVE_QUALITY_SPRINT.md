# Creative quality sprint - three real Qwen candidates and provisional ad

2026-10-24. Executed from approved f2af2a0 on feat/adstudio-workspace. Exactly one Secure A40 session and three renders, no retries. **All images and the ad require owner review; none is approved.** Prior rejected two-image evidence is untouched.

## Results and visual evaluation

| Concept | Raw size | Comfy workflow / SDK round trip | Findings |
|---|---|---|---|
| Authentic full pan | 880x1184 | 225.123s / 228.281s | Nine rolls/3x3 retained most clearly; frosting, dough contours, baking marks and dish geometry still change. Bottom handle meets frame. |
| Intimate close-up | 944x1104 | 189.219s / 192.577s | Better photographic intimacy, but regularizes the original into a rounder coil; frosting/seams/side geometry drift. Strict fidelity FAIL. |
| Dramatic campaign | 880x1184 | 189.541s / 192.440s | Strongest light, shadows and negative space; irregular surface more convincing than close-up. Frosting/geometry change and nine-roll arrangement cannot be reliably verified. Pan edges partly clipped. |

Campaign is an editorial development selection, not a fidelity pass. Authenticity preserves count/layout better. Different references/framing mean this is not a controlled prompt-only causal experiment. A better-looking photograph does not establish that it faithfully represents the sellable product.

Private local evidence (gitignored):
- `outputs/creative-quality-sprint/session/gallery.html`: original, all raw images, genuine intimate conditioning crop, exact prompts, reviews and provisional ad.
- `.../session/comparison.jpg`: four-way contact sheet.
- `.../session/candidates/{authenticity,intimate,campaign}/raw.png`: untouched model PNGs; accompanying render.json/comfy-history.json contain full prompt/brief, seed, graph, hashes, timings and execution provenance.
- `.../ad/no-crumbs-provisional-ad.png`: actual 1080x1350 provisional export; recipe.json and provisional-ad.svg preserve composition. No product-photo finishing or further inference. Real alpha-treated circular logo, sourced "Leave nothing behind.", product name and website; uniform fit and crop of bottom background only. Viewed full-size and phone-size, no text over food. Windows Georgia/Arial font files recorded, no fonts redistributed.
- `.../session/artifact-verification.json`: PNG decode, dimensions, SHA256 and actual embedded Comfy settings match. Originals/crops/raw files unchanged. `visual-review.json` records deviations separately from artistic selection.

Reproduce only the local ad, after restoring this private evidence, with `node adstudio/benchmark/compose-provisional.mjs --case campaign --write`. Default is a dry run. The command requires all three completed/hash-matched raw files and verified termination, validates the genuine logo, and refuses to overwrite outputs. It never invokes inference/cloud services. Use a fresh output backup/move before a deliberate rerender; original files remain immutable.

## Actual environment, safeguards and cost

Pod `53ja1bmhae3ufr`, Secure CA-MTL-1, NVIDIA A40 48GB. Provider quote $0.59/GPU-hour; conservative combined GPU/local-disk budget $0.61/hour. 30GB container +80GB Pod-local /workspace, no network/global volume. Allocation 50GB RAM/9vCPU; CUDA-visible VRAM 47,699,722,240 bytes (44.42GiB), CUDA true. Python3.12, torch2.10.0+cu128. Hardware and authenticated independent Pod-side watchdog heartbeat passed before model downloads. Local retained guard also passed and exited0 after exact-Pod404. Both enforce the original 2h/$2 bounds, early stop near$1.80; no credential printed or committed.

Pinned runpod/comfyui image digest7ed65713a24c7c836cea8e5ba338ee140b0257b0a086cc3835784e0473efe2f2; Comfy commit a40c6ce87ba6358080d85fe4ab339bcb0b2fd020. Only approved FP8 editor/encoder/VAE (30,172,239,743 bytes total) downloaded and SHA256-verified. No BF16, LoRA, new custom node/model or dependency. Complete versions/hashes in session/model-hashes.json and qwen-hero-pins.json. Existing Comfy SDK0.5.0 -> private SSH proxy0.1.6 -> ComfyUI architecture retained; only SSH exposed. Seed42,40steps,CFG4,euler/simple,denoise1,shift3.1,CFGNorm1; approved compiled prompts and authentic full/crop bytes verified against plan and embedded executed graph. No logo/type in raw outputs.

Setup after SSH took462.842s. Created16:15:04UTC, collected all three images and verified termination16:37:44UTC:22m40.43s total uptime. Exact Pod GET404 and complete empty Pod/network/global-volume inventories confirm no remaining billable resources. Conservative whole-lease estimate$0.230518. Latest balance$8.1068570252 from$8.3366180835: observed debit$0.2297610583, current spend/hour0, auto-pay off, reserve preserved. Itemized exact-Pod billing has no rows yet; observed debit is the best current charge evidence, not a settled invoice. Sanitized balance/cleanup reports are private. No further resources or runs authorized.

## Verification and handoff

Typecheck/build;18 Ad Studio/Director CPU regression scripts; Qwen guard/execution/gallery tests; compiler/model pin checks; local ad syntax/dry-run and actual raster output PASS. Raw source metadata and source-preservation checks PASS. Nine unrelated dirty files retain their recorded hashes; shared/runtime, shared/workflows and studio source unchanged. No new dependencies/defaults/UI features. **Browser acceptance NOT RUN** this task; no browser publishability claim. Gallery is a local HTML file (Vite denies outputs serving); do not bypass those server controls. PR3 remains draft/unmerged. Next action: owner inspect three separate raws and provisional ad for fidelity/postability before any more generation or workflow expansion.

---

## Historical preparation (before this approved execution)

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
