# Blockout / previz correction

Research: 2026-10-27. User wants very simple blocking whose composition and camera move survive the final render. More detailed geometry is not a solution.

## Reference notes

[Higgsfield 3D Jutsu](https://higgsfield.ai/blog/higgsfield-3d-jutsu) documents editable primitives, proxy characters and camera trajectories. Their example exports gray previz, then combines that clip with separate character/location images. The previz supplies framing, camera motion and behavior; appearance comes from the other references. These are vendor-described capabilities, not proof of an equivalent local implementation.

## Correction to our current results

The chair test was near-copying gray guides. The later horror hallway changed appearance but did not prove correspondence with the corridor blockout. Neither is an accepted blockout-transfer demonstration. Lowering RGB guide strength trades away structure; it does not separate appearance from geometry.

Current implementation exports real 3D video, but the LTX2B handoff only uses three RGB frames. Do not label this structural video conditioning or claim faithful blocking/camera transfer.

## Smallest useful target

- A floor plane, two box walls with an opening, one capsule person. No generated mesh required.
- One camera at eye height, moving sideways past the opening. Keep the person stationary.
- Render RGB plus per-frame depth from that exact camera and scene.
- Change only the appearance to a horror setting, keeping the opening, silhouette, screen positions and parallax visibly aligned.
- Compare side-by-side at start, quarter, midpoint, three-quarter and end. Judge structure and timing separately from aesthetics. An attractive unrelated hallway fails.

## Backend work before another claim

[LTX IC-LoRA documentation](https://docs.ltx.io/open-source-model/usage-guides/ic-lo-ra) distinguishes frame-level structural control from ordinary style adapters. [Official LTX-Video repository](https://github.com/Lightricks/LTX-Video) documents depth-control models. A compatible base model, adapter, graph and resource budget must be verified, with model license/source recorded before adding anything. This note does not select or install a new model.

Local audit: existing API video catalog exposes LTX2B and its trained child. Native Comfy object_info has LTXVAddGuide/GetICLoRAParameters but did not list LTX Add Video IC-LoRA Guide/loader nodes. Node-name presence alone would not prove weights or a working workflow. Dense depth/motion control remains unimplemented and unvalidated.
