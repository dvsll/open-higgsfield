# Functional action audit — 2026-10-26

Audited primary React JSX, handlers, services and disabled/error states at da0914d
before changing code. No browser-controller use or aesthetic redesign.

| Controls (all current primary actions) | Actual behavior / friction | Decision |
| --- | --- | --- |
| Wordmark / three journey buttons | Local stage change; unfinished stage not reliably restored | Keep navigation, persist stage; refuse during jobs, await pending writes |
| Project select | Durable project switch; disabled even during normal autosave | Await writes automatically; only block real jobs/storage failure |
| Rename/new project menu, name, Rename, Create | Stable ID, same store | Retain, await saves; no duplicate registry |
| Brand profile / close / backdrop / Escape | Separate modal, local unsubmitted edits | Retain specialist edit; no extra first-brand modal requirement |
| Five specialist links | Same-origin native tools; flush before navigation | Retain all; guard live store busy state |
| Save status / Retry saving | Ordered durable writes, failed Blobs retained | Keep contextual retry, never claim Saved before transaction completion |
| Dismiss error | Clears presentation only | Keep; interrupted-job warning cannot be dismissed into a retry |
| Create brand / Brand name / Save brand | Three interactions before product work | Inline first/new brand name; Develop creates brand + plan in one action |
| Website / research+save | Real accessible evidence, optional AI analysis | Optional onboarding disclosure; unavailable research keeps manual brand |
| Description/tone/style/logo modal fields | Useful brand correction/original preservation | Retain in Brand profile; not mandatory onboarding |
| Brand select | Saved context | Reuse existing project/sole saved brand; explicit selection for ambiguity |
| Photo drop/upload/replace | Original + normalized Blobs | Retain; do not silently choose or certify an ambiguous original |
| Saved original selector | Reuses originals; sole source repeats upload choice | Contextual when alternatives exist; same selection is a no-op |
| Product selector | Valid SKU/photo association only, often no matching choices | Show only actual matches; no inferred SKU link |
| Photo description | Necessary owner observation (no proven vision) | Reuse unchanged original's facts; brief description remains required for new source |
| Count/arrangement/texture/container/category | Optional source constraints | Keep optional; no invented observations or mandatory extra fields |
| Desired-ad request | Optional creative input | Keep; persist latest text; refinement is a saved new plan |
| Intent select | Campaign/closeup/enhancement, always exposed | Campaign default; unusual modes inside existing optional disclosure |
| Develop | Three real/local-AI or labeled fallback concepts | One primary action; create missing brand/context within same job lock |
| Alternatives disclosure / alternative buttons | New immutable plan, not inference | Keep contextual choice; fresh review required, previous concepts retained |
| Refinement text / Develop refinement | New plan, no image generation | Retain; synchronize on plan/project switch, persist text, invalidate review |
| Correct details | Navigates backward and can discard active-plan context | Inline optional correction; preserve old concepts in new unreviewed record |
| Fact checkbox + Confirm direction | Both required for one review | One explicit Accept direction & confirm facts action; same server confirmations |
| Generate photograph | Actual Qwen job, availability and review gates | Keep separate explicit action; block uncertain prior submission and double clicks |
| Check connection | Duplicates 15-second polling | Remove; poll automatically and refresh on online/focus, no inference retry |
| JSON export / prompt / evidence / seed | Developer review capabilities in normal flow | Retain inside Request details; no technical setup required in normal journey |
| Photograph / Ad preview / Compare toggles | Three modes; compare disabled in ad view | Show live ad by default; one original/generated comparison disclosure |
| Missing-image Restore | Checksum-verified recovery from local output | Retain contextual action; no replacement generation |
| Take thumbnails | Saved version selection | Keep; restore that take's own reference and saved copy, reset fidelity review |
| Headline/body/CTA/format | Local preview + autosave | Merge patches against latest store snapshot, never trigger Qwen |
| Fidelity checkbox | Meaningful image review | Retain; reset when selected take changes |
| Export ad + Download latest | Compose/save then second click to receive file | Export PNG composes, verifies, durably saves and requests download once |
| Saved advertisements downloads | Existing verified Blobs | Retain latest and older exports; download failure preserves export/history |
| Download photograph only | Actual raw/finished image | Retain in comparison disclosure with truthful method label |
| New direction | Reopens product work without deleting outputs | Retain; saved stage and prior takes/exports |
| Boot retry / specialist recovery | Existing records unreadable/unavailable | Retain, never clear/reset storage |

Interaction count uses discrete field entries, file selections and action clicks;
it excludes typing individual characters, OS file-dialog mechanics, optional copy
edits, waits and model setup. Assumes generation is actually available and a new
brand is needed. Previous: Create brand → name → Save → photo → description →
Develop → facts checkbox → Confirm → Generate → Compare → Ad preview → fidelity
checkbox → Export → Download = **14**. New: name → photo → description → Develop →
Accept+confirm → Generate → compare disclosure → fidelity checkbox → Export PNG
= **9**. Returning saved brand/photo/facts: **9 → 6** for the equivalent complete
journey. These are control-path counts, not measured browser timing or acceptance.
