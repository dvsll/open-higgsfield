# Open Source Higgsfield entry — project brief

Handoff from a claude.ai chat on 2026-10-19. Treat everything under "Verified" as checked against the linked source on that date; everything under "Unverified / to confirm" must be checked before relying on it.

## Goal
Place in Comfy Org's **Open Source Higgsfield** competition. Realistic targets: one of 10 runner-up slots, **Open Weights Only** (RTX 5090), and the **LTX VFX bonus** ($2,000 cash). Best Overall ($10k) is a long shot.

## Verified (2026-10-19)
- Submission deadline: **Oct 30, 9:00am PT**. Build nights: SF Oct 28 (Frontier Tower), LA Oct 29. Winners announced Nov 6. — https://comfy.org/open-source-higgsfield/
- The Oct 1 "Open Call" (deadline Oct 19) was replaced by this competition. — https://comfyui-wiki.com/en/news/2026-10-15-open-source-higgsfield
- Main prizes: Best Overall $10k (all entries auto-considered); Most Innovative 5090 (demo must explain why it's innovative); Most Viral 5090; Open Weights Only 5090 (no partner nodes or closed APIs); 10 runner-ups $250 Comfy credits. — competition page
- Bonuses: LTX VFX $2k cash (LTX core video model); FLUX 3 credits (FLUX 3 core model); MiniMax H3 $1k credits (H3 core model). — competition page
- Entry = working creative app with usable UI + example outputs (not a workflow export): repo with app code, workflow files, open-source license, local run instructions, demo video ≤ 2 min. Optional deployed link. Post demo with #OpenSourceHiggsfield. Must be built on Comfy Developer Platform (Comfy API, Router and/or SDK). Lawful, SFW, no unlicensed IP or likenesses. — comfyui-wiki article + competition page
- First 200 signups get free credits. Signup: https://form.typeform.com/to/Ayn9Cwfj · Submit: https://form.typeform.com/to/V1dSQrkS
- LTX 2.5 is open weights. — https://comfy.org/ltx-2.5/
- MiniMax H3 is available as open weights. — https://comfy.org/minimax-h3/
- FLUX 3 open weights are "coming soon" (not usable for Open Weights Only today). — https://comfy.org/flux-3/
- LTX-2.5 IC-LoRA adapters include: Union Control, Motion Control, Ingredients, Pixel Spatial Upscaler, In-Outpainting, Instant Shave, Water Simulation, Colorization, Decompression, Deblurring, Day to Night, Clean Plate, SDR to HDR, Layout to Render, Refine Details, Restore, Alpha Gen (beta). Relight is documented on the IC-LoRA usage page (light-direction ball composited top-right of the reference). — https://docs.ltx.io/open-source-model/integration-tools/ic-lo-ra-adapters , https://docs.ltx.io/open-source-model/usage-guides/ic-lo-ra
- LTX-2.5 official minimum: NVIDIA GPU 32GB+ VRAM, 32GB RAM; recommended A100/H100 80GB, 64GB+ RAM; CUDA 12.7+, Python 3.12+. — https://docs.ltx.io/open-source-model/getting-started/system-requirements
- Comfy SDK: `comfy-sdk` (PyPI, Py 3.10+) and `@comfyorg/sdk` (npm, Node 22+), v0.5.0. Same code targets Comfy Cloud, a Comfy API deployment, or self-hosted ComfyUI via `COMFY_BASE_URL` (self-hosted needs `comfy-api-proxy`). — https://docs.comfy.org/development/api-development/sdks
  ```python
  from comfy_sdk import Comfy
  client = Comfy(api_key="comfyui-...")
  wf = client.workflows.from_file("workflow_api.json")
  wf.set_input("10", "image", client.assets.from_file("photo.png"))
  job = client.run(wf)
  for out in job.get_outputs("9"): out.to_file(out.name)
  ```
- Comfy API: package workflow with `comfy build init` / `comfy build push --release`, deploy, billed per GPU-second. RTX PRO 6000 96GB $4.54/hr, H100 80GB $6.23/hr. Standard/Creator plans: 5 builds, 2 deployments. — https://comfy.org/platform/comfy-api/
- Comfy's page lists its own example apps Cinematic Studio and Reshoot, and "Openjutsu — coming soon" (Comfy is building its own Genjutsu-style app; don't clone it).

## Verified from the submission form + page Q&A (2026-10-19)
Source: https://form.typeform.com/to/V1dSQrkS and the Q&A on https://comfy.org/open-source-higgsfield/
- Repo only has to be **public at submission**: form asks for a GitHub URL that "must be public with an open-source license and setup instructions". Nothing requires building in public or code started after Oct 15.
- Each entry is eligible for both a main category and a model-provider bonus category.
- Partner models are allowed; only Open Weights Only requires open weights with no partner nodes or closed APIs. Form: "fully open" = every model, node and dependency open, no closed API in the critical path; **rented GPUs still count**.
- Demo video < 2 min: "show us your build in action and how you made it". Page: "We're judging the work, not your video editing or quality."
- Live link optional, **not shared publicly**, judges expect ~5-10 runs; rate-limiting/spend caps allowed.
- Social post tagging #OpenSourceHiggsfield is a required field.
- Agreements: repo public + OSS license; lawful/SFW, no unlicensed IP or real people's likenesses without permission; Comfy/NVIDIA/Runpod/partners may feature it; **"This is my only submission."**
- Form category checkboxes list FLUX 3 and LTX bonuses but not MiniMax H3.
- Form asks which Comfy parts were used: Comfy API, Router, SDK, Cloud Agent, Local Agent, MCP.

