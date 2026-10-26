# Saved websites and editable brand intelligence

> Catalog V2 update: see [CATALOG_DISCOVERY_V2.md](CATALOG_DISCOVERY_V2.md). React now returns products before optional receipt-bound text interpretation, preserves same-brand page navigation, and reports bounded/partial coverage. The original analysis evidence below is retained; the latest real Abel text attempt timed out and is not an AI success.


The primary React journey remains Product → Direction → Review/export. On the
product step, **Saved websites** reopens that business's latest project, selected
original, photo permissions, plans and takes. The existing project selector still
opens individual advertisements. Rediscovery updates evidence without replacing
customer corrections. Redirect aliases require observed destinations and matching
source identity; canonical hints require a protected read, matching identity and
an equivalent route/query. Different businesses and tenant queries stay separate.

**Brand understanding** is an optional, collapsed section beside the discovered
products. Expand **Edit brand understanding & palettes**, edit, then click **Save
brand understanding**. Name, description, story, positioning, tone, messaging,
audience hypothesis, differentiators, visual/design preferences, guidelines,
creative preferences, product names/descriptions/selling points and colors are
editable. Each DNA field supports accept, remove and restore detected value.
Original research remains separate. Saving relevant changes invalidates creative
review; previous plans, photographs, permissions and exports are retained.

## Actual analysis

