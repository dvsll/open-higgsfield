# Studio polishing: real functionality and remaining gaps

Updated October 26, 2026. Call these gaps out when discussing or changing the affected tools.

| Tool | Actual behavior | Remaining gap |
| --- | --- | --- |
| Stylization | Old palette illustrations/heuristic and prompt-based variations removed from normal windows. Hidden legacy service DOM remains for controller lifetime safety. | These were never LoRA training or reference conditioning. New prompts no longer receive the hidden style modifier. |
| Training workflow | Captioned image dataset, native ComfyUI LoRA graph, bounded settings, run records, safetensors output, same-base image adapter loading and picker hierarchy. | Experimental native trainer. FP8/bypass path passed actual SDK/API and eight-step browser training at 512px/rank4 on RTX4070 SUPER12GB; saved adapter loads for Image inference. BF16 path OOM. Quality/long-run acceptance remains untested. Z-Image Turbo, LTX-Video2B clip LoRA and Hunyuan3D mini image/mesh LoRA pass actual SDK/API runs. Audio, material, full-checkpoint tuning and cancellation remain unimplemented. |
| 3D | Real Hunyuan3D mini image-to-mesh generation, geometry LoRA training from image/OBJ pairs, GLB download and Three.js orbit viewer. | Material/texturing training, reconstruction and scene editing are not integrated. Geometry is untextured; short training fixtures do not prove quality. |
| Elements | Real image-backed library and description mentions. | Photos do not condition identity; no trained character guarantee. |
| Overlay tools | Timed text/watermarks and real local caption transcription, with timeline preview. | LTX VFX and burning/compositing overlay layers into exported video are not integrated. |
| Precision image edit | Real masked Z-Image resynthesis, saved versions and outside-mask compositing. | Automatic subject/character segmentation is not implemented. This is not an instruction-edit checkpoint. |
| Video/image/audio/captions | Existing SDK/proxy generation and transcription paths; caption model selection is passed through to the server. | Models must be installed and compatible; estimates are approximate observations, not guarantees. |
| Semantic search | MiniLM CPU text/description embeddings through ComfyUI, with literal fallback. | It does not inspect image pixels or recognize objects in uncaptioned media. |
| Design lab | Separate concept page explicitly marked as mockup. | Concept controls are not features of the production app. |

Training source: installed ComfyUI `comfy_extras/nodes_train.py` and `nodes_dataset.py`, including its experimental node flags. Repo-owned `osh_training` I/O nodes preserve exact dataset captions, base identity, steps and loss. Downloads of old Tiny-SD/Small-SD research bundles are not compatible runnable Studio models and no longer appear in the chooser.


### 2026-10-27: 3D scene implementation
Prompt-to-OBJ generation is now proven with a real stool using installed Z-Image and Hunyuan mini. Project-scoped multi-object viewport, selection, numeric transforms, selected-only regeneration routing and scene OBJ export are connected. Whole-environment generation remains an unvalidated quality case and yields a single untextured mesh; no material generation, scene decomposition or production environment fidelity is claimed.
