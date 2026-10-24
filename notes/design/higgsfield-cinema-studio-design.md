# Cinema Studio design reference and adaptation brief

Research date: October 22, 2026. Scope: Higgsfield Cinema Studio, translated into our local Studio. This is a design and original UI-copy specification, not a request to implement everything immediately.

Implementation update: P0 foundations are now implemented; see [the checklist](cinema-studio-backlog.md). Explore [the wireframe/mockup](../../studio/design-lab.html) and [51-feature coverage](cinema-studio-feature-coverage.md). Advanced feature concepts remain separate from working local backend support.

## Key takeaways to implement in our app

| Priority | Change | Concrete implementation | Acceptance criterion |
| --- | --- | --- | --- |
| P0 | Give the workspace a stable frame | Fixed app shell; independent panel scrolling; a dedicated timeline area rather than a timeline buried below a long creation form | Repeated scrolling cannot move the header or expose document space outside the workspace |
| P0 | Establish one hierarchy | Preview is the visual focus, the composer owns generation, the timeline owns selection/timing, one inspector owns detailed settings | No competing copies of the same editable setting are visible simultaneously |
| P0 | Make actions legible at rest | Named disclosure buttons, distinct numeric fields, visible drag handles, selected states and keyboard focus | A new user can find properties without hovering or being told where to click |
| P0 | Keep video and audio together | Shared time axis, adjacent lanes, fixed track-header gutter, compact empty-audio cells | Collapsed lanes have no full-width control rows or decorative gaps between them |
| P0 | Preserve direct-video entry | Start with one editable scene prompt; offer optional start/end guides after the first result | No keyframe prerequisite; image-first remains an equally valid alternate route |
| P0 | Explain what changed | Distinguish settings for the next render from properties of the current result | Changing output size does not imply the existing video was resized |
| P1 | Replace option sprawl with curated choices | A short model list with selected state, local readiness, useful capabilities and one hardware-based estimate | User can choose a working model without inspecting the installed-file inventory |
| P1 | Make Elements feel like reusable assets | Reference thumbnails, names, categories, searchable @ mentions and explicit prompt-only/conditioned behavior | A valid mention is visually resolved; a reference is never presented as trained identity control |
| P1 | Save a reusable production setup | Save look, prompt modifiers and compatible generation settings independently of a particular render | Applying a setup previews changes and retains the prior take |
| P1 | Improve take review | Group versions under their scene; show thumbnail, settings, source guides and creation time | User can compare and restore takes without accidentally assigning them to a different scene |
| P1 | Teach choices visually | Small example previews for supported motion/style suggestions; concise explanations of the result | A choice explains its effect, not merely a technical name |
| P2 | Grow project organization deliberately | Project brief, scene names, search, favorites, then folders when actual volume warrants them | Organization reduces retrieval effort without becoming the default screen’s main content |
| P2 | Add richer directing only after backend proof | Camera presets, reference conditioning, color and audio processing require working implementations and validation | No control promises a physical or deterministic effect that our workflow cannot produce |

**Design decision:** borrow Higgsfield’s generation workflow and asset reuse; use After Effects for temporal editing and track interaction; use Swiss design discipline to align the whole interface. These references serve different jobs. Do not turn a generation page into a superficial imitation of a full editor, or remove the timeline because a competing generation product advertises automatic editing.

## 1. Evidence, versions and limits

### Evidence labels

- **Observed:** inspected in a public browser page or a published interface image.
- **Documented:** described by Higgsfield’s own material; not independently tested here.
- **Proposed:** our original design recommendation. Unless explicitly labeled otherwise, sections 3–12 below are proposed specifications for our app.

### Source ledger

