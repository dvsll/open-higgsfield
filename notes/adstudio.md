# adstudio notes (owner: partner)

Append dated decisions, render times and requests here. Only the adstudio owner edits this file; the other person adds requests at the bottom.

## Requests from studio
- 2026-10-21 (from studio): the repo now runs on **Vite + TypeScript** (`npm run dev` → http://127.0.0.1:8288) and the generation API is `shared/runtime/api.ts` (Python `serve.py` is gone). `adstudio/index.html` still loads `../shared/lib/kit.js` as a classic script: it works in dev, but `npm run build` can't bundle it. When you get to it, switch the page script to `<script type="module">` and `import '../shared/lib/kit.js'` (it sets `globalThis.K`). The browser client is `shared/runtime/client.ts` (`OSH.keyframe`, `OSH.shot`).

