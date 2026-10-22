# Fidelity prototypes — measured comparison, 2026-10-22

Base: updated main `09a39c6`, branch `feat/adstudio-fidelity`. Existing Creative generation, Director calls, model selection, export/edit endpoints and `shot_ltxv.json` remain intact.

## Input and reproduction

Test photo: [packaged cookies from the user-authorized bakery website](https://www.nocrumbsbakery.store/assets/packaged-cookies.jpg), 1086×1448. Two cookies in clear bags on parchment, with two printed “Thank You” stickers. These are printed-label tests; they do not establish preservation of every brand's logo or tiny text. Raw photos and visual evidence stay local/gitignored.

- Original JPEG SHA-256: `99a67c3c1d311afc87df545b61e8eb2bce3751b7c4e7863b6c74c0e1fdd23ac2`.
- Normalized PNG SHA-256: `285cf93f45c0f05be4e8da27fc1aa1973f791b8ddeaa31a23009cad8424a5cb0`.
- Creative model: `ltxv-2b-0.9.8-distilled.safetensors`, `t5xxl_fp8_e4m3fn_scaled.safetensors`, Euler, 8 steps, CFG 1, 24 fps, seed **1**, requested **3 s** (73 frames, ~3.042 s).
- Postprocessing: existing FFmpeg **9.0.1** / libvpx-vp9 lossless WebM / libx264 CRF 20 MP4. No new models, adapters or dependencies. Camera has no model, seed or prompt.
- Hardware: RTX 3080 10 GB, ComfyUI 0.42.4. Timings below are local observations, not promises.

Exact Creative/background prompt:

> Two packaged chocolate chip cookies on brown parchment inside clear plastic bags, resting on a wooden table. Very slow smooth camera push in. Preserve the cookies, chocolate chips, plastic folds and both round Thank You stickers exactly. No new text, no hands, no opening the bags. Clean studio background, controlled lighting, smooth camera movement. Preserve the reference product appearance and branding. No added text.

Run `acceptance.mjs` with that prompt, normalized PNG, seed 1, duration 3 and fitted guides per ratio. Then:

```powershell
$env:OSH_TEST_URL='http://127.0.0.1:8294'
node --experimental-strip-types adstudio/scripts/fidelity-compare.mjs <creative-report.json>
node adstudio/scripts/fidelity-gallery.mjs <creative-report.json> <fidelity-report.json>
```

The Creative background is reused for the locked comparison so compositing differences are not confounded with another model draw. Reports retain exact requests, hashes, rectangles, source model prompt/seed, media probes, timings, sampled frames and measurement data. Camera repeatability compares every decoded frame, not container bytes.

## Approaches and findings

| Approach | Framing / identity / lettering | Motion and visual quality | Observed processing time, landscape / vertical / square |
| --- | --- | --- | --- |
| Creative (unchanged LTX) | Fitted photo stays broadly recognizable; cookie chips, bag folds and sticker scripts deform. Strict identity/text FAIL. | Can invent movement; requested push-in not reliably followed. Most integrated scene appearance, but unsuitable when exact package details are essential. | 20.6 / 6.7 / 10.6 s, then ~0.1 s MP4 export |
| Product-Locked prototype | Static original-photo rectangle at ~82% fit over LTX background. Protected core and all three annotated feature regions exactly match the resized/color-converted reference in lossless WebM. Not full-resolution/source-RGB or lossy-MP4 identity. | Product does not animate. Hard photo-panel boundary is visible. Generated background blurred/dimmed after an initial unblurred prototype exposed duplicate bag edges. This is compositing, not a cut-out/segmentation mask. | Reuses Creative time + 0.2 / 0.3 / 0.3 s compositing; ~0.1 s export |
| Camera push/pan | Whole original photo inside margins; no model repainting. Resampling/encoding still affect small letters. | Push 1.00×→1.08×; pans use fixed 1.06× zoom and crop-center travel ±2% of width. Camera-right moves photo left. Predictable flat-photo animation; no 3D/parallax or invented product motion. | Push 0.3 / 0.5 / 0.5 s; pans 0.2–0.3 s; ~0.1–0.2 s export |

All **12** prototype cases (3 ratios × locked/push/pan-left/pan-right) passed media and MP4-export checks: correct sizes, 24 fps, 73 frames. All nine camera recipes were rerendered and had identical decoded frame hashes. Pixel-derived photo bounds at first/middle/final verified push size increase, pan direction and no source clipping. Pure geometry tests also check bounds at every recipe frame over multiple durations/source shapes.

## What the preservation measurements prove

Product-Locked core excludes four pixels around the photo boundary to avoid chroma mixing with moving background. Compare decoded RGB with the original resized via Lanczos and the same RGB→YUV420→RGB conversion. MAE is mean absolute error per channel on the 0–255 scale, not an OCR or aesthetic score.

| Format | Protected rectangle x/y/w/h | WebM core and feature ROIs | MP4 core MAE at frame 0 / 36 / 72 | MP4 sticker ROI MAE range |
| --- | --- | --- | --- | --- |
| 512×288 | 168 / 26 / 176 / 236 | One unique core frame across all 73; source MAE 0 | 1.882 / 1.884 / 1.890 | 2.496–2.514 |
| 288×512 | 26 / 98 / 236 / 314 | One unique core frame across all 73; source MAE 0 | 1.802 / 1.809 / 1.814 | 2.185–2.557 |
| 384×384 | 74 / 34 / 236 / 314 | One unique core frame across all 73; source MAE 0 | 1.810 / 1.813 / 1.816 | 2.244–2.530 |

Source-pixel feature rectangles: top cookie `(210,440,440,350)`, top sticker `(650,330,180,210)`, bottom sticker `(790,760,150,220)`. Each maps inside the protected core. All had zero WebM reference MAE and one unique decoded patch across 73 frames. Sticker patches are only 24–39 pixels wide after fitting: unchanged pixels do not guarantee readable small text. MP4 compression is measurably lossy and temporal error varies slightly.

The protected photo is static by design. These measurements do not establish general masked generation, unseen brand/logo fidelity, arbitrary camera paths, captioned-pixel identity or browser playback quality. Tagline compositing can cover protected details and still needs the browser checks below.

### Additional No Crumbs logo-source check

The earlier user-provided 122×101 logo screenshot was also composited over its recorded Creative outputs. Screenshot SHA-256: `027a15e8258fe99e7154093c9f93210e8086464920a68e758f0620df61a4b07d`. This deliberately uses the same low-resolution source rather than claiming recovered detail from a higher-resolution replacement.

Prior Creative reference: seed 1 / 3 seconds, same LTX model; recorded landscape/vertical/square times 50.8/6.7/10.5 seconds. Exact prompt: “A slow subtle camera push toward the bakery logo. Keep the exact lettering, circular emblem, colors and layout unchanged. No new text, no distorted letters, no rotation. Clean studio background, controlled lighting, smooth camera movement. Preserve the reference product appearance and branding. No added text.” Letter/ring/emblem drift was visible in that reference.

On this branch, all three locked logo cores had one unique decoded patch over 73 frames and zero error against the resized/color-converted source reference. MP4 core MAE at frames 0/36/72: landscape 0.946/0.941/0.941; vertical 1.056/1.050/1.051; square 0.895/0.891/0.891. Compositing took 0.1–0.2 seconds. First/middle/final sheets show the wordmark remaining static. Low source resolution and compression still limit readability; the clipped outer ring in the supplied screenshot is not restored. The same nine camera repeatability/media/export cases passed for this source too.

Logo evidence: `outputs/acceptance-2026-10-22T01-48-07-009Z-2be769/fidelity-2026-10-22T16-52-52-468Z/`. Its LTX background footage is an earlier recorded run, not a newly timed generation on this branch.

## Actual visual evidence and acceptance boundary

Local evidence root: `outputs/acceptance-2026-10-22T16-38-54-137Z-5b2539/`. Creative first/middle/final sheets are in that folder. Final comparison: `fidelity-2026-10-22T16-47-14-952Z/`, including JSON metrics, WebM/MP4 files, repeat renders, contact sheets and a self-contained **gallery.html**.

Sampled frames show Creative sticker/foil drift; locked product details remain static with an intentionally obvious photo-panel style; Camera retains the photo and has the expected move. An earlier unblurred-background comparison is retained under `fidelity/` as evidence of the duplicate-edge defect, not the final prototype.

Browser upload/preview/progress/caption/export/download/recovery acceptance is **NOT RUN on this branch**. Earlier automation was physically interrupted; no bypass attempted. Follow [BROWSER_ACCEPTANCE.md](BROWSER_ACCEPTANCE.md) in a fresh authorized session. Automated HTTP download/probe tests are not browser download proof. Overall status: prototype media/processing PASS, Creative strict fidelity FAIL, browser release acceptance PENDING.
