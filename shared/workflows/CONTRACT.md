# Workflow contract

One section per workflow. The apps only talk to workflows through what is listed here.
Export workflows from ComfyUI with **Save (API format)** and commit the JSON next to this file.

## Template

### `<name>.json`
- **Used by:** studio / adstudio
- **Models:** e.g. LTX-2.5 + IC-LoRA … (open weights? yes/no)
- **Inputs:** node `<id>` `<field>`: image (PNG) / text / number …
- **Outputs:** node `<id>`: MP4 / PNG
- **Render time:** `<seconds>` on `<GPU>` at `<resolution, length>`
- **Notes:**

## Workflows

### Fidelity postprocessing API (2026-10-22, additive)
- `POST /api/product-video`: `{image: "/outputs/<hex>.png", mode: "locked"|"camera", ratio: "16:9"|"9:16"|"1:1", duration: 2..5, background?: "/outputs/<hex>.webm", motion?: "push"|"pan-left"|"pan-right"}`. Locked requires a background from the existing SDK shot path. Camera uses only the source photograph and FFmpeg.
- Returns API-owned lossless VP9/yuv420p WebM plus seconds, frames, width/height, mode/motion and protectedRect (locked only). Fixed development sizes: 512×288, 288×512, 384×384. Frame count follows 8n+1 at 24 fps. Existing `/api/export` can add a PNG tagline and encode MP4; MP4 is lossy.
- Locked overlays an ~82%-fit static original-photo rectangle over blurred/dimmed LTX footage. This is not product segmentation. Four-pixel-inset core measurements on the cookie test prove resized/color-converted WebM preservation only; no universal strict-fidelity claim.
- Camera push/pan recipes and protection bounds are fixed in `shared/runtime/product-video.ts`; no client filter expressions/paths are accepted. Existing access gate, opaque outputs and shared four-job queue apply. 90-second FFmpeg timeout, partial-output cleanup; no changes to existing generation/model/Director signatures.
- Camera sampling correction (2026-10-22): new takes use eased 1.00×→1.04× push, or eased 2.4% crop-center pan travel at 1.04× zoom; RGB 8× input/4× output sampling followed by Lanczos downsample. Same dimensions, 24FPS and duration mapping; originals/old takes retained. This is conventional 2D animation. Creative/Locked/Director routes and audio behavior unchanged. Evidence and playback limits: `adstudio/CAMERA_MOTION.md`.

### Local model discovery and selection
- `GET /api/models`: returns `keyframe`/`video` arrays of `{id, label}` for installed workflow-compatible models, plus `inventory` groups `{category, files}` from the connected ComfyUI. Config/custom-node source files are excluded from model inventory. Supporting models and workflow node classes must exist before a choice is offered.
- 2026-10-22 additive metadata: choices also include `family`, `description`, `capabilities` (`name`, `status`, `detail`, optional UI `control`) and `timing` (baseline range/workload/provenance). Capability statuses describe the connected app workflow, not theoretical model support. `research` lists completed local LoRA-lab model bundles from their manifest; these are not runnable choices. Old ID/label consumers remain compatible.
- `POST /api/keyframe` and `POST /api/shot` accept optional `model` (the catalog ID). Missing IDs use the first compatible installed choice; unsupported/unavailable IDs return HTTP 400 before generation. The selected ID sets the workflow's UNET/checkpoint loader. Discovery downloads nothing and does not imply every listed model has an app workflow.
- Browser methods: `OSH.models()`, `OSH.keyframe(prompt, seed, size, model?)`, `OSH.shot(keys, prompt, duration, seed, model?)`.
- Merged client compatibility: the fifth `OSH.shot` argument accepts either a model ID string (Director) or `{width?, height?, model?}` (Ad Studio or combined use). Omitting it preserves default dimensions and the installed default video model.

