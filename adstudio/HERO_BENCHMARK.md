# Product hero / Benchmark Ad V1

Open `/adstudio/#hero` -> **Open No Crumbs benchmark**. Current local server: http://127.0.0.1:8301/adstudio/#hero. This imports a separate private example project/brand; reopening retains existing edits. Browser storage is origin-specific: changing ports does not transfer existing projects. Existing Brand/Static/Composer workspaces remain available.

Choose a saved brand/product, source and direction -> develop a hero -> compare against its original -> edit copy -> approve product details -> export PNG. Upload PNG/JPEG/WebP originals, choose an original comparison and label supplied AI edits explicitly. Framing is a visible 4:5 crop, not stretching. New hero versions and PNG exports are separate immutable assets in existing IndexedDB DB3. Older project versions 1/2/3 get an empty version1 hero workspace. Large originals/results remain Blobs; localStorage is not used for image data. Missing API files can be re-uploaded from retained normalized Blobs. Storage errors remain visible in the main project status.

## What actually ran

Private outputs: `outputs/benchmark-ad-v1/no-crumbs-benchmark.png` (1080x1350), `hero-supplied-ai.png`, `original-only-comparison.png`, `comparison.jpg`, `phone-preview.png`, `index.html`, and exact `verification.json`/`sources.json`/`model-readiness.json`. These are actual HTTP exports, not UI screenshots. Photos/PNGs/fixtures remain gitignored.

Selected the close-up cinnamon-roll reference after inspecting the original/enhanced dataset. Original `heroshotV2_og.jpeg` has nine rolls in a white pan. Supplied `AI_enhanced/hero shot.png` is more appetizing and removes distracting surroundings, but changes frosting coverage, cinnamon contrast and spiral/roll details. Its original model/prompt are unknown. It is **not** ground truth or a new generation from this implementation. Both original and supplied reference retain original bytes/hashes. A separate original-only ad is included for honest fidelity comparison.

The chosen hero uses the supplied AI edit with explicit FFmpeg crop/uniform Lanczos resize, restrained gamma/color/contrast, and mild sharpening. Ad export uses resvg, the authentic website logo as a separate unregenerated image, Georgia/Arial system fonts, a restrained dark gradient and the website-supported slogan **Leave nothing behind.** No invented offers, quantities, ingredients, prices or scarcity. No CTA button: product and slogan carry the image, website is the quiet action. Inspected full-size and 360px-wide actual exports: headline readable, no overlap, food remains dominant, correct logo aspect. Website/product kicker are intentionally secondary. Owner postability/fidelity approval remains **PENDING**. Overall requested *new AI hero generation* acceptance is **BLOCKED**, not passed by this import/finish path.

## Real generation boundary / limitations

Separate `hero_zimage_experimental.json` uses LoadImage -> ImageScale -> VAEEncode -> KSampler -> VAEDecode, through the existing Comfy SDK -> proxy -> ComfyUI execution and queue/progress. Production keyframe/video workflows are unchanged. Uses existing manifest components: Z-Image Turbo, Qwen3 encoder, FLUX ae VAE (Apache2; [model/source](https://huggingface.co/Comfy-Org/z_image_turbo), [official img2img documentation](https://github.com/huggingface/diffusers/blob/main/docs/source/en/api/pipelines/z_image.md)). No new dependencies or model downloads.

Experimental defaults: 768x960 center crop, seed1,24 steps,CFG1,res_multistep/simple,denoise0.3 (bounded0.2..0.55), AuraFlow shift3. Prompt comes from editable reference-preservation instructions and `brandContext()` product description/tone/guidelines; inferred Brand DNA is not independently verified. Model/prompt/seed/strength/source SHA/workflow SHA travel with each result. This is latent img2img, not an identity-lock/edit-specialist or multi-reference model. It can change product details/angles. Generation **NOT RUN**: live ComfyUI has only LTX2B/T5 video weights; image diffusion/encoder/VAE weights are missing. Node/required-input schema matches the live installation. `/api/hero/reimagine` returns503; no silent photo fallback or automatic download. Installed pack would only make the experiment runnable, not prove quality.

Next best improvement: separately approve a compatible open-weight reference-edit model/weights, then test one matched cinnamon-roll pair with source-conditioned lighting/background changes. Require no invented ingredients/roll structure, believable frosting and phone-size superiority to this candidate. Do not substitute prompt-only text-to-image for product editing. No paid infrastructure, LTX tuning or general template expansion in this milestone.

## Reproduction and evidence

With existing private `sources.json`/normalized files and brand demo available, run using Node22.20+:

```
node adstudio/scripts/hero.test.mjs
node adstudio/scripts/hero-http.test.mjs
node adstudio/scripts/hero-demo.mjs
```

Set `OSH_TEST_URL` for the actual server (default8301). Demo reads exact original paths/hashes from private sources.json; it does not discover/download substitute photos. Re-running intentionally creates fresh local outputs. Actual FFmpeg tests cover all directions, hashes/dimensions, decode/path/filter/copy rejection, missing sources, explicit review gate, error recovery and honest missing-model503. Serializer + memory-driver Blob roundtrip/isolation/legacy migration passed; **actual browser IndexedDB, responsive UI and downloads NOT RUN** (Computer Use apps=[],browsers=[]). Manual acceptance is in BROWSER_ACCEPTANCE.md. Director source, setup/model/download/activity/audio/frame/FPS compatibility retained; both apps build and regressions/live media integration pass. PR3 remains draft.
