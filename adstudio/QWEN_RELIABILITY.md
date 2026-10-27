# Final local Qwen3 reliability check — 2026-10-26

**DEGRADED GO for the source-first unfamiliar-website test.** Local AI speed is
not established as reliable. Image generation remains unavailable and requires
separate availability/authorization. No new inference, downloads or spending.

## What the retained evidence proves

| Measurement | Earlier successful brand analysis | Catalog V2 failure |
| --- | --- | --- |
| Native job | `f6ec90b2-ddc7-488f-a179-7ce56a5d308a` | `fe63c28d-84a3-41ce-8a52-2c25fbcc5aa1` |
| Prompt / system characters | 4,034 / 884 | 4,073 / 884 |
| Workflow | CLIPLoader → TextGenerate → SaveText | Same graph/settings |
| Settings | installed Qwen3 4B FP8; lumina2/default; thinking off, sampling off, 600 output tokens | Identical |
| Native execution | 14.790 s, 203 tokens | 220.360 s, interrupted; only 1/600 tokens |
| Application | 17.46 s including source collection; genuine raw text returned | 181.586 s; no raw output |

Native console: the failed job began immediately, prepared the cached text model
for dynamic VRAM loading (5,370 MB staged), and needed **147.48 s for its first
token**. Exact-job cancellation was requested at 19:26:38.860; interruption was
observed at 19:27:17.860. Cancellation acknowledgement was not termination.

This locates the delay inside native model execution/initial token computation,
before SaveText or SDK asset delivery. Queue wait, excessive output length and a
larger context are unsupported explanations. Cached CLIPLoader does not prove
the weights were physically GPU-resident. No out-of-memory error was recorded.

**The underlying historical resource/kernel cause remains unresolved.** There
was no VRAM/RAM/process snapshot at that instant. During this check a running game
coincided with ~8.9 GB GPU usage, ~1.1 GiB free/reclaimable VRAM and ~5 GiB free
RAM, despite an empty Comfy queue. Contention/offloading is plausible, not proven
as the cause of the earlier stall. No application or game was stopped.

## Narrow repairs and actual verification

- Optional Ad Studio text admission checks native queue, setup/training and
  conservative memory headroom before submission and again inside serialization.
  Requires 6 GiB free/Comfy-reclaimable VRAM and 2 GiB free RAM. This is a bounded
  admission policy, not a universal model-fit or speed guarantee.
- The existing 180-second text deadline also aborts in-flight SDK polling and
  final result reading. Exact-job cancellation, no expired-job retry and the
  existing 15-second/32 KB output boundary remain. Director's default is unchanged.
- Failures retain bounded job/state/cancellation diagnostics. Invalid returned
  text is retained for inspection but cannot become successful observations.
  The existing brand status displays the failure/unavailability reason.
- Same receipt never retries. Identical in-flight evidence deduplicates; different
  evidence while analysis is busy returns source-first immediately. Success cache
  remains 30 min; failure cooldown is 60 s. A later explicit discovery can recover
  after that cooldown. No background retry or automatic model download.
- Explicitly accepted AI **style preferences** now guide creative planning, while
  their underlying evidence stays inferred. Unaccepted suggestions remain
  hypotheses; business claims never become source-confirmed by this operation.

Real production Vite/API against local ComfyUI: memory-pressure unavailability in
**184 ms**, queue empty before/after, **zero new text jobs**, no new native history
IDs. No controlled inference was launched into the observed resource shortage.
This is an admission test, **not a successful fresh model run**.

Historical raw output was separately replayed through current validation into an
isolated saved/reopened RAM brand: seven suggestions retained, unsupported daily
baking rejected; test-only accepted tone guided the actual deterministic planner.
This replay is not new inference, owner approval or browser acceptance.

## Source-to-reviewed-request gate

Actual application/service/request tests use synthetic authorized raster fixtures,
distinct original/normalized hashes and RAM project storage. Validated MOCK text
reaches the saved brand; palette/preferences propagate to a truthfully labeled
deterministic plan. Product/source/page provenance and hashes match the exported
Qwen FP8 request, seed 42. Accuracy, image-use permission and direction review are
mandatory. Source/product/prompt/seed/brand edits block stale requests. Prepared
paid/private-upload flags remain false; no image job is submitted. Missing local
Qwen image weights are reported unavailable by the real capability endpoint.

Typecheck/build, 64 JS regression files (including 23 Director files), and five
CPU media scripts pass. Tests cover admission, polling abort/cancel/no retry,
receipt cooldown/recovery, raw-output quarantine, preference handoff, consent,
request hashes, stale review, storage reopening and React status rendering.
The initial regression run exposed two runner-hydration compatibility failures;
scoping text hooks explicitly fixed them without editing Director tests/source.

Owner confirms Abel discovery, selection, same-brand navigation and refresh:
**OWNER-REPORTED PASS**, not independent automation. No browser controller or
owner IndexedDB was accessed. Preserved No Crumbs source, normalized guide, old
generated image, campaign plan and unrelated outer-worktree files match hashes.

Private local evidence: `outputs/qwen-reliability/` — `native-console.json`,
`live-admission.json`, `historical-result-delivery.json`,
`synthetic-generation-brief.json`, regression/build/media logs and preservation
receipt. Original success/failure reports remain in their earlier evidence folders.

Next: run the unfamiliar-site source-first journey with honest non-AI planning
when local text is paused. Review its genuine product source and direction before
any separately authorized image run; do not treat this check as image acceptance.