## Unverified / to confirm (ask in Comfy Discord)
- Whether two LLC partners may each submit their own entry (form says "my only submission", read as per person, not confirmed).
- Judging criteria weights for the new categories.
- Whether Layout to Render and Relight produce demo-quality output on our inputs. **This decides the concept.**
- Whether FP8/quantized LTX-2.5 runs on < 32GB cards (not stated in docs).

## Concepts (flow mock: osh-flows.html)
1. **Blockout** — primary. Block a scene with grey shapes + camera path in a browser three.js viewport → record playblast → LTX-2.5 + Layout to Render IC-LoRA (+ optional 2× Pixel Spatial Upscaler) → finished shot. Targets: Open Weights, Most Innovative, LTX VFX bonus. Risk: Layout to Render quality unproven.
2. **Sunline** — second entry. Upload clip → drag sun on a sphere → app composites the light ball into the reference automatically → Relight (or Day to Night preset) → before/after wipe. Targets: Open Weights, Most Viral, LTX VFX bonus. Risk: relight strength on real footage.
3. **Rescue** — fallback. Old home video → chain Decompression → Deblurring → Colorization → Upscaler (→ SDR to HDR) → shareable before/after card. Targets: Most Viral, Open Weights, LTX VFX bonus. Risk: least novel; use own footage only.

All three: web app → comfy-sdk → Comfy API deployment (or rented GPU) → LTX-2.5 + IC-LoRAs. No partner nodes/closed APIs, to stay eligible for Open Weights Only.

## Hardware note
Local cards (Arc Pro B60 24GB, RTX 4070 Super 12GB) are below the LTX-2.5 official 32GB NVIDIA minimum. Plan on rented GPUs (Comfy API RTX PRO 6000, or Runpod — a competition sponsor) for the build window.

## Plan
- Oct 19–21: capability spike. Run Layout to Render and Relight example workflows on a rented GPU with our own test inputs. Measure real render times.
- **Oct 22 gate:** if neither produces a clip worth posting, pivot to Rescue or to API models (drop Open Weights Only, aim at runner-up / Most Viral).
- Oct 23–26: build the app around the chosen workflow.
- Oct 27–28: freeze, test on a clean machine from the README, record ≤ 2-min demo.
- Oct 29: submit (one day of buffer before the 9am PT Oct 30 deadline).

## First tasks for Claude Code
1. Sign up via the Typeform today (free credits for first 200).
2. Pull Lightricks/ComfyUI-LTXVideo example workflows for 2.5 (Layout to Render, Relight/IC-LoRA) and get one render out of each on a rented GPU.
3. Scaffold the repo: `app/` (front end), `workflows/` (API-format JSON), `scripts/` (comfy-sdk runner), LICENSE (MIT or Apache-2.0), README with local run steps.

## Working rules
- Verify any factual claim (rules, model capabilities, prices) against a source before relying on it; record the source here.
- Prefer existing CLIs (`comfy`, `gh`, `ffmpeg`) over hand-written scripts.

## Collaboration (two people, two projects, one GitHub repo until the split)
**Since 2026-10-21 this supersedes the GPU/app lanes and the concept list above.** dvs builds `studio/` (cinema studio); the partner builds `adstudio/` (ad studio). Dates: `DEADLINES.md` (these take priority over everything else). Scope: `PLAN.md`. Ideation wireframes/mockups are frozen in `archive/`.

Live notes from each project:
@notes/studio.md
@notes/adstudio.md

- **Projects own directories.** Edit only your own project folder and notes file. If you need a change in the other project, write a request at the bottom of their notes file.
- **`shared/`** (workflows + `CONTRACT.md`, scripts, style board, lib) is used by both. Change it only with a dated note in both notes files.
- **Keep the split easy:** a project loads files only from its own folder and `../shared/`. See README → "Splitting into two repos".
- **This file (CLAUDE.md) is the stable brief.** Do not append running notes here.
- **Sync is automatic.** Hooks in `.claude/settings.json`: on session start it pulls and shows the last 24h of commits; on every prompt it tells you about partner commits you haven't pulled; at the end of every turn it commits, rebases on the remote and pushes. If a rebase hits a conflict the hook aborts it and nothing is pushed; then resolve it yourself: `git pull --rebase`, fix, continue, push.
- Your personal, uncommitted instructions go in `CLAUDE.local.md` (gitignored), e.g. "I am on adstudio".
