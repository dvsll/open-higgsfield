# PR #2 — persistent workspace browser acceptance

**Status: NOT RUN.** GitHub reports [PR #2](https://github.com/dvsll/open-higgsfield/pull/2) was externally merged as `c7d02b7` at22:52UTC on2026-10-22; this agent did not merge it. Camera/preflight follow-up must remain a separate draft review. These are instructions for a person to execute, not completed results. Latest Computer Use initialized, then stopped because Chrome's current URL could not be determined confidently. Earlier failures/interruption were not bypassed. API/media and memory-driver tests do not establish real IndexedDB, browser playback or download acceptance.

**Camera review first:** open private `outputs/camera-motion-20261022/index.html`, play baseline/revised pairs at normal speed, then generate fresh takes of all three templates in the app. Revised push is eased 4%; pans use eased 2.4% travel. Check for shaking, abrupt endpoints, repeated-frame stutter and tiny-letter shimmer through full playback. Existing history keeps its old videos. Record any remaining problem with template, source, output filename and player/browser; see `CAMERA_MOTION.md` for measured evidence/limits.

## Before starting

- Use Chrome/Edge in a normal profile, one Ad Studio editing tab. Open **http://127.0.0.1:8294/adstudio/** if that server is running; otherwise start `npm.cmd run dev` and use its printed URL plus `/adstudio/`. Record commit (`git rev-parse --short HEAD`), full URL, browser/version and time. Do not use a different port, `localhost` instead of `127.0.0.1`, or an incognito window for the refresh/persistence test: each has separate storage.
- Use **new disposable test projects**; do not clear existing site data. Have the original cookie photograph and packaged-cookie printed-label photograph ready. The approved label surrogate tests “Thank You” lettering; it does not prove brand-logo fidelity. Leave original photo files unchanged.
- The default for a **new project** is Portrait push / Camera / 9:16 / 3 seconds. Existing projects restore their saved mode/settings, which may differ. Camera uses FFmpeg, not AI. No ComfyUI or GPU generation is needed for this walkthrough. Do not rerun LTX-2B quality experiments.

## Walkthrough (about 15–20 minutes)

Record PASS / FAIL / NOT RUN for each numbered check. Stop and report a failure before resetting anything that could erase evidence.

| # | Do this | Pass when |
|---|---|---|
| 1 · New project | Enter **Acceptance A** in Name, click **New project**. Choose **Portrait push**, upload the original cookie photo, enter tagline **Fresh cookies. Made to share.** Wait for **Saved on this browser.** | Photo previews in proportion; Camera is selected; Animate photo becomes available when local API/FFmpeg are ready. No image/audio model download or GPU job starts. |
| 2 · Real IndexedDB | Press F12 → **Application → IndexedDB → osh-adstudio-projects** (refresh the database view if necessary). Inspect `projects` and `assets`. Then refresh the page. | Project record has `version: 2`, a stable ID, settings and asset ID; asset record contains original/normalized Blobs. Local Storage `osh-adstudio:active:v1` contains only an ID, not large image data. The same project, preview, tagline and settings return. The file picker may be blank: restored preview comes from IndexedDB. |
| 3 · Generation/history | Click **Animate photo**, wait, play the entire clip. Note the original WebM link. Generate a second variation. | Two separate cards remain; neither replaces the other. Both play. Generation status changes while working; project switching/upload are blocked during processing and restored afterward. Portrait output is 288×512, about 3.04s/73frames/24FPS. |
| 4 · All presets | In A, choose **Landscape pan**, animate; then **Square pan**, animate. Play each whole clip. Open Generation details. | Previous cards remain. Landscape is 512×288, camera-right motion (photo moves left); square is 384×384, camera-left motion (photo moves right). Portrait pushes in. Product is not stretched or unintentionally clipped. Details identify FFmpeg camera motion and say no model/prompt/seed was used. |
| 5 · Derived editing | Download the first portrait card’s **original WebM**. Open its **Adjust** panel. Set start **0.5**, end **2.5**, speed **2×**, Reverse on, width **144**. Click **Save adjusted version**. Play and use **Compare previous version**. | A new Adjusted card appears (~1s, 144×256). Compare toggles the parent/derived video. Original card, source URL and previous takes stay intact. Invalid end-before-start shows an error and leaves history unchanged. Width changes preserve aspect ratio; height is not independently stretched. |
| 6 · MP4 and actual downloads | Export the original portrait card, the adjusted card, and landscape/square cards. Click **Download MP4** for each and open files from browser Downloads/your video player. Change tagline and use **Export another MP4** on one card. | Complete playable MP4s download with correct proportions and duration. Captions remain readable/in bounds across the full clip. Earlier export links remain; original WebM remains downloadable. Re-download the original WebM and compare SHA256 with the first download: identical. MP4s are derived assets and need not match the WebM hash. |
| 7 · Project isolation | Enter **Acceptance B**, click **New project**. Upload the printed-label photo, choose Landscape pan and a different tagline, generate once. Rename B to **Acceptance B renamed**. Switch to A and back using Project. | A retains its cookie reference, settings, cards and exports; B has its own reference/settings/single generation and renamed title. Neither project gains or loses the other’s records. |
| 8 · Durable restore | Wait for Saved, refresh B, then switch to A. Close the test tab, reopen the **same URL/profile**, inspect both projects and play an original, an adjusted take and an MP4. | Stable project/asset/take IDs, previews, settings, histories and export links restore from real IndexedDB. Results do **not** disappear after refresh. Outputs must still exist in the local runtime `outputs/` directory; this is local persistence, not cloud backup. |
| 9 · Failure/retry | In A, upload a disposable text file renamed `.png`, then a valid photo. For export failure, use DevTools Network request blocking for **only `/api/export`**, click Export another MP4, remove the block, retry. | Invalid photo shows an error and keeps the previous reference/takes. Export failure leaves originals/history intact; retry succeeds without regeneration. Uncheck every format and click Animate: clear validation error, no job submitted. |
| 10 · Missing file | Generate a fresh disposable Camera take and do not export it. Note its source `/outputs/<hex>.webm`. Keep DevTools open with Network → Disable cache checked for this step. Temporarily rename that generated file in File Explorer to `<hex>.webm.acceptance-backup`. Refresh. Restore its exact filename and click Reload preview. Uncheck Disable cache afterward. | Explicit missing-output message; project/history/reference remain. Restored file plays after retry. Do not rename a product photo, existing customer asset or previous investigation output. If only an exported MP4 is missing, the app should try the retained WebM. |

Optional hash check in PowerShell (use the two actual downloaded paths):
```powershell
Get-FileHash -Algorithm SHA256 'C:\path\first-original.webm'
Get-FileHash -Algorithm SHA256 'C:\path\downloaded-again.webm'
```

## Offline Camera test — leave shared ComfyUI running

Use an isolated server with deliberately unreachable Comfy/proxy addresses, rather than stopping the collaborator’s services. In a **new PowerShell terminal** in this repo:
```powershell
$env:OSH_PORT='8296'
$env:COMFYUI_URL='http://127.0.0.1:18188'
$env:COMFY_BASE_URL='http://127.0.0.1:18189'
npm.cmd run dev
```
Open **http://127.0.0.1:8296/adstudio/**. This port has a separate browser database; missing projects from8294 here are expected. Create **Offline acceptance**, upload a test photo and wait for connection checks. Verify the notice says ComfyUI offline while Camera/Adjust/MP4 remain available. Animate, adjust and export/download an MP4. Under Customize, Creative and Product-Locked must be unavailable for generation; switch back to Camera and verify it works. No GPU request or model download. Close the offline test tab and press Ctrl+C in **only that new terminal** afterward.

Also test local API recovery on this disposable8296 project: stop only its terminal, observe connection failure/retained draft; restart with the same variables, click Retry connection, then explicitly retry the action. No automatic generation resubmission. Return to8294 and confirm A/B unchanged.

## Additional release checks

- In a **disposable browser profile** where site storage is blocked by browser settings, open Ad Studio: it must say session-only/not saved; do not claim persistence. Re-enable storage, click Retry saving and refresh to verify recovery. If you cannot safely simulate storage denial/quota, record **NOT RUN**; never fill your disk or clear existing projects to force this test.
- Refresh during a disposable Camera job: either it already completed and restores, or the app warns of an interrupted attempt. It must not silently re-submit. In-flight job reconciliation/resumption is not implemented.
- On desktop and a narrow window, scroll both panels to the end and expand Adjust. Verify all controls remain reachable with visible keyboard focus and no obscured buttons. Actual visual layout acceptance is still pending.
- Creative remains experimental, with commercial acceptance **FAIL** from prior investigation; Product-Locked is a static photo rectangle over a generated background. These are not the default Camera presets. Existing quality evidence remains in FIDELITY.md, CREATIVE_MOTION_INVESTIGATION.md and CONDITIONING_DECISION.md; full-playback reviews there are separate outstanding checks.

## Reply with observations

Copy this and fill it in (keep photos/videos private):
```
Commit / URL / browser+version / date:
1 New project+upload:
2 IndexedDB+refresh:
3 History+playback:
4 Three presets:
5 Derived edit+original preservation:
6 MP4 downloads+caption+hash:
7 Project isolation+rename:
8 Close/reopen restoration:
9 Error/retry:
10 Missing-file recovery:
Offline Camera+API recovery:
Storage failure / interrupted job / layout (or NOT RUN):
Failure: step, exact message, expected/actual, source/take URLs, screenshot if useful:
```

Keep the Camera/preflight follow-up draft until this evidence is reviewed. Do not turn an API test pass, successful request or recognizable product into a browser or fidelity acceptance claim.
