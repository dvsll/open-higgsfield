# Studio polishing: real functionality and remaining gaps

Updated October 28, 2026. Call these gaps out when discussing or changing the affected tools.

| Tool | Actual behavior | Remaining gap |
| --- | --- | --- |
| Stylization | Old palette illustrations/heuristic and prompt-based variations removed from normal windows. Hidden legacy service DOM remains for controller lifetime safety. | These were never LoRA training or reference conditioning. New prompts no longer receive the hidden style modifier. |
| Training workflow | Captioned image dataset, native ComfyUI LoRA graph, bounded settings, run records, safetensors output, same-base image adapter loading and picker hierarchy. | Experimental native trainer. FP8/bypass path passed actual SDK/API and eight-step browser training at 512px/rank4 on RTX4070 SUPER12GB; saved adapter loads for Image inference. BF16 path OOM. Quality/long-run acceptance remains untested. Z-Image Turbo, LTX-Video2B clip LoRA and Hunyuan3D mini image/mesh LoRA pass actual SDK/API runs. Audio, material, full-checkpoint tuning and cancellation remain unimplemented. |
| 3D | Hunyuan mini geometry/training; multiobject scene editing; native TRELLIS.2 image-conditioned shape plus UV-baked color/metallic/roughness maps. Full-body human inferred and inspected front/back locally. | Fine artifacts remain on human surfaces. Existing-mesh semantic retexturing and material training are not connected; the separate surface-projection option remains a repeating material swatch. Scene reconstruction/production fidelity not accepted. |
| Elements | Real image-backed library and description mentions. | Photos do not condition identity; no trained character guarantee. |
| Overlay tools | Timed text/watermarks and real local caption transcription, with timeline preview. | LTX VFX and burning/compositing overlay layers into exported video are not integrated. |
| Precision image edit | Real masked Z-Image resynthesis, saved versions and outside-mask compositing. | SAM3.1 text/point object masks now run locally through native ComfyUI; manual refinement remains available. Automatic capped object-proposal list with cutout thumbnails; proposals have numbered labels and detection is not exhaustive. Working image capped at768px; this is not an instruction-edit checkpoint. |
| Video/image/audio/captions | Existing SDK/proxy generation and transcription paths; caption model selection is passed through to the server. | Models must be installed and compatible; estimates are approximate observations, not guarantees. |
| Semantic search | MiniLM CPU text/description embeddings through ComfyUI, with literal fallback. | It does not inspect image pixels or recognize objects in uncaptioned media. |
| Design lab | Separate concept page explicitly marked as mockup. | Concept controls are not features of the production app. |

Training source: installed ComfyUI `comfy_extras/nodes_train.py` and `nodes_dataset.py`, including its experimental node flags. Repo-owned `osh_training` I/O nodes preserve exact dataset captions, base identity, steps and loss. Downloads of old Tiny-SD/Small-SD research bundles are not compatible runnable Studio models and no longer appear in the chooser.


### 2026-10-27: 3D scene implementation
Prompt-to-OBJ generation is now proven with a real stool using installed Z-Image and Hunyuan mini. Project-scoped multi-object viewport, selection, numeric transforms, selected-only regeneration routing and scene OBJ export are connected. Whole-environment generation remains an unvalidated quality case and yields a single untextured mesh; no material generation, scene decomposition or production environment fidelity is claimed.


### 2026-10-27: blockout acceptance correction
The gray-chair and horror-corridor videos do not establish faithful blockout transfer. Current3-frame RGB handoff is sparse image guidance only. Structure-preserving depth/motion conditioning and primitive scene blocking are still missing; see [correction and acceptance case](blockout-previz-correction.md). Do not present visual restyling as successful camera/layout transfer.


2026-10-28 Audio update: real local Kokoro ComfyUI speech inference, FLAC Project files output and browser playback verified; SRT input is continuous narration, not time-aligned dubbing. Captions Advanced text-only is editable, downloadable TXT and hands off to speech; no SRT written. Plain TXT is not a Project files asset kind. Shared speech prompt/generate styling, model+voice row and Advanced import visually verified.


### 2026-10-28: human texture fit
Native TRELLIS.2 shares image conditioning and sampled shape latent with its texture pass, then decimates, unwraps and bakes PBR maps through native Comfy nodes and SDK. Full-body human tests produced aligned navy jacket/white shirt/tan trousers/skin/shoes; real GLBs d269f07329ff2436 (API),423321853545467b (Studio1K),f50f73ee0f3735ee (Studio2K). Front/back screenshots saved under outputs/human-texture-*.png. Minor speckling and coarse detail remain; do not claim production character quality or arbitrary existing-mesh retexturing. Dense blockout graph exists but its model download/inference acceptance remain pending.
