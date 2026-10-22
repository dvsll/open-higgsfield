# Shared API review: Ad Studio P0

## Current integration review — feat/adstudio-workspace, 2026-10-22

Draft review: https://github.com/dvsll/open-higgsfield/pull/2 . Keep draft pending browser acceptance; no auto-merge. GitHub connector lacked write permission; the existing authenticated CLI created the draft successfully.

Supersedes the historical fidelity audit below. Latest fetched main remains `9921282`. Integration commit `74fd500` reconciles it with `d46e789` through a union of audio and product-video services; no whole stale shared-file replacements. Persistence `7210bad`, workspace `115755c`, and saved-history hardening `3fb7600` are separate reviewable commits. Studio source and production shot_ltxv JSON exactly match integrated main. No merge into main or default-model change.

Review shared diff with `git diff origin/main...feat/adstudio-workspace -- shared/runtime shared/workflows/CONTRACT.md`. Preserve both audio and product routes, FLAC serving, AAC/Opus preservation, keepAudio, frame/FPS controls, model-string/options SDK signatures, model catalog and timed connection health. Additive `GET /api/capabilities` in the workspace commit probes FFmpeg independently of ComfyUI, without queueing work or starting the proxy. The response distinguishes API support from `/api/models` runnable weights/nodes. Existing endpoints are unchanged.

PASS: build/typecheck, both app regression suites, client calling conventions, live silent/audio trim/speed/reverse/resize/export, all Product-Locked/Camera formats, FLAC serving, malformed-input/decode recovery and unchanged source hashes. Isolated offline-Comfy API also produced all three Camera template recipes and adjusted MP4 exports. No new GPU renders; Creative workflow unchanged and commercial quality still FAIL. Browser/actual IndexedDB/playback/layout acceptance NOT RUN due to unavailable Computer Use Node runtime. See WORKSPACE.md for exact tests and remaining manual checks.

Separate `adstudio/benchmark/` package is preparation only, absent from production imports/runtime model catalog. No cloud resources, model downloads or private uploads occurred. A100 execution/deletion/billing remain explicitly approval-gated and untested. Generic printed-label input is not proof of brand-logo fidelity.

## Historical review before integration

## Current review — feat/adstudio-fidelity, 2026-10-22

Final readiness audit against main `3ab79dc`: one API route conflict (retain **audio AND product-video**), two client declaration conflicts (retain product types/method, audio, keepAudio, frame/FPS and timed health), one contract append conflict, plus both notes files. Preserve main's FLAC handling, audio readiness, audio-aware edit/export and model/audio workflow bundle. Do not replace services with branch-old files. Current branch remains compatible with its Director; an integrated main candidate is not tested/merged. Full resolution matrix and required coexistence tests: [CONDITIONING_DECISION.md](CONDITIONING_DECISION.md). No shared production code changed during the final strength test.

Creative motion findings are in [CREATIVE_MOTION_INVESTIGATION.md](CREATIVE_MOTION_INVESTIGATION.md). The current milestone selectively ports main `f604c8d`'s shared frame/FPS controls into the existing fidelity branch: optional `frames`/`fps`, response timing metadata, frame-rate conditioning/output and guide snapping. Existing model-string/size-object calls and default duration mapping remain supported; product-video additions remain intact. Review the milestone commit's `shared/runtime/api.ts`, `shared/runtime/client.ts` and `shared/workflows/CONTRACT.md`; no existing workflow JSON, Studio source or production sampler changes. Separate main audio/projects work was intentionally not imported. Typecheck/build, client/Director tests and live rejection/export/product checks pass; browser/playback acceptance remains pending. Do not merge automatically. The P0 review below is historical.

Integration update (2026-10-21): user explicitly requested merging this branch into main. Shared conflicts resolved to retain local model selection alongside upload/dimensions/export. Fifth `OSH.shot` argument accepts a model ID or `{width?, height?, model?}`. Typecheck/build, shared-client compatibility regression, live HTTP smoke, model discovery and real FFmpeg export pass on the merged checkout. Quality/browser acceptance limitations below remain outstanding; this integration does not claim acceptance.

Branch: `feat/adstudio-p0`. Existing draft: https://github.com/dvsll/open-higgsfield/pull/1 . Keep it draft until product/browser acceptance is evaluated. Do not merge automatically.

Review the shared diff against `main`:

```sh
git diff main...feat/adstudio-p0 -- shared/runtime/api.ts shared/runtime/client.ts shared/workflows/CONTRACT.md .env.example
```

| Change | Contract / compatibility |
| --- | --- |
| `POST /api/upload` | PNG data URL → opaque `/outputs/<hex>.png`, width and height. 8 MB JSON / 5 MB decoded / 2048px per side limits. Same access gate as generation. Checks PNG header/dimensions; not a full image decoder. |
| Optional shot dimensions | Width/height apply to latent and every guide scale; 256–1024, snapped to 32, max 768×768 pixels. Omitted values remain 768×448. Existing four-argument `OSH.shot` calls remain valid. |
| Shot image validation | Existing API-owned PNG URLs still work. Non-PNG keys rejected before SDK submission. No graph node IDs, sampler settings or model files changed. |
| `POST /api/export` | API-owned WebM + optional API-owned PNG → H.264/yuv420p silent MP4. FFmpeg executable configured with `FFMPEG_PATH` or PATH. Arguments are passed without a shell; filters are fixed. |
| Output serving | Adds `video/mp4` MIME type. Existing PNG/WebM URLs remain valid. Uses full-file GET responses; byte-range seeking is not implemented. |
| Queue | Export shares the existing four-job serialized queue with generation; it can delay a subsequent Director render. Export timeout is 90 seconds. No remote ComfyUI/proxy exposure changes. |

The known-good fallback is the unchanged `shared/workflows/shot_ltxv.json`, SHA-256 `c711d545fc60c853b144ef96420fe9b049f1b91fd943f61f41144e25a2190e7b`. No LTX-2.5 migration is included. No `studio/` source files changed.

Verification: `npm run typecheck`, `npm run build`, `node adstudio/scripts/smoke.mjs`; live synthetic SDK render and FFmpeg export checks have passed. Commands and quality findings for real-product acceptance belong in `notes/adstudio.md`; synthetic/API checks alone do not establish browser or branding fidelity. A live Director generation with omitted dimensions has not been rerun on the partner machine.

Review focus: compatibility of optional dimensions and strict PNG keys with Director, whether sharing the generation queue with export is acceptable, and output playback/download behavior. Track acceptance blockers in the draft PR instead of presenting the current dev model as a production-ready branding-preservation guarantee.