| ID | Primary source | Verified finding and relevance |
| --- | --- | --- |
| H1 | [How We Built Cinema Studio](https://higgsfield.ai/blog/how-we-built-cinema-studio), Aug 12, 2026 | Documented: the initial design reduced equipment controls to a small curated set. The article describes a wheel-based picker, generation metadata following an image into video, later video-first creation, and project-level continuity. These are product-design explanations, not independent performance measurements. |
| H2 | [Cinema Studio 2.0 guide](https://higgsfield.ai/blog/cinema-studio-guide), Feb 17, 2026 | Documented historical workflow: establish an image, choose motion, then generate video. It describes optional start/end guides and manual/automatic sequencing. The published camera image shows category tabs, four aligned equipment columns and a clearly emphasized selection band. A motion illustration uses labeled visual examples. |
| H3 | [How to use Cinema Studio](https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-cinema-studio) | Documented: version selection matters; reusable Elements represent characters, places and props. The help page describes audio and assistant features, while keeping generation explicitly user-triggered. It lists 4.0 clips up to 30 seconds. |
| H4 | [Current Cinema Studio product page](https://higgsfield.ai/cinematic-video-generator) | Marketing describes genre, tempo, reference selection, camera directions, shared assets, project briefs and per-shot model choice. It also promotes automatic montage rather than a manual timeline. It advertises up to one minute and native 4K; this differs from the help/API limits. Treat those limits as unresolved across surfaces. |
| H5 | [Cinema Studio 4.0 API playground](https://open.higgsfield.ai/models/higgsfield/cinema-studio/4.0/playground) | The API page lists 4–30 seconds and 480p–720p in its model table, and shows an audio-generation parameter. This is a separate product surface; it does not establish the web application’s full limit. |
| H6 | [Public Cinema Studio shell](https://higgsfield.ai/generate) and [public image route](https://higgsfield.ai/generate/image?image-inpaint=true) | Observed: dark sidebar/workspace split, named navigation for generations, Elements and favorites, project search/sort, a sidebar-collapse control and a resize splitter. The public session did not expose a fully usable authenticated composer; no generation or project creation was performed. |

### Research limitations

The current public route is titled 4.0, while older guides and illustrations show earlier versions. Do not combine them into a claim that one live screen contains every feature. Some published imagery is an illustration rather than a functioning UI screenshot. The motion carousel image, for example, establishes a visual teaching approach; it does not prove the live interaction physics.

The public project link was reachable, but this session did not reveal enough project content to audit editing behavior. I did not test paid generation, credit consumption, authenticated asset creation, collaboration, exports or failure recovery. Exact Higgsfield spacing, typography tokens, accessibility compliance and responsive breakpoints are unverified. Numbers in our proposed specification below are our design decisions, not reverse-engineered measurements.

The source pages make strong claims about consistency and cinematic control. Our app should describe only the behavior our local models and connected workflows demonstrate. Source disagreements belong in this document; they should not become invented precision in the UI.

Visual references inspected: [published equipment picker](https://cdn.sanity.io/images/s479xw3z/production/6672d83456ff3689907f687e09a730cf12f8b0c2-1108x876.png) and [published motion illustration](https://cdn.sanity.io/images/s479xw3z/production/7b93b57d668e06a70b8e7c218391bfb6b37ea0a4-2832x1616.png), both linked from H2. These belong to Higgsfield and are referenced for research, not proposed as shipped assets. Browser inspection used a 1280×720 viewport. The adaptation should use original assets and copy.

## 2. What is worth borrowing

### Curate the decision before designing the selector

H1 supports a useful principle: reducing and validating choices can matter more than presenting a huge equipment catalog. The lesson for us is to decide which choices create a visible, repeatable difference before giving them premium UI space. A camera-shaped card is not evidence that a model reproduces that camera.

**Application:** keep the default generation surface small. Put rare details behind explicitly named properties. Recommend a working local model before offering an inventory. A preset must represent real saved settings or clearly described prompt guidance.

### Let visual examples do instructional work

In the historical image from H2, the chosen equipment row is brighter than its neighbors, with columns sharing alignment and labels. Its separate motion illustration gives a recognizable scene to each movement option. Selection and explanation are part of the content, rather than a paragraph the user has to read first.

**Application:** show a selected row clearly, use matching preview crops, and describe what will change. Prefer a few useful examples to a long wall of badges. Preserve keyboard and search access; do not copy wheel gestures as the only selection method.

### Treat a project as accumulated creative intent

The project and asset patterns described in H1, H3 and H4 suggest that a creator should not repeatedly rebuild the same context. The design opportunity is persistence and reuse, not simply adding another sidebar section.

**Application:** keep references, look, scene prompts and generation provenance available together. Reuse should be an explicit action with predictable scope. A project setup applies to future work unless the user requests a new version of existing media.

## 3. Proposed workspace architecture

```text
PROJECT HEADER                         connection / jobs
────────────────────────────────────────────────────────
ASSETS        PREVIEW                     INSPECTOR
Projects      selected image/video        Selection
Elements      playback / comparison       Properties
Looks                                    Next render
              COMPOSER
              scene / motion / audio
              model summary / Generate
────────────────────────────────────────────────────────
SEQUENCE      shared time ruler / playhead / zoom
Track header  video clips and their titles
Track header  matching audio or Add audio
              optional properties, stash and takes
```

This diagram specifies information ownership, not final pixel dimensions. The timeline should become a docked, resizable workspace panel in a future implementation. Its current placement inside the scrolling creation column is an interim state; viewport containment alone does not complete this architecture.

### Panel responsibilities

| Region | Owns | Must not own |
| --- | --- | --- |
| Header | Project identity, project switch, connection and job access | Shot-specific creative parameters |
| Assets | Elements, reusable looks and imported references | A duplicate inspector for the same selection |
| Preview | Playback, fit, comparison and the selected result | Hidden generation triggers |
| Composer | Intent for the next result and its primary action | An unrelated full settings panel below every prompt |
| Inspector | Detailed attributes of the current selection | A permanently open second copy of timeline fields |
| Timeline | Order, time, selection, linking, trimming and track properties | A scrolling dump of all historical renders |

The inspector and expanded timeline properties may be alternate views of the same state, but they should not compete. Default to one detailed surface at a time. Distinguish **Current result** from **Next render** inside that surface.

### Sizing and scrolling

Use shared vertical dividers across preview/composer and track/content boundaries. Side panels may resize within sensible minimum and maximum widths. The preview scales media with containment. Vertical panel scrolling never changes the workspace frame. Horizontal scrolling belongs to the timeline or an explicitly scrollable asset strip, not the document.

A docked timeline needs a visible resize divider with hover/focus feedback. Keep the time ruler and track headers available while inspecting long sequences. Avoid accidental time-axis zoom when the user intends ordinary scrolling. Small screens need a deliberate panel switcher; stacking desktop panels indefinitely is not the final responsive design.

## 4. Proposed visual system

| Primitive | Proposed rule |
| --- | --- |
| Spacing | 4px base; 8px control spacing; 12px between related groups; 16–24px between major regions |
| Typography | Inter; 13px body/control text, 11–12px secondary labels, 16–20px section headings; tabular numerals |
| Alignment | Labels share a baseline; numeric columns share a right edge; clip/title/audio boundaries share the time axis |
| Corners | Square, matching the project’s standing direction |
| Surfaces | Three restrained dark levels: workspace, panel, interactive control |
| Borders | Define a control, selection or panel boundary; avoid outlining every static sentence |
| Color | Amber for primary generation; muted blue for video; muted green for audio; readable neutral text |
| Selection | Outline plus a stable background change; never color alone |
| Interaction | Pointer, focus ring, active state and disabled explanation where needed |

Swiss discipline means a consistent grid and clear hierarchy, not tiny typography or universal equal spacing. More related things should be closer. A disclosure control should remain visually quieter than Generate but clearly more actionable than a static label.

### Numeric controls

Every editable numeric value uses the same bounded field. Click to type; drag horizontally to scrub; Shift increases the increment. Units sit beside the value or in the label. Focus makes text editing obvious. Keyboard arrows honor the same increment and bounds. Calculated values use a subdued readout and cannot pretend to be editable.

Scrubbing must support Escape to revert and preserve the initial value if cancelled; this is a required follow-up to the present basic scrub implementation. Invalid input remains visible with a local explanation. Do not silently change an impossible dimension into a different output. Editable frames follow the model’s valid increments, and FPS visibly explains derived duration.

## 5. Proposed interaction contracts

| Gesture / action | Result |
| --- | --- |
| Click video clip | Select it; do not seek or open scene mode |
| Double-click clip / explicit Open scene | Open the scene’s keyframe view |
| Click audio | Select audio specifically; show its applicable controls |
| Click empty timeline | Place playhead there and clear item selection |
| Drag time ruler | Scrub time; do not change scene selection |
| Click a properties header | Expand or collapse its named properties; do not seek |
| Drag clip body | Show insertion position before committing reorder |
| Drag clip edge | Trim, with distinct edge handle and feedback |
| Drag keyframe to boundary | Snap to labeled START/END anchor; pulling inward makes it timed again |
| Change next-render value | Update pending settings; retain current take |
| Generate | Submit one explicit job using the visible pending settings |
| Connection restored | Refresh availability; never silently resubmit work |

Track headers need a visible disclosure arrow and an explicit properties label. Hover and keyboard focus strengthen the target; they must not reveal its existence for the first time. Keep collapsed media lanes adjacent. Expanded properties occupy an intentional region aligned with the corresponding media, rather than an unexplained spacer.

Drag operations require a preview, a clear valid drop location and cancellation. The timeline must preserve selection across ordinary view changes. Selection and playhead position are separate states, even if they happen to refer to the same scene.

## 6. Proposed creation flows

### First video

1. Open a fresh project with one scene and an editable example prompt.
2. Read a short instruction, edit the scene and optionally describe motion/sound.
3. Choose from working local models; show an estimate beside the primary generation action.
4. Generate a video directly.
5. Preview the result and offer a small number of next actions: refine with keyframes, change the prompt, or add a scene.

The tutorial should guide the existing product rather than introduce a separate miniature product. Keep the current requested sequence: first video, two images, add START/END, regenerate. Explain what changed in the second take. Skipping preserves all work.

### Image workshop

Generate one image by default. Browse versions, revise the prompt and deliberately choose a keeper. Offer **Turn into video** on that keeper. Carry its prompt, reference and generation metadata into the video draft; do not automatically animate or replace an existing scene.

### Element creation

Choose character, location or prop; add references; provide a name and short identifying description; preview; save. The resulting asset card should look reusable. @ completion searches names, filters as the user types and supports keyboard selection. Resolve mentions into persistent IDs, with a visible chip/highlight and a way to inspect the attached reference.

Our current prompt expansion is not identity training. Distinguish reference conditioning, textual mentions and LoRA adapters. A saved Element does not become a LoRA merely because both can influence style or identity. Only present training actions when a real training workflow and its provenance exist.

### Audio and Edit

Audio remains an optional composer prompt. A filled prompt accompanies video generation; a blank one means no new generated sound. If a video is silent, allow a specific **Generate audio** action. Existing sound goes through **Edit audio** for replacement, with preview, Undo and Apply. Keep linked audio paired with video unless explicitly unlinked.

H3 describes native audio in Higgsfield. Our current local app performs a separate audio render and muxes it with video. Present this accurately; do not promise frame-accurate dialogue or synchronized foley. EQ controls such as bass and treble belong in Edit only after working processing is implemented.

## 7. Proposed model and capability design

Use a compact selected-model summary and a searchable selection dialog. Each row shows a model name, intended use, readiness, supported capabilities and a representative estimate. Put the full installed-model inventory in a secondary diagnostic surface.

Capabilities need an actionable explanation: what they do, which inputs they enable and where those inputs appear. Display supported capabilities in the row; explain temporary incompatibilities next to the affected control. Do not fill every row with unsupported badges.

Preserve the user’s creative intent when switching models. Show which parameters would change before applying the switch. Do not erase reference attachments silently. Camera/motion presets that only alter text must say so; they are guidance, not a deterministic physical rig.

Estimates should be a single approximate value backed by this server’s hardware and observed timings, with a concise confidence explanation. Distinguish render estimate from queue wait and additional audio time. Keep raw model paths, missing-node detail and proxy internals in an expandable diagnostics view.

## 8. Proposed original UI-copy catalog

The following is new copy for our app, not a transcription of Higgsfield text.

| Surface / state | Primary copy | Secondary copy / action |
| --- | --- | --- |
| Fresh project | Your first scene | Describe a moment, then generate a video. |
| Scene prompt | Scene | What happens, where, and who is there? |
| Motion prompt | Motion | Describe how the subject or camera moves. |
| Audio prompt | Sound | Describe the ambience, effects or music. Optional. |
| Generate action | Generate video | About 18 seconds · sound takes extra time |
| No reliable estimate | Estimate unavailable | Generate once to help calibrate this model. |
| Queue | Waiting to generate | 2 jobs ahead · Open queue |
| Render running | Creating your video | You can keep editing other scenes. |
| Audio running | Adding sound | Your video is ready. Sound is still generating. |
| Success | Your video is ready | Preview · Refine · Add scene |
| Refine action | Refine with keyframes | Choose how this scene begins and ends. |
| Start slot | Start frame | Add an image to guide the opening. |
| End slot | End frame | Add an image to guide the ending. |
| Optional guides | Keyframes are optional | Generate from your prompt, or add visual guides. |
| First guided take | Generate a new take | Your previous version stays in this scene’s takes. |
| Image keeper | Turn into video | Use this image as the start of a new video draft. |
| Scene expansion | Video properties | Show dimensions, frames, FPS and seed. |
| Audio expansion | Audio properties | Show timing and edit options. |
| Existing result | Current result | These are the dimensions of the selected take. |
| Pending settings | Next render | Changes apply when you generate again. |
| Numeric hint | Drag to adjust · click to type | Shift changes values faster. |
| Invalid frames | Choose a supported frame count | This model uses 9, 17, 25…121 frames. |
| Invalid dimensions | This size is too large | Choose a smaller preset or reduce width and height. |
| Empty audio lane | Add audio | Describe sound for this scene. |
| Silent video action | Generate audio | Adds sound to the current silent video. |
| Existing audio action | Edit audio | Replace or adjust sound in Edit. |
| Linked audio | Linked to video | Timing edits follow the video. |
| Unlink action | Unlink audio | Edit this sound independently. |
| Model picker | Choose a video model | Available on this computer. |
| Capability: Elements | Use saved Elements | Type @ in the prompt to attach an asset. |
| Prompt-only Element | Used as prompt text | This workflow does not preserve identity through reference conditioning. |
| Create Element | Save an Element | Name it and add references for later scenes. |
| No mention matches | No matching Elements | Create an Element or try another name. |
| Generation failure | This take couldn’t finish | Your earlier takes are unchanged. View details · Try again |
| Audio-only failure | Video ready; sound couldn’t finish | Preview video · Generate audio |
| Connection lost | Connection interrupted | Your project stays here. Keep editing · Retry connection |
| Reconnected | Connection restored | Ready to generate again. |
| Uncertain prior job | Check the last generation | The connection dropped before its status was confirmed. |
| Save setup | Save this setup | Reuse the look and generation settings in another scene. |
| Unsupported setup | Some settings aren’t available | Review changes before applying this model. |
| Empty takes | Your takes will appear here | Each generation keeps a version you can return to. |

Dynamic values above are examples, not promises. Use the actual job state, model limits and measured estimate. Keep a calm factual tone; avoid calling a prompt approximation a simulation or a resized image newly generated detail.

## 9. Proposed state and provenance model

Separate project defaults, scene intent, pending generation settings, immutable take metadata, selection and viewport state. A result should retain its prompt, model, seed, dimensions, frame count/FPS, input references, audio provenance and elapsed render time. Applying an old take restores its own metadata rather than reinterpreting it using the latest scene settings.

Store disclosure state and panel sizes separately from content. Scrolling or opening properties must never mutate a scene. Reordering changes sequence position without changing take identity. A reference asset should have an ID independent of its display name, so renaming does not break mention resolution.

Make the job state explicit: draft, queued, running, video ready/audio pending, completed, failed, or connection status unknown. A connection problem is not proof a server job failed. Check job status before offering a retry that could duplicate it. Interrupted connection handling in the current app does not yet provide that full reconciliation behavior.

## 10. Implementation plan and current gaps

| Stage | Work | Existing starting point | Verification |
| --- | --- | --- | --- |
| 1 | Consolidate layout rules and stable panel ownership | `studio/director.html`, `studio/edit.html`, timeline CSS | Scroll extremes, expansion, resizing, long history, short viewport |
| 2 | Dock timeline and add visible panel resizing | Current timeline inside main scrolling column | Preview remains accessible while editing later scenes |
| 3 | Unify properties and distinguish current/pending metadata | `director.ts`, `frame-size.ts`, `timeline-attributes.ts` | Changing one field cannot create conflicting visible values |
| 4 | Harden numeric and drag interactions | `number-controls.ts`, timeline interaction helpers | Typing, arrows, scrub, cancel, invalid values, pointer leaving panel |
| 5 | Improve model/reference decisions | `models.ts`, Element maker and mention components | Switching models preserves or explains affected inputs |
| 6 | Group takes by scene and preserve provenance | Current generation history and stable scene IDs | Restore across reorder, stash, model changes and audio edits |
| 7 | Add presets and project brief | Existing looks and project storage | Setup changes are reviewable and do not rewrite prior results |

Current work already includes optional keyframes, model selection, numeric scrubbing, linked audio, properties disclosures and connection notices. Those are foundations, not proof that this complete brief is implemented. The biggest remaining structural issues are the scrolling creation column, duplicated property surfaces, missing cancellation in numeric scrubbing, and incomplete job reconciliation after a disconnect.

Do not broaden scope into closed model APIs, unimplemented 3D controls, simulated collaboration or decorative EQ. Our generation stays within the repository’s open-weights, Comfy SDK/proxy and LTX requirements. Proposed advanced tools must earn their controls through working behavior.

## 11. Review checklist

### Structure and visual clarity

- Header and workspace remain inside the viewport at scroll extremes.
- One clear primary generation action is visible in the composer.
- Track names, disclosure targets, media cells and properties share stable columns.
- Video and audio remain adjacent when properties are collapsed.
- Selected and hovered states are distinct; color is not the only cue.
- Disabled controls explain why, without filling the default view with diagnostics.
- Short clips remain selectable; long values do not push panel boundaries outward.

### Interaction and accessibility

- Properties can be found and opened with mouse and keyboard.
- Numeric typing, scrubbing, arrows, bounds and cancellation agree.
- Clip click, empty-space seek and scene opening remain distinct.
- Focus remains visible and returns sensibly after dialogs close.
- Drag actions preview their outcome and can be cancelled.
- START/END anchors remain identifiable while selected or dragged.
- Audio edits require explicit audio intent; unlinking changes scope visibly.
- Zoom, nested scrolling and reduced-motion preferences do not hide critical controls.

### Truthfulness and resilience

- Current media attributes are separate from next-render settings.
- Every advertised capability has a connected, tested workflow.
- Prompt guidance is never described as guaranteed identity or camera physics.
- Previous takes survive failure, retry, reordering and navigation.
- A dropped connection does not automatically duplicate a render.
- Estimates reflect the active local model and distinguish extra sound work.

## 12. Final direction

The target is a calm creative workspace with enough structure to make the next action obvious. Higgsfield is useful for curated creative choices and reusable production context. After Effects is useful for selection, timing, disclosures and editable values. Swiss design gives both a common visual grammar. Evaluate each future change against the task it clarifies, the grid it belongs to and the behavior it actually delivers.

## 2026-10-24: empty Sequence and scroll ownership

Adobe references: [Work with compositions](https://www.adobe.com/learn/after-effects/web/create-composition-animation) explicitly supports creating an empty composition before adding footage; [Add layers to a composition](https://www.adobe.com/learn/after-effects/web/add-layers-to-composition) distinguishes layer selection from empty timeline space. Adaptation for Studio: keep the ruler, playhead and aligned track gutters when there is no video; do not invent a footage clip to fill the panel. Use a small Add scene action in the empty video lane. Prompt drafts are independent from footage. Audio/overlays can exist without video. The finite10-second empty ruler is a viewing extent, not generated content or a claimed AE default.

The Sequence dock body owns both scrolling axes. Wheel gestures over clips, expanded properties, numeric controls and titlebar scroll this same body. Shift-wheel scrolls horizontally; Ctrl-wheel remains browser zoom. Nested track containers must not trap wheel events or allow document scrolling at panel boundaries. No timeline redesign into AE per-layer rows is claimed.