Default: installed `qwen_3_4b_fp8_mixed.safetensors`, Qwen3 4B FP8, through the
existing Comfy SDK → local proxy → ComfyUI native TextGenerate/SaveText workflow.
No new model, dependency, download, cloud API or photo analysis. Model/source:
[Qwen3 4B, Apache 2.0](https://huggingface.co/Qwen/Qwen3-4B), existing mixed-FP8
component documented in CREATIVE_ENGINE.md. An explicitly configured legacy
`ADSTUDIO_BRAND_MODEL` still selects the previous installed Ollama provider.

One text inference at most per successful discovery; 600 output tokens, greedy,
no thinking, existing 180-second job deadline. Eight bounded optional hypotheses
cite collected page IDs. Unknown IDs, invalid structure and unsupported claim
patterns are rejected. Operating-frequency/service promises unsupported by the
cited text are removed. This is a limited validator, **not semantic proof**.
All accepted suggestions still require customer review. Unavailable/failed analysis
leaves source extraction usable. Audience remains a hypothesis; text inference
does not see photographs or certify a visual identity.

One real public No Crumbs discovery through the production API completed in
**17.46 s**. Its raw Qwen result contained eight structured suggestions; final
validation retained seven and rejected an unsupported **daily baking** claim
(the website specifies Sunday pickup). No second inference was run. Private local
evidence: `outputs/brand-intelligence-review/live-no-crumbs-research.json`,
`live-final-validation.json`, `live-final-review.html`. No owner profile was
overwritten and these results are not owner-approved.

## Palette provenance and planning

- Website: CSS declaration counts/property context, RGB/hex and theme metadata.
  Generic black/white-like neutrals are marked separately. These are algorithmic
  candidates, not official brand colors or a screenshot/image analysis.
- Imported photograph: bounded local RGBA histogram of actual raster pixels,
  labeled **overall image colors**. Background/container/product are mixed; no
  segmentation is claimed. New imports measure automatically; older photographs
  have an explicit local **Read colors** action. Original/normalized bytes stay intact.
- Approved brand: explicit editable hex palette and preferred ad combination;
  add, remove and reorder. Preferred/approved colors drive future surrounding
  backgrounds, accents and legible text. Products and logos are never recolored.
  Unchanged legacy profiles retain their former palette/rendering behavior.

Saved DNA/product edits and source/owner/inferred attribution enter current
planning. Customer preferences stay owner input, not website claims. Layouts use
approved/preferred colors; old saved plans keep their original snapshots.
Optional metadata uses the existing Brand v1, ProductAsset and IndexedDB v3 stores;
no schema migration, origin change or registry replacement.

## Verification and remaining browser check

`npm run test:brand-intelligence`, website/creative/React suites, Ad/shared
regressions, Director tests, typecheck/build and CPU media integration pass.
Synthetic fixtures use three unrelated websites, source hashes and permission
gates; test responses are explicitly mocked. Real React SSR is **not browser
acceptance**. No browser controller was retried and owner IndexedDB was not accessed.

At `http://127.0.0.1:8301/adstudio/`, the remaining owner check is:
discover/select A, B and C; return through Saved websites; save a brand/color edit;
refresh and verify each site's photo, permissions, history and edits remain its own.
Confirm the changed brand requires a fresh direction review. Canvas decoding,
actual Chrome IndexedDB refresh and interactive download remain unverified.

---

## Retained V1 report (historical evidence)

The following is the original milestone record, not the current setup instructions.
The Qwen3 implementation and current8301 workflow are described above.

# Brand Intelligence V1

Open `/adstudio/#brand`: website -> Research brand -> review/edit Brand DNA -> Save brand. Start manually without a website; add it later. Names, descriptions, story excerpts, structured products and CSS color candidates come from real public pages. Audience, positioning, tone and creative guidance need customer input or an available local model. Original logos/photos are stored as Blobs, separately from previews and profile metadata.

No text model is configured on the tested machine. Website collection works; it does **not** claim successful AI analysis. The optional adapter uses Ollama's official local `/api/tags` and structured `/api/chat` interfaces at `127.0.0.1:11434`. It supports preinstalled `qwen2.5:7b-instruct` or `qwen2.5:7b` (Qwen2.5-7B-Instruct, Apache2). Set `ADSTUDIO_BRAND_MODEL` in gitignored `.env` and restart the server **after separately installing the runtime/weights yourself**. No API token is needed; no models are downloaded by this app. Budget RAM/VRAM for your chosen quantization and 12K context. Real-model inference is NOT RUN here; protocol tests use an isolated HTTP fixture, never customer-facing sample AI results.

- Provider: [Ollama API](https://docs.ollama.com/api/chat), [structured output](https://docs.ollama.com/capabilities/structured-outputs), [model/license](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct). Every model suggestion remains an inference, with validated source IDs; a source citation does not prove the suggestion true. Uploaded photographs are not analyzed by this text-only model. No tools, cloud fallback or media-generation changes.
- Collection: max4 HTML pages,2 same-origin stylesheets,10s/request,3 redirects, bounded bytes. HTTP(S) standard ports, public IPs only, DNS answers validated and connection pinned. No scripts/cookies/logins, private networks, SVG execution or anti-bot bypass. JS-only/protected content may be unavailable. Image candidates are not downloaded until Keep image. CSS frequency is only a palette hint. Prices/availability are intentionally excluded from product fields.
- Storage: existing `osh-adstudio-projects` upgraded non-destructively to DB3 with a `brands` store. Project schemas1/2/3 and all old stores survive. Version1 BrandProfile includes evidence, corrections, products and original-asset IDs. Draft autosave + explicit reviewed save; storage errors keep edits/originals in the tab for retry. Do not clear site data or change origin to test refresh.
- Reuse: `shared/lib/brand.ts` exports versioned `brandContext()`, including reviewed status, inferred fields, selected products, colors and image/logo asset IDs. Use brand name in Composer explicitly links `project.brandId` and changes only its editable brand-name field; no automatic claims, product selection or generation. Composer shots/takes/export history stay intact.

Private No Crumbs demo: run `adstudio/scripts/brand-http.test.mjs`, then `brand-demo.mjs` with the existing isolated Node22.20 runtime and local server on8300. These use actual public website research plus the existing local logo/cookie original, without inference. `outputs/brand-demo/` contains source/image hashes, original-byte data and a review-required profile; never commit it. The cookie image is deliberately unassigned to a specific product until reviewed. Click **Open No Crumbs example** from Create brand.

Browser acceptance **NOT RUN**: no available Computer Use browser. Follow the Brand walkthrough in BROWSER_ACCEPTANCE.md. API/parser/security/storage-driver tests are not proof of browser IndexedDB migration or refresh.
