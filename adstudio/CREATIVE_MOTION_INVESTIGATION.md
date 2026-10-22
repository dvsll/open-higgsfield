# Creative motion investigation — 2026-10-22

**Verdict: the reported failure is real. No tested change qualifies as a faithful commercial Creative-mode fix.** Portrait framing elicits movement but fine product details deform. A distilled-derived timestep schedule alone does not rescue the failed landscape case. Keep Creative's current graph as fallback; do not disguise its output with Camera Mode or enhancement.

## Provenance and running version

- Started with a clean `feat/adstudio-fidelity` at `47ed114`. Fetched main through `7b6b2a1`. Selectively ported only the shared explicit frame/FPS changes from `f604c8d`; no automatic merge, Studio source edits, audio integration, dependencies or model installs.
- Found the actual Downloads `ad-creative-16x9-1.mp4`: 55,275 bytes; SHA-256 `9b3423bbf8ff176db970fd6dcd1be3183047f88ce15fd4ccd1b6d128737fd1e8`. It is byte-identical to API output `506252d8b50f3fb3.mp4` and to a fresh export of `5a138da45c83c438.webm`.
- Source WebM SHA-256 `91070754ce5bcb854101f614a7a48eb237e5deb12b6742cf7f0803ce0c96d94`; matches Comfy's `osh/shot_00018_.webm`. History job `0b6f5896-267f-4c06-855a-a24202560b82` recovers the exact graph, prompt, seed and guide. Generation completed about 13:22 local; export about 13:36. This is the **four-cookie tray**, visually matching dataset `Cookie4_og.jpeg`, not the earlier packaged-cookie website test. No printed logo is visible in this pair.
- Guide was `76f0d3f8a389a937.png`, an already fitted 512×288 image. Existing SDK/proxy path produced the real LTX output; this was not Product-Locked or deterministic Camera output. Test A's exported bytes equal the actual failed download, not a substituted sample.
- Both :8288 and :8294 currently serve Creative/Locked/Camera source and accept the additive product-video route. Read-only process inventory found ports :8288 PID 35588 and :8294 PID 29284, started 12:31/12:34. Vite can reload after process launch. **Neither port nor file timestamp proves the historical Git commit. No historical server build stamp was stored.** The graph matches the checked-in fallback; the exact historical server commit remains unrecorded. The :8288 recording alone is not evidence of a different generation implementation.
- Experiment requests ran against :8294. Private `runtime-provenance.json`, served source snapshots, history, model hashes and hardware report are under `outputs/motion-investigation/`. Actual hardware is **RTX 3080, approximately 10 GiB**, not the 4070 Super used in older notes. Timings are not cross-machine benchmarks.

## Dataset inventory, completed before generation

Windows redirected the supplied Desktop path to `C:/Users/osiam/OneDrive/Desktop/ComfyUI_Product_Pic`. Read-only inventory: **9 original photographs, 10 enhanced photographs, 4 MOV references**. Originals were not renamed or modified. Private `inventory.json` records every path, size, SHA-256, image dimensions and video probe; `inventory.jpg` was visually inspected.

| Original | Enhanced candidate | Visual finding |
|---|---|---|
| `Cookie4_og.jpeg` | `Cookie4_ai.png` | Same four-cookie tray product; enhanced version changes lighting, tray angle, cookie texture/chips. Selected pair. |
| `cookie_og.jpeg` | `Cookie 2.png` | Packaged cookies with sticker; enhanced bag arrangement/label placement differs. Reserved. |
| `bite shot_og.jpg` | `bite shot_AI.png` | Hand-held torn cinnamon roll, matching composition; texture/background edits. |
| `glaze_og.jpg` | `glaze_ai.jpeg` | Hand-held glazed roll, similar angle. |
| `tiramisu4_og.jpeg` | `tiramisu4_ai.jpg` | Four rolls in foil tray, matching overhead layout; lighting/background altered. |
| `tiramisu_og.jpeg` | `tiramisu_ai.jpg` | Single plated pastry; substantial reframing/background change. |
| `heroshotV2_og.jpeg` / `tray_og.jpeg` / `IMG_1546.jpeg` | `hero shot.png` / `Cinn 4 new.png` | Cinnamon-roll trays at overhead/detail/outdoor angles. Product-family matches; exact source mapping is uncertain. Do not treat these as registered pairs. |
| No exact still established | `single_ai.png`, `cookies_4_ai.png` | Single roll / boxed cookies; no verified matching original still. |

Video references: `cinnamon_pull_og.mov` 8.062s, 1280×720/30fps; `Single_og.mov` 2.102s, 1920×1080/~29.97fps; `singleV2_og.mov` 2.442s, 3840×2160/120fps; `tray_of_4_vid_og.mov` 2.217s, 3840×2160/60fps. Inventoried/probed, not used as generation conditioning or claimed playback references. Remaining dataset reserved; no training or enhancement system.

