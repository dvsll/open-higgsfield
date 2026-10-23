# Studio interface system

The working workspace uses `studio/src/workspace-dock.css` as its control language. Follow this system when adding panels; do not independently size their controls.

- Body/control text: 12px Inter; secondary text and window titles: 11px; uppercase field labels: 10px with a 14px line box. Responsive small-screen values come from the same tokens.
- Controls: 28px high, square corners, shared border/background, 8px spacing rhythm. Title-bar controls use a 24px variant inside a 29px title bar. Primary Generate uses the accent fill; its placement and size do not redefine other buttons.
- Icons: 16px SVG on a 24-unit viewBox with the same stroke weight. Transport controls share a baseline, including numeric inputs. Avoid text glyphs for playback/frame icons.
- Labels belong above fields. Generate occupies a right-hand grid cell, aligns with the audio input in the narrow composer, and keeps its estimate immediately beneath it. Wide composers align all prompt fields and Generate on one grid.
- The default desktop arrangement places Prompts and Viewer beside one another with Sequence below. Optional keyframe tools may scroll; the default prompt inputs, Generate and collapsed video/audio lanes must fit inside their windows.
- Sequence has one title in its window bar. Do not restore the removed heading/count, usage-hint strip or Edit/Remove keyframe buttons. Keyframe double-click and keyboard deletion remain; Add keyframe and Trash stay contextual in the window bar.
- Stylization and Elements are independent windows. Moving their existing DOM preserves callbacks and project state.

## Docking contract

The persisted layout is a binary split tree containing panel leaves and horizontal/vertical split nodes. Floating panel positions are not a valid state. Every visible panel appears once. Removing a leaf collapses its redundant split. All splits have pointer/keyboard resize handles.

Dragging leaves the source slot in place, dims it and shows a compact drag label. Hovering another window reveals Left/Right/Above/Below guides and a shaded preview. Preview geometry is calculated from the same resulting tree used on release, including collapsing the source slot. Invalid/self drops, Escape, pointer cancellation, resize and focus loss retain the previous layout. A released panel cannot remain floating.

Named setups, split ratios, notes and panel visibility persist in browser storage. V1 named layouts migrate into splits; old floating entries become docked panels. Reset restores a built-in setup. Layout changes never trigger generation or change project media.

## Verification

Run typecheck/build and `studio/scripts/window-layout.test.mjs`. The layout test covers all four directions, removal/collapse, duplicates, invalid/self drops, unknown states, preview geometry and JSON round trips. Verify drag behavior in the browser separately.

Check the default at 1280×720, 1024×768, 900×600 and 768×640. Check body dimensions against viewport, prompt/Generate bounds against their panel, and the audio lane's bottom against Sequence. Check label/input top alignment, keyboard focus, right-hand Generate placement, independent style/element windows and restored layouts. Expanded properties and deliberately crowded custom setups can scroll within their panel; the app frame must remain bounded.


## Reference Video layout (2026-10-22)

At desktop width, Selected media sits above Project files in a narrow left column; Prompts and Viewer share the remaining width evenly. Sequence spans the bottom. Narrow screens prioritize Prompts/Viewer/Sequence; the media/files windows remain in Windows. Director has its own arrangement with keyframes; Edit opens the existing Edit workspace through the setup picker. Cross-workflow links are removed from the Selected media card. Stash is an independent window, never a Sequence footer. Project files index only the active project's images/video/audio/references; they do not enumerate other projects or arbitrary server files. Primary Generate is bounded to 54px (32px at short viewport heights), never stretched by a tall dock. Tall prompt panels keep fields bounded as well.

Local setup is a separate, explicit first-boot dialog. Model downloads show actual bytes and source/license information, outside generation timing. Runtime progress must never invent a model download, sampler step or percentage when its source does not report one.

## Incremental React migration
User approved a gradual migration on 2026-10-22. Introduce React in contained panels as they are changed, preserving existing project storage, runtime APIs, docking behavior and CSS tokens. Avoid a whole-app rewrite; establish explicit state/event boundaries before moving a panel. Record React package licenses and official sources before adding dependencies. Current workspace/setup implementation remains TypeScript; no React dependency is installed by this change.

## Personalized onboarding
The tutorial lives outside the workspace grid as anchored popups. First choose ComfyUI experience (one/two/three play icons); then Image, Video or 3D. Beginner copy explains terms, seasoned copy focuses on the flow, professional copy is brief. Image and Video have real generation milestones; 3D honestly opens the unconnected workspace preview. Audio is a planned standalone setup. Never auto-generate or download from tutorial actions. Preserve project choices and successful milestones; suspend popups during modal setup or active renders. Highlight the actual target and keep both the target and popup usable within the viewport. Closing/reopening a docked window must not break the guide.

Tutorial actions advance explanations only. A step asking for Generate must point to the real Generate control and must not offer a similarly styled Focus button. Keyframe teaching demonstrates both dragging images onto a scene and retiming them into START/END anchors; keep the drag source and destination visible through the shading. Completion offers other workflows. Share the initial experience level across workflows, preserve paused checkpoints per project, and suppress completed/skipped first-visit guides. Validate UI changes with browser checks and CPU fixtures; model generation requires an explicit user request.

When a required window is closed, teach Windows → the actual window menu item and wait for the user to add it. Do not silently open panels as a tutorial side effect. Already-visible windows need no add-window lesson; closing one again returns to the same guidance.
