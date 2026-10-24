# Qwen real-app acceptance: prepared, not demonstrated

2026-10-24, integrated main includes Ad Studio6f6b29b and Studio eb57686. **Browser Hero acceptance NOT RUN; live app inference NOT RUN.** Owner granted fresh unpaid browser permission. Computer Use recovered an initial geometry error, observed a saved Composer project at8300, then stopped because current-URL confidence was insufficient. No further browser calls or controller bypass. Target8301 review/isolation/refresh remains manual. Prior standalone images are not app acceptance. Repository integration follows the newer shared-main instruction; no PR merge operation or paid execution was initiated.

The owner confirmed the saved project origin is **http://127.0.0.1:8301/adstudio/**. Keep this exact host/port/profile. Do not open the remote API as the UI, clear browser data, import a replacement demo over the existing project, or move to localhost/another port.

## Architecture

```text
Existing browser / IndexedDB / Hero UI (127.0.0.1:8301)
  -> existing local /api/hero/qwen + local activity
  -> optional Qwen-only relay -> authenticated SSH 127.0.0.1:28301
  -> same application API on GPU host
  -> existing Comfy SDK -> proxy28189 -> ComfyUI28188
       readable /workspace/qwen/ComfyUI/models; pinned SHA256 before submit
  <- raw PNG + provenance -> durable verified LOCAL outputs -> browser history
```

All GPU-host services bind loopback. Only SSH22 is allocated; no public HTTP/Comfy endpoints, network volumes or additional services. Ordinary local outputs, brand research, Composer, Director, project storage and other generation endpoints are not redirected. No storage schema changes. The remote package contains committed public `shared/`, pinned package lock and API startup files, never local outputs, .env, browser data or photos.

`QWEN_APP_RELAY_URL` is opt-in, fixed to loopback28301. The normal local runtime is unchanged when unset. Local and remote one-job receipts use exclusive creation: restart, second click, timeout or corrupt delivery cannot automatically submit another job. Approval binds exact browser origin, real project/brand/source/product IDs, original/normalized hashes, reviewed model-prompt hash, seed42 and tested code commit. The UI manifest records project id/name; optional fourth OSH.qwenHero argument carries project identity without breaking old calls. A stale/missing independent Pod heartbeat fails closed; its local mirror is separate from the Windows watchdog heartbeat. Model verification is retained, not replaced by trusting a tunnel.

Before returning success, the relay saves and fsyncs the raw PNG, original, reference, provenance and local opaque PNG, then reads back their hashes and publishes `collection.json` plus a local status receipt. Remote graph/model/source/job metadata and raw PNG CRC/pixels/executed prompt are checked. The collection monitor verifies all five files again and deletes the exact Pod. The browser receives a local URL; downloading/saving the take can finish after the Pod disappears. Original/reference/project Blobs and prior local takes remain local. Actual IndexedDB behavior still needs browser acceptance.

## Gates before requesting a paid session

1. Follow the first section of [BROWSER_ACCEPTANCE.md](BROWSER_ACCEPTANCE.md) at the confirmed origin. Record actual observations. The interrupted browser session is a blocker, not a pass; resume only when the owner authorizes another session, or use owner-reported manual observations.
2. In Hero choose the genuine original nine-roll photo, **Qwen**, Authentic enhancement, seed42. Inspect/correct source observations and direction, then **Use this reviewed direction**. Do not substitute an AI-enhanced source. Expected original JPEG SHA256 is `4d75113286150db970511ea426c2573e6caca9a84937dee80dc251e231583a71`; normalization may differ from the benchmark guide and must be bound to the actual browser bytes.
3. Advanced -> Exact model prompt / request manifest -> **Download brief and request JSON**. This is a local manifest, not inference. After owner review, bind it locally:

```powershell
python adstudio/benchmark/qwen-app-prepare.py --draft "$env:USERPROFILE/Downloads/generation-brief.json" --origin http://127.0.0.1:8301 --out outputs/qwen-app-acceptance/session
python adstudio/benchmark/qwen-app-prepare.py --bundle --out outputs/qwen-app-acceptance/session
```