### Local export API (postprocessing, not a generation workflow)
- `POST /api/export`: `{video: "/outputs/<hex>.webm", overlay?: "/outputs/<hex>.png"}` → `{url: "/outputs/<hex>.mp4", seconds}`. Only existing API-owned files are accepted, under the same localhost/token gate. Source WebM is kept.
- Uses local FFmpeg (`FFMPEG_PATH` or PATH), H.264/libx264, yuv420p, no audio, faststart. Optional static PNG is composited at 0,0; Ad Studio creates a same-size transparent tagline PNG in the browser and uploads it. No client-provided filesystem paths, shell commands or filter expressions.
- Shared queue, 90-second export timeout; failure removes partial MP4. No generation models or workflow JSON change. FFmpeg must be installed separately.

### Video editing and exact sizes (2026-10-22)
- `POST /api/edit-video`: `{video, start?, end?, speed?, reverse?, width?, height?}` → `{url, seconds, width, height}`. `OSH.editVideo` mirrors this. Only API-owned WebM/MP4 sources; original is kept. Trim bounds 0–60 seconds, end after start; speed 0.25–4; whole-pixel dimensions 16–4096, at most 4096×2160 total pixels. Local FFmpeg trims, optionally reverses, changes speed, resamples to 24 fps and scales with Lanczos to VP9 WebM without audio. Same gate/queue, 90-second timeout, no client filter/shell strings, partial output cleanup. This is conventional resizing, not learned super-resolution.
- Generation accepts exact whole-pixel dimensions. Image bounds 256–1536; video 256–1024 and at most 768×768 pixels after padding. Internal latents round up to 16 pixels (image) or 32 (video); a core `ImageCrop` after decoding returns the exact requested output size. Existing aligned defaults are unchanged.
- `GET /api/models` additionally returns top-level `timing`: actual ComfyUI GPU identity/VRAM, hardware-specific measured render samples, last observed model and queue depth. Successful uncached SDK executions are saved in gitignored `outputs/render-timings.json`; cached sampler executions are excluded. UI uses nearby measured workloads, actual padded dimensions/frame count, model-switch overhead and missing-keyframe work. Unknown hardware without samples needs a benchmark. Queue wait is separate; another Comfy client can change model residency.

Dev set: small + fast, for iterating locally on 12 GB cards (4070 Super; should fit a 3080 with ComfyUI offloading, untested).
Swap to LTX-2.5 + IC-LoRAs on a rented 32 GB+ GPU for final renders.

### `keyframe_zimage.json`
- **Used by:** studio (Generate keyframe, missing keyframes before a shot); available to adstudio
- **Models:** Z-Image Turbo bf16 + Qwen3-4B fp8 text encoder + ae VAE (Apache-2.0, open)
- **Inputs:** node `5` `text` (prompt) · node `8` `seed` · node `7` `width`/`height` (default 768×448)
- **Outputs:** node `10`: PNG
- **Render time:** ~7 s warm, ~18 s cold, 768×448, 8 steps, RTX 4070 Super (2026-10-21)

### `shot_ltxv.json`
- **Used by:** studio (Generate shot); the same pattern works for adstudio's product shots
- **Ad Studio integration (2026-10-21):** `/api/upload` accepts a PNG data URL (5 MB decoded, max 2048×2048) and returns an API-owned `/outputs/<hex>.png` for the existing keyframe input. `/api/shot` optionally accepts width/height (256–1024, snapped to 32, max 768×768 pixels); sets both latent and guide scale sizes. Omitted dimensions retain the Director's 768×448 default. Ad Studio uses 512×288, 288×512, 384×384 and generates each format separately through the SDK. No workflow JSON or model changes.
- **Models:** LTX-Video 2B 0.9.8 distilled + T5-XXL fp8 (open weights)
- **Inputs:** node `3` `text` (motion prompt) · node `7` `length` (frames, 8n+1, 24 fps) · node `14` `noise_seed` · keyframe *i*: image node `5` / `5NN`, guide node `8` / `8NN` (`frame_idx`, `strength`)
  - The file has one keyframe guide. `shared/runtime/api.ts` clones nodes 5/6/8 per extra keyframe (`shotGraph()`) and snaps `frame_idx` to multiples of 8 (last key = `-1`).
