# AGENTS.md: instructions for any coding agent (Codex/ChatGPT, Claude Code, …)

This repo is worked on by two people, each switching between agents. **Read this file, then `notes/studio.md` → "Where we left off", before doing anything.**
`CLAUDE.md` is the full brief (rules, sources, prizes). This file is the short version, and it applies to every agent.

## What this is
Two entries for Comfy Org's **Open Source Higgsfield** competition. **Hard deadline: Thu Oct 30, 9:00am PT.** Treat Wed Oct 29 as the real one.
- `studio/`: **dvs's** cinema studio (Director + Edit Anything). The person driving you is usually dvs → work here.
- `adstudio/`: the partner's ad studio. **Don't edit it** unless asked.
- `shared/`: used by both: `runtime/` (local server), `workflows/` (ComfyUI API JSON + `CONTRACT.md`), `styleboard/`, `lib/`.
- `archive/`: frozen concept mockups. Don't edit.

## Rules (non-negotiable, see RULES.md)
- Categories: **Open Weights Only · LTX VFX bonus · Most Innovative**.
- Generation goes through the **Comfy SDK** (`comfy-sdk`) → `comfy-api-proxy` → ComfyUI. No closed APIs, no partner/API nodes, **open-weights models only**, LTX as the core video model.
- Before adding any model or dependency: write its name, license and source link in your notes file.
- Projects load files only from their own folder and `../shared/` (keeps the later repo split easy).
- `DEADLINES.md` beats `PLAN.md` whenever the two conflict.

## Working conventions
- **Shared branch decision (user, 2026-10-23): both owners work on `main` now.** Ad Studio's workspace branch through `58dd62a` was merged into main in `656bab2`. Partner agents: preserve any uncommitted/new branch work, fetch origin, switch to main and integrate any remaining work without resetting or discarding it. Continue committing and pushing on main; do not keep developing on the old Ad Studio branch. Pull/reconcile remote main before pushing; never force-push. Coordinate shared runtime edits in both notes files. Ad Studio keeps its current UI until its owner starts the React migration described in `adstudio/REACT_MIGRATION.md`.
- **Commit and push on your own** after each working change, using **Conventional Commits**: `feat(studio): …`, `fix(studio): …`, `style:`, `docs:`, `chore:`. Don't ask the user first; they don't want to think about commits.
- Before ending a session (or when the user says they're switching agents), **update `notes/studio.md` → "Where we left off"** (state, what's running, next steps), then commit and push.
- Keep the UI style: dark, Inter, **no rounded corners** (for now), tokens in each page's `:root`.
- Convivial design is central to Studio: support user agency, understandable tools, reversible actions and learning at the user's pace. Prefer calm, informative empty states over coercive calls to action.
- New ordinary Studio modals use `studio/src/react/popup.tsx` and its shared styles: native dialog focus/escape behavior, visible X, backdrop dismissal only when both pointer down/up are outside, contained scrolling and a shared title/action grid. Do not introduce another text Close button or independently styled popup shell. Guided tutorial overlays retain their focus-specific behavior.
- Follow Swiss / International Typographic Style principles for Studio UI: precise shared grids, consistent spacing, clear typography and hierarchy, restrained color, and functional visual cues. Keep related media lanes adjacent; put track controls in a gutter rather than adding spacer rows. Editable numbers use consistent boxed drag-or-type controls. Prefer alignment and proportion over extra borders, panels, or decoration. This is the user's ongoing design preference.
- Use After Effects as the interaction reference for the editing workspace. Expandable properties must look interactive at rest: visible disclosure arrow, explicit property label, bounded hit target, hover/focus and expanded states. Never rely on tiny arrows or hover-only discovery. Keep the app frame bound to the viewport and scrolling contained to the intended panel; verify panel-end scrolling and expanded timelines visually before shipping layout changes.
- Studio is in the polishing phase: explicitly report remaining preview/mockup/unconnected features when relevant, and never present a prepared UI or downloaded model as a working backend. Current audit: `notes/design/studio-polish-readiness.md`.
- For Studio design changes, consult `notes/design/higgsfield-cinema-studio-design.md`: researched references, prioritized adaptations, interaction contracts and original UI copy. Proposed features in that document are not claims of existing implementation.
- Studio UI lives in strictly typed React components under `studio/src/react/*.tsx`. Director/Edit HTML files hold page styles and the React mount point. Existing `studio/src/*.ts` modules own project storage, canvas/media/pointer services and Comfy SDK orchestration; the Director controller still has inherited unchecked types. Build new UI in React, not string templates or DOM factories. `react/render.tsx` gives each service host one React root; closed dock panels must stay connected in hidden parking (`panel-lifecycle.ts`). Native controller lifetimes currently require full-page reloads for Studio TS/TSX development edits; CSS still updates live.
- Prefer small targeted edits over rewrites. The Director is one big file; read the relevant part first.

## Run it
- `npm install`, then `npm run dev` → http://127.0.0.1:8288/ (Vite + React + TypeScript; CSS live updates, Studio code reloads). The generation API (`shared/runtime/api.ts`, a Vite plugin using `@comfyorg/sdk`) is mounted on the same server and starts `comfy-api-proxy` itself.
- Real generation also needs ComfyUI on :8188 with the models in `shared/runtime/models.json` (`npm run models -- --models-dir …`). The Director header shows **● local ComfyUI** when connected. Outputs go to `outputs/` (gitignored).
- Before committing: `npm run typecheck` (and `npm run build` for bigger changes).
- Security rules in README → Security. Never expose ComfyUI/proxy, never commit `.env`.
- Machine-specific paths (where ComfyUI lives, how to start it) are in `notes/studio.md` → "Local machine".

## Map of studio/
- `director.html` + `src/director.ts`: header · left = shared sidebar (`src/shell.ts`) · middle = preview + motion prompt + **Generate shot** + timeline (sequence ↔ opened shot, stash tray, 🗑 trash) · right = keyframe generator.
  - State lives in `localStorage['osh-director']` (`SH` shots, `STASH`, `TRASH`, `cur`, `G`). The look is in `osh-project`.
  - Shot: `{n, d, spec, m (motion), keys:[{t,u,spec,img}], r (generated), video, seed}`.
  - `OSH.keyframe()` / `OSH.shot()` (`shared/runtime/client.ts`) call `/api` (`shared/runtime/api.ts`). Video only generates when the user presses Generate.
- `edit.html` + `src/edit.ts`: docked Edit workflow; React precision image editor (brush/box/erase, masked Z-Image resynthesis, saved versions), real video properties/export and frame capture. Automatic subject masks need segmentation weights; not implemented.
- `src/shell.ts`: shared sidebar (selected media + "open in", mood board, cast & places). `src/scene.ts`: generic placeholder + storage helpers.
