# Ad Studio React migration handoff

## Functional UX update — 2026-10-26

No stylesheet/aesthetic changes. First-brand creation is inline and completed by
Develop. Campaign stays default; unusual modes/details are optional. One explicit
Accept direction & confirm facts retains both server review requirements; Generate
is still separate. Correcting facts recompiles the existing concepts into a new
unreviewed record, preserving the original/parent plan and source hashes. Source
descriptions are cached per normalized reference hash and restored on switching;
no vision claims. Stage/refinement and per-take copy drafts survive reopen.

Ad preview is default; one comparison disclosure replaces preview-mode switching.
Export PNG composes, checksum-verifies, durably saves/readbacks and requests the
download inside one job lock. A blocked download keeps the export and is recovered
from history without recomposition/inference. Browser/OS completion is not claimed.
Automatic availability polling/online/focus recovery replaces Check connection.
JSON/evidence/seed/prompt stay in Request details; specialist tools remain.

Workspace actions reserve their lock before awaiting queued saves. Navigation
waits for the latest write; per-record failures remain visible even if another
record saves. Import normalization cannot attach to a different project. Previews
and fidelity state are identity-bound; uncertain inference is interrupted and
cannot silently retry. No DB/origin/model/transport change. Full control inventory,
decisions and explicit **14→9 / returning9→6** interaction counts are recorded in
FUNCTIONAL_UX_AUDIT.md. These counts assume available generation, not live timing.

## Implemented 2026-10-25 — owner-authorized complete primary journey

The newest owner instruction supersedes the historical sequencing gates below.
`index.html` now mounts one React root from `src/react/entry.tsx`: product/brand,
source-grounded concept, explicit review, Qwen readiness/generation, comparison,
copy/layout preview, verified PNG export and history. No native DOM island in the
primary screen. `WorkspaceStore` owns ordered durable saves, per-write revisions,
pending original/media Blobs, quota retry, busy locks and subscriptions.
`AdApplication` and the real `CreativeStudioService` use the same Projects facade.
No database/version/key/origin change. React and its types are existing MIT deps;
no package/model installed. Refresh does not submit jobs. Interrupted attempts are
labeled; back-forward cache returns reload the saved database. TS/TSX changes use
full-page reload, CSS updates live. Image URLs/listeners/timers clean up on disposal.

**Specialist tools are retained as a separate page**, `tools.html`, using the old
native controllers, not mounted inside React. Project & tools links preserve full
Brand/Hero/Static/Create/Composer functionality. Returning to the primary page
reopens the same existing database/active-project key. Old #create/#compose/#static
links redirect there at the same origin; #hero and #brand use the React entry.
Native retry now shares its ordered save chain and clears only unchanged pending
versions, rather than rewriting every project and dropping newer edits.

Validation: `npm run test:adstudio-ui`, `npm run test:creative`, existing Ad/Director
regressions, `node --experimental-transform-types adstudio/scripts/local-media-regression.mjs`,
typecheck/build. Full original→brand→plan→review→mock Qwen→verified take→real PNG→reopen
passes in isolated storage. Real API/FFmpeg tests cover offline Camera, audio-aware
editing/export and Composer. Static React snapshots live in gitignored
outputs/react-adstudio-review; they are not browser acceptance. Browser control
remains blocked by the prior URL-confidence restriction; no retry/controller swap.
No real text/image inference, spending, private upload or model download occurred.

---

Historical planning follows; its old entry/layout/sequencing descriptions are not
the current application.

2026-10-23 · Requested by dvs for the partner's coding agent. **Planning only: Ad Studio stays on its current UI in this merge. The user clarified React, not Rust. No Rust migration is planned.**

## Read first

Read repository `AGENTS.md`, `notes/adstudio.md`, then this document. Studio has already migrated its view layer to React; see `notes/design/studio-react-architecture.md`. Do not import Studio components/controllers into Ad Studio: both entries must stay separable, loading their own folder and `../shared/` only.

