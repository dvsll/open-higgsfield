# Open Ad Studio

Brand + original photograph ? three creative directions ? explicit owner review
? Qwen product photograph ? editable advertisement ? verified PNG export.
The accepted React interface is the primary entry. Original image Blobs, brands,
projects, takes and exports persist in the existing browser database. Logo artwork
and accurate text are composed separately from the model-generated photograph.

## Run

Node 22.20.0 is tested; the shared package requires >=22.18. From current main:

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 8301 --strictPort
```

Open **http://127.0.0.1:8301/adstudio/**. Existing users must keep this exact
host/port and Chrome profile. Do not clear storage or change origins to fix a
missing model. The root `npm start` still opens Director; it was not repurposed.
Local editing, deterministic planning and historical-image PNG composition work
without ComfyUI. `Project & tools` retains the existing specialist workspaces.

## Models and architecture

Inference uses **@comfyorg/sdk ? comfy-api-proxy ? ComfyUI**, bound to loopback.
The shared setup/installer remains available. Model installation is separate from
generation. See [contracts](../shared/workflows/CONTRACT.md).

| Capability | Requirement and actual evidence |
|---|---|
| Source-led baseline planning | No model. Explicitly deterministic suggestions, no photo analysis. |
| Optional local AI creative planning | Qwen3 4B FP8, Apache-2.0; one 5.63 GB encoder and native CLIPLoader/TextGenerate/SaveText nodes. Encoder installed/checksum verified; real local inference completed but its concepts failed schema/evidence validation. App honestly used deterministic fallback. [Actual activation evidence](CREATIVE_ENGINE.md#latest-real-activation--2026-10-26). |
| Reference-conditioned photograph | Qwen-Image-Edit-2511 FP8, Apache-2.0; three pinned files, 30.17 GB, API-readable matching model directory. One A40 48 GB app execution proved historically; local weights absent. [Pins](../shared/workflows/hero_qwen2511_contract.json), [integration](QWEN_HERO_INTEGRATION.md). |
| PNG composition/export | CPU Resvg. Verified PNG, saved immutable history and download request; OS download completion is browser acceptance. |
| Optional Camera/video tools | FFmpeg Camera is deterministic 2D motion. LTX-2B Creative failed commercial-motion acceptance. Historical LTX-2.5 feasibility is not a product-fidelity guarantee. |

Director's newer **Qwen-Image 2512** text-to-image pack does not satisfy the
Ad Studio Qwen editing workflow. Z-Image, audio/captions and other Director packs
are optional, not prerequisites for this primary path. No silent model fallback.

## Use

Choose/create a brand, genuine original and minimal owner description. **Develop
advertisement** reuses saved context. Choose/refine a concept, then **Accept
direction & confirm facts**. No proven vision model extracts those observations.
Generate is separate, deliberate, and disabled when weights/services are missing.
Advanced retains exact prompt, evidence, seed and reviewed-request export.

Compare delivered work with the original. Edit copy/format live, confirm fidelity,
then **Export PNG** composes, verifies, durably saves and requests download in one
action. Saved advertisements retry download without inference. Never retry an
uncertain paid generation. Keep originals/outputs private and back them up along
with browser data; local server plans are not cloud-synchronized storage.

## Verify

```powershell
npm run typecheck
npm run build
npm run test:creative
npm run test:adstudio-ui
npm run test:studio
node --experimental-transform-types adstudio/scripts/creative-local-check.mjs
```

The last command is read-only. `--run` explicitly requests one local text-only
job on an owned synthetic fixture, only if the encoder is available. It never
requests image inference or downloads weights. Fallback is not an AI success.

One historical real app Qwen image with full provenance is retained privately.
Its enhancement was subtle; product details can drift. No new campaign photograph
was generated this sprint. Postable quality still requires actual generation and
owner inspection. [Readiness](SUBMISSION_READINESS.md), [demo storyboard](DEMO_STORYBOARD.md),
[browser checks](BROWSER_ACCEPTANCE.md) and notes/adstudio.md distinguish verified
behavior from remaining acceptance. No fidelity guarantee is made.
