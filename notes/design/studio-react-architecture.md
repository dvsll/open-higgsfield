# Studio React architecture

Director and Edit start at `studio/src/react/director-app.tsx` and `edit-app.tsx`. `boot.tsx` mounts the typed JSX surface before starting the media/controller services. Startup failures show a reload action without changing project storage.

## Ownership

- React views own app markup, project picker/recycle bin, dock tree and window chrome, toolbar/menu, sequence clips/guides/ruler/audio, generation results/takes/stash/trash, model rows/help buttons, output controls and track attributes, branching edit/prompt history, onboarding, selected-media cards, Stylization, Elements, connection notices and video/image edit controls.
- Existing TypeScript controllers retain generation, canvas painting, playback clocks, pointer interactions, project persistence and scene operations. They publish typed view models through `react/render.tsx`. This retains the existing Comfy SDK -> proxy -> ComfyUI path; no backend or model rewrite was needed.
- Surface IDs remain deliberate controller/editor integration points. Do not render React children into the same host from two owners. Hosts for externally published views must start empty. Never clear a React-owned host with `innerHTML`, `replaceChildren` or `textContent`; update its root instead.
- A dock panel has one stable host and one window-chrome root. The split tree slots reparent that host; they do not recreate its video, editor, canvas or React roots. Closing a panel parks it, connected and hidden, because the services still read its controls. `panel-lifecycle.ts` prevents stale slot cleanup from detaching a panel that has already moved.
- Native media/canvas, mention-editor integration, download links and setup polling remain browser services. Setup's initial surface is JSX; its polling adapter still updates its native status/control leaves. The Director's inherited state/controller file remains unchecked; new React view files are checked by TypeScript.

## Persistence

Existing `osh-projects-v1`, active-project IDs, project-scoped data, `osh-window-workspace-v2`, history trees, tutorial profiles and saved media URLs are retained. Recycling only marks project metadata; it does not delete media or project storage. No reset or data conversion is required.

## Development

Studio TS/TSX edits trigger a full reload through the scoped Vite plugin. This avoids hot-mounting duplicate page-lifetime media listeners, animation loops and render jobs. CSS updates live. Do not add Fast Refresh or Strict Mode replay to the controller boundary before converting those remaining service lifetimes to explicit cleanup contracts.

`npm run typecheck` and `npm run build` include TSX. CPU regression checks include `studio/scripts/react-ui.test.mjs`, `panel-lifecycle.test.mjs`, project isolation, docking, edit history, onboarding, mentions and estimate tests. Browser acceptance must include closing/reopening windows and switching workflows with hidden panels, not just the default screenshot.