Selected original SHA-256 `f2f09d1631d033accfcd9a6c99c171a0064b04d2a49da0a125fd5081c45caf1d` (4284×5712); enhanced SHA-256 `097a16069690eecf2bc6086875f863ab36be00b5ce62b4c02c0d8ff045a04953` (1086×1448). Enhanced input is explicitly **not ground truth**.

## Actual graph inspection

`shared/workflows/shot_ltxv.json` remains unchanged, SHA-256 `c711d545fc60c853b144ef96420fe9b049f1b91fd943f61f41144e25a2190e7b`.

- Checkpoint: **LTX-Video 2B 0.9.8 distilled**, not a 2B development checkpoint. Combined checkpoint includes model/VAE. File SHA-256 `76aa8c4786af752fa6f951947129d5290c3c6c0b2fadcadea6b5e114ae2cad8f` (6,340,744,492 bytes).
- Text encoder: `t5xxl_fp8_e4m3fn_scaled.safetensors`, LTXV CLIP type, SHA-256 `a498f0485dc9536735258018417c3fd7758dc3bccc0a645feaa472b34955557a` (5,157,348,688 bytes). No encoder precision comparison attempted.
- LoadImage → Lanczos ImageScale → **one LTXVAddGuide at frame 0, strength 1** → LTXVConditioning/24fps. Empty latent is 73 output frames, not a repeated input video. Installed `comfy_extras/nodes_lt.py` appends the encoded guide with temporal coordinates and guide noise mask; `LTXVCropGuides` removes appended guide slots before decode. It does **not** fill all output frames with the photograph. Guide attention can affect generation beyond frame 0; strength reduction was not tested in this bounded batch.
- Euler / SamplerCustom / add_noise=true / CFG=1 / 8 steps / seed 1. At CFG 1, negative-conditioning text is not an independently effective CFG lever. No evidence justifies increasing CFG arbitrarily for a distilled model.
- Generic `LTXVScheduler`: max_shift 2.05, base_shift .95, stretch=true, terminal=.1. For this 16×9 spatial latent and 11 guide-inclusive latent frames, approximately `[1,.94350,.87535,.79154,.68598,.54893,.36382,.1,0]`.
- The publisher's [2B 0.9.8 distilled configuration](https://raw.githubusercontent.com/Lightricks/LTX-Video/main/configs/ltxv-2b-0.9.8-distilled.yaml) uses a different, checkpoint-oriented multi-scale schedule. C tests a **single-stage hypothesis** assembled from its timestep values: `[1,.9937,.9875,.9812,.975,.9094,.725,.4219,0]`. This is not the complete official multi-scale pipeline, its upscaler, or a proven correction. It runs through the existing Comfy SDK → proxy → ComfyUI, without changing the shared fallback or exposing sampler controls in the app.
- Output SaveWEBM is VP9/CRF30; MP4 export is H.264/CRF20/yuv420p, no tagline in these tests. The failed source WebM measures .155px / 1.00013× with the same ROI/estimator (`webm-metrics.json`); MP4 export is not creating the lack of motion.
- Fitting a 3:4 photo into 16:9 leaves a **216px-wide photo strip, 42.19% of frame width** (actual cookies occupy less). At 9:16 the photo spans 288×384, full width and 75% height. Padding becomes part of the model's guide, not just a display border. There is no crop-to-fill bug here: fit mode explicitly prepares that canvas. A sparse, largely empty landscape composition is a poor motion-conditioning input.

## Controlled experiment

All AI cases: seed **1**, **73 frames / 24fps / 3.0417s**, same model, encoder, Euler, CFG1, strength1 and exact prompt:

> A slow camera push toward the product, soft studio lighting, subtle reflections, premium commercial product shot. Clean studio background, controlled lighting, smooth camera movement. Preserve the reference product appearance and branding. No added text.

Negative prompt: `worst quality, inconsistent motion, blurry, jittery, distorted, watermark`.

A/C use the **exact recovered browser guide bytes**. B uses the visually matching dataset original, EXIF-transposed RGB, Lanczos resized to max2048 then fitted on RGB(22,23,27). E uses the selected enhanced counterpart with the same preparation/settings as B. The reconstructed original landscape fit differs from the recovered browser guide by photo-region RGB MAE 4.679/255: **A/B are not pixel-identical preprocessing controls**. Aspect and spatial latent shape also change noise realization despite an identical seed. Do not attribute all movement differences uniquely to aspect ratio.

