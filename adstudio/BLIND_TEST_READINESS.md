# Website-first blind-test readiness

Website-first foundation tested at **b6752b3f6117ef5a3e0108a6a805b7007b288f9e**.
Baseline: `3a6b343fbf6186c1a1456808e6333582e5c82012`.
Original readiness report: `bcb888366cae5400192deb814646f568ea2724b8`. The subsequent targeted repair below changes application code; use `git log -1 -- adstudio/src/ad-application.ts` for its exact commit.

**Implementation/regressions PASS. Full readiness gate FAIL / NOT VERIFIED:**
independent browser interaction, real browser image preparation, IndexedDB refresh
and download completion remain unverified. No unfamiliar-website image job ran.
Do not interpret service, HTTP or SSR tests as browser acceptance or image quality.

## Targeted website/Develop/+ New repair (2026-10-26)

**CPU implementation/regressions PASS; Chrome acceptance still NOT VERIFIED.**
The earlier service/standalone-consent tests missed that the primary page never
mounted WebsiteSourceConsent. It now does; no underlying rights/provenance gate
was removed. Current selected-source metadata refreshes separately from the image,
with project/source-bound confirmation and one relevant disabled-Develop reason.
Optional count, arrangement, packaging, texture and style remain optional.

Editing a different website immediately isolates the visible context. Old brand,
images, facts, consent and plans remain saved, but are not presented as the new
site. Failed discovery is scoped to the entered site; Return to saved brand
restores A. Successful B research opens its own clean project and leaves A's
website/source/history intact. Request identities and a pre-save context revision
fence late research and both fresh/cached image promises. Provider reads are
serialized; discarded reads cannot leave a permanently loading project on reopen.
Same-site refresh keeps corrections/product IDs. No backend or shared API changes.

Header **+ New** flushes queued edits, creates/activates a blank Product project,
and explicitly suppresses the old sole-brand fallback. No photos, facts, permissions,
plans, approval, history or website are inherited; old records remain selectable.
Database version/origin and all generation/hash/approval contracts are unchanged.

Two new regressions are in `npm run test:adstudio-ui`: actual application actions
and primary React JSX with TEST-ONLY synchronous source hydration (SSR cannot run
browser effects). They catch the former missing component, check two unchecked
consents, verify the actual button's one-reason disabled/enabled states, and show
A hidden under B and a clean + New. This is not live DOM/canvas/IndexedDB acceptance.
Current targeted checks: UI6 +website5 +creative6 +Ad/shared17 +Director23 =57
passing JS script files; production build/typecheck PASS. Private snapshots/actions,
logs and preservation evidence: `outputs/workflow-switch-fix/`. No models, GPU calls,
private uploads or generation. No Crumbs plan remains byte-identical/unapproved.

Remaining unpaid Chrome check: refresh the SAME8301 profile; + New is blank;
A -> B shows only B after discovery (and A restores through the selector); choose
an authorized website photo, explicitly confirm accuracy/use rights, leave optional
fields blank and click Develop once. It must reach Creative direction and survive
refresh. Stop before Generate. No controller retry/workaround was performed.

## Acceptance evidence

