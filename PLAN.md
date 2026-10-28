# Plan

Plans change. `DEADLINES.md` wins whenever the two disagree. Work top-down: finish P0 before touching P1.
Facts about rules and prizes come from `CLAUDE.md` (sourced, checked 2026-10-19). Anything marked *verify* is not confirmed.

## Prize targets
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

## Supporting libraries (`shared/`)
Local Comfy runtime, API workflows and contracts, reusable styleboard and libraries used by Studio.
