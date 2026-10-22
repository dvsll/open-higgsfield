# Camera motion correction — 2026-10-22

**Encoded jitter reproduced and substantially reduced. Human playback acceptance remains pending.** Camera Mode is deterministic 2D photo animation, not cinematic AI or 3D motion. Creative and Product-Locked workflows are unchanged.

## Diagnosis and smallest correction

The exact baseline renderer from `2d38051` was rerun locally on the original four-cookie photograph and the approved printed-label surrogate. Three templates, 73 frames/24 FPS, all existing dimensions. The original input files were rehashed unchanged. This is a reproduction of the old renderer, not a claim to have recovered the user's particular shaky download.

Baseline `zoompan` enlarges its input 4× but samples directly to final resolution; integer crop/scale rounding produces irregular frame steps. Uniform encoded timestamps (41.666–41.667 ms) argue against an encoding-time pacing defect. They cannot rule out browser/player scheduling issues. Linear motion also begins/ends abruptly: 8% push, fixed 1.06× pan zoom with 4% crop-center travel.

Correction: retain planar RGB during sampling, use an 8× input and 4× `zoompan` output, then Lanczos downsample before YUV420 conversion. Use smoothstep easing, a 4% push and 2.4% pan travel at 1.04× zoom. A 4×-input prototype improved photographs but failed the synthetic frame-jitter threshold; the 8× input passes. These are a combined sampling/pacing change; the photo comparison is not an isolated attribution of each individual contribution.

The photograph remains aspect-fitted inside the same protected margins. No endpoint, input, output type, frame count/FPS, source asset, Director edit/export, generation graph or model default changes. New takes use the revised recipe; existing videos/history are not rewritten. Peak sampling memory/CPU increases, bounded by existing small output sizes and 90-second timeout.

## Actual measurements

Adjacent-frame similarity registration in the central 60% of the photograph, excluding padded background. Values below are **MP4** estimates; lossless VP9 independently passes the same improvement bounds.

| Original / template | Motion error RMS, before → after (px/frame) | Unexpected acceleration RMS, before → after (px/frame²) |
|---|---:|---:|
| Cookies / portrait push | .332 → .023 | .602 → .026 |
| Cookies / landscape pan | .267 → .037 | .504 → .053 |
| Cookies / square pan | .257 → .029 | .480 → .038 |
| Printed label / portrait push | .323 → .021 | .587 → .023 |
| Printed label / landscape pan | .258 → .044 | .485 → .068 |
| Printed label / square pan | .258 → .035 | .485 → .050 |

Motion error is deviation from the recipe's own unquantized transform, not displacement or a quality score. Unexpected acceleration measures changes in that error. Measured after-pan travel is approximately −13.1px landscape / +9.9px square; push accumulated scale ~1.042–1.043 versus intended 1.04. Accumulated small registration errors bias scale; do not interpret this as exact zoom metrology. Fractional-translation/scale calibration passes at .025px/.0002× tolerances. Compression, interpolation, ROI choice and small motions limit accuracy.

First/middle/final RGB contact sheets for all six revised clips were visually inspected: tray outline, chip positions, bag silhouette and lettering remain consistent, with no new clipping or product warping observed in those frames. Small text remains limited by the low output resolution. Full playback was **NOT RUN**: fresh Computer Use stopped because it could not confidently determine Chrome's URL; no input or alternative automation bypass followed. This is not commercial/browser acceptance.

Six local CPU renders took 1.30–1.39s each, versus .06–.09s before; MP4 exports .11–.15s versus .04–.06s. Hardware/load dependent, not a promised UI latency. Prompts/seeds/models: none.

## Reproduction and private evidence

`outputs/camera-motion-20261022/index.html` contains side-by-side playable baseline/revised videos and first/middle/final contact sheets for both photos and all three templates. Open locally; **do not publish this folder**. `baseline.json`, `candidate.json` contain input/source/video hashes, exact FFmpeg filters/arguments, dimensions, timings and timestamps. `metrics.json` contains every adjacent-frame estimate in both lossless and exported media. The initial 4× prototype is retained separately under `initial-4x-input/`.

```powershell
$env:NODE_OPTIONS='--experimental-strip-types --disable-warning=ExperimentalWarning'
node adstudio/scripts/camera-evidence.mjs --run-local '<private-original-folder>' baseline
node adstudio/scripts/camera-evidence.mjs --run-local '<private-original-folder>' candidate
# Existing Comfy Python provides NumPy/Pillow; no package installation required.
python adstudio/scripts/camera-metrics.py --self-test
python adstudio/scripts/camera-metrics.py outputs/camera-motion-20261022 --assert
node adstudio/scripts/camera-frames.test.mjs
node adstudio/scripts/product-video.test.mjs
node adstudio/scripts/integration.test.mjs
```

Evidence generation refuses to overwrite existing assets. Use a clean private output folder/archive existing evidence before rerendering. The test preparation uses FFmpeg normalization; browser Canvas bytes are not claimed identical.

PASS: actual-frame determinism/jitter/pan-direction/vertical-stability tests on a synthetic fiducial for all three templates; source bounds across formats/durations/source shapes; matched real-photo metrics in lossless and MP4; silent/audio-bearing edits/exports, FLAC serving, invalid-input recovery, original hashes and offline Camera API operation; both applications' domain regression suites; typecheck/build. The patch also applies cleanly to latest main06d936d in a detached validation worktree, where both-app suites/build and live CPU API/media checks pass with newer Director source untouched. No branches were merged. Next: full playback of all three revised templates, then the persistent-project walkthrough. PR #2 was externally merged before this push; keep the follow-up draft pending review.