- **Outputs:** node `17`: WEBM (VP9)
- **Render time:** ~20 s for 3 s (73 frames) from 2 keyframes; ~32 s for 4 s including generating 2 missing keyframes. 768×448, 8 steps, RTX 4070 Super (2026-10-21)

### Optional shot guides (2026-10-22)
`POST /api/shot` accepts `keys: []` or omitted keys for text-to-video; up to eight image guides remain optional. Zero-key graph removes LoadImage/ImageScale/LTXVAddGuide/LTXVCropGuides and connects text conditioning plus EmptyLTXVLatentVideo directly to the existing scheduler/sampler/decode. Same SDK/proxy path, model, dimensions, frame cap and output. Studio sends only keys with actual images and never silently generates missing images. Start/end UI anchors send t=0 / current shot duration; regular keys send their timed position. Guidance remains approximate, not an exact reproduction promise.

### Explicit frame timing (2026-10-22)
Optional shot fields `frames` (integer9–121, `(frames-1)%8=0`) and `fps` (1–120, float) set latent length, conditioning node11 frame_rate, output node17 fps and guide frame snapping. Explicit duration is frames/fps; response adds fps and duration. Omitted frames retains existing 1–8s duration mapping/cap and omitted FPS retains24. OSH.shot fifth options argument accepts both fields. 121 is the current app workload cap; installed ComfyUI node exposes a larger theoretical maximum. No workflow JSON/model changes.

### audio_stable.json / local soundtrack (2026-10-22)
- Stable Audio Open1.0 (Stability AI Community License, Powered by Stability AI), Google T5-base (Apache2); built-in nodes only. Source https://huggingface.co/Comfy-Org/stable-audio-open-1.0_repackaged ; encoder https://huggingface.co/google-t5/t5-base . Model entries in runtime/models.json.
- POST/api/audio `{prompt, duration?, seed?, video?}` → `{audio, video?, duration, seconds}`; OSH.audio mirrors it. Prompt1–1500chars, duration0.1–47s (latent minimum1s), seed uint32. Optional input must be API-owned existing WebM/MP4. Graph1 checkpoint,2 text encoder,3/4 text,5 seconds conditioning,6 latent seconds,7 seeded30-step sampler,8 decode,9 SaveAudio FLAC. Generated text audio is separate from video, not synchronized foley/lip-sync.
- Shared SDK/proxy/queue and local/token gate; outputs accepts opaque FLAC with audio/flac. Optional FFmpeg mux maps only video0/audio1, copies WebM video (MP4 re-encodes VP9), encodes stereo Opus, pads/trims to requested duration; fixed filters, 90s timeout, partial mux cleanup and source preservation.
- GET/api/models adds audio.available/model. Audio model execution is recorded for hardware/model residency; UI video estimate explicitly excludes the additional audio job.
- Export now maps optional source audio to AAC. edit-video maps optional audio, applying areverse/atempo with video trim/speed; `keepAudio:false` performs video-only edits. Silent inputs remain supported. Director linked/unlinked state is browser project data; unlinked audio is not altered by video-only Edit.

## 2026-10-22: local service capabilities (Ad Studio workspace)
`GET /api/capabilities` uses the existing access gate and returns boolean API support (`upload`, `shot`, `keyframe`, `audio`, `productVideo`, `editVideo`, `exportVideo`) plus `ffmpeg.available`. FFmpeg is probed with `-version`, 3s timeout, 30s cache. It does not contact ComfyUI, start a proxy, queue jobs or download models. API support does not imply installed weights: `/api/models` remains authoritative for compatible model/node availability. Camera/Adjust/MP4 may be enabled while ComfyUI is offline. Existing routes/signatures unchanged; audio-aware edits/exports and product generation coexist.


