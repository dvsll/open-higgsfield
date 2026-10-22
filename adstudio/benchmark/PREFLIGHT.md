# Final no-spend preflight — 2026-10-22

**Deployment: NO-GO today.** Preparation and local tests pass; account access, free CPU-container validation, a live quote and explicit deployment/private-transfer approval are still required. No Pod, billing, heavyweight model download or product-photo upload occurred. PR #2 stays draft; browser acceptance is separately NOT RUN.

## Findings and changes

| Check | Evidence / disposition |
|---|---|
| Exact image | Public registry manifest/config confirms Linux/amd64, the pinned `7ed657…` digest and `/start.sh` entrypoint. No image layers pulled. The mutable tag still resolves to that pin; scripts use the digest. Runtime contents are **not** proven by metadata alone. |
| Old prebuilt Comfy | Image build source bakes0.30.0; LTX node1.1.0 declares>=0.35.0. Keep the fresh pinned Comfy checkout and isolated28188/28189 endpoints. Do not use the old default8188 service or Manager auto-update. |
| Dependencies |109-package Linux/Python3.12 hash lock resolves, but imports/pip-check have not run in the image. Potential ABI/native-library/system-site-package conflicts are a **pre-spend blocker** until the CPU check below passes. No Docker runtime is installed here. |
| CUDA/RAM | Candidate is Python3.12 / CUDA12.8 / torch2.10.0+cu128 / one A10080GB. Removed unverified12.9 host-filter entry. Request now requires110GB RAM; health requires100GiB actual RAM, matching the intended117GB offering with conservative BF16 offload headroom. This is engineering headroom, not a measured memory requirement. Native1088×1920 GPU fit/latency remain unknown. |
| Model access | Pinned repository is gated (`auto`); an unauthenticated HEAD returns401. User must accept the repository's conditions, then all **five** exact pinned files must pass authenticated HEAD/size checks before any Pod. Optional prompt enhancer/API encoding are absent; no additional enhancer model is needed. |
| Watchdog readiness | Previously a live process could be unauthenticated. Now startup/setup/download/render require matching authenticated heartbeat evidence; stale/mismatched proof blocks work. The watchdog rechecks identity/rate and refreshes proof only on success. Financial lease validation also remains active under Python optimization. |
| Failure cost | Source fetches and pip waits are bounded; setup/weight failure triggers verified termination. Download checks heartbeat/deadline per block and enforces45-minute bootstrap limit. Complete verified `.part` files are promoted without an invalid end-of-file Range request; mismatched ranges cannot append. Startup health failure terminates instead of proceeding. |
| Before upload | SDK runner requires the external heartbeat and remote health/weight-hash report tied to the same Pod/deadline/pins. It rechecks immediately before lazy upload; keeps four-attempt ledger and bounded render/download waits. Missing evidence stops before private transfer. |
| SDK MP4 transport | **PASS on existing local services**, synthetic CPU graph only: SDK → proxy0.1.6 → RepeatImageBatch/CreateVideo/SaveVideo → downloaded H.264 MP4,73frames/24FPS. No model nodes. Evidence: private `outputs/benchmark-preflight-20261022/transport-*/result.json`. This reduces output-serialization risk; it does not validate the pinned remote image or LTX generation. |
| Clock/config | Documented Runpod API1 does not promise `createdAt`; lease starts from a saved local timestamp immediately before the approved create request. No clock reset after restart. Shell credentials/lease variables must be exported in each SSH session. Public package transfer now uses tracked-only `git archive`, excluding ignored credentials/cache/private files. |

