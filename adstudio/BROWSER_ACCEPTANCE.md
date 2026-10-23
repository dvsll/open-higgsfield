# Static ads V1 - browser acceptance

**Status: NOT RUN.** Current Computer Use inventory apps=[], browsers=[]. No browser interruption was bypassed. Real PNG/API and storage-domain tests do not prove actual browser downloads, responsive layout or IndexedDB refresh.

Use **http://127.0.0.1:8300/adstudio/#brand** on the same normal-profile origin as your saved data. Record commit/browser/time. Keep PR3 draft.

1. Open an existing brand. Check the overview and recognizable asset strip. Reviewed, From website, Your input, Inferred and Missing states must be distinct. Optional empty fields and evidence should be collapsed; no deep AI understanding claimed when unavailable. Expand/edit a field and save; check immediate status changes.
2. Product cards: choose the correct original photograph, expand/edit one product, then Use in ad. Or Create an advertisement and select a product. Confirm quantity/packaging match before checking the photograph confirmation. Do not select a specific SKU for an unverified reference photo.
3. Choose spotlight/editorial/poster, change headline/body/CTA/colors/format. Preview should update immediately with the actual photo/logo and deterministic text. Entire source photo must fit without stretching. Overlong copy must show an error, not silently export a clipped or stale preview. Use saved product description only after verifying it.
4. Export PNG in all three formats. Open the downloaded files at full size and phone size; verify text, crop/contain, logo identity and source photo. Save a variation, undo/redo and edit a copy of a previous export. Earlier PNGs and source assets must remain unchanged.
5. Wait for Saved, refresh and switch projects. Concepts, source selections, undo history and downloadable prior PNGs must return. Old video projects/takes/Composer exports must still work. Existing IndexedDB DB3/stores stay intact; no large image blobs in localStorage.
6. With Comfy offline, deterministic editing/export must work and optional supporting-image generation must be disabled honestly. If later connected with compatible weights, generate only on explicit click, verify real shared-job output and retain original product/logo. No automatic weight downloads.
7. Open /adstudio/#static -> Open No Crumbs ads for the actual three-PNG example and editable source project. Existing example edits must be kept when reopening. Compare the two feed ads and story poster with outputs/static-ads-demo/index.html; that gallery contains real exports, not UI screenshots.
8. In a disposable project test missing runtime outputs and storage failure. Prior exports should use saved PNG Blobs; original references should re-upload for a fresh export. Storage failure must show Not saved, retain the tab state and allow retry. Verify panel-end scrolling, all disclosures, keyboard focus and narrow-window layout.

---

# Brand Intelligence V1 - browser acceptance

**Status: NOT RUN.** Computer Use returned apps=[], browsers=[]. No interrupted session was bypassed. API/parser/provider-protocol/storage-domain checks do not prove real browser IndexedDB refresh/migration.

Open **http://127.0.0.1:8300/adstudio/#brand** in a normal profile. Keep the same origin and existing site data; close other Ad Studio tabs for DB migration. Record commit/browser and PASS/FAIL.

1. Create brand -> enter `https://www.nocrumbsbakery.store/` -> Research brand. Expect actual sourced identity/story, four current structured products, image/color candidates, source links and explicit AI unavailable notice on this machine. Audience/tone must not appear as fabricated AI conclusions.
2. Edit name/description/tone/audience/preferences and colors. Add/edit/remove a product. Upload a logo and original product photo; assign the photo only to the correct product. Save brand - reviewed. Download original and compare its hash/bytes to the uploaded file.
3. Refresh after saved status. All edits, palette, products, photo associations and original downloads must return. DevTools IndexedDB `osh-adstudio-projects` is DB3 with brands/assets/projects/media stores; BrandProfile version1, old project version3 remains supported. localStorage holds only active IDs.
4. Create/switch to a second brand; verify isolation, then return. Re-research the first website: customer corrections and original photos must remain; new evidence becomes review-required again. Keep a website image and verify local retention and source link.
5. Save reviewed brand -> Use brand name in Composer. Only the current project's brand name/link changes; shots, trims, previous exports and existing projects stay intact. The full brandContext is a future-generation contract; palette/logo are not automatically applied to Composer.
6. Start manually without a website; fill only known facts. Add website/photos later. Try an inaccessible URL and `http://127.0.0.1`: show an error/manual recovery, keep edits/assets, no private-network fetch. Missing AI model must not fake an analysis.
7. In a disposable browser profile simulate quota/unavailable storage. Expect Not saved, retained in-tab edits/originals and Retry saving; no reviewed-use until durable save. Restore storage, retry, refresh and verify.
8. For the prepared authentic example, Create brand -> Open No Crumbs example. Actual website evidence and existing original logo/cookie photo load. No AI completion is claimed; cookie photo is unassigned to a specific SKU until reviewed.

