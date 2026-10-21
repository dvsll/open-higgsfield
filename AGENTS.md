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
- **Commit and push on your own** after each working change, using **Conventional Commits**: `feat(studio): …`, `fix(studio): …`, `style:`, `docs:`, `chore:`. Don't ask the user first; they don't want to think about commits.
- Before ending a session (or when the user says they're switching agents), **update `notes/studio.md` → "Where we left off"** (state, what's running, next steps), then commit and push.
- Keep the UI style: dark, Inter, **no rounded corners** (for now), tokens in each page's `:root`.
- Page code lives in `studio/src/*.ts` (ES modules; most files start with `// @ts-nocheck` because they were ported from inline JS, so add types when you touch them). HTML files only hold markup + CSS.
- Prefer small targeted edits over rewrites. The Director is one big file; read the relevant part first.

## Run it
- `npm install`, then `npm run dev` → http://127.0.0.1:8288/ (Vite + TypeScript, hot reload). The generation API (`shared/runtime/api.ts`, a Vite plugin using `@comfyorg/sdk`) is mounted on the same server and starts `comfy-api-proxy` itself.
- Real generation also needs ComfyUI on :8188 with the models in `shared/runtime/models.json` (`npm run models -- --models-dir …`). The Director header shows **● local ComfyUI** when connected. Outputs go to `outputs/` (gitignored).
- Before committing: `npm run typecheck` (and `npm run build` for bigger changes).
- Security rules in README → Security. Never expose ComfyUI/proxy, never commit `.env`.
- Machine-specific paths (where ComfyUI lives, how to start it) are in `notes/studio.md` → "Local machine".

## Map of studio/
- `director.html` + `src/director.ts`: header · left = shared sidebar (`src/shell.ts`) · middle = preview + motion prompt + **Generate shot** + timeline (sequence ↔ opened shot, stash tray, 🗑 trash) · right = keyframe generator.
  - State lives in `localStorage['osh-director']` (`SH` shots, `STASH`, `TRASH`, `cur`, `G`). The look is in `osh-project`.
  - Shot: `{n, d, spec, m (motion), keys:[{t,u,spec,img}], r (generated), video, seed}`.
  - `OSH.keyframe()` / `OSH.shot()` (`shared/runtime/client.ts`) call `/api` (`shared/runtime/api.ts`). Video only generates when the user presses Generate.
- `edit.html` + `src/edit.ts`: Edit Anything (placeholder edits; real image-edit workflow not built yet).
- `src/shell.ts`: shared sidebar (selected media + "open in", mood board, cast & places). `src/scene.ts`: generic placeholder + storage helpers.
