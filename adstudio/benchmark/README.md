# LTX-2.5 remote benchmark preparation

Preparation only. No deployment, paid operation, private upload or weight download is authorized yet. Experimental assets never change production defaults. This report records readiness, commands, costs and the approval gate.

**Readiness: prepared for review; NOT validated on a remote GPU.** Static graph/schema checks, hash-lock tests, default no-action paths, mocked termination/identity checks and CPU artifact collection pass. Linux shell execution, remote dependency imports, A100 fit/latency, proxy SaveVideo download, real termination and settled billing remain untested. No claim that this model meets product fidelity or that a three-hour session is guaranteed to succeed.

## Proposed components and licensing (before any future installation)

- LTX-2.5 22B distilled transformer, projected Gemma encoder, video/audio VAEs and spatial upscaler: [publisher bundle](https://huggingface.co/Lightricks/LTX-2.5), [LTX-2.x Community License](https://github.com/Lightricks/LTX-2/blob/main/LICENSE-2_x). Open weights with conditions/revenue threshold; not unrestricted MIT. User must accept the gated repository terms themselves.
- ComfyUI: [GPL-3.0](https://github.com/Comfy-Org/ComfyUI/blob/master/LICENSE). ComfyUI-LTXVideo custom nodes/workflows at the pinned revision use the [LTX-2 Community License](https://github.com/Lightricks/ComfyUI-LTXVideo/blob/220e1d45aa0469f518e982102fca4dca92a61862/LICENSE), January5,2026; retained in LICENSE-LTX-NODES.txt. This differs from the newer model bundle's LTX-2.x terms. The API graph is an adaptation of the official workflow, credited to Lightricks; the app's MIT license does not replace upstream terms. Pin source revisions; do not use automatic Manager updates.
- Runpod ComfyUI container: [official build source](https://github.com/runpod-workers/comfyui-base), third-party packages retain their licenses. Image digest pins the preinstalled Ubuntu/Python/CUDA/PyTorch environment; NVIDIA CUDA terms and PyTorch BSD notices apply.
- Existing Comfy SDK [MIT](https://github.com/Comfy-Org/comfy-typescript-sdk), comfy-api-proxy [MIT](https://github.com/Comfy-Org/comfy-api-proxy). No new application dependency. Use SDK0.5.0/proxy0.1.6 for benchmark consistency.
- Python node dependencies from pinned source: colour-science (BSD-3-Clause), diffusers/transformers/huggingface-hub (Apache-2.0), einops (MIT), kornia (Apache-2.0), ninja (Apache-2.0), OpenImageIO (Apache-2.0). [Node manifest](https://github.com/Lightricks/ComfyUI-LTXVideo/blob/220e1d45aa0469f518e982102fca4dca92a61862/pyproject.toml). Full transitive license notices must accompany any redistributed environment; this package does not redistribute weights or environments.
- Existing uv0.12.5 is used only to resolve a Linux/Python3.12 dependency lock from public metadata; no package installation. FFmpeg is supplied by the proposed container, with build-specific LGPL/GPL obligations. No training, fine-tuning or image-enhancement system.

## Selected environment and reproducibility

One **on-demand Secure Cloud A100 PCIe80GB**, at least64GB RAM/8vCPU (public listing117GB/8vCPU), host supporting CUDA12.8, local SSD, 30GB container +200GB Pod volume. No network/global volume and no spot interruptions. A100 SXM80GB is an alternative only after checking the same price, RAM and availability. [Publisher requirements](https://docs.ltx.io/open-source-model/getting-started/system-requirements) recommend A10080GB/H100,64GB+RAM,200GB+SSD, CUDA12.7+, Python3.12+.

Use the [official Runpod prebuilt ComfyUI image](https://docs.runpod.io/tutorials/pods/comfyui), Linux/amd64 digest in `pins.json`, rather than a bare CUDA image. Metadata reports5.63GB compressed. Its [build source](https://github.com/runpod-workers/comfyui-base/blob/33dfcd67fd5dfa666bc339aae4b92cf25d292a8b/docker-bake.hcl) pins Python3.12, CUDA12.8, torch2.10.0+cu128, torchvision0.25.0+cu128, torchaudio2.10.0+cu128. It bakes **ComfyUIv0.30.0**, too old for the selected node package's declared>=0.35.0 requirement. Therefore use its preinstalled environment but a **fresh isolated pinned Comfy checkout**, not its default graph/server. No Manager auto-updates or inherited custom-node folders in the benchmark checkout.

| Component | Exact pin |
|---|---|
| Image amd64 | `runpod/comfyui@sha256:7ed65713a24c7c836cea8e5ba338ee140b0257b0a086cc3835784e0473efe2f2` |
| ComfyUI | `a40c6ce87ba6358080d85fe4ab339bcb0b2fd020` |
| ComfyUI-LTXVideo1.1.0 | `220e1d45aa0469f518e982102fca4dca92a61862` |
| Official two-stage UI graph | `example_workflows/2.5/LTX-2.5_T2V_I2V_Two_Stage_Distilled.json`, SHA256 `ddd0626416d8ec9faf6cf37c842210ad87e883ba8154f48b1bd5e80e669c0996` at node revision above |
| Model repo | `Lightricks/LTX-2.5@49b093a39c19169a8a81721dcc541e07e945232f` |
| Python overlay | `requirements.lock`,109 resolved Linux/Python3.12 packages with hashes; SHA in pins.json. Resolver success is not import/GPU compatibility proof. |
| SDK/proxy | Existing `@comfyorg/sdk0.5.0` from npm lock; `comfy-api-proxy0.1.6` from Python hash lock |

`pins.json` records each of five model-file paths, sizes and LFS SHA256 values. Total **71,114,917,404 bytes**: transformer42.018GB, projected encoder26.264GB, video VAE1.472GB, audio VAE.365GB, spatial upscaler.996GB. No prompt-enhancer weights or IC-LoRAs. `weights.py` reuses verified existing files, resumes `.part` downloads, refuses mismatched existing weights and verifies full SHA before renaming. No weight download has occurred. [Publisher workflow guidance](https://github.com/Lightricks/ComfyUI-LTXVideo/blob/220e1d45aa0469f518e982102fca4dca92a61862/example_workflows/2.5/README.md).

The prebuilt image caches Python/CUDA packages, **not verified LTX-2.5 weights**. No suitable public cached weight volume was verified. Do not pay for an unverified community template claiming cached models. Prefer a provider host with the image cached and>=1Gbps download;71.1GB alone takes>=9.5minutes at a sustained1Gbps, ~95minutes at100Mbps, before setup/hash checks. Provider documentation allows initialization up to30minutes. All preparation time counts in the three-hour lease. Abort at45minutes if health is still not ready; do not spend the session debugging installs. A custom CPU-built overlay could cache the small source/dependency delta later, but has not been built/pulled here. No Docker runtime is available locally for a container smoke test.

## Isolated graph and inputs

`workflow_api.json` and `graph.mjs` adapt the pinned official local-encoding branch. This is a reviewed API projection, **not an official publisher-distributed API export**. All34 node instances and their classes, input names, links, dynamic options and numeric ranges passed checks against the local ComfyUI schema with missing-weight choices excluded. Remote validation repeats with weights included before submission; any discrepancy stops the experiment.

Settings: final **1088×1920** (official960×544 base transposed to544×960, then2×),73frames/24FPS=3.0417s, seed1, eight-step manual sigma schedule then three-step refinement, CFG1, Euler ancestral first stage/Euler second stage, image strength.7 first/1 second, preprocessing compression18, tiled decode512/64/128/32. These are LTX-2.5 conditioning nodes, not the failed2B AddGuide strength experiment. Frame count/FPS agree in video latent, audio latent, conditioning and encoder. Prompt enhancement disabled; local Gemma encoding; **no API/partner nodes or API keys in the graph**. Optional joint model audio remains in the official AV pipeline; its presence is not audio-quality acceptance. Negative prompt empty. The exact authored positive prompt is in `render.mjs` and every execution record. No prompt/scheduler sweep.

1088×1920 is near portrait, **not exact9:16**; do not stretch it for comparison. It follows official aligned geometry. This is a new model/pipeline/resolution/prompt benchmark, not a parameter-isolated comparison to low-resolution2B. Old results/known-good production workflows stay unchanged.

Private preparation completed: original four-cookie tray and original packaged cookie with generic readable “Thank You” sticker, whole-photo fit with EXIF orientation and dark padding. Sources rehashed unchanged. Private paths, source/guide hashes and preparation settings are only in `outputs/ltx25-benchmark/inputs/manifest.json`. Guides are new1088×1920 PNGs, not claimed byte-identical to prior2B guides. No enhancement, training or private upload. **On2026-10-22 the user selected the printed-label photo as the limited surrogate for the second benchmark case.** That input-selection decision does not authorize deployment, billing, model downloads or private transfer. The separate small No Crumbs logo is not branding printed on this product. Generic sticker preservation can establish only bounded lettering preservation; actual brand-logo fidelity remains untested and is outside this initial surrogate comparison.

Local regeneration (explicit paths; originals never renamed or modified):
```powershell
node adstudio/benchmark/prepare-inputs.mjs <original-cookie-path> <printed-label-product-path>
node adstudio/benchmark/benchmark.test.mjs
python adstudio/benchmark/lifecycle_test.py
```

## Budget and stopping policy

Public prices checked2026-10-22; actual region/stock/tax and deployment quote must be rechecked **before** approval. [GPU/storage prices](https://www.runpod.io/pricing), [per-second compute/storage billing](https://docs.runpod.io/pods/pricing), [storage lifecycle](https://docs.runpod.io/pods/storage/types).

| Item | Three-hour planning amount |
|---|---:|
| A10080GB @ $1.79/hour | $5.3700 |
| Container30GB @ $.10/GB/month | ~$0.0123 |
| Running volume200GB @ $.10/GB/month | ~$0.0822 |
| Total, before tax | **~$5.4645 (budget ~$5.47)** |
| Research ceiling / initial ceiling | **$10 / $6** |
| Reserve after estimated session / minimum reserved under initial cap | ~$4.53 / **$4** |

Storage estimate uses730hours/month as a planning conversion; provider docs verify per-second storage billing and rates but do not establish this exact month divisor. Live quote/bill is authoritative. No ingress/egress fee per Pod pricing docs; [tax](https://docs.runpod.io/accounts-billing/sales-tax) may apply to purchases and is account/location dependent. Do not initiate a top-up, auto-pay or any other paid service. If the full live estimate plus tax/fees exceeds$6, stop for revised approval. Do not borrow the reserved$4 automatically. No retained network volume:200GB for a month at$.07/GB/month would cost$14, exceeding the entire budget. A stopped Pod still bills its volume at$.20/GB/month; **terminate**, do not merely stop.

Hard maximum is three hours from **Pod creation**, including initialization, downloads, rendering and collection. Both watchdogs begin DELETE at2h55m. Target finishing actual work by2h30m; collect continuously. Stop immediately on severe product/lettering damage, broken conditioning, OOM, repeated execution failure or unsafe termination status. First two renders: cookie seed1, printed-label/approved-brand seed1. Review before seed2; at most four attempts total, including failed submissions. No seed2 without acceptable first results and remaining time; no idle GPU while waiting on owner review. Render timeout25min is a stop/review condition, not permission to retry a possibly still-running job.

## Deployment approval gate — nothing below has been executed

Required before a paid action: explicit user approval of one quoted A100 session, <=3h/initial$6/total$10, selected region, storage lifecycle and exact approved input cases; user-controlled HF gated-access acceptance; SSH/public-key configuration; ephemeral Runpod termination credential and separate read-only billing credential where supported; independently hosted watchdog available for the entire session. Credentials stay out of Git/logs. A broad API key is not magically scoped to this Pod by our script; revoke ephemeral credentials after deletion.

Read-only public metadata was accessed during preparation. No Runpod account resources/billing were accessed. `--approved` is a guard against accidental execution, **not a substitute for user approval**.

After approval, review `pod-request.example.json` into a private `outputs/ltx25-benchmark/pod-request.approved.json`, fill session name/public SSH key, confirm the live quote. Only22/tcp is published; no ComfyUI/proxy/Jupyter/file-browser HTTP ports. The example does not itself impose a provider-enforced hourly price cap.

Local PowerShell, **after approval only** (API1 remains documented; do not mix with API2 paths):
```powershell
# RUNPOD_API_KEY supplied privately; do not echo it or store it in source.
curl.exe --fail --silent --show-error --request POST https://rest.runpod.io/v1/pods --header "Authorization: Bearer $env:RUNPOD_API_KEY" --header "Content-Type: application/json" --data-binary '@outputs/ltx25-benchmark/pod-request.approved.json' --output outputs/ltx25-benchmark/pod.json
```
There is deliberately **no provisioning function in the scripts**. Record exact Pod ID/name/created timestamp/live rate from response/console. Populate private `lease.json` from `lease.example.json`: UNIX creation time in seconds, deadline=created+10800, actual storageHourly (expected~.031507), no networkVolumeId. Do not reset created/deadline after a restart. The example lease with created0 is intentionally invalid.

Immediately arm the external watchdog on an independent always-awake host, before waiting for SSH or installing anything:
```powershell
python adstudio/benchmark/lifecycle.py watch --lease outputs/ltx25-benchmark/lease.json --approved
```
Run this in its own retained session. Prevent host sleep/disconnection; confirm its armed message. A second watchdog must run inside the Pod as soon as SSH is available. Neither watchdog is the render worker. Do not rely on credits running out.

Copy **only this public benchmark package** and private lease using authenticated SSH/SCP, after verifying the provider's SSH host identity. Use the actual direct SSH host and mapped22/tcp port from Pod Connect; no guessed host/key or disabled host-key checks:
```powershell
scp -P <ssh-port> -r adstudio/benchmark root@<verified-host>:/workspace/benchmark-package
scp -P <ssh-port> outputs/ltx25-benchmark/lease.json root@<verified-host>:/workspace/lease.json
ssh -p <ssh-port> -L 28188:127.0.0.1:28188 -L 28189:127.0.0.1:28189 root@<verified-host>
```
No photo SCP is necessary: the approved SDK run lazily transfers only its selected guide. Before that, the remote host contains no private images. Inputs still must be explicitly approved for transfer.

Inside the remote shell (separate persistent watchdog session first; Runpod key provided privately, never baked into image):
```bash
export BENCHMARK_LEASE=/workspace/lease.json
python3.12 /workspace/benchmark-package/lifecycle.py watch --lease "$BENCHMARK_LEASE" --approved
# Separate shell. The external watchdog is already protecting all setup time.
bash /workspace/benchmark-package/setup.sh --approved
# HF_TOKEN provided privately after the user accepts model terms.
/workspace/adstudio-benchmark/venv/bin/python /workspace/benchmark-package/weights.py --approved
bash /workspace/benchmark-package/start.sh --approved
# Separate shell after services are ready:
/workspace/adstudio-benchmark/venv/bin/python /workspace/benchmark-package/health.py
```
`start.sh` also arms a watchdog and traps service failure/exit to terminate. A manual watchdog armed before setup remains independent. It starts the fresh Comfy checkout on loopback28188 with API nodes disabled, proxy0.1.6 on28189. The official image's old default server may be idle on8188; never submit to it. If the host can't support the pinned CUDA stack, terminate rather than replacing packages during the paid session.

Locally through the SSH tunnel, using the existing npm lock installation and Node>=22.18:
```powershell
$env:BENCHMARK_LEASE='outputs/ltx25-benchmark/lease.json'
$env:COMFY_BASE_URL='http://127.0.0.1:28189'
$env:BENCHMARK_COMFY_URL='http://127.0.0.1:28188'
node adstudio/benchmark/render.mjs --approved --case cookie --seed 1
node adstudio/benchmark/collect.mjs
node adstudio/benchmark/render.mjs --approved --case printed-label --seed 1
node adstudio/benchmark/collect.mjs
```
The local SDK → remote proxy → remote ComfyUI architecture is preserved. Runner validates graph/model choices before lazy upload, records guide/graph/model hashes, exact prompt, seed, system stats, job ID, elapsed cold/warm occupied time and errors. It writes attempt ledger **before** submission and prevents duplicates. No automatic retry. Remote `health.py` verifies exact commits, Python/CUDA/PyTorch/GPU/RAM, all five weight hashes, FFmpeg, dependency consistency and service health. It never queues a render. Do not use the production `/api/shot` or modify models.json to run this benchmark.

During rendering collect peak GPU state from a separate remote shell, and copy logs before termination:
```bash
nvidia-smi --query-gpu=timestamp,name,memory.used,memory.total,utilization.gpu --format=csv -l 1 > /workspace/gpu-samples.csv
```
```powershell
scp -P <ssh-port> root@<verified-host>:/workspace/gpu-samples.csv outputs/ltx25-benchmark/
scp -P <ssh-port> root@<verified-host>:/workspace/comfy-benchmark.log outputs/ltx25-benchmark/
scp -P <ssh-port> root@<verified-host>:/workspace/proxy-benchmark.log outputs/ltx25-benchmark/
scp -P <ssh-port> root@<verified-host>:/workspace/adstudio-benchmark/pip-freeze.txt outputs/ltx25-benchmark/
python adstudio/benchmark/lifecycle.py terminate --lease outputs/ltx25-benchmark/lease.json --approved
```
The collector verifies output hashes, probes frames/FPS/dimensions, generates seven-frame contact sheets and a private side-by-side input/video HTML gallery. Local downloaded artifacts survive termination. Never delay deadline deletion for unfinished downloads; partial results are acceptable. Never commit customer images, render records or raw media.

### Independent billing/deletion verification

After termination, from a **separate local process/credential**, not the Pod or render process:
```powershell
python adstudio/benchmark/lifecycle.py audit --lease outputs/ltx25-benchmark/lease.json --out outputs/ltx25-benchmark/independent-audit --approved
```
Uses [GET Pod and DELETE](https://docs.runpod.io/api-reference/pods/DELETE/pods/podId), [GET billing/pods](https://docs.runpod.io/api-reference/billing/GET/billing/pods) and GET networkvolumes. Requires GET Pod404; saves filtered billing history, volume inventory and reported amount privately. Billing can lag: repeat after records settle, independently inspect Billing and Pods/Storage in the console and reconcile credit delta against any pre-existing resources. Verify no new retained volume, no running benchmark Pod and zero continuing benchmark storage/compute. Do not delete unrelated volumes. Revoke ephemeral credentials. There is no automatic second session or top-up.

**Safeguard limit:** no provider-enforced three-hour TTL was verified. Both watchdogs issue real DELETE, retry until GET404 and start five minutes early, but neither can guarantee a monetary cap during a provider control-plane outage. A 2h45m independent console alarm/manual termination fallback is required. Do not deploy if both watchdogs/credentials/independent host cannot be verified. Clock drift, host sleep, API changes/rate limits, unavailable A100s and provider billing delay remain risks. Tests simulate termination; they do not prove real deletion.

## PASS / FAIL gate

First score each case separately. A valid MP4 is only a technical prerequisite. **No commercial PASS without normal-speed full playback and owner review**, plus contact sheets/details at frames0/12/24/36/48/60/72. Start every `review.json` at NOT REVIEWED / NOT ACCEPTED; collection never overwrites a human review.

| Dimension | Acceptance requirement |
|---|---|
| Cinematic motion | Clearly visible, smooth, physically plausible requested push with perspective/depth; not just static scaling, padded-background movement, texture crawling or subject melting. |
| Direction | Predominantly forward push; record approximate scale/translation from product-region tracks. Suggested diagnostic: >=3% coherent enlargement across clip and matching direction through most sampled intervals. Not an automatic quality score. |
| Identity | Four-cookie count, silhouettes, major chips/cracks and foil tray remain identifiable in cookie case. Packaged case preserves cookie and package folds/seal/label location. No disappearing parts or invented ingredients. |
| Lettering / brand | Source lettering readable and unchanged through playback, including glyph shapes/colors, no flickering/extra letters. Generic sticker can pass **label** preservation only; actual brand-logo acceptance is untested until a suitable case is approved. |
| Composition | Whole product/critical label intentionally framed, no unintended stretch/cutoff, no padding mistaken for product motion. Inspect edges at final zoom. |
| Temporal quality | No distracting flicker, chip/foil melting, label swapping, unstable reflections or implausible shape changes. |
| Export/reproducibility | Correct1088×1920/73frames/24FPS, playable complete MP4, preserved source SHA, complete settings/model/input provenance, repeated seed run if first results warrant it. Hardware/backend nondeterminism must be recorded. |
| Commercial verdict | Motion **and** fidelity/temporal/framing gates pass together; owner judges clip usable as a product ad. Reject increased motion with recognizable product damage. |

For measurements reuse `adstudio/scripts/motion-metrics.py` with manually selected product-only ROI, source/final frames and pinned FFmpeg/Python/Pillow/numpy. Run its `--self-test` before evaluation; do not silently install measurement dependencies in the cloud. Record track count/inlier coverage, NCC rejection, first/middle/final scale/translation and fit residual. Compare stable silhouette/label/texture crops against the input after alignment. Patch tracks can fail on repeated cookies/reflections/deformation and cannot prove physical camera motion or exact logo fidelity. Displacement outside the product is irrelevant. No quantitative result exists for LTX-2.5 yet.

If either first case has severe identity/label damage, stop and classify the limitation with evidence. If both appear acceptable, seed2 repeat is allowed within the same bounded four-attempt plan after review. No endless tuning. A failed/unknown candidate remains separate from production; LTX2B Creative remains commercial FAIL and Camera/Product-Locked remain honest fallbacks.

## Validation and unresolved items

PASS locally: public metadata revisions/digests/LFS file hashes;109-package Linux/Python3.12 resolution and hash lock; API graph schema excluding absent weights; deterministic graph settings/AV timing, missing-node/link/cycle rejection; default runner/downloader/watchdog no-action paths; five mocked lease/cutoff/identity/DELETE verification tests; Python syntax; Node syntax; CPU fixture artifact collection/contact sheets/gallery. The collector fixture is explicitly synthetic, not an LTX output or quality comparison. Source photos were inspected/prepared locally and rehashed unchanged.

NOT RUN: Linux setup/start shell execution, remote import/pip-check, A100 GPU render/VRAM/latency, real SDK/proxy SaveVideo output compatibility, actual provider deletion and billing, real model video playback/quality, actual brand-logo case. Resolve any import/schema failure before uploading private photos or queueing a paid render. Latest source plus resolved dependency metadata is a **candidate compatible stack**, not a tested environment image. No costs incurred by this preparation.

Exact next milestone: obtain explicit deployment/private-transfer approval and a live quote; execute the original-cookie and user-selected printed-label surrogate seed1 cases under armed watchdogs; terminate, independently settle billing, review motion and preservation together. Do not call surrogate success a brand-logo fidelity pass. Promote no model/default unless that evidence passes. App development/browser acceptance proceeds independently.