Browser playback/download/layout and DB1/DB2 -> DB3 migration remain manual acceptance gates. PR3 stays draft.

---

# Ad Composer V1 - browser acceptance

**Composer status: NOT RUN.** The available Computer Use inventory has no browser surface. API/FFmpeg tests, frame inspection and memory-driver persistence tests passed; they do not prove browser playback, downloads or real IndexedDB. Keep PR #3 draft until review. Earlier workspace evidence is retained below.

Open **http://127.0.0.1:8300/adstudio/#compose** while the current local server is running. Keep this exact origin for persistence tests. Use a disposable project and record browser/version, commit, URL and PASS/FAIL for each step. No ComfyUI, Runpod or GPU is needed.

1. Click **Open cookie example**. Expect an editable 8.5-second vertical ad with two shots, placeholder branding, a closing card and local demo tones. Play the full preview with sound. The opening is a 2D Camera photo animation; only the hero is the existing LTX-2.5 footage.
2. Create a new project. In Compose Ad, import `outputs/ltx25-benchmark/cookie-seed1/video.mp4`. In Create shots, upload a product photo and generate a Camera take; click **Add to ad**. Both clips must appear in this project's library and timeline.
3. Reorder by dragging and arrows; duplicate/remove a shot; change In/Out points. Reject a reversed/out-of-bounds trim without losing the timeline. Choose cuts, then dissolve. Edit brand/headline/CTA and ending duration. Import local music, adjust volume and test Keep sound from shots.
4. Click **Preview sequence**. Wait for the actual local render, then play the whole ad. Confirm shot order, trims, smooth transitions, text placement, sound and a complete ending. Landscape sources must have padding, never stretch. Click **Export Ad**; open the downloaded MP4 in another player and verify its end and audio.
5. Wait for **Saved on this browser**, then refresh. Inspect DevTools > Application > IndexedDB > `osh-adstudio-projects` (DB version 3): `projects` records are project version 3; `media` holds imported original Blobs; `assets` retains product photos. Check that ordered shots, trims, text/music and playable previous exports return. Large media must not appear in localStorage.
6. Create/switch to another project; it must have a separate composition/history. Return to the first project. Change branding and export again; both exports and all previous takes must remain. Source videos must retain original duration/bytes; trimming creates a new MP4.
7. Missing-file recovery: use a disposable imported video and temporarily move its opaque server output out of `outputs/` (keep it locally). Refresh: show an explicit missing-source error without deleting the project. Click **Restore saved original** and render again. Restore the moved file afterward. Imported Blob recovery must retain trim/order and old export history.
8. Storage failure: on a disposable profile/origin, deny storage or simulate quota failure. Expect **Not saved** and a retry action, never a saved-success claim. Keep the tab open, restore storage, retry and refresh; verify original Blobs and composition survive.
9. With ComfyUI offline, retry connection and create a Camera take, preview/export the composition and download MP4. These local actions must work; unavailable AI models must remain honestly disabled.

Report layout/keyboard/phone-width issues separately. Actual IndexedDB migration from an existing version-1 database, full playback, browser downloads and responsive layout remain manual acceptance requirements.

---

# PR #2 — persistent workspace browser acceptance

**Status: NOT RUN. [PR #3](https://github.com/dvsll/open-higgsfield/pull/3) is the draft Camera/preflight follow-up.** GitHub reports [PR #2](https://github.com/dvsll/open-higgsfield/pull/2) was externally merged as `c7d02b7` at22:52UTC on2026-10-22; this agent did not merge it. These are instructions for a person to execute, not completed results. Latest Computer Use initialized, then stopped because Chrome's current URL could not be determined confidently. Earlier failures/interruption were not bypassed. API/media and memory-driver tests do not establish real IndexedDB, browser playback or download acceptance.

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
| 2 · Real IndexedDB | Press F12 → **Application → IndexedDB → osh-adstudio-projects** (refresh the database view if necessary). Inspect `projects` and `assets`. Then refresh the page. | Project record has `version: 3` (legacy versions migrate), a stable ID, settings and asset ID; asset record contains original/normalized Blobs. Local Storage `osh-adstudio:active:v1` contains only an ID, not large image data. The same project, preview, tagline and settings return. The file picker may be blank: restored preview comes from IndexedDB. |
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