## 2026-10-23: local Ad Composer (additive, no model workflow changes)
- POST `/api/media`: raw MP4/WebM or audio MIME (MP3/WAV/M4A/FLAC/Ogg), <=100MiB, <=600s. FFprobe validates content/dimensions. Returns `{url,kind,duration,width,height,audio,bytes}` with an opaque immutable output; corrupt new imports removed. Original Blobs live separately in Ad Studio IndexedDB.
- POST `/api/compose-ad`: `{shots:[{source,start,end}],width:720|1080,transition:"cut"|"dissolve",keepAudio:boolean,ctaSeconds:0..8,overlay?:PNG,closing?:PNG,music?:{source,volume:0..1}}`. 1..12 API-owned MP4/WebM shots with >=0.5s trims inside source duration. Positive ending >=0.5s requires closing PNG. Max90s. Contains/pads to9:16 without stretching;24fps,H.264/yuv420p MP4 and optional48kHz stereo AAC. Source audio normalized/crossfaded; music loops/fades. Dissolve overlaps adjacent clips/card by0.3s. Returns `{url,width,height,fps,duration,seconds,audio}`. One local composition (409),240s timeout, originals unchanged. 400 invalid,404 missing,422 decode/render,503 missing tools,504 timeout. No Comfy generation.
- Existing opaque output access gate retained; audio extensions added. GET/HEAD with MIME/Content-Length/Accept-Ranges. One byte range206, invalid416. Existing Director FLAC/MP4/WebM outputs preserved with seek support.
- GET `/api/ad-composer-demo` reads only fixed local `outputs/composer-demo/project.json` (404 absent). Private photos/videos/evidence stay gitignored.
- No existing SDK signature, frames/FPS, audio/edit/export or product-video route changed. Generation remains SDK -> proxy -> ComfyUI. Latest-main integration must retain newer Director services, never replace shared files wholesale.


## 2026-10-23: Ad Studio Brand Intelligence (additive local analysis)
- GET `/api/brand/status` returns `{provider:"none"|"ollama",available,model?,digest?,reason}`. Optional ADSTUDIO_BRAND_MODEL selects installed local qwen2.5:7b-instruct/7b via Ollama127.0.0.1:11434. No keys, cloud fallback, weight downloads or inference when unconfigured. Text-only research, not media generation; existing SDK/proxy workflows unchanged.
- POST `/api/brand/research` `{website}` returns version1 BrandResearch: website, sources with URLs/text/SHA256, source observations, images, palette candidates, structured products, provider/warnings, aiCompleted. Max4 pages/2 stylesheets; bounded bytes/time/redirects; DNS public-only and pinned; no credentials/custom ports/private IPs or script execution. Website content is untrusted model data, no tools; all model text is inference with validated source IDs. Failure is explicit and manual fallback keeps originals. Product prices/availability excluded from draft fields.
- POST `/api/brand/image` `{url}` downloads bounded public PNG/JPEG/WebP after the same URL/DNS controls, validates signature and returns data URL/source URL/SHA256. User chooses retention/association; originals stored locally as Blobs. GET `/api/brand/demo` reads only fixed private outputs/brand-demo/demo.json,404 absent,25MiB cap. Existing auth gate retained.
- Portable contract shared/lib/brand.ts: BrandProfile version1, evidence/corrections/assets/products/reviewed state, `brandContext(brand,productIds?)`. Ad Studio DB3 adds brands without changing old stores/project schemas. Optional project.brandId links profile. Composer uses explicit reviewed name handoff only. No Director source/SDK/shared editing/model capability changes.


## 2026-10-23: integrated runtime and deterministic static ads
- Feature merge3191482 integrates main ea2287b RuntimeSetup/model download/job activity and latest client with all Brand/Composer/product/media routes. Setup keeps its loopback/origin/queued-generation guards. Old model-string and options-object + frames/FPS SDK calls remain valid. No workflow graph/model pin changes.
- POST `/api/static-ad` `{design:StaticDesign,photo:opaquePNG,logo?:opaquePNG,support?:opaquePNG}` -> `{url,width,height,sha256,sources,recipeSha256,renderer,font,photoBox,textBounds,warnings}`. Fixed concept/format schema; source confirmation required; source PNG bounds/signature/native decode checked. Embedded raster images only, escaped text, contain/no stretch, local resvg2.6.2; no arbitrary SVG/network/file reads. Sizes1080x1350/1080x1920/1080x1080. New immutable opaque PNG; 400 invalid,404 missing,409 busy,422 invalid/empty raster. Text bounds are layout estimates; preview/font appearance still needs browser review.
- `OSH.staticAd` additive local wrapper (not a GPU job). Optional supporting imagery reuses OSH.keyframe/shared Z-Image SDK/proxy workflow and model discovery; no auto-download. Original product/logo are separate deterministic layers.
- GET `/api/static-ad-demo` reads only fixed local outputs/static-ads-demo/demo.json (32MiB cap/404 absent), same access gate. Private original photos/generated evidence remain gitignored.
- Existing project schema3 adds optional version1 staticAds workspace (designs/history/immutable PNG export snapshots with Blob asset IDs), defaults empty for legacy data. DB3/stores unchanged. BrandProfile v1 and brandContext reused, independent from Director registry. Source assets/history never overwritten by derived exports.


