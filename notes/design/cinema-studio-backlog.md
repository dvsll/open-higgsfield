# Cinema Studio implementation checklist

## P0 — implemented foundation

- [x] Stable viewport shell and independent panel scrolling.
- [x] Dedicated bottom timeline dock; divider supports pointer dragging and keyboard arrows, bounded sizing and saved height.
- [x] Sequence/Takes tabs keep history separate from the active cut.
- [x] Viewer owns detailed next-render width/height/frame/FPS/seed controls; timeline offers a link instead of duplicate editors.
- [x] Explicit property buttons, SVG disclosure icons, visible trim-edge cues, numeric drag-or-type fields and strong selection.
- [x] Shared ruler, fixed track gutter and adjacent collapsed video/audio lanes.
- [x] Direct video with optional start/end images; image workshop is an alternative, not a prerequisite.
- [x] Current-take metadata is separate from next-render settings; changing pending size does not resize existing media.

These checkboxes refer to the six P0 takeaways in the research brief, not every advanced recovery state or every P0-tagged concept in the feature atlas. Durable job reconciliation, additional accessibility hardening and comprehensive take metadata remain follow-up work.

## Reminder — P1 next

One-time app reminder requested for October 23, 2026 at 9:00 AM America/New_York. The reminder is a planning prompt, not authorization to start unattended implementation.

- [ ] Audit the existing model picker, then finish curated recommendations, readiness and capability explanations.
- [x] Finish Element asset cards, reference attachment and explicit prompt-only vs reference-conditioning labels. (Oct 24: visual library, search/category filters, saved reference covers, shared maker popup; current generation remains prompt-only.)
- [ ] Save reusable production setups with a review of changed settings before application.
- [ ] Group takes by scene; preserve prompt/model/seed/reference/output metadata per take.
- [ ] Add visual examples for motion and style choices, connected only to supported workflows.

## Reminder — P2 after P1 review

- [ ] Add project briefs, search and favorites; add folders only when needed.
- [ ] Validate camera/genre/era presets against local model output before advertising them as reliable controls.
- [ ] Implement actual conditioning before stronger cast/location identity claims.
- [ ] Add real color and audio processing before exposing grading/EQ controls.
- [ ] Evaluate 3D scene exploration, script-to-shots and assisted directing as separate backend projects.
- [ ] Evaluate Canvas, shared assets, comments and collaboration only with real shared storage and permissions.
- [ ] Reconcile interrupted generation jobs before offering potentially duplicate retries.

## Design review references

- Research and original copy: [design brief](higgsfield-cinema-studio-design.md).
- Interactive wireframe/mockup: `/studio/design-lab.html`.
- Complete source-linked feature inventory: [feature coverage](cinema-studio-feature-coverage.md).
- Feature concepts are not promises of local backend support. The design lab never generates media.
