# Local product campaigns — 2026-10-27

The default Klein option now isolates the original product and integrates it into
a real generated environment. It does **not** put the original photograph in a
frame. Product-safe and older framed/background takes remain unchanged.

## Shipped path

Existing product/website → source facts and direction review → Klein →
`/api/hero/campaign` → native BiRefNet mask → Klein environment → original product
pixels with grounding shadows → deterministic campaign lettering → PNG.

Both models run through **Comfy SDK → existing proxy → local ComfyUI**. Nothing
uses a partner API, paid service or remote private-photo upload. One prepared
receipt permits one pipeline (one extraction plus one diffusion job), with no
automatic retry. Queue/resource admission, source/original hashes, reviewed plan,
exact environment-prompt hash, overall deadline and exact-job cancellation remain.
Missing/untested extraction prevents AI availability; Product-safe still works.

BiRefNet native `LoadBackgroundRemovalModel` / `RemoveBackground` produces the
matte. Declared tray/dish/pan assemblies use a convex contour repair to retain
container seams; bottles retain a soft matte. Empty/ambiguous masks fail closed.
The intact assembly scales proportionally, fits in frame and receives contact
and diffuse shadows. No product geometry is generated. Matte quality still needs
inspection. The source photograph's lighting is retained.

The environment brief uses category, reviewed direction, tone and preferred
palette. Food uses tactile warm material/light; coastal beauty uses wet mineral
texture and water caustics; other beauty and graphic/material directions use their
own surfaces. Product descriptions are excluded from the diffusion prompt after
a prototype invented an extra baked object. Full factual evidence stays in the
reviewed plan. Advanced shows the exact model prompt before submission.

Raw environment, isolated original, integrated scene, source hashes, both job IDs,
prompt, seed, workflow hashes and final exports persist with the project. The raw
result is saved before deterministic export; an export failure does not require
another generation. No DB version/origin change. Historical exports use their
saved original scene/recipe, never nest an already lettered advertisement.

## Models and setup

- Existing FLUX.2 Klein 4B distilled FP8, Apache-2.0; same pinned checkpoint,
  VAE and reused Qwen3 4B FP8 encoder. No new image-generation model.
- Added **BiRefNet**, MIT, native Comfy implementation already installed:
  [Comfy-Org pack](https://huggingface.co/Comfy-Org/BiRefNet), revision
  `35767b272f2846752a3aee1259abdd4586f735c8`,
  `background_removal/birefnet.safetensors`, **444,473,596 bytes**, SHA256
  `9ab37426bf4de0567af6b5d21b16151357149139362e6e8992021b8ce356a154`.
- No dependency install. Total four model components: **10,483,303,459 bytes**;
  only the 444 MB extraction file was downloaded this sprint.
- `python adstudio/scripts/install-klein.py --models-dir <folder> --with-cutout`
  is read-only verification. Only an explicit `--install` downloads missing pins.
  Existing encoder required; no competing model packs or automatic download.

## Real evidence

Private gallery and actual downloaded PNGs:
`outputs/generative-ads-browser-2026-10-27T15-21-52-289Z/comparison.html`.

| Case | Native Klein / mask | SDK pipeline | Click → completed ad |
| --- | --- | --- | --- |
| No Crumbs cookie tray | 6.311 s / 1.473 s | 12.418 s | 16.215 s |
| Licensed cosmetic bottle | 6.679 s / 1.847 s | 16.530 s | 20.709 s |

Native histories show **no cached nodes** in these final jobs. Raw Klein output
512×640; integrated scene 768×960; exported ads 1080×1350. Peak observed **total**
GPU use, including other desktop allocations, 9,476 MiB on RTX 3080 10 GB.
These are measured examples, not performance guarantees.

The final isolated Chrome test actually imported both originals, edited manual
brand preferences, developed/reviewed directions, generated Product-safe and AI
results, observed progress, edited copy, downloaded valid PNGs, rejected duplicate
receipts and reopened the real IndexedDB data after refresh/project switching.
Original/normalized, matte/environment/scene hashes and prior takes/exports all
passed. The owner's actual profile was never opened or changed.

Opaque matte pixels match the retained source RGB exactly: 658,067 bakery pixels
and 16,422 beauty pixels, zero mismatches. Other pixels use the soft matte. This
is a pre-scaling proof, **not** a semantic segmentation or final-pixel certification.
The cookie count and arrangement visibly match the source; the bottle's blank
label/pump are original. Glass transmission and edge lighting are not solved.

Beauty source: [Content Pixie / Unsplash](https://unsplash.com/photos/cq1zGLQIFyA),
[Unsplash license](https://unsplash.com/license). Field Study is a fictitious test
brand, not a claim of affiliation. No prices, ingredient/efficacy claims or offers.
Manual fixture palette/tone are not claimed to be official researched branding.

## Why reference-only editing was not promoted

`klein4b_scene.json` is a separately pinned native reference workflow. Real local
tests produced richer scenes but changed cookie count, chip positions and tray
pose; one tray became implausibly upright. Those are **failed strict-fidelity
candidates**, retained in the private gallery/evidence, not the default UI path.
The optional `/api/hero/scene` research path stays distinct. Its raw PNG validation
checks native input bytes, graph/prompt and source hash; normal Comfy collision
names such as `reference (1).png` are supported without allowing traversal.

Browser testing also found and fixed request-ID/progress wiring, text-planner
cache retention blocking image admission, and a stale final save overwriting the
initial export record. Cache release applies only to our own last terminal job
with an idle queue; it never interrupts another job or stops another application.
Raw outputs survive validation failures in diagnostics; none are presented as
verified images until checks pass. Earlier rejected files/logs remain intact.

## Validation and limits

Typecheck/build, **72 JS regression files (24 Director)**, six focused local-AI
CPU suites and five real offline-API FFmpeg media regressions pass. The media tests
must use their API harness; direct invocation without it gave connection refusals.
CPU tests cover real PNG rendering, opaque-source pixels, mask rejection, geometry,
hash/review invalidation, exact reference input, receipts/cancellation, unavailable
AI fallback, historical export and recovery after a deterministic export failure.

No Director source changes. Latest shared main is reconciled on the feature
branch; draft PR stays unmerged. Original No Crumbs nine-roll references, prior
Qwen output and campaign plan hashes remain unchanged. Qwen/Z-Image weight
availability is unchanged; no paid operations occurred.

**Owner creative approval is pending.** These are source-preserving flat-lay
campaigns, not synthesized product relighting or a guarantee of perfect matting.
Food source lighting is still harsh; translucent/reflected materials retain some
source-background color. New product types, readable branded packaging and every
format need their own visual checks. The fitted 4:5 scene never stretches/crops
product edges in other formats, but those compositions are only CPU-tested.

Owner check: open `http://127.0.0.1:8301/adstudio/` → product → Develop/review →
Klein → Generate ad → compare original/matte/environment → edit → Export PNG.
