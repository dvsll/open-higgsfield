# Sound Director — Journey UI contract (for Codex)

Target: unified Journey on **8304** (`feat/adstudio-final-integration`).  
**Do not edit the 8302 Journey agent worktree.** Mirror/polish controls here or cherry-pick into final.

## Readiness

`GET /api/sound/capabilities` → `{ stableAudio:{available,model}, ffmpeg, note, modes:['auto','mute','reference','replace'] }`

Stable Audio Open 1.0 + T5-base are **optional**. When unavailable: Mute, Replace (licensed upload), and authorized Reference reuse still work. Silent video master always remains downloadable.

## SoundPlan (shared)

`shared/lib/sound-director.ts` → `planCampaignSound({ takeId, creative, shotPlan, videoDuration?, referenceAudio?, videoRights?, audioRights?, preferSilence? })`

Fields: atmosphere, music/ambience/silence flags, cues (timed music/sfx/accent), brandRevealAt, levels, referenceInspiration (timing only), separate `rights.video` vs `rights.audio`, modelPrompt, warnings.

**Rule:** video footage rights ≠ soundtrack rights.

## HTTP

| Route | Role |
|---|---|
| `POST /api/sound/plan` | Build SoundPlan from creative + shotPlan |
| `POST /api/sound/analyze` | `{url}` → ReferenceAudioAnalysis (ffprobe + silence/loudness) |
| `POST /api/sound/upload` | Raw audio/video body; header `x-osh-audio-rights: user-owned-or-licensed\|inspiration-only` |
| `POST /api/sound/extract-reference` | `{url, audioRights:'user-owned-or-licensed'}` → wav extract |
| `POST /api/sound/mix` | `{silentMaster, duration?, layers[]}` → AAC MP4; **silent master file unchanged** |
| `POST /api/audio` | Existing Stable Audio generate (Director path) |

Reference analyze now attaches optional `analysis.audio`.

## AdApplication (client actions)

| Method | UI control |
|---|---|
| `planCampaignSound(heroTakeId, preferSilence?)` | (internal / Auto) |
| `applyCampaignSound(heroTakeId, 'auto'\|'mute'\|'reference'\|'replace', opts?)` | **Auto sound** / **Mute** / **Use reference audio** / **Replace soundtrack** |
| `uploadSoundtrack(file, rights)` | Replace soundtrack file picker |
| `setInspirationAudioRights(rights)` | Confirm audio rights separately |
| `downloadCampaignVideo(heroTakeId, preferMixed=true)` | **Download final MP4** |
| `soundCapabilities()` | Gate Auto when Stable Audio offline |
| `commercialFor` / `soundState` | Resolve video take + stored sound |

Persistence: optional `creative.soundByTakeId[videoTakeId]` (`CampaignSoundState`). No DB version bump. Stores silentMaster, plan, layers, mixedUrl, rights/provenance. Regenerating sound **never** re-runs LTX.

## Minimal UI (already on final Journey Reveal)

Contextual under each commercial video (not a new stage):

1. Auto sound  
2. Mute  
3. Replace soundtrack  
4. Use reference audio (only if reference has audio + user confirms audio rights)  
5. Download final MP4 (+ Silent master link when mixed)

## Codex remaining polish

- Confirm-audio-rights checkbox before enabling **Use reference audio** (explicit, not only button).  
- Show SoundPlan atmosphere + cue list in a `<details>` (read-only).  
- Disable Auto with `capabilities.note` when Stable Audio missing; keep Replace/Mute.  
- Per-shot progress toast while generating accents (when model present).  
- Do **not** reintroduce the technical dashboard.
