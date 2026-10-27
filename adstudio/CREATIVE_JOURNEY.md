# Creative Journey preview

Separate entry: **http://127.0.0.1:8302/adstudio/journey.html**.
Worktree: `C:\Users\osiam\open-higgsfield-journey`.
Branch: `feat/adstudio-creative-journey`, based on generator `c88db7087032425964ca093dc68c973f76b991d8`.
The generator on 8301, `/adstudio/`, Director, and PR #4 are unchanged.

## What works

1. Choose Static. Short video is honestly marked Coming soon.
2. Enter a website, upload original photos, or both. Original files are retained. Keyboard-accessible upload, drag/drop, saved introduction, and manual fallback for restricted websites.
3. Actual public website research/import, source-associated product cards, up to three selected originals, editable brand identity/tone/colors and visible facts. Website image-use permission stays mandatory. No automatic factual confirmation. Existing research reopens without being rerun. Provider labels distinguish source evidence and model hypotheses.
4. Existing creative plans become visual concept cards. Natural-language refinement, alternative selection and explicit factual/direction approval. Full prompt/source/seed inspection is optional. Concepts are labeled directions, not generated previews.
5. One to three distinct existing concepts per product, maximum six advertisements. Round-robin distribution includes every selected product. The exact batch list needs explicit review. Automatic engine selection uses real capabilities; Advanced can choose Product-safe or an installed ready engine. The chosen engine is pinned for the batch, not silently changed after failure.
6. Sequential preparation/generation/composition/save, genuine SDK activity, progressive completed cards, PNG download, fullscreen preview, original comparison, immediate copy preview and export, variation/refinement, project switching and old takes. A failed/cancelled job stops unsubmitted work and retains completed outputs. Interrupted work is never automatically resubmitted.

Dark emerald/ivory/lime system, responsive panels, keyboard focus, restrained card/stage/image transitions, touch targets and reduced-motion behavior. No WebGL or new dependencies.

## Integration contract

No shared generation, SDK, API, model or workflow source changed.

`journey/entry.tsx` initializes the existing `WorkspaceStore`, `Projects` driver and `AdApplication`. `JourneyService` orchestrates the same `develop`, `choose`, `approve`, `generate`, capability, source and export methods. Each batch card receives a **fresh child plan and prepared receipt** for the specific concept explicitly approved in the visible batch list. Current source bytes, brand revision and creative input are checked against the reviewed snapshot before starting. Existing server validation remains authoritative.

Persistence is optional `creative.journey` metadata in existing version-3 project records: selected source/draft/permission/plan/review identities, stage, introduction, quantity and result-card IDs. Takes, normalized/original Blobs, background/cutout assets and export recipes remain in the original stores. **No IndexedDB schema change.**

8302 is a separate browser origin: it does not see or mutate the owner's 8301 database. There is no automatic cross-origin copying. Tests use isolated Chrome contexts, never the owner's profile.

New scripts: `npm run dev:journey`, `npm run test:journey`. Node >=22.18 as before. For local AI configure the existing `ADSTUDIO_KLEIN_MODELS_DIR`; do not download anything implicitly. This preview reused valid same-machine runtime proof records and existing weights; the real run subsequently wrote its own proof. Preview Vite cache is `.journey-cache/`, outside the API's `/outputs` media route.

## Actual acceptance, 2026-10-27

