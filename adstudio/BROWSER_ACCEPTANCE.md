# Browser acceptance handoff — fidelity prototype

Final strength gate (2026-10-22): existing private gallery now opens with exact strength1.0 control and0.7 experiment side by side, plus nine matched frames/detail crops. Computer Use initialization still fails before input with missing Node runtime path; no bypass. Play both complete clips twice at normal speed/native size and record direction, silhouette/chip/foil stability, texture crawl/flicker and advertising judgment. Frame review already rejects promotion; playback remains NOT RUN. See [CONDITIONING_DECISION.md](CONDITIONING_DECISION.md).

2026-10-22 Creative investigation: fresh Computer Use initialization and one retry both failed before any input: `failed to start Node runtime: The system cannot find the path specified. (os error 3)`. No interrupted session was bypassed. Full-playback review remains **NOT RUN**. Open private `outputs/motion-investigation/controlled/gallery.html`, restart/play all five clips twice at normal speed, then seek each start/middle/end. Record browser/version and per-clip motion direction, chip/foil deformation, texture crawl, cropping and overall ad quality. A is the exact failed MP4 replay; D is conventional camera motion, not AI success. Complete the original browser upload/progress/export/tagline/download/retry checks below separately. Detailed measurements and limitations: [CREATIVE_MOTION_INVESTIGATION.md](CREATIVE_MOTION_INVESTIGATION.md).

Status: **NOT RUN on this branch**. The earlier Computer Use session ended on physical Escape; no attempt was made to bypass or resume that interruption. The checks below require a fresh authorized browser session or a person at the computer. API/media tests are separate evidence, not substitutes for these checks.

Current isolated server: http://127.0.0.1:8294/adstudio/ . A normal fresh start can use `npm run dev` on 8288. Use one server consistently. ComfyUI/proxy stay on loopback :8188/:8189; FFmpeg is configured locally with `FFMPEG_PATH`.

Local test files:
- Cookie photo: `C:\Users\osiam\open-higgsfield\outputs\packaged-cookies.jpg` (public bakery-site source; contains two printed “Thank You” stickers).
- Pastry: `C:\Users\osiam\Downloads\ChatGPT Image Oct 12, 2026, 01_44_54 PM.jpg`.
- Logo: `C:\Users\osiam\open-higgsfield\outputs\website-logo.png`.
- Intentional errors: `C:\Users\osiam\open-higgsfield\outputs\invalid-product.png` and `oversized-product.png`. Do not replace or corrupt customer originals.

Use seed **1**, length **3 seconds**, Studio vibe and this exact motion brief for the cookie run:

> Two packaged chocolate chip cookies on brown parchment inside clear plastic bags, resting on a wooden table. Very slow smooth camera push in. Preserve the cookies, chocolate chips, plastic folds and both round Thank You stickers exactly. No new text, no hands, no opening the bags.

The app appends the Studio text and preservation suffix; the complete prompt is recorded in `FIDELITY.md`. Use tagline **Fresh cookies. Made to share.** and test a second export with an 80-character tagline to exercise wrapping. Camera Mode ignores prompt/vibe/seed; the UI must make that clear.

| Check | Exact action | Required result / evidence |
| --- | --- | --- |
| Initial state | Refresh page; inspect mode and connection. | Creative is default; Generate disabled without a photo; connection resolves. Record browser/version, server URL, source hash and time. |
| Decode error + recovery | Choose invalid-product.png. Then choose cookie JPEG. | Visible decode error; no preview/generation for invalid data. Valid JPEG subsequently previews with correct proportions and enables generation without a reload. |
| Size error + recovery | Choose oversized-product.png, then logo PNG. | Visible size limit error; valid PNG subsequently works. Re-select a valid JPEG and confirm preview updates. |
| Input validation | Uncheck all formats; click Generate. Recheck all three. | “Select at least one format”; controls remain usable. No GPU request for the invalid brief. |
| Creative | Select Creative / Fit whole photo / all formats; use exact brief above; generate. | Stage names and `(1/3)`…`(3/3)` advance; form/upload disabled while working and restored afterward. Three video cards, correct sizes, actual timings, prompt and seed. No fake percentage or completion state. |
| Product-Locked | Same inputs, Product-Locked, all formats; generate. | LTX generation followed by original-photo compositing. Static sharp photo rectangle, abstract blurred/dim background. “Inspect Creative background” opens the generated source. No claim of automatic segmentation or product movement. |
| Camera | Select Camera; select push, then pan-left and pan-right; generate each in all formats. | Prompt/vibe/seed/framing disabled, camera selector enabled. Whole photo remains within frame. Push increases size; camera-right translates photo left; camera-left translates photo right. Record processing times. |
| ComfyUI independence | With Vite/FFmpeg available but ComfyUI unavailable, use Camera Mode. | Photo animation works without GPU generation. Creative/Locked remain unavailable with an accurate connection reason. Coordinate before stopping a shared ComfyUI instance. |
| Preview/playback | Play every resulting format from beginning to end; pause and seek to middle/final. | Correct ratio, no stretching, 73 frames / ~3.042 s at 24 fps, silent playback. Record stutter, shimmer or control failures. API byte-range seeking is not implemented; explicitly record whether Chrome seeking works after download. |
| Caption + MP4 | Export one card, then Export all MP4s. Inspect first/middle/final frames and full playback. | Caption is readable, within safe bounds and not covering cookie/sticker/logo details; no clipped or awkwardly wrapped words. MP4 replaces preview, original WebM remains downloadable, successful cards survive another card's failure. |
| Download | Click actual WebM and MP4 download links for each ratio/mode; inspect Chrome Downloads and downloaded files with FFprobe. | Files complete, correct extensions/MIME/dimensions/frame count; downloaded bytes match the linked API file. This step is NOT established by HTTP fetch tests. |
| Network recovery | On a generated card, use Chrome DevTools Network → Offline for this tab. Attempt export. Restore Online; retry export. For generation, check connection again after restoring Online. | Visible failure, originals/cards retained; Retry succeeds without regenerating source. Do not change system firewall/security settings. |
| Persistence boundary | Refresh only after saving files and evidence. | Current implementation clears cards after refresh; record this known limitation rather than claiming saved-project recovery. |

For every run record mode, input SHA-256, full prompt/seed or camera move, source/output URLs, timings, downloaded filename/hash, screenshots, and PASS/FAIL per check. Inspect frames **0 / 36 / 72** for product outline, chocolate-chip pattern, plastic folds, both sticker scripts/hearts and cropping. A recognizable product or a high aggregate pixel score is not proof of exact text readability.

Remaining acceptance gaps must stay marked NOT RUN/FAIL in notes and any PR. Do not mark the prototype production-ready from the automated measurements alone.
