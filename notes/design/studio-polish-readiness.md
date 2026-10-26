# Studio polishing: real functionality and remaining gaps

Updated October 26, 2026. Call these gaps out when discussing or changing the affected tools.

| Tool | Actual behavior | Remaining gap |
| --- | --- | --- |
| Stylization | Old palette illustrations/heuristic and prompt-based variations removed from normal windows. Hidden legacy service DOM remains for controller lifetime safety. | These were never LoRA training or reference conditioning. New prompts no longer receive the hidden style modifier. |
| Training workflow | Captioned image dataset, native ComfyUI LoRA graph, bounded settings, run records, safetensors output, same-base image adapter loading and picker hierarchy. | Experimental native trainer; no real GPU training or quality/VRAM acceptance run yet. Initial supported base is installed Z-Image Turbo. Video/audio and full-checkpoint tuning are not implemented. |
| 3D | Clearly labeled viewport/workspace preview. | No 3D generation, reconstruction or scene editing backend. |
| Elements | Real image-backed library and description mentions. | Photos do not condition identity; no trained character guarantee. |
| Overlay tools | Timed text/watermarks and real local caption transcription, with timeline preview. | LTX VFX and burning/compositing overlay layers into exported video are not integrated. |
| Precision image edit | Real masked Z-Image resynthesis, saved versions and outside-mask compositing. | Automatic subject/character segmentation is not implemented. This is not an instruction-edit checkpoint. |
| Video/image/audio/captions | Existing SDK/proxy generation and transcription paths; caption model selection is passed through to the server. | Models must be installed and compatible; estimates are approximate observations, not guarantees. |
| Semantic search | MiniLM CPU text/description embeddings through ComfyUI, with literal fallback. | It does not inspect image pixels or recognize objects in uncaptioned media. |
| Design lab | Separate concept page explicitly marked as mockup. | Concept controls are not features of the production app. |

Training source: installed ComfyUI `comfy_extras/nodes_train.py` and `nodes_dataset.py`, including its experimental node flags. Repo-owned `osh_training` I/O nodes preserve exact dataset captions, base identity, steps and loss. Downloads of old Tiny-SD/Small-SD research bundles are not compatible runnable Studio models and no longer appear in the chooser.
