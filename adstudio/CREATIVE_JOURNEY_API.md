# Narrow API contract — Creative Journey UI ↔ creative intelligence / reference video

For Codex Creative Journey UI (port 8302). Quality worktree implements these on the shared Vite API.

## Unchanged (preserve)

- `POST /api/hero/scene` — Klein Creative Restage
- `POST /api/hero/campaign` — hybrid/product-safe tooling
- `POST /api/shot` — LTX via OSH.shot
- `POST /api/export` — FFmpeg MP4
- Existing static PNG / provenance flows

## New

### `POST /api/reference/upload`
- Body: raw `video/mp4` | `video/webm` | `video/quicktime` (≤40MB, ≤60s)
- Returns: `{url, originalUrl, sha256, bytes, duration, width, height, rights:'inspiration-only', productReplacementAvailable:false}`

### `POST /api/reference/analyze`
- JSON: `{url, originalUrl?, bytes?, rights?:'inspiration-only'|'user-owned-or-licensed'}`
- Returns: `ReferenceAnalysis` (shots, transitions, pacing, transferablePrinciples, analysisMethod, warnings)
- Method is FFmpeg scene/keyframe/heuristics — not a vision LLM claim

### `POST /api/reference/plan`
- JSON: `{plan: CreativePlan, analysis?: ReferenceAnalysis, hook?: CreativeHook}`
- Returns: `{intelligence: CreativeIntelligence, shotPlan: CampaignShotPlan, productReplacementAvailable:false}`

### `POST /api/inspiration/search`
- JSON: `{query?: string, intelligence?: {category,intendedFeeling,creativeHook,photographicApproach,marketingGoal}, media?:'photos'|'video'}`
- Returns: `{configured, provider:'pexels', query, results[]}` — empty + note if `PEXELS_API_KEY` unset
- Sends **queries only**; never customer photos

## Client actions (AdApplication)

- `uploadInspiration(file, rights)`
- `planCampaignShots(hook?)`
- `generateInspiredCommercial(takeId)` — LTX from saved static hero + shot-plan prompt; **not** reference footage remix
- `animateCampaign(takeId)` — existing path (verified)

## Hard limits

- `productReplacementAvailable` is always `false` on this install
- Inspiration-only references must not appear as export source footage
- Do not label FFmpeg-only moves as AI motion
