# Categories we're competing for + rules we must follow

**Studio targets these three categories:**

| Category | Prize | What it takes |
|---|---|---|
| **Open Weights Only** ("fully open source") | RTX 5090 | Every model, node and dependency is open. **No partner nodes, no closed APIs anywhere in the critical path.** Rented GPUs are fine. |
| **LTX VFX bonus** | $2,000 cash | **LTX (LTX-2.5) is the core model** of the app. |
| **Most Innovative** | RTX 5090 | The demo video must **explain why it's innovative**. |

Best Overall ($10k) considers every entry automatically. Each entry is eligible for one main category plus a model-provider bonus.
Source: https://comfy.org/open-source-higgsfield/ and the submission form (checked 2026-10-19, see CLAUDE.md).

## Hard rules: check before every new dependency
1. **Built on the Comfy Developer Platform.** Generation goes through ComfyUI via the **Comfy SDK** (`comfy-sdk` / `@comfyorg/sdk`), a Comfy API deployment and/or the Router. Keep the SDK in the real code path, and name it in the form ("which Comfy parts did you use").
2. **Open models only:** LTX-2.5 + its IC-LoRAs as the core. Any other model (image gen, image edit, segmentation, VLM, upscaler) must be open weights too. Before adding one, write its name + license + source link in your `notes/*.md`.
   - Not allowed: FLUX 3 (weights not out yet), MiniMax H3 *via API*, closed LLMs/VLMs (e.g. a hosted chat API) anywhere in the pipeline, partner/API nodes in ComfyUI.
3. **Workflow files in the repo:** API-format JSON in `shared/workflows/`, documented in `CONTRACT.md`.
4. **A working creative app with a usable UI** and example outputs. A workflow export alone doesn't count.
5. **Public repo at submission** with an **open-source license** (MIT, already in place) and local run instructions.
6. **Demo video ≤ 2 min:** the build in action + how it was made + **why it's innovative**.
7. **Social post with #OpenSourceHiggsfield** (the form needs the link).
8. **Lawful + SFW.** No unlicensed IP, no real people's likenesses without permission. Use your own footage/photos and original characters (e.g. Mia & Bolt).
9. **"This is my only submission"**: one entry per person. Ask in Discord to confirm two teammates may each submit. *(unconfirmed)*

If a feature can't be done with open models through Comfy, cut the feature. Don't break the rules to keep it.
