# Local LoRA test kit

Run `node studio/scripts/fetch-lora-lab.mjs` from the repository root. Assets stay in gitignored `outputs/lora-lab/`. The script records pinned model revisions, exact sizes and SHA-256 hashes, verifies model LFS hashes, and writes image provenance/captions. Re-running skips complete model files. No model code or training dependencies are installed/executed by this downloader.

## Models and dataset

- [Segmind Tiny-SD](https://huggingface.co/segmind/tiny-sd) and [Small-SD](https://huggingface.co/segmind/small-sd): CreativeML OpenRAIL-M, distilled/pruned SD image-model bases. These are research assets, not additional runnable choices in the Director. Normal SD1.5 workflows/LoRAs must not be assumed compatible with their pruned UNets. Model bundles use the upstream Diffusers layout, including `.bin` weights. Load trusted upstream weights with a current tensor-only loader when a trainer is installed.
- [HugGAN Smithsonian butterfly lowres](https://huggingface.co/datasets/huggan/smithsonian-butterfly-lowres): dataset declares CC0-1.0. First 20 source rows: 16 training subjects and 4 held-out subjects. Download both original photos and corresponding `sketch_pix2pix` images. Photo/sketch pairs from the same row stay in the same split. Descriptive captions are generic test captions, not expert species annotations.

## Working Studio training workflow

Choose **Training** in the workspace menu. Add project images or import new ones, caption each image, name the adapter, choose settings, and press **Start LoRA training**. Drafts are project-scoped. Training runs record the exact dataset/settings, loss history and downloadable safetensors; **Use in Image** selects the saved adapter beneath its base model.

The connected base is **Z-Image Turbo** (Apache-2.0, already installed). Training goes through SDK → proxy → ComfyUI native `MakeTrainingDataset`/`TrainLoraNode`, with repo-owned caption-pairing/output nodes. Install those nodes with `python shared/runtime/setup-training.py --comfy-root <ComfyUI folder>` and restart idle ComfyUI. No additional trainer package or model download is needed. Native ComfyUI training is experimental ([source, GPL-3.0](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_train.py)).

The memory-tested path loads frozen base weights as FP8 e4m3fn, preserves native training compute dtype (`none`), uses BF16 adapters, bypass hooks, block gradient checkpointing at depth 2, AdamW and batch 1. Model weights remain frozen. Images are center-cropped to the selected size. This avoids the BF16 training path that exhausted this machine's 12 GB GPU. It is not a guarantee that every resolution/rank fits every GPU.

### Actual validation, October 26, 2026

RTX 4070 SUPER 12 GB, ComfyUI 0.41.3, PyTorch 2.12.1+cu130:

- SDK one-step 256 px/rank 1 run saved a 7.7 MB adapter and finite loss.
- API two-step 512 px/rank 4 run saved an adapter and two finite losses; the model catalog exposed it as a child of its exact base, and `/api/keyframe` successfully generated using it.
- Browser import/captions → eight-step 512 px/rank 4 training on two CC0 butterfly sketch images → download and **Use in Image** succeeded. Loss changed from 0.1100 to 0.0085. That is wiring/optimization evidence, not a style-quality acceptance result.

Video/audio training, full-checkpoint fine-tuning, automatic captions, validation previews, pause/resume and training cancellation are not implemented. Tiny-SD/Small-SD research bundles remain separate; their pruned architectures are not selectable or trainable in this workflow. Do not infer compatibility from the presence of a downloaded file.

For a quality experiment, use the 16 training sketches and reserve all four held-out subjects. Compare fixed seeds with base/adapter outputs and unrelated subjects. The narrow dataset can confound butterflies with sketch treatment; evaluate prompt adherence and memorization before calling it a reusable style.

## Model chooser

Simple view shows compatible bases, generation estimates and expandable child fine-tunes. The type filter selects bases/fine-tunes. Advanced view adds capabilities and technical settings. Research downloads do not appear as generation choices. Elements remain prompt descriptions, not identity conditioning.

Estimates use the connected Comfy server GPU and measured uncached execution times saved under outputs/render-timings.json. They scale nearby workloads by padded dimensions and actual frame count, include observed model-switch overhead and missing keyframes, and display one approximate time. Unknown hardware without observations needs a benchmark. Queue waiting is additional. These are generation estimates, not training-time estimates.
