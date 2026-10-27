# Creative Journey UI ↔ Open Ad Studio API (quality branch)

Target: unified Journey on **8304** (`feat/adstudio-final-integration`, worktree `open-higgsfield-final`). Engine/API from `feat/adstudio-campaign-quality` @ `25d6bbd`; Journey UI from `feat/adstudio-creative-journey` @ `e928091`. Do **not** edit Director, 8301/8302/8303 agent worktrees, or auto-merge to main.

**Incorporating newer Journey UI commits:** from the final worktree, `git fetch origin && git merge origin/feat/adstudio-creative-journey` (or cherry-pick). Resolve `creative-service.ts` by keeping both `journey?` and `inspiration?` on `CreativeWorkspace`. Never edit the journey worktree from the integration branch.

## Preserve

| Route / client | Role |
|---|---|
| `POST /api/hero/scene` | Klein Creative Restage static |
| `POST /api/hero/campaign` | Hybrid tooling (not default UI) |
| `POST /api/shot` | LTX-2B generative motion (`OSH.shot`) |
| `POST /api/export` | Single-clip WebM→MP4 |
| Product-safe static PNG + provenance | Unchanged |

## Creative intelligence (shared lib)

- `buildCreativeIntelligence(plan, hook?)` → brand/category/`sensoryLane`, hook, photo + video concepts, fidelity constraints
- `proposeCreativeHooks(plan)` → 2–3 abstract mechanisms (not scene templates)
- Lanes adapt copy for food / comfort-care / scent / athletic / refined-object / general from disclosed text — not a cookie-only system

## Reference video

### `POST /api/reference/upload`
Raw body: `video/mp4` \| `video/webm` \| `video/quicktime` (≤40MB, ≤60s)  
→ `{url, originalUrl, sha256, bytes, duration, width, height, rights:'inspiration-only', productReplacementAvailable:false}`

### `POST /api/reference/analyze`
JSON `{url, originalUrl?, bytes?, rights?}`  
→ `ReferenceAnalysis` (shots, transitions, pacing, transferablePrinciples, `analysisMethod`, warnings)  
Method: FFmpeg scene-change + keyframes + motion heuristic. **Not** a vision LLM.

### `POST /api/reference/plan`
JSON `{plan: CreativePlan, analysis?: ReferenceAnalysis, hook?: CreativeHook}`  
→ `{intelligence, shotPlan: CampaignShotPlan, productReplacementAvailable:false}`  
`CampaignShotPlan.shots[]` drives the final timeline (purpose, duration, keyframe strategy, motion brief, edit transition).

### `POST /api/reference/assemble`
JSON `{shots:[{source}], transition:'cut'|'dissolve'|'wipe', width?:720|1080, closing?:pngUrl, ctaSeconds?}`  
→ assembled `/outputs/*.mp4`  
**Honest:** FFmpeg transitions are deterministic edits, not AI camera moves.

### `POST /api/inspiration/search` (optional)
Queries only (never customer photos). Empty results if `PEXELS_API_KEY` unset.

## AdApplication client actions

| Method | Behavior |
|---|---|
| `uploadInspiration(file, rights)` | Upload + analyze + optional shot plan |
| `planCampaignShots(hook?)` | Persist intelligence + shot plan |
| `generateInspiredCommercial(takeId)` | **Multi-shot:** plan → distinct stills (source vs hero) → LTX per beat → assemble |
| `animateCampaign(takeId)` | **Multi-shot original** (no reference): `planOriginalCampaign` → same producer |

Templates: `inspired:…:xN`, `campaign:…:xN`, `original:…:xN`.

## Hard limits

- `productReplacementAvailable` always `false` on this install
- Inspiration-only references must not appear as export source footage
- Do not label FFmpeg wipes/dissolves as generative AI motion
- Keep 8301 / 8302 / Director untouched; no auto-merge to main
