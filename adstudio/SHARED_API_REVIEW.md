# Shared API review: Ad Studio P0

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