Public sources rechecked: [image build pins](https://github.com/runpod-workers/comfyui-base/blob/33dfcd67fd5dfa666bc339aae4b92cf25d292a8b/docker-bake.hcl), [LTX node requirement](https://github.com/Lightricks/ComfyUI-LTXVideo/blob/220e1d45aa0469f518e982102fca4dca92a61862/pyproject.toml), [model access/conditions](https://huggingface.co/Lightricks/LTX-2.5), [Pod API fields](https://docs.runpod.io/api-reference/pods/GET/pods/podId). Small public metadata/HEAD checks only; no Runpod account API was called.

## What is needed from you

| You control | Needed action / information | What can be automated afterward |
|---|---|---|
| Runpod account | Confirm available research credits and any funding/tax/fees. Obtain a current **unsubmitted** quote for one on-demand Secure A100 PCIe80GB, >=110GB RAM/8vCPU,30GB container+200GB Pod volume, no network/global volume. Provide region, rate, storage charge and quote time/screenshot; do not click Deploy or top up on my behalf. | Validate request/quote arithmetic, save pre-request timestamp, prepare lease and exact commands. Actual create remains approval-gated. |
| Hugging Face account | Log in to Lightricks/LTX-2.5 and personally review/accept Agree and Access, including the stated information-sharing/consent conditions. Supply a read token with gated access **privately through environment/local secret storage**, not chat or Git. | `access.py --check-head` checks all five files without downloading weights. Account consent cannot be automated for you. |
| Runpod credentials | Privately configure an ephemeral key with Pod read/terminate permissions, plus billing/volume read access (separate read-only credential where supported). Confirm permission scopes; a successful GET alone does not prove DELETE permission. | Watchdogs, named-resource checks, deadline/rate enforcement, DELETE/404 verification and independent billing audit. Keys are never logged or baked into images; revoke after deletion. |
| SSH access | Select your existing SSH public key, retain its private key locally, and later verify the provider's host fingerprint/Connect details. Never send a private key in chat. | Tracked source archive transfer, SSH tunnels and log/report collection using the approved connection. No product photos are included in the archive. |
| Monitoring / free CPU host | Identify an existing **free Linux/amd64 Docker host** for the check below, or make local Docker available separately. Also confirm an always-awake external watchdog host and your2h45m manual console fallback during the later paid session. | CPU import/schema/transport validation, local/remote heartbeat checks and artifact collection. No new cloud/CI runner is provisioned for this check. |
| Final approval | After the above evidence and quote: explicitly approve **one <=3h session, <=$6 initial total, $10 research total**, download of the pinned model bundle, and transfer of only the two selected prepared guides: original cookie and **printed-label surrogate**. Input selection was already approved; this still does not authorize transfer or deployment. | Execute the reviewed setup/health/SDK render/collection/termination sequence. No further model/prompt sweep, automatic second session, spending of the reserve, production promotion or merge. |

Do not paste any token, private key or full credential-bearing Pod response into chat. Public SSH key, redacted quote and the explicit scope decision suffice here; secrets belong in private environment/local storage. Verify both Runpod credentials belong to the same account/organization as the quote and record an initial positive Pod identity/owner check: a404 or empty billing list under a wrong account is not proof of deletion/zero spend. Synchronize host clocks before creating the lease. A genuine branded-product photograph is **not required for this initial surrogate experiment**; actual brand-logo fidelity will remain untested.

## Free CPU check before spending

`Dockerfile.preflight` uses the same pinned image, commits and hash lock. Its whitelisted context contains no photos, secrets or model files. It installs only software dependencies and starts Comfy with `--cpu`; there is no `--gpus` option or model download. **NOT RUN here** because Docker is unavailable. Use an already available free host; do not rent one or trigger a potentially billable CI job.

```sh
docker build --platform linux/amd64 -f adstudio/benchmark/Dockerfile.preflight -t adstudio-ltx25-cpu-check adstudio/benchmark
docker run --rm --name adstudio-ltx25-cpu-check -p 127.0.0.1:28188:28188 -p 127.0.0.1:28189:28189 adstudio-ltx25-cpu-check
```

From another terminal on that host with this repo's existing npm lock installation (Node>=22.18 recommended; local22.14 transport test passed but is below the repo's declared engine):
```sh
node --input-type=module -e "import {benchmarkGraph,validateGraph} from './adstudio/benchmark/graph.mjs'; const r=await fetch('http://127.0.0.1:28188/object_info'); if(!r.ok)throw Error('Comfy not ready'); validateGraph(benchmarkGraph({prompt:'CPU schema check'}),await r.json(),{weights:false}); console.log('PASS pinned CPU graph schema; no weights queued');"
# Set COMFY_BASE_URL=http://127.0.0.1:28189 and BENCHMARK_COMFY_URL=http://127.0.0.1:28188 in this terminal.
node adstudio/benchmark/transport-smoke.mjs --run-local
docker stop adstudio-ltx25-cpu-check
```

On a separate free host, use an authenticated SSH tunnel for these loopback ports. Save build/import logs and both PASS results privately. Fix import/schema/transport failures **before** approving any GPU lease. Docker build has network/package download needs and several GB of image/software disk use, but no model weights/private assets; it must use a free existing machine. No CPU-container validation pass is claimed until executed.

## Cost and remaining risks

Published reference:3h×$1.79=$5.37 compute;230GB running/container storage at$.10/GB/month adds about$.0945 using730h/month, **~$5.47 before tax**, not a live quote. Initial all-in ceiling$6; reserve at least$4 of the$10 total. Tax/top-up fees and exact provider month divisor must be verified from the account/quote; do not silently spend beyond either ceiling. [Pricing](https://www.runpod.io/pricing), [per-second billing](https://docs.runpod.io/pods/pricing), [storage lifecycle](https://docs.runpod.io/pods/storage/types).

Remaining risks: A100 stock/actual download throughput, cold image initialization, native-resolution model OOM/latency, software/GPU compatibility beyond CPU imports, and provider control-plane/billing delay. A1Gbps host filter is not a sustained HF download guarantee. If readiness is not achieved by45minutes, terminate and report; leave at least30minutes before starting a new render. Ten dollars does not guarantee a useful model result.

No provider-enforced TTL was verified. Independent watchdogs begin DELETE five minutes before the three-hour boundary and retry until404; provider/API failure can defeat any client-side monetary guarantee. An always-awake independent host, verified credentials and manual console fallback remain required. A stopped Pod still bills storage: terminate and independently reconcile the bill; no retained paid volume or automatic top-up.

## Tests performed in this task

PASS: public metadata/digest/gating checks; default no-action paths; local synthetic SDK/SaveVideo MP4 test; financial/lease and fresh-heartbeat/matching-health gates; six lifecycle and four download/redirect tests; Node/Python/Git Bash syntax and shell dry runs. Model access with your token, CPU image build/imports, A100 generation/quality, real Runpod deletion and settled billing remain NOT RUN. Existing Director source/runtime/fallback graphs and earlier evidence are unchanged.

Full paid-operation commands and exact model pins remain in [README.md](README.md). This report adds prerequisites; it grants no approval to execute them.