| Test | Processing / execution-history seconds | Product patch displacement | Approx. fitted scale | Residual | Finding |
|---|---:|---:|---:|---:|---|
| Actual failed MP4 / A, 512×288 | Original history 6.464; A API .6, **cached** | .175px | 1.00009× | .140px | Stationary product; slight texture/lighting change, no convincing push. FAIL. |
| B original, 288×512 | API 10.6 / history 7.333 | 9.557px | 1.12314× | 2.596px | Visible push-like enlargement; foil/crumb/chip details deform. Full tray remains in sampled bounds. Motion exists; faithful-ad acceptance FAIL. |
| C distilled-derived sigmas, 512×288 | SDK 4.158 / history 3.788 | .170px | 1.00002× | .183px | Still stationary; schedule-only hypothesis fails. Do not promote. |
| D Camera push, 512×288 | FFmpeg .4, no model | 3.822px | 1.07999× | .282px | Recovers the intended 1.08× transform, original photo stays inside frame. Motion reference only, not Creative success. |
| E enhanced, 288×512 | API 6.9 / history 6.557 | 14.945px | .98111× **unreliable** | 9.745px | Tray rotates toward upright; non-rigid detail changes and incorrect requested direction. Better input lighting does not establish identity or motion control. FAIL. |

Every export: HTTP/media/probe PASS, 73 frames at 24fps, ~.1s MP4 processing. All five request bodies, input/guide/video hashes, graph snapshots, timestamps and Comfy history are private in `outputs/motion-investigation/controlled/report.json`. A's sampler node was cached; B/C/E sampled anew with model/text-loader caching. These timing differences are not a controlled speed benchmark.

### Measurement and visual limits

Independent estimator: grayscale normalized-cross-correlation, distributed 11×11 textured patches, ±22px search with subpixel peak refinement, NCC≥.8; trimmed similarity least-squares fit. Explicit ROIs exclude padded backgrounds: A/C/actual `(185,30,120,210)`, B/E `(55,110,180,280)`, D `(198,50,112,180)`. Self-tests recover zero motion, (5,3) translation and 1.05× zoom. This is a different estimator from preliminary optical-flow measurements; .175px versus ~.12px supports the same near-static conclusion, not exact numerical replication. Tracks can attach to deformed/repeated cookie texture; B/E residuals warn against reading their fitted transforms as exact camera geometry. No OCR or brand-preservation score applies to this unbranded pair.

All 73 frames were decoded and measured for adjacent ROI grayscale MAE: A .278, B 2.405, C .256, D 5.338, E 3.677 (0–255). This mixes movement, lighting, codec noise and deformation; **it is not a flicker score**. First-to-last ROI MAE likewise is not fidelity ground truth. First/middle/final color contacts and the all-frame grayscale sheets for B/E were visually inspected: enlargement/rotation and changing textures are visible; no full temporal-quality pass is claimed. Other cases have all-frame sheets available for manual review.

Private comparison: `outputs/motion-investigation/controlled/gallery.html` embeds the original/enhanced inputs, five playable MP4s with synchronized restart controls, color contacts and measurements. Source/customer media and generated evidence stay gitignored. No photos were sent to a third party.

## Root-cause classification and decision

| Classification | Confidence / evidence |
|---|---|
| `ASPECT_RATIO_OR_INPUT_PREPARATION` | **High for poor composition; moderate as a motion contributor.** 42% landscape photo footprint and near-static A vs visibly moving B. Preparation/noise-shape confounds prevent exclusive causal attribution. |
| `WORKFLOW_CONDITIONING` | **Plausible, unproven.** One strong sparse guide plus a vague slow-push/preservation prompt may favor copying a static composition. Installed graph can produce motion in B/E, so it is not fundamentally an image repeater. C rules out the particular schedule-only rescue, not all conditioning defects. |
| `MODEL_CAPABILITY` | **Moderate evidence of a fidelity/control limit at these settings; low confidence of an inherent impossibility.** B/E move while altering detail/direction. This 2B distilled setup has not delivered a convincing faithful ad under the tested constraints. Larger-model superiority on this product is untested. |
| `OTHER_IMPLEMENTATION_ISSUE` | **Historical version attribution gap confirmed.** No build stamp. No evidence of an accidental Camera/Locked selection, wrong model name, repeated-frame export, or export-induced motion loss. |
| `INCONCLUSIVE` | **Exclusive root cause and a successful Creative fix remain unresolved.** Small single-seed test; full playback and product-owner judgment pending. Stop this GPU batch. |

No production motion/sampler change is justified. Existing Creative, Locked and Camera behavior remains intact; Camera is explicitly a conventional photo transform. No decorative effects or enhancement were added to Creative.

## Tests, compatibility and browser gaps