## 2026-10-23: isolated product hero benchmark (additive)
- GET /api/hero/capabilities: {finish:true,reimagine:boolean,experimental:true}; reference generation requires compatible installed image weights and all nodes. No downloads. Existing /api/models keyframe capability remains prompt-only; not relabeled as product editing.
- POST /api/hero/finish {image:opaquePNG,settings:HeroSettings}: fixed FFmpeg photographic grade + explicit uniform 4:5 crop,1080x1350PNG. Settings: direction natural/warm/clean,zoom1..1.5,x/y0..1,sourceKind original/supplied-ai. Returns url,width,height,sha256,sourceSha256,method,seconds,crop,filter,sourceKind. No AI or supplied filters/paths; source PNG decode/bounds checked,45s timeout,409 busy,partial output cleanup.
- POST /api/hero/reimagine {image,settings}: experimental hero_zimage_experimental.json only; source-conditioned VAEEncode,768x960 center crop,24steps,CFG1,res_multistep/simple,shift3,denoise0.2..0.55. SDK assets.fromFile -> proxy -> ComfyUI; existing GPU serialization/setup guards/activity. Returns source/output/workflow hashes,model,prompt,seed,strength,timing,warning. Missing models/nodes503, no fallback. Real inference NOT RUN; not a commercial fidelity claim. Original production graphs unchanged.
- POST /api/hero/export {hero:opaquePNG,logo?:opaquePNG,reviewed:true,copy:{headline,productName,website}}: real resvg1080x1350PNG, escaped bounded copy, no arbitrary SVG. Hero/logo uniform contain, no logo generation. Review is a customer assertion, not automated identity verification. Returns url,width,height,sha256,sources,seconds.
- GET /api/hero/demo: fixed private outputs/benchmark-ad-v1/demo.json,404 absent,45MiB cap, existing access gate. No user paths. Original/enhanced input provenance and evidence remain gitignored.
- Optional project.hero version1 within Ad Studio schema3/DB3: settings, immutable hero history/source lineage, explicit selected-hero review, immutable export snapshots, Blob asset IDs. Legacy1/2/3 migration additive. Director storage/source unchanged. Existing audio/FLAC/edit/export/product/brand/composition/setup/model-string/options+frames/FPS routes retained.


## 2026-10-23: isolated Qwen2511 benchmark, not production
hero_qwen2511_benchmark.json is an API-format flattening of the official Comfy template pinned in adstudio/benchmark/qwen-hero-pins.json (MIT original notice retained). TextEncodeQwenImageEditPlus CLIP/VAE/image1 conditioning on positive and negative, source VAE latent, index_timestep_zero,40steps/CFG4/euler/simple/denoise1/shift3.1, no Lightning. FP8 editor default, optional BF16 explicitly chosen by standalone benchmark script. All nodes/schema match local0.42.4; actual inference NOT RUN because editor/encoder/VAE weights absent. No new route, SDK signature/default or production model-catalog change. Existing Z-Image /api/keyframe and /api/hero/reimagine are not Qwen-edit endpoints. Standalone check/prepare never submits; opt-in Windows-local render uses SDK -> proxy, requires explicit approval and verifies publisher weight hashes; remote rendering blocked pending a separately approved Qwen lease/health/termination adaptation. All private refs/raw evidence stay outputs/ gitignored.
