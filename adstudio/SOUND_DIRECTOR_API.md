# Sound Director — Journey UI contract

Target: unified Journey on **8304** (`feat/adstudio-final-integration`).  
**Do not edit the 8302 Journey agent worktree.** Audio is frozen for release after the fixes below.

Verified integration baseline: `8d312b9`. Release fixes land on top of that SHA.

## Readiness

`GET /api/sound/capabilities` → `{ stableAudio:{available,model}, ffmpeg, note, modes:['auto','mute','reference','replace'] }`

Stable Audio Open 1.0 + T5-base are **optional**. When unavailable:

- **Auto sound** is disabled in the UI with `capabilities.note` (understandable explanation).
- Mute, Replace (licensed upload), and authorized Reference reuse still work.
- Silent video master always remains downloadable.

## Exact video targeting (required)

Each static take may have **multiple commercial videos**. Sound must never follow “latest”.

| Method | Target |
|---|---|
| `videoTake(videoTakeId)` | Exact take |
| `planCampaignSoundForVideo(videoTakeId, preferSilence?)` | Exact take |
| `applyCampaignSoundForVideo(videoTakeId, mode, opts?)` | Exact take |
| `downloadCampaignVideoTake(videoTakeId, preferMixed?)` | Exact take |
| `soundState(videoTakeId)` | Exact take |
| `commercialFor(heroTakeId)` / `planCampaignSound` / `applyCampaignSound` / `downloadCampaignVideo` | Convenience only — resolves **latest** sibling; Journey UI must **not** call these for sound actions |

Journey Reveal wires every control with `v.id` (the figure’s video take). Replace stores `replaceVideoId` before the file picker so the upload cannot land on a sibling. Download uses `downloadCampaignVideoTake(v.id)`.

**Isolation rule:** two videos from the same static image are independent. Muting, replacing, referencing, or downloading one must leave the other’s `soundByTakeId` slot and exports untouched.

Persistence key: `creative.soundByTakeId[videoTakeId]` (`CampaignSoundState`). No DB version bump. Regenerating sound **never** re-runs LTX; silent master file is never overwritten.

## Explicit audio rights (required)

Video footage rights ≠ soundtrack rights. Uploading a reference **must not** set or imply `audioRights`.

Before **Use reference audio**:

1. Visible checkbox: user confirms commercial rights to **both** the soundtrack recording **and** the underlying music.
2. UI keeps the button disabled until checked (`audioRightsOk`).
3. Client calls `applyCampaignSoundForVideo(id, 'reference', { confirmedAudioRights: true })`.
4. Server/client reject reference reuse unless `confirmedAudioRights === true` on that call; `setInspirationAudioRights('user-owned-or-licensed', { recordingAndMusic: true })` is required to persist rights.

Do not pre-check the box. Do not infer rights from having uploaded a reference.

## Loudness management

`POST /api/sound/mix` applies:

1. Stereo 48 kHz layer prep with fades + layer gain  
2. `amix` (or single bed) with `normalize=0` → temporary WAV  
3. ebur128 **Summary** integrated loudness + peak (not momentary −70 lines)  
4. Conservative gain toward **I = −16 LUFS** (clamped), then true-peak `alimiter`  
5. Mux AAC stereo onto a **new** MP4; silent master file untouched  

Empty layers (Mute) remux video with `-an` — **gain is never applied to silence** (no silence→noise). Near-noise-floor beds (`I < −60` and peak `< −50`) are left unboosted. Response includes `loudness.{preIntegratedLufs,gainDb,integratedLufs,truePeakDb}`. Duration aligned with `-t`.

## SoundPlan (shared)

`shared/lib/sound-director.ts` → `planCampaignSound({ takeId, creative, shotPlan, videoDuration?, referenceAudio?, videoRights?, audioRights?, preferSilence? })`

## HTTP

| Route | Role |
|---|---|
| `POST /api/sound/plan` | Build SoundPlan from creative + shotPlan |
| `POST /api/sound/analyze` | `{url}` → ReferenceAudioAnalysis |
| `POST /api/sound/upload` | Raw body; header `x-osh-audio-rights: user-owned-or-licensed\|inspiration-only` |
| `POST /api/sound/extract-reference` | `{url, audioRights:'user-owned-or-licensed'}` → wav |
| `POST /api/sound/mix` | `{silentMaster, duration?, layers[]}` → AAC MP4; silent master unchanged |
| `POST /api/audio` | Existing Stable Audio generate (optional) |

## Journey Reveal controls (per video figure)

1. Auto sound — disabled when Stable Audio missing + note  
2. Mute — exact `v.id`  
3. Replace soundtrack — exact `v.id` via `replaceVideoId`  
4. Use reference audio — requires rights checkbox  
5. Download final MP4 — `downloadCampaignVideoTake(v.id)` (+ Silent master link when mixed)

## Freeze

After these release fixes: **do not** add providers, install models, or expand audio scope. Polish only if a regression blocks submission.
