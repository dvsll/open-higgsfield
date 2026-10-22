# Local LoRA test kit

Run `node studio/scripts/fetch-lora-lab.mjs` from the repository root. Assets stay in gitignored `outputs/lora-lab/`. The script records pinned model revisions, exact sizes and SHA-256 hashes, verifies model LFS hashes, and writes image provenance/captions. Re-running skips complete model files. No model code or training dependencies are installed/executed by this downloader.

## Models and dataset

- [Segmind Tiny-SD](https://huggingface.co/segmind/tiny-sd) and [Small-SD](https://huggingface.co/segmind/small-sd): CreativeML OpenRAIL-M, distilled/pruned SD image-model bases. These are research assets, not additional runnable choices in the Director. Normal SD1.5 workflows/LoRAs must not be assumed compatible with their pruned UNets. Model bundles use the upstream Diffusers layout, including `.bin` weights. Load trusted upstream weights with a current tensor-only loader when a trainer is installed.
- [HugGAN Smithsonian butterfly lowres](https://huggingface.co/datasets/huggan/smithsonian-butterfly-lowres): dataset declares CC0-1.0. First 20 source rows: 16 training subjects and 4 held-out subjects. Download both original photos and corresponding `sketch_pix2pix` images. Photo/sketch pairs from the same row stay in the same split. Descriptive captions are generic test captions, not expert species annotations.

## First training experiment (planned, not run)

Use Tiny-SD first. Train on `images/sketch/train`, reserve `images/sketch/holdout` for evaluation, and use the photo pairs as reference comparisons. Start with a small UNet attention LoRA (rank 4), batch 1, gradient accumulation 4, 384px crops, fp16, learning rate 0.0001, and a bounded 300-update run with checkpoints every 100 updates. These are starting settings to validate training plumbing, not tuned recommendations. Use [Diffusers' LoRA trainer](https://huggingface.co/docs/diffusers/training/lora) with a loader that honors the pruned architecture's configuration; [Segmind's training source](https://github.com/segmind/distill-sd) documents the base architecture.

Training tools are not installed yet. No training time or memory promise is made. Avoid running training concurrently with generation on the same GPU. Training is a separate operation from the app's SDK generation path; any generated demo media must continue through SDK → proxy → ComfyUI once an appropriate workflow is integrated.

Compare fixed seeds and prompts with the base model and adapter strengths 0, 0.5, and 1. Test both held-out butterflies and unrelated subjects (a teapot, a robot, a house). Look for transferred sketch treatment, unwanted butterflies, memorization and loss of prompt adherence. A narrow butterfly set can confound subject and style; passing this test does not establish a general-purpose stylization adapter.

## Picker design

Image and video model choices display the selected model, a generation range, workload assumptions, and explicit app capability states. JSON posing and LoRA loading are currently **not connected**; Elements are **prompt only**. Research downloads appear in local inventory after a completed model bundle is recorded, but cannot be selected for generation. No capabilities are inferred merely from filenames.

The compact chooser/main rows show only available or prompt-supported capabilities. Hover/focus explains usage, and clicking a supported chip focuses its input or timeline. Separate Shot and Motion prompt inputs are combined for LTX. `@` autocomplete resolves named Elements to descriptions in Image/Shot/Motion prompts; it does not add visual identity conditioning.

Estimates use the connected Comfy server GPU and measured uncached execution times saved under outputs/render-timings.json. They scale nearby workloads by padded dimensions and actual frame count, include observed model-switch overhead and missing keyframes, and display one approximate time. Unknown hardware without observations needs a benchmark. Queue waiting is additional. These are generation estimates, not training-time estimates.
