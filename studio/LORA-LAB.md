# Local LoRA test kit

Run `node studio/scripts/fetch-lora-lab.mjs` from the repository root. Assets stay in gitignored `outputs/lora-lab/`. The script records pinned model revisions, exact sizes and SHA-256 hashes, verifies model LFS hashes, and writes image provenance/captions. Re-running skips complete model files. No model code or training dependencies are installed/executed by this downloader.

## Models and dataset

- [Segmind Tiny-SD](https://huggingface.co/segmind/tiny-sd) and [Small-SD](https://huggingface.co/segmind/small-sd): CreativeML OpenRAIL-M, distilled/pruned SD image-model bases. These are research assets, not additional runnable choices in the Director. Normal SD1.5 workflows/LoRAs must not be assumed compatible with their pruned UNets. Model bundles use the upstream Diffusers layout, including `.bin` weights. Load trusted upstream weights with a current tensor-only loader when a trainer is installed.
- [HugGAN Smithsonian butterfly lowres](https://huggingface.co/datasets/huggan/smithsonian-butterfly-lowres): dataset declares CC0-1.0. First 20 source rows: 16 training subjects and 4 held-out subjects. Download both original photos and corresponding `sketch_pix2pix` images. Photo/sketch pairs from the same row stay in the same split. Descriptive captions are generic test captions, not expert species annotations.

## Working Studio training workflow

Choose **Training** in the workspace menu. Add project images or import new ones, caption each image, name the adapter, choose settings, and press **Start LoRA training**. Drafts are project-scoped. Training runs record the exact dataset/settings, loss history and downloadable safetensors; **Use in Image** selects the saved adapter beneath its base model.

The image base is **Z-Image Turbo** (Apache-2.0). Training goes through SDK → proxy → ComfyUI native `MakeTrainingDataset`/`TrainLoraNode`, with repo-owned caption-pairing/output nodes. Install those nodes with `python shared/runtime/setup-training.py --comfy-root <ComfyUI folder>` and restart idle ComfyUI. No additional trainer package or model download is needed. Native ComfyUI training is experimental ([source, GPL-3.0](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_train.py)).

The memory-tested path loads frozen base weights as FP8 e4m3fn, preserves native training compute dtype (`none`), uses BF16 adapters, bypass hooks, block gradient checkpointing at depth 2, AdamW and batch 1. Model weights remain frozen. Images are center-cropped to the selected size. This avoids the BF16 training path that exhausted this machine's 12 GB GPU. It is not a guarantee that every resolution/rank fits every GPU.

### Actual validation, October 26, 2026

RTX 4070 SUPER 12 GB, ComfyUI 0.41.3, PyTorch 2.12.1+cu130:

- SDK one-step 256 px/rank 1 run saved a 7.7 MB adapter and finite loss.
- API two-step 512 px/rank 4 run saved an adapter and two finite losses; the model catalog exposed it as a child of its exact base, and `/api/keyframe` successfully generated using it.
- Browser import/captions → eight-step 512 px/rank 4 training on two CC0 butterfly sketch images → download and **Use in Image** succeeded. Loss changed from 0.1100 to 0.0085. That is wiring/optimization evidence, not a style-quality acceptance result.

Audio training, full-checkpoint fine-tuning, automatic captions, validation previews, pause/resume and training cancellation are not implemented. Tiny-SD/Small-SD research bundles remain separate; their pruned architectures are not selectable or trainable in this workflow. Do not infer compatibility from the presence of a downloaded file.

For a quality experiment, use the 16 training sketches and reserve all four held-out subjects. Compare fixed seeds with base/adapter outputs and unrelated subjects. The narrow dataset can confound butterflies with sketch treatment; evaluate prompt adherence and memorization before calling it a reusable style.

## Model chooser

Simple view shows compatible bases, generation estimates and expandable child fine-tunes. The type filter selects bases/fine-tunes. Advanced view adds capabilities and technical settings. Research downloads do not appear as generation choices. Elements remain prompt descriptions, not identity conditioning.

Estimates use the connected Comfy server GPU and measured uncached execution times saved under outputs/render-timings.json. They scale nearby workloads by padded dimensions and actual frame count, include observed model-switch overhead and missing keyframes, and display one approximate time. Unknown hardware without observations needs a benchmark. Queue waiting is additional. These are generation estimates, not training-time estimates.


## Video and geometry LoRA workflows (October 26)

**Video:** choose LTX-Video 2B in Training. Import MP4/WebM clips or choose project videos; caption appearance and motion. Size is center-cropped; frames/FPS determine the opening clip segment. Each example retains its temporal tensor (not a set of unrelated stills). Defaults are 256px, 17 frames, 24 FPS; editable frames use LTX's 8n+1 stride. The native LTX VAE encodes the clip and the T5 text encoder supplies caption conditioning with frame rate. BF16 native training, bypass LoRA, depth2 checkpointing, batch1/AdamW use the same SDK/proxy path as images. **Use in Video** selects the adapter under its exact video base; `SamplerCustom` receives the LoRA-patched model for both guided and unguided generation. This is LTX-Video0.9.8 2B support, not LTX-2.5 training support.

**3D geometry:** choose Hunyuan3D mini in Training. Pair each reference image with the corresponding target OBJ. OBJ geometry is sanitized (external material paths/resources stripped), center-normalized and area-sampled into81920 oriented surface points. The pinned VAE encoder produces512 shape tokens; DINO image conditioning trains the native0.6B shape model. Frozen mesh preprocessing stays on CPU to avoid the native FPS sampler's CPU-index/GPU-tensor bug; diffusion LoRA training runs on GPU. No extra Python dependency is needed. **Use in3D** selects the adapter and carries its reference into the real3D workflow. Generate geometry → GLB download and local Three.js orbit/zoom viewer. The SDK currently ignores native `ui.3d` outputs; repo-owned OSHSaveGeometry returns the same GLB via the supported file-output descriptor contract, without bypassing SDK/proxy.

Hunyuan3D mini and encoder are official pinned weights (`f90a0f7df7d5e6f71109cf333f6a95a0ae3194a6`) under Tencent Hunyuan Community License; upstream use/territorial restrictions apply. They are an optional3D pack in Admin. The encoder checkpoint is hash-pinned and loaded with `weights_only=True`; the downloader now verifies manifest SHA-256 for this non-safetensors asset. The viewport uses MIT Three.js/@types/three from npm, with local GLB rendering and no CDN.

**3D materials are not connected.** The target chooser explicitly marks materials and geometry+materials unavailable. A shape LoRA cannot train textures. The investigated Hunyuan3D2.1 texture path documents21GB inference VRAM, beyond this12GB device; this is not a claim that every alternative texture pipeline needs21GB. Integrating and validating a compatible material model/trainer remains separate work.

### Additional actual validation

- SDK video: one step/rank1,9 frames256px, saved finite-loss adapter.
- API video: two clips/two steps/rank2, temporal concat, saved adapter, child model catalog entry and successful9-frame256px video generation with it.
- Browser video: imported clip, FPS/frame controls, one-step run, saved adapter/download and Use in Video action.
- SDK geometry: real cube OBJ surface encoding, one-step training, saved finite-loss adapter, native mesh generation/decode/export returned GLB through SDK.
- API geometry: sanitized OBJ upload plus reference, one-step/rank2 training, adapter catalog binding, mesh generation and valid GLB download (3.3MB, one mesh, correct MIME).

These are execution/integration checks. Short runs on synthetic cube fixtures do not establish motion/style/shape quality or generalization.

- Browser geometry: cube reference+OBJ pairing → one-step/rank2 adapter → Use in3D carried adapter/reference →20-step generation → GLB and real Three.js orbit interaction visually verified. The generated mesh is untextured and may reproduce image/background artifacts.
- Base/adapter checks with matching seeds/settings: decoded video-frame hashes differ; generated geometry bytes differ. This verifies adapter application, not improved quality.
