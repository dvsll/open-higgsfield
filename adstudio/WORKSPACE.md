# Ad Studio workspace milestone

Before: one transient brief, upload and output list. Refresh lost the session; new generations replaced the context. After: named local projects, saved product references/settings, additive take history, saved exports and optional derived adjustments.

Implemented:
- Create, rename, open and switch projects. IndexedDB `osh-adstudio-projects` holds versioned records and original/normalized image blobs. Only the active project ID is in app-specific localStorage. Browser origins/ports have separate databases; keep the same server address. This is local persistence, not cloud backup.
- Restore references, settings, take metadata and native video previews. New variations retain earlier takes and reference IDs. Interrupted attempts warn before manual retry. Missing files are reported explicitly; history and original references remain.
- Storage failure keeps pending changes in memory, displays unsaved state and offers retry. Unknown schema versions are rejected without overwriting existing records.
- Three reproducible, GPU-independent Camera presets: Portrait push (9:16, push), Landscape pan (16:9, camera right), Square pan (1:1, camera left); all 3 seconds, whole-photo composition. Advanced customization remains available. These are conventional photo animations, not cinematic AI generation.
- Optional Adjust panel: trim, speed, reverse, exact-aspect even-dimension resize, new version in history, original/previous-version comparison. Original videos and exports are retained. Width snaps to an exact aspect-ratio step; no independent stretching control. Timing displayed for derived edits is estimated from trim/speed at 24 FPS.
- MP4 exports use the current project tagline and save that export's tagline in history. Previous exports remain downloadable. Every take retains its original WebM.
- Connection retry, periodic/focus/network checks, local API/FFmpeg capability status distinct from installed compatible models. Camera/Adjust/export work without ComfyUI. GPU actions require available models. Estimates require warm measurements from the connected GPU/model; queue/compositing/export time is additional.
- Creative/Product-Locked remain explicitly experimental. No image/audio generation UI or model downloads were added. Shared Director audio, FLAC, model discovery, editing and SDK call conventions remain intact.

## Validation

PASS: typecheck/build; both apps' pure regression suites; client model-string/options/frame/FPS/audio/product/keepAudio conventions; storage-domain migration/isolation/lineage/quota/interruption tests; live API silent/audio trim/speed/reverse/resize/H.264/AAC exports; Product-Locked and Camera in all formats; invalid/decode recovery; source SHA preservation; FLAC serving. Three actual preset recipes plus derived edits/MP4 exports passed on an isolated API with unreachable Comfy/proxy URLs. Synthetic fixtures only; no new GPU renders.

Commands (Node >=22.18 recommended; this machine's 22.14 needs `--experimental-strip-types`):
```
npm.cmd run typecheck
npm.cmd run build
node --experimental-strip-types adstudio/scripts/projects.test.mjs
node --experimental-strip-types adstudio/scripts/workspace.test.mjs
node --experimental-strip-types adstudio/scripts/client-compat.mjs
node --experimental-strip-types adstudio/scripts/product-video.test.mjs
```
Live tests: `integration.test.mjs`, `product-http.test.mjs`, `smoke.mjs`, and `studio/scripts/audio-api.test.mjs`, with `OSH_TEST_URL=http://127.0.0.1:8294`. `camera-offline.test.mjs` defaults to :8296, started with `OSH_PORT=8296`, `COMFYUI_URL=http://127.0.0.1:18188`, `COMFY_BASE_URL=http://127.0.0.1:18189`.

**Browser acceptance / screenshots: NOT RUN.** Computer Use could not start its Node runtime (`os error 3`) before input; no alternative automation or interruption bypass. Storage tests use the memory driver, not a real browser IndexedDB implementation. Required manual checks:
1. Upload valid and malformed files; confirm preview and previous reference preservation.
2. Create/rename/switch two projects; refresh and reopen each. Confirm reference, format, template, settings, playable takes and downloads; repeat after closing/reopening the browser at the same origin.
3. Generate each preset, then another variation; verify previous takes remain. Adjust trim/reverse/speed/resize, compare originals and export with wrapped tagline in all ratios. Play full clips and download actual files.
4. Remove a test output externally; reload and check explicit missing-file message and retained history. Do not remove customer originals.
5. Simulate storage denial/quota, retry saving, and close/reopen. Confirm an unsaved warning rather than a false saved claim.
6. Stop/restart only the owned API/Comfy services; confirm Camera availability offline, blocked GPU actions, connection recovery, no automatic resubmission. Refresh during a render and verify interrupted-job warning.
7. Verify desktop panel-end scrolling, small-screen flow, keyboard focus and expanded Adjust controls visually. No layout acceptance claim until checked.

Remaining: actual browser persistence/interaction acceptance; multi-tab conflict resolution (single active editing tab recommended); no render-job reconciliation after refresh; cloud/project backup and generated image/audio handoff remain future work. Creative commercial acceptance still FAIL per CONDITIONING_DECISION.md.
