# Current Qwen integration

The Qwen adapter is now connected to Hero; see [QWEN_HERO_INTEGRATION.md](QWEN_HERO_INTEGRATION.md) for the current model selection, collapsed controls, concise prompt review and manual acceptance steps. Real app inference is still unverified. The text below records the original 012df48 brief-control milestone and its former standalone-only boundary.

---

# Source-grounded hero briefs

Open `http://127.0.0.1:8301/adstudio/#hero` on the existing local server. Choose a saved brand/product and **the original source** (the old demo initially selects a supplied AI edit). Open **Source facts, controls and prompt review**.

1. Inspect the actual selected thumbnail. Describe visible count, spacing, container and distinguishing texture; confirm the observations. No vision model extracted these facts.
2. Select product type and intent. Intent loads a starting control preset; then adjust fidelity, count, arrangement, angle, crop, background, cleanup, creativity and brand emphasis individually. Strict explicitly overrides count/arrangement to exact, angle/crop to none and creativity to low. Cleanup always excludes real product features/bake marks.
3. Rebuild the brief. This replaces the editable sections/prompt; it does not change references or historical takes. Sections separate photo observations, product descriptions/unverified notes, website/owner/inferred brand signals, preservation, transformation, composition, background, texture and avoid rules. Creative direction is a labelled suggestion, not an invented brand fact.
4. Edit sections, compile them, then optionally edit the exact final model prompt. Inspect the payload manifest. Explicitly review the final text. Changed source/facts/brand/controls/execution settings/sections/prompt invalidate review. Input changes require rebuilding, so stale sections cannot quietly reach generation.
5. Download the complete draft/payload JSON for the next benchmark. Drafts persist in the existing project's IndexedDB metadata, separate from original image Blobs and prior takes. No new storage namespace or destructive migration. Missing images/storage failures are surfaced.

## Model boundary

This is deterministic planning, not a new AI analysis provider. It consumes existing `brandContext()`, website evidence IDs/hashes, labelled Brand DNA fields, selected source/original SHA256, selected product descriptions and optional owner/review notes. It never assumes every brand product matches a reference. Missing tone is declared; facts are never invented to fill blanks. Existing photo facts must be authored/confirmed against each selected source.

The app's existing Generate endpoint runs **experimental local Z-Image**, not Qwen. Its fixed 4:5 center crop cannot honor strict/no-crop/exact-count/exact-arrangement requests: the client refuses that mismatch before upload/inference and offers brief export. Other requests require a reviewed prompt and actual installed capability. The final edited prompt is passed verbatim; legacy free text is never silently substituted. Prompt instructions cannot certify physical fidelity on any model. Photographic finishing remains a separate non-AI method and does not execute these AI instructions.

Shared compatibility: optional version1 `HeroSettings.briefDraft`; existing project/workspace versions and old takes stay valid. Hero prompt limit expands additively from1,800 to16,000 characters to accommodate reviewed structured prompts. Existing endpoint/model defaults/SDK signatures unchanged. Director has no imports of the new UI and no source changes.

## No Crumbs prepared review

Run `node adstudio/benchmark/prepare-brief-controls.mjs` with Node22.20+ from the repository. Requires the existing private `outputs/creative-quality-sprint/sources.json`, original files/guides/crop and saved `outputs/benchmark-ad-v1/demo.json`. It verifies actual reference/original hashes and writes **only new local preparation artifacts** to `outputs/brief-controls-v1/`:

- `review.html`: all three intents, reference thumbnails, controls/source evidence, editable sections/prompt and edited JSON download.
- `{enhancement,closeup,campaign}.json`, `*-prompt.txt`, `*-workflow.json`: explicit input/brief and official FP8 Qwen graph with only prompt/output-prefix changed. Seed42,40steps,CFG4,euler/simple and existing pins remain intact.

These are NOT new generated previews. Prepared graphs are unapproved and are not automatically sent anywhere. HTML edits download a review draft; they do not silently mutate the saved workflow. Recompile/revalidate that exact edited prompt and guide before execution. Earlier v1 creative briefs, paid-run results and known-good workflows remain untouched.

Generalization: bakery texture hints apply only to the explicitly selected type and remain conditional on visible evidence. Cookies use spread/crumb/inclusions; packaged goods use material/seams/printed artwork; unspecified products use observed material/shape. Brown sugar/ingredients are never inferred from appearance. Brand signals guide surroundings/light rather than altering product colour or identity. No default cinematic direction.

## Before another real render

Owner review/correction of the three briefs and source observations; select exact source/crop and desired constraints; recompile the edited prompt into the official Qwen graph and validate hashes/settings. A separately approved, available Qwen environment is still required. No Pod, model download or paid inference was performed for this task. The previous round's frosting/count/geometry failures remain unresolved until a new controlled run demonstrates improvement.

Validation: compiler/conflict/missing-fact/stale-review/adapter/exact-prompt tests; project isolation/refresh serialization, original preservation and legacy compatibility; official graph reuse; both-app regression suites, typecheck/build and local HTTP module smoke. Browser acceptance **NOT RUN**: connected browser inventory was empty. Manual acceptance: confirm edits and reviewed status survive refresh, source/brand/seed changes invalidate them, project switching isolates drafts, and unsupported local locks produce no inference.
