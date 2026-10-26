# Product discovery V2 — evidence and handoff

Review the primary app at `http://127.0.0.1:8301/adstudio/`.
No model, dependency, image inference, paid service or database migration added.

## Reproduced cause

Baseline `63fae7827fc135b11202af43ae7bc6b97f3eb75b`, public
[Abel collection](https://us.abelfragrance.com/collections/perfumes):

- Initial HTML already contained all 12 product rows. Each `.product-card` has
  an empty `.product-card__link` overlay, sibling image blocks, a sibling title,
  a tagline and size controls. The old parser required title/image inside one
  anchor. It found **zero products on the collection page**.
- The page's JSON-LD described the organization, not its perfume catalog. Other
  JSON scripts were configuration/cart data; no script execution was necessary.
- The four-page crawler then visited the collection → Cyan Nori → Perfume Sets →
  Trial Kit. It recovered **1/12 target perfumes**, plus an out-of-collection Trial
  Kit. This is two total records in our reproduction, not a claim that the owner's
  recorded one-card state was identical.
- Image-association validation did not discard 12 internally detected products:
  those collection records were never constructed. Global metadata also says
  seven perfumes; the rendered collection heading says 12. Metadata is not used
  as an authoritative inventory count.

Baseline HTML/results remain in gitignored `outputs/catalog-v2/abel-before.*` and
`before-page-*.html`. Site names in test fixtures are an acceptance oracle only;
no Abel/product-name list exists in production discovery code.

## Implemented

Tiered extraction supports JSON-LD Product/ItemList references, scoped microdata,
product metadata, meaningful product-card containers with sibling anchors/images,
and narrowly supported public JSON hydration (including common Shopify/Next and
GraphQL edges/nodes). Scripts are parsed as JSON data, never executed. Cart,
configuration, API-token and recommendation namespaces are not catalog traversal
roots. Navigation/editorial mentions and ambiguous containers are excluded.

Canonical product URLs deduplicate repeated cards and `variant`/`selling_plan`
query variants without merging distinct product paths. Lazy sources, picture/
srcset and SVG data-URI placeholders are handled without inventing URLs or expanding
JavaScript image templates. Each product retains its source page/hash, canonical
product URL, name, discovery method/key and explicit image URLs.

Collection pagination stays in scope. Already-proven collection cards avoid
unnecessary detail crawling; missing information and relevant collection pages
come before About/navigation. Limits: 40 catalog records, 40 image references,
8 collected HTML pages (4 text evidence + 4 compact hash/URL-only catalog sources),
10 page attempts, a 25-second collection scheduling window, 2 bounded CSS reads,
3 MiB/HTML page, 300 KB/CSS, 5 MiB/raster. In-flight reads/redirects can add timeout
latency; this is not a promise of a hard 25-second wall-clock cutoff. Pages are
read sequentially. The HTML byte ceiling was raised from 1.2 MB after Arduino's
legitimate modern collection exceeded it; text/DOM/storage/proof limits remain bounded.

Coverage reports found/linked/image-associated counts, methods, rejected/duplicate
candidates, page/byte/time limits and partial reasons. Inventory completeness is
never promised. A first image per product gets priority over secondary pictures.
Server-side fresh DOM/JSON revalidation supports every new method. Compact selected
proofs still fit the existing64 KiB request boundary. Source/DNS/redirect protections,
raster magic, hashes and separate user accuracy/rights gates remain intact.
The protected reader now also honors bounded cached robots rules, including
specific-agent/longest-path precedence. No authentication or bot restrictions bypassed.

## Source-first interpretation and preservation

React first requests `analyze:false,deferAnalysis:true`. Products are saved and
displayed before any optional text result. `/api/brand/analyze` accepts only a
server-issued receipt, not client-authored inference evidence. Existing Qwen3
SDK/proxy execution remains the sole default text path. At most one attempt per
receipt; identical evidence shares an in-flight/completed result in a bounded
16-entry/30-minute process cache. Failure is cached, not silently retried.
Unavailable-provider status can be checked again on a new discovery. Restarting
the API expires its volatile receipts; products remain usable and expired analysis
shows an honest error. A browser refresh can resume a still-valid pending receipt
without another model job.

Responses apply to the exact saved brand/receipt/fingerprint, even if another
project is open. Latest customer edits/assets win. Organization identity, sourced
site names and conservative tenant/root rules reconcile collection/homepage pages;
older profiles migrate without requiring identical page descriptions. Unrelated
businesses and tenant selectors stay separate. Same-brand discovery retains the
selected source/product, original Blobs, permissions, palette, active direction,
past reviews, takes and exports. A changed full input/evidence snapshot makes a
review stale; no approval is automatically renewed.

## Actual public checks

| Check | Observed result |
| --- | --- |
| Abel target collection | 12/12 target perfumes; 12 verified product links; 12 unique image associations; one HTML page |
| Public Abel photos | All12 freshly revalidated, downloaded unmodified and decoded with existing FFmpeg; hashes retained |
| Abel foreign/competitor results | 0; 0 structurally rejected product candidates; comparison/filter labels never became candidates |
| Arduino boards/modules | 40 real linked records and40 unique image associations, explicitly partial at the40-record limit; files not exhaustively downloaded |
| Abel legacy collection → homepage | Correctly matches the saved business despite different descriptions; source-backed fixture/application preservation PASS |

Observed public collection times: Abel **1.051 s**, Arduino **1.347 s**. These are
measurements on this machine/response snapshot, not latency guarantees. A separate
real **appClient → production API** run delivered all12 products in **549 ms**, with
the application unlocked while interpretation was pending.

**Real Qwen analysis FAIL:** exactly one local TextGenerate job was attempted
(`fe63c28d-84a3-41ce-8a52-2c25fbcc5aa1`). The API reported failure after **181.586 s**
at its existing180s deadline. The native job later recorded interruption and the
queue is empty. No raw AI result was delivered/applied, and no retry was submitted.
Repeating the receipt returned its cached failed state in **5 ms**; unchanged
discovery also reused that failure. The live probe's initial assertion counted only
completed history jobs and failed while the attempted job was still running; the
subsequent exact-ID history establishes the one attempt and its interruption.
Do not describe this as a successful AI brand interpretation. Slow/failed text
inference is now independent of usable product discovery. No Qwen tuning or new
weights were attempted.

Private evidence: `outputs/catalog-v2/{abel-after.json,arduino-after.json,
abel-image-verification.json,abel-review.html,abel-same-brand-final.json,
live-analysis.json,live-text-job.json,cpu-flow.json,ssr-review.html}`. Public-source
photographs are not a commercial-use license or owner accuracy confirmation.

## Verification and remaining Chrome check

`npm run test:catalog` covers the 12-product sibling fixture, Shopify grids,
ItemList references, microdata regression, JSON hydration, GraphQL image/variant
records, pagination/compact sources, variants, srcset, competitor/editorial/nav
exclusions, missing/shared images, forged proofs, robots rules, source-first slow/
failed/unavailable analysis, receipt dedup/resume, same-brand edit/palette/source/
permission/history persistence and stale review. A product from the seventh page
also completes import → consent → plan → review → request export without inference.
Existing website, brand, creative, React, persistence/shared, Director and CPU media
regressions plus typecheck/build pass. Director source and saved No Crumbs campaign
remain untouched.

**Browser acceptance NOT VERIFIED.** No blocked controller was retried. In the
existing8301 Chrome profile, the owner still needs to check: Discover the Abel
collection → Show more → select a genuine photograph and inspect the separate rights/accuracy controls (confirm only facts and rights you can attest) →
switch to its homepage → verify the same project/photo/palette/history → refresh.
Review stale directions explicitly when current evidence changed. Actual Chrome
IndexedDB/canvas/interactive Show more remain unverified; service/HTTP/SSR tests
are not substitutes. The future unfamiliar-site blind test remains outstanding.