PASS: `npm.cmd run typecheck`, `npm.cmd run build`, existing shared-client compatibility (extended for explicit frames/FPS), product plan/bounds tests, all four existing Director test scripts, HTTP upload/path/size/host smoke, malformed-image decode → next Camera/render/export recovery, real MP4 export; live Product-Locked/export across all three formats; invalid explicit frames/FPS rejection. No Studio source files changed. Shared default shot timing still maps 3s → 73 frames at24fps; Director's model-string and Ad Studio's size-object calls remain supported. New explicit timing matches main `f604c8d`; no claim that this branch contains main's separate audio/projects features.

**NOT RUN:** fresh real-browser upload/preview/progress/tagline placement/download/retry and full-speed playback aesthetic sign-off. Computer Use was initialized/retried through the prescribed skill; both attempts failed before input with `failed to start Node runtime: The system cannot find the path specified. (os error 3)`. No interrupted session was bypassed. [BROWSER_ACCEPTANCE.md](BROWSER_ACCEPTANCE.md) remains the manual checklist. Open the private gallery, restart all, play complete clips twice at normal speed, seek each to start/middle/end; inspect cookie/foil geometry at native size, movement direction, texture crawl, edge/crop stability and perceived ad quality. Log PASS/FAIL per clip and browser/version. Then run all three modes through :8294/adstudio with actual file upload, watch progress, export with a long tagline, verify downloaded MP4 opens/seeks, and recover from invalid upload/network failure. Automated decoding/contact sheets do not replace playback.

## Recommended next milestone (bounded, before migration)

1. Complete the above normal-speed playback review. Keep this exact failed source and A/B/C/D/E evidence as controls.
2. One **matched-preparation, original-only 9:16 comparison**: same PNG guide, prompt, seed, 73 frames; current guide-strength1 versus .7 (already supported by API), unchanged scheduler/model. This isolates a remaining guide hypothesis; assess displacement **and** chip/foil preservation, not speed. At most two new short renders; stop if meaningful motion still requires detail loss. Keep any tested graph separate until fidelity passes. Do not run the remaining dataset.
3. If that fails, seek approval for a separately pinned official larger-LTX workflow/hardware benchmark, with the same product and explicit motion/fidelity gates. Do not promise that larger weights preserve branding.

Read-only alternatives evaluation, no downloads/costs incurred: [publisher model card](https://huggingface.co/Lightricks/LTX-Video) offers 13B 0.9.8 dev for quality and distilled/FP8 for faster/lower-memory comparisons, plus recommended Comfy workflows. This is closer to the current T5/VAE generation but remains a new, untested setup. [LTX-2.5](https://huggingface.co/Lightricks/LTX-2.5) has official [Comfy workflows](https://github.com/Lightricks/ComfyUI-LTXVideo/tree/master/example_workflows/2.5), including image-to-video and motion-track control, under its LTX-2.x community license; it requires a different compatible encoder/VAE/model stack and license review before installation. It is a competition-aligned option, not a minimal fix.

[Publisher hardware guidance](https://docs.ltx.io/open-source-model/getting-started/system-requirements) specifies 32GB+ VRAM / 32GB RAM / 100GB disk minimum for LTX-2.5, recommends A10080GB or H100, 64GB+ RAM and 200GB+ SSD. Existing 10GiB RTX3080 is below that stated VRAM baseline. A rented A10080GB is the conservative recommended benchmark target; a 48GB RTX6000Ada/L40S is a lower-headroom alternative requiring measurement, not a guaranteed fit. [Runpod GPU inventory](https://github.com/runpod/docs/blob/main/references/gpu-types.mdx) lists these classes. Availability, final hourly price/storage and private-image transfer need approval before provisioning; none was provisioned. No speed/quality claim for untested hardware.

## Reproduce locally

Use existing ComfyUI/Pillow/numpy and configured FFmpeg; install nothing. The private manifest contains exact prompt, seed, image paths and A–E specifications. Copy it to a new local manifest and set a **new output folder**; the runner refuses to overwrite evidence:

```powershell
$env:OSH_TEST_URL='http://127.0.0.1:8294'
node adstudio/scripts/motion-experiment.mjs <new-private-manifest.json>
<existing-comfy-python> adstudio/scripts/motion-metrics.py --self-test
<existing-comfy-python> adstudio/scripts/motion-metrics.py <private-metrics-spec.json>
node adstudio/scripts/motion-gallery.mjs <report.json> <metrics.json> <original.png> <enhanced.png>
```

The experiment runner submits through the existing API or SDK/proxy for experimental sigmas, records cache history and refuses an already-active GPU queue. Keep manifests, local paths, customer photos, contacts, raw media and gallery under gitignored `outputs/`. The runner is investigation tooling, not a production API or quality certification.