| Requirement | Status | Evidence / reproducible check |
| --- | --- | --- |
| Prominent website entry, manual brand and own-photo path | PASS in React SSR; browser NOT VERIFIED | `npm run test:website`, `npm run test:adstudio-ui` |
| Grounded identity, descriptions, positioning, differentiators, logo references, candidate colors | PASS for supported fixtures and public smoke | `website-discovery.test.mjs`; private `public-smoke.json` |
| Source facts vs hypotheses vs unknowns | PASS | Website-first uses source-only collection. Tone/audience/style remain absent unless actually provided; website description is not photographic style. Legacy configured AI analysis remains labeled inference. |
| At least three distinct products with their own images | PASS | Electronics fixture: speaker, bag, chair with distinct own synthetic PNGs. Separate clothing/microdata and furniture/permalink/OG fixtures. Public smoke: three distinct product records/images. |
| Defensible relationship, no unrelated banner or image-zoom SKU | PASS | Product JSON-LD image, scoped microdata, same product-permalink title/image, explicit product-page OG. Ambiguous shared imagery disabled; forged client relationships rechecked against current DOM. |
| Protected raster import and actual HTTP client/server path | PASS with test-only web reader | `website-http.test.mjs`: real Vite/API, OSH client, app/store, selected proof under unchanged64KiB body cap; no production fixture flag. Public smoke independently exercises real reader/raster checks. |
| Original and normalized images, hash/provenance persistence | PASS in isolated storage | `website-journey.test.mjs`: unchanged downloaded originals, distinct normalized PNGs, brand/product/source/method/URL/MIME/hash bindings, reopen and original preservation. Browser canvas preparation NOT VERIFIED. |
| External origin and commercial-use rights remain distinct | PASS | Original *input* does not mean owned or camera-original. Separate unchecked accuracy/use attestations, timestamps and source bindings; rights revocation blocks review/request/export. `source-provenance.test.mjs`. |
| No website copy automatically becomes visual observations | PASS | New image facts start empty. Only explicit accuracy action can add a minimal product-identity observation. Count/texture/arrangement are never inferred. Complete direction/fact review remains separate. |
| Real website information reaches creative planning | PASS | Product evidence retains source IDs; customer corrections labeled owner input, stale website evidence unconfirmed. Bounded product/positioning data enters existing text-planning request as untrusted data. |
| Three distinct non-food directions and honest provider state | PASS in CPU integration | Editorial/material/graphic scaffolds; no bakery assumption or presumed tabletop scale. Missing/invalid Qwen3 output is deterministic, never fake AI success. No new live text inference in this sprint. |
| Fresh reviewed request for exact selected product/source | PASS | App action and real HTTP tests validate `/api/hero/qwen` request, seed, product ID, raw/normalized hashes and reviewed snapshot. Source/brand/seed/permissions changes invalidate review. |
| Generation availability / payment / no-submission gates | PASS for closed/unavailable state | `website-http.test.mjs`: Generate submission count0; `qwen-app-api.test.mjs`, relay/session/guard tests. Actual remote availability NOT VERIFIED this sprint. Local Qwen FP8 weights unavailable; no automatic rental/download/fallback. |
| Real PNG composition/export | PASS for explicitly SYNTHETIC input | `website-journey.test.mjs` and existing export tests. `outputs/website-first-readiness/SYNTHETIC-composition.png` decoded, hash checked and visually inspected; not an AI-generated product photograph. Browser download completion NOT VERIFIED. |
| Repeat research, corrections, source/brand/project isolation | PASS in app actions/storage | Same saved website retains brand/product IDs, corrections, assets/takes; fresh review required. Another business opens separately. Wrong-brand sources fail; generic category resets. |
| Interrupted saves and durable reopen | PASS in isolated storage | Quota failures during import/edit, blocked export until retry, originals retained, project switching/reopen. Owner IndexedDB refresh NOT VERIFIED for this new flow. |
| Existing DBv3, projects, history, specialist tools, Director | PASS regressions / no migration | `test:studio`23 files; existing Ad/shared/UI/media regressions. No authored `studio/` source changes; legacy fields/routes accepted. No browser storage touched or cleared. |
| No Crumbs campaign preserved and unapproved | PASS file/hash checks | `b94c0c151365694d` matches retained selected-plan bytes; no reviewed snapshot added. Retained original, normalized source, earlier real output and9 unrelated outer-worktree file hashes match. Private `preservation.json`. |
| Typecheck/build/regressions | PASS | Typecheck + production build;61 JS script files: website5, creative6, UI4, Ad/shared17, Director23, CPU media5, clean-routes1. Python14 pass,2 Linux-only skips. Logs under private evidence directory. |
| Actual React browser journey / refresh / reopening | **NOT VERIFIED - BLOCKER** | Earlier Computer Use URL-confidence restriction respected. No controller retry or alternative-controller workaround. SSR and memory/HTTP tests do not close this gate. |
| Owner-chosen blind website and real generated PNG | **NOT RUN** | Site not selected or preconfigured. No image inference, new model, Pod, private upload or spend. A different business requires its own explicit inference/source/budget scope. |

