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