The plan starts with `paidApproved:false`, `privateUploadApproved:false`, `podId:UNALLOCATED`. Preparation does not read credentials or contact any service. Package from committed tested HEAD only; do not package dirty working files. No reviewed browser manifest has been provided yet. Exports without real project/brand/source identity must be re-exported from the existing browser project, not filled in by an agent. The compiled direction is not automatically owner-approved.

## Proposed resource limit (requires NEW explicit approval)

One on-demand Secure A40 48GB; existing pinned image `runpod/comfyui@sha256:7ed65713a24c7c836cea8e5ba338ee140b0257b0a086cc3835784e0473efe2f2`;30GB container +80GB Pod-local /workspace, no network/global volume; SSH22 only. Existing corrected GPU/RAM/CPU/disk diagnostic and fresh authenticated independent watchdog must pass **before** the three pinned30.17GB FP8 weights download. No GPU switch or retry Pod.

Read-only quote on2026-10-24: Secure A40$0.59/hour. Current official storage pricing is$0.10/GB/month for running container/Pod disks;110GB is approximately$0.0153/hour with a720-hour month. Existing lease conservatively allows$0.02/hour storage: total$0.61/hour, at most$1.22 over2h before any additional quoted charges. [Runpod storage/billing terms](https://docs.runpod.io/pods/pricing).

Propose **$2 total cap, preserve at least$4, two hours from creation, stop at$1.80 estimate or earlier, one image only**. Recheck actual offer, complete storage charges, balance, automatic reload off and empty resource inventories immediately before creation. Abort if any fee/allocation cannot fit. Current sanitized account/quote evidence stays private in `outputs/qwen-app-acceptance/preflight/`. A read-only GET proves authentication, not Delete permission; prior exact-Pod cleanup and mocked watchdog tests are evidence, while fresh Pod-side heartbeat/readback are mandatory after creation. No new Pod/weights/private transfer/spend occurred during preparation.

## Startup AFTER separate approval only

These are operator commands for the future session, **not authorization**. First prepare/review the browser manifest and public package while free. Use a fresh isolated session folder; never reuse prior leases/receipts. Provision through the existing controlled MCP/guard procedure, not a new deployment system. Creation must start `qwen-guard.py --approved --boot` with temporary termination credential, exact image/name/creation/deadline and SSH public key. Start the existing retained Windows guard before creation:

```powershell
$env:QWEN_SESSION_DIR = (Resolve-Path outputs/qwen-app-acceptance/session).Path
python adstudio/benchmark/qwen-guard.py --approved --wait
```

After approved creation: retain exact `lease.json`, complete `pod-readback.json`, verified SSH host key in `known_hosts`. Check actual Secure A40 allocation, quote/storage, CUDA memory>=44GiB, CPU>=8, usable RAM>=44GB and free workspace>60GB. Never infer VRAM from the provider host-RAM field. Authorize the private plan with the exact Pod ID only after owner approval; its source/prompt/seed/commit must remain unchanged. Retain independent provider watchdog and local monitor concurrently:

```powershell
# Separate retained terminal; finally deletes exact Pod on collection/failure/cutoff.
python adstudio/benchmark/qwen-app-monitor.py --approved
# Bootstrap existing pinned ComfyUI/proxy and approved weights; NO inference here.
python adstudio/benchmark/qwen-ssh.py --approved
# Upload PUBLIC code + approved hash-only plan; start SAME application API.
python adstudio/benchmark/qwen-app-ssh.py --approved
# Two retained SSH processes, in separate terminals:
python adstudio/benchmark/qwen-app-ssh.py --approved --tunnel
python adstudio/benchmark/qwen-app-ssh.py --approved --heartbeat
```

GPU-host startup: `/workspace/qwen-app/adstudio/benchmark/qwen-app-start.sh --approved` verifies package hashes, exact Pod/watchdog/health/model pins, installs an isolated SHA-pinned Node22.20.0 and `npm ci --ignore-scripts` from the existing lockfile. It sets ComfyUI28188, SDK/proxy28189 and readable models directory, strips provider/HF credentials from the API process and listens28301. Startup errors trigger the Pod-side abort file. New Node/dependencies use the existing runtime; no new inference stack/model.

After confirming no local active jobs, restart only the existing Ad Studio server at its SAME origin/port with temporary process env (do not change runtime setup or .env):

```powershell
$env:QWEN_APP_RELAY_URL = 'http://127.0.0.1:28301'
$env:QWEN_APP_SESSION_DIR = (Resolve-Path outputs/qwen-app-acceptance/session).Path
& 'outputs/runpod-integration/node-runtime/node-v22.20.0-win-x64/node.exe' node_modules/vite/bin/vite.js --host 127.0.0.1 --port 8301
```

Keep this local server running after remote cleanup. Confirm `GET /api/hero/capabilities` shows Qwen available (nodes/names/file sizes); no inference from discovery. The API streams all three weight SHA256 checks before submitting. **Do not use qwen-execute.py or qwen-render-runpod.mjs**: those standalone benchmark runners do not establish app acceptance.

## One real job and cleanup acceptance

Return to the existing browser project, retry model connection, confirm exact reviewed source/direction/seed and click **Generate with Qwen once**. Observe local tracked progress and the actual remote Comfy job. Do not retry an uncertain failure. Relay must verify/collect locally before delivery. Monitor terminates immediately on verified collection or failure; independent Pod-side deadline/$1.80 guard remains armed if this PC disconnects. A disconnected PC can lose uncollected results; cleanup takes precedence over extending the budget.

Record visible raw comparison, job/provenance/model hashes/timing; wait for browser Saved. Verify history/source/brief survive refresh at8301 and project switching after remote Pod deletion. Download raw hero PNG and compare SHA with collection/provenance. If IndexedDB save fails, retain tab and use Retry saving; do not regenerate. Local collected evidence remains available even if the browser was closed.

Confirm exact-Pod GET404 and full empty Pod/network/global-volume inventories; Pod-local/container disks delete with Pod. Reconcile billing/balance (delayed itemization is not zero spend). Collect setup/diagnostic logs via existing SSH collection before termination when possible; raw output/provenance collection has priority. Remove only temporary relay env on next local restart; never delete project storage or local originals/outputs. Stop at one job, no automatic sessions.

## Evidence and remaining blockers

- PASS: integrated typecheck/build;18 Studio regressions,15 Ad Studio/client/adapter/workflow regressions and18 Python CPU tests including collection/finally cleanup; bash syntax/default dry runs. Explicit mocked inference tests are not real GPU or browser results.
- PASS actual local HTTP8301: capability reports missing Qwen files, stale prompt409/activity error, malformed body400, wrong adapter400, Hero module200. Existing output/provenance access remains local in relay configuration.
- Preserved: Director source, existing workflows, model pins, project schemas, old raw images/ad, originals and unrelated dirty working files. No UI changes.
- NOT RUN: target8301 browser review/invalidation/project switching/IndexedDB refresh (fresh authorized Computer Use stopped on insufficient current-URL confidence; no bypass); owner-approved browser request binding; Linux API startup, real app SDK job and collection against a GPU. No current local Qwen weights.
- Next authorization gate: owner performs/confirms short browser checklist and approves exact exported direction/source, then explicitly approves the proposed single paid session. The milestone remains incomplete until the actual UI job and post-refresh retrieval pass.


Integration findings: tracked Qwen graph uses LF; its previous CRLF-working-copy pin was corrected to8dc8cda519f67c812b77543990d14adb647ff413f92423718bf889515bed1bd6. Graph content/model/sampler are unchanged; strict validation now passes Git/archive bytes. See notes/cross-project-handoff.md for current shared capabilities and adstudio/REACT_MIGRATION.md for deferred service-first migration. Active main worktree outputs/adstudio-main-integration shares existing ignored outputs; use that worktree for subsequent source changes, never recursively copy the outputs junction. Current native prompt/precision/caption and Qwen discovery on8301 are unavailable even though Comfy/proxy are healthy. No setup/model download was performed.