## Public smoke test (supporting evidence only)

Ordinary public collection: <https://shop.pimoroni.com/collections/pico>.
Robots rules inspected before bounded reads; no cart/account/search/protected route,
cookies, authentication, JavaScript execution or access-control bypass.

Final run: four HTML pages, three product/image relationships (Raspberry Pi Pico,
Raspberry Pi4 ModelB, official USB-C power supply);2.606s. One current source page
was rechecked and one WebP fetched/validated **in RAM only**, never saved/published.
Both original research and fresh page hashes retained. An image URL ending.jpg
actually returned WebP; MIME/magic and original bytes, not URL suffix, govern import.
Initial reads exposed image-zoom URLs misclassified as products and reference images
crowding later product photos; general fixes have offline regressions. Earlier
reports retained separately. No special-case business code was added.

Optional explicitly networked reproduction (bounded public read, no inference):

```powershell
node --experimental-transform-types adstudio/scripts/website-smoke.mjs --website https://shop.pimoroni.com/collections/pico --verify-image
```

Do not treat a smoke-test success as a promise that every website works. Private
evidence is in gitignored `outputs/website-first-readiness/`: fixture-journey,
HTTP evidence, static SSR review, synthetic PNG, public smoke, logs and preservation.
No customer photographs, external product-image files or credentials are committed.

## Important limitations

- At most four HTML pages; capped images/products/CSS/raster sizes. Huge catalogs
  are deliberately partial. JS-only shops, bot protection, inaccessible images,
  unsupported metadata and ambiguous relationships use clear manual import fallbacks.
- Thumbnails are protected raster previews; availability is established by download
  and browser decode, not merely the existence of an image URL. SVG logos remain
  references; upload an authorized raster logo using existing tools.
- No text model visually inspects the photograph. Product descriptions and marketing
  excerpts are website statements, not proof of ingredients, audience or appearance.
- Palette values are CSS candidates, not confirmed brand preferences. There is no
  claim of deep AI brand analysis. Actual future image fidelity needs visual review.
- Original downloaded input bytes can themselves be edited/AI-made by the website.
  External origin and user permission are preserved; neither is independently certified.
- Production browser normalization, responsive ordering, focus/click behavior and
  actual browser persistence/downloads still need permitted interaction.
- The reserved No Crumbs $2 allocation is unused and exclusive to its prepared
  nine-roll campaign. It cannot fund an unrelated website's generation.

## Remaining owner-only actions

Keep the existing Chrome profile and **http://127.0.0.1:8301/adstudio/** origin.
Do not clear storage or click Generate during unpaid acceptance.

1. Refresh, use a new project, paste an authorized business website and click
   **Discover brand & products**. Check the actual brand and product thumbnails.
2. **Use this product**; inspect its saved photograph and source URL. Correct product
   information/photo facts. Confirm accuracy and reuse permission only if true;
   otherwise upload an authorized original. Leave unknown count/texture blank.
3. **Develop advertisement**, inspect the three directions/provider label, then
   **Accept direction & confirm facts** only when accurate. Wait for Saved.
4. In **Request details**, export the reviewed JSON. Check matching product/source
   identities and hashes. Missing models must keep Generate disabled with a reason.
5. Refresh and switch projects/back. Verify photo, corrections, reviewed request,
   old takes and exports remain. A changed source/seed/brand must require fresh review.

Record the actual browser observations, or provide fresh permitted browser control
to close the explicit browser gate. No engineering setup should be delegated to the
owner. A real unfamiliar-business generation requires a new explicit scoped approval
after its source and request are reviewed; do not reuse No Crumbs approval.

## Saved websites / brand intelligence update (2026-10-26)

Implemented optional editable brand understanding, saved-site project navigation and
real local Qwen3 text analysis. See BRAND_INTELLIGENCE.md for actual evidence and
limitations. Three-site service/storage and React SSR regressions pass. These do
not establish Chrome IndexedDB/canvas/interactive acceptance; the full gate above
remains unverified. No controller retry or image inference in this milestone.
