# studio/: cinema studio

Owner: dvs. Notes: `../notes/studio.md`.

- `director.html`: mood board (left, shared) · shot preview + sequence timeline (middle) · keyframe generator (right)
- `edit.html`: Edit Anything: click a region, describe the change, edits stack as layers
- `shell.js`: shared left sidebar: selected media + "open in" any workflow, mood board, cast & places
- `scene.js`: placeholder renderer for keyframes (replace with real outputs)

Both pages keep state in `localStorage` (`osh-director`, `osh-project`). Clear site data to reset.
Everything is still faked in the browser. Next up: `PLAN.md` → studio P0.
