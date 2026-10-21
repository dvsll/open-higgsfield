# Plan

Plans change. `DEADLINES.md` wins whenever the two disagree. Work top-down: finish P0 before touching P1.
Facts about rules and prizes come from `CLAUDE.md` (sourced, checked 2026-10-19). Anything marked *verify* is not confirmed.

## Prize targets (both projects)
**Open Weights Only** (fully open source) · **LTX VFX bonus** · **Most Innovative**. Best Overall is automatic.
Rules and what each category requires: **[RULES.md](RULES.md)**. In short: LTX-2.5 is the core model, everything open, generation via the Comfy SDK, and the demo explains why it's innovative.

## studio/: cinema studio (Higgsfield Cinema Studio, open)
The demo already has the UX: the Director (mood board → keyframes → sequence) and Edit Anything, joined by shared elements and the "Selected media" hop.

**P0: must ship**
1. **Keyframes → video**: Generate shot sends a shot's keyframes and motion prompt to LTX-2.5 keyframe conditioning and gets an MP4 back. This is the core.
2. **Generate keyframe**: prompt + elements → image. Pick an open image model and check its license (*verify*: FLUX 3 weights are not out yet).
3. **Play / export the sequence** as one MP4 (ffmpeg concat).
4. Keep state in the browser (already done) and in project files on disk.

**P1: the Most Innovative story**
5. **Edit Anything on keyframes**: click region → mask → LTX-2.5 In-Outpainting IC-LoRA, or an open image-edit model (*verify* which).
6. **Mood board as conditioning**: LTX Ingredients IC-LoRA with the pinned references.
7. **Camera moves**: Motion Control IC-LoRA from a simple camera path.

**P2: only if ahead of schedule**
8. Pixel Spatial Upscaler pass for the final export.
9. Edit Anything on whole shots (propagate the edit through the clip).

**Demo story (≤ 2 min, must say why it's innovative: one shared element/media layer across workflows, keyframe-directed LTX):** mood board → write 3 keyframes → generate shots → fix one keyframe in Edit Anything → play the film.

## adstudio/: ad studio (Higgsfield Marketing Studio, open)
Innovation angle for the demo: *pick it by Oct 22* (e.g. the shared style board as brand kit + one-click reframes via LTX In-Outpainting).
The starter is the Ad Studio mockup: product photo + pitch + vibe → ads in 16:9, 9:16 and 1:1.

**P0: must ship**
1. **Product photo → video** with **LTX-2.5** (image-to-video / Ingredients IC-LoRA). LTX must be the core model for the LTX VFX bonus.
2. **Three aspect ratios** from one generation: reframe/outpaint (LTX In-Outpainting) or generate per ratio.
3. **Tagline overlay + export** of all three (ffmpeg).

**P1: polish**
4. Audio: a music track you own (no closed music APIs).
5. Brand look from the **shared style board**.
6. Vibe presets (Lifestyle / Studio / UGC) that change the prompt and camera.

**P2**
7. Batch: several products → ad set.

**Demo story:** drop a product photo → 15s later, three ready-to-post ads.

## Shared work (`shared/`)
- `workflows/`: ComfyUI API-format JSON + `CONTRACT.md`, which lists input/output node IDs per workflow. Whoever gets a model running first writes it; the other reuses it.
- `scripts/`: one comfy-sdk runner, `run.py <workflow> --in key=value ... --out dir`.
- `styleboard/`: shared looks (already used by studio's mood board).
- `lib/`: the placeholder renderer for mockups. Delete it from each app once real outputs exist.