React/React DOM 19.3.1 and their TypeScript definitions are already root dependencies (MIT; https://github.com/facebook/react and https://github.com/DefinitelyTyped/DefinitelyTyped). Existing Vite handles TSX and `jsx: react-jsx` is configured. No new framework or dependency is required. Add `adstudio/**/*.tsx` to the root tsconfig include when starting implementation. Keep `adstudio/index.html` as a Vite entry; preserve its URL and `#brand`, `#static`, `#hero`, `#create`, `#compose` routes.

## Fastest safe path

1. Establish a typed React entry under `adstudio/src/react/` and switch the HTML module entry only when that entry can render a complete usable surface. Move page markup into components while retaining current CSS and explicit service integration IDs. Keep boot failures visible. Do not ship two simultaneous UI owners.
2. Split `src/main.ts` into a project/job service and React views. Keep its asynchronous project-save ordering, pending asset/media maps, dirty/write-version guards, in-flight operation locks, refresh recovery and status behavior. Expose snapshots plus actions; React owns controls and renders snapshots. Never call the existing top-level DOM-binding module before its surface exists.
3. Migrate one complete workspace at a time: shared project/header controls, then Create/takes, Composer, Brand, Static Ads and Hero. Current boundaries are `main.ts`, `composer.ts`, `brand-ui.ts`, `static-ui.ts`, `hero-ui.ts`; these are migration targets, not React components. Preserve remaining native mounts only inside dedicated empty hosts with explicit cleanup. Never mutate React-owned children with `innerHTML`/`replaceChildren`.
4. Prefer explicit React state/subscriptions after extracting the service. Studio's `react/render.tsx` demonstrates a small root adapter for transitional controllers, but copy the pattern locally rather than importing Studio. A single React root with typed workspace children is sufficient here; Ad Studio does not need Studio's docking manager.
5. Remove old DOM listeners/mounts as each boundary moves. Add disposal for timers, subscriptions, media listeners and object URLs. Async view requests need stale-result guards when switching projects/workspaces. Start without Strict Mode replay or Fast Refresh across old page-lifetime controllers; enable them only after mount/unmount cleanup is proven. Studio's full-reload plugin currently matches **Studio source only**, so explicitly choose an Ad Studio reload policy during the transition.

## Preserve these contracts

- `src/projects.ts`: IndexedDB `osh-adstudio-projects`, local active key `osh-adstudio:active:v1`, project schema version 3, original/normalized Blob storage, migrations, immutable take/export lineage and recovery. A UI rewrite needs no database reset, rename or schema bump.
- `src/composition.ts`, `templates.ts`, `availability.ts`, `assets.ts`, `reference.ts` remain reusable domain services. `shared/lib/brand.ts`, `static-ad.ts`, `hero-ad.ts` retain validators and existing saved representations.
- `shared/runtime/client.ts` remains the browser API. Preserve `OSH.shot` string/options compatibility, frames/FPS and optional audio, plus product-video, upload/media, compose-ad, brand, static-ad and hero contracts in `shared/workflows/CONTRACT.md`.
- Generation stays Comfy SDK -> proxy -> ComfyUI. Preserve setup/download progress, local access gates, installed-model checks, source ownership validation, queue tracking and honest capability/error messages. Do not introduce direct Comfy calls or automatic model downloads.
- Preserve source photos and export review. FFmpeg finishing/static composition are not AI generation; supplied AI references are not newly generated output. React must retain these distinctions.

## Acceptance before replacing the old entry

Run `npm run typecheck`, `npm run build`, `npm run test:studio` and Ad Studio's pure regression scripts under `adstudio/scripts/` (projects/workspace/shared-client/product-video/composition/brand/static-ad/hero). Run the corresponding CPU HTTP scripts against the intended dev server using `OSH_TEST_URL`; inspect each script because defaults use different historical ports. Fixture-only brand-provider tests do not prove model inference. No GPU run is needed for this migration.

Browser acceptance must use existing saved projects: upload -> switch workspace/project -> refresh -> verify original Blobs, selected brand, takes and export lineage. Exercise Create, Composer reorder/trim/music/export, Brand editing/review, Static Ads and Hero comparison/approval; check offline recovery, missing-output re-upload, pending-save/storage failures, keyboard focus, disabled job controls and contained scrolling. Confirm no duplicate network jobs after remount/reload and no loss of media when views switch. Leave benchmark/cloud approvals and known model fidelity limits unchanged.

Commit each working boundary separately, record tests and remaining native owners in `notes/adstudio.md`, and keep both applications building. Rollback should be reverting a view-layer commit, never clearing user storage.

## P0 sequencing update - 2026-10-24 (planning only)

Do not begin the view migration until a real Hero Qwen job, durable local collection, saved browser history and refresh retrieval pass. Integration/readiness does not establish that milestone. Current Hero/source/brief UI stays native.

The **first migration boundary is the project/persistence/job service**, extracted without changing markup or storage. `main.ts` currently owns `saving`, dirty/write-version guards, pending asset/media maps, durable status and `working()` locks. Give these an explicit snapshot/subscribe/actions/dispose boundary while retaining ordered saves and project-scoped asset ownership. React is already installed; no dependency, DB version or route changes.

Test that boundary with delayed/out-of-order saves, project switches while dirty, quota/retry, original Blob readback, old-project migrations, stale async results and in-flight operation refusal. Capture existing browser state before extraction; return to the same8301 origin and verify it after refresh. Revert the extraction commit if contracts regress, never clear data.

First **React view**: one small connection/save-status host, fed only by the service. Remove the legacy writers/listeners for exactly that host in the same commit; no simultaneous DOM/React ownership. Use a locally copied one-root adapter pattern, explicit unsubscribe/unmount, timer/object-URL cleanup and a deliberate full-page TS/TSX reload policy. Keep Strict Mode replay/Fast Refresh off across legacy controllers until disposal is proven. Test remount/refresh for one subscription, no duplicate save/job and preserved busy/error states.

Then migrate project controls (with global save/job guards), one complete Hero direction-review island, Hero comparison/history, Brand, Create/takes, Composer and Static views in separately reversible commits. Legacy `blocking()` currently sets disabled on all Hero controls: remove that writer from each React-owned subtree and drive busy through props before moving it. A native workspace may remain only in a dedicated empty host with explicit lifecycle ownership. Keep all five existing hash routes, current CSS and project identities; no Studio docking/registry imports. Browser acceptance and both suites gate every boundary. This order refines the earlier markup-first sketch; no React UI was implemented in this task.