- **Real browser PASS:** original cookie import, source facts/use permission, three real backend concepts, explicit approval, sequential **two distinct Product-safe PNGs**, immediate copy edit/download, actual IndexedDB original/hash/take/export preservation after refresh.
- **One real Klein pipeline PASS:** actual Journey UI submitted one `/api/hero/campaign` job. Native BiRefNet `f2c552e6-811b-42a6-9ee0-929323f4c4f6` took **1.404s**; native Klein `01100b69-6fe8-44d7-adb6-26154e84b995` took **5.634s**. Both reported no cached nodes. Runtime pipeline **10.861s**, seed42; exact source hashes are below.
- OriginalSHA `f2f09d1631d033accfcd9a6c99c171a0064b04d2a49da0a125fd5081c45caf1d`; normalizedSHA `34f9040939a457feec434c40a46220f85a04eabde4067ecbff83544d7f1023c0`.
- Initial exported ad SHA `b5c4457102d1c32c1dd78106eeea279744b75532bf8386ed18101608674f21ae`. Raw environment, isolated original, integrated scene, native histories and browser project records retained privately. Result visible in gallery and after refresh; edited copy downloaded without another image job. Neither ad nor source facts are claimed owner-approved by these test actions.
- **Text planning was source-guided in the real image run.** Qwen3 proposed invalid packaging/container wording; the existing validator rejected it and used its labeled deterministic concepts. This is not a successful AI-planning claim.
- **Real website PASS:** https://abelfragrance.com produced29 source-linked products. Product import preserved source relationships and blocked further planning without permission. Saved site/source survived refresh/back/reopening; no duplicate brand. No permission or generation was asserted for Abel images.
- **Real multi-product/failure PASS:** two authorized local originals reviewed separately; three-card round-robin campaign. First real Product-safe export completed, an explicitly injected browser-network503 failed the second, third was not submitted. Completed PNG survived refresh/download and switching to the prior website project. Failure was injected, successes were actual API outputs.
- **Both inputs/manual fallback PASS:** actual enabled-button file chooser plus website retained the selected original in the new brand project. Restricted loopback URL was rejected by existing fetch security; manual brand/photo continuation worked. No creative-plan/image submissions in this test.
- **Interaction PASS:** actual keyboard activation, touch context, six mobile screenshots, no horizontal overflow, reduced-motion CSS verified. 7.17s actual browser screencast (217 captured frames), not an animation mockup.
- Typecheck/build PASS. Full regression run: **73 JS files /79 tests**, including24 Director files. Final affected rerun:11 tests PASS. Five existing real offline FFmpeg/API suites PASS. Existing build chunk-size warning remains.

Private evidence under `outputs/journey/` (gitignored):

| Evidence | Location |
| --- | --- |
| Review page, all six desktop/mobile screens and actual PNGs | `review.html` |
| Actual Klein/UI/IDB/native results | `browser-2026-10-27T16-46-30-630Z/` |
| Two distinct Product-safe results and IDs | `browser-2026-10-27T16-35-29-837Z/report.json` |
| Latest website/multi-product/failed-job/touch checks | `extended-1793119905859/report.json` |
| Website+photo / blocked-site manual flow | `inputs-1793120193345/report.json` |
| Actual motion recording | `motion/journey-motion.mp4` |
| Full/affected CPU regressions, build | `all-js-tests.log`, `js-test-receipt.json`, `final-focused.log`, `final-build.log` |

Intermediate failures retained: preview optimizer initially lived under the media route and returned404; corrected to isolated cache. Async blur saving swallowed Continue; ordered autosaves now preserve click intent and capture controlled input values before scheduling. The input edge-case harness initially set a hidden file input before the stage transition completed; fixed to exercise the real enabled file chooser, and the input is now disabled during transitions. All occurred **before image submission**, not extra image attempts. Playwright's optional FFmpeg recorder was absent; the recording uses CDP frames and already-installed FFmpeg instead of installing tooling.

## Limits and safe promotion

- Owner UX/creative approval still pending. This is a functioning preview, not an automatic replacement of `/adstudio/`.
- Multiple **Product-safe** outputs are browser-proven. Multiple Klein jobs are deliberately not GPU-tested this sprint; its sequential orchestration uses the same tested one-job path. Current generator maps several food concepts to the same environment family/seed. Variations can differ in composition/copy without materially different AI backgrounds. Do not promise independent scene variety or guaranteed requested camera/lighting changes; Cursor owns generator improvements.
- Product isolation preserves original pixels but lighting/transparency/matte defects remain possible. No new relighting or geometry guarantee was added.
- No automatic resume after reload during inference. Completed server files can remain for recovery; app failure/history controls remain conservative.
- 8302 does not show the owner's 8301 projects. Promotion should first reconcile with the latest generator branch, then point its existing entry to the Journey **at the original origin** after owner review. Rehearse legacy-project resume and missing-file recovery there with explicit authorization. Do not copy databases, reset storage, or merge this draft automatically.
- Generator branch was still atc88db70 at final fetch; no newer generator conflicts. Main advanced independently; this branch deliberately does not import those unrelated Director changes or target main.

Run reproducible browser checks explicitly (public network calls/local outputs):
`node adstudio/scripts/journey-browser.mjs` (Product-safe),
`node adstudio/scripts/journey-acceptance.mjs`,
`node adstudio/scripts/journey-inputs.mjs`.
`node adstudio/scripts/journey-browser.mjs --klein` submits a real local mask+diffusion pipeline; run only with authorization and an idle shared queue. No cloud resources are used.
