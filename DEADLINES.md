# Deadlines

**Hard deadline: Thu Oct 30, 9:00am PT.** Treat **Wed Oct 29** as the real deadline.
Each date is a sanity check. Missing one means cutting scope that day, not making it up later.

Both projects hit every checkpoint: **studio/** (cinema studio) and **adstudio/** (ad studio).

| Date | Checkpoint | Done when |
|---|---|---|
| **Tue Oct 21** | Repo up | Private repo pushed, partner invited. Both people have filled in the [signup form](https://form.typeform.com/to/Ayn9Cwfj) (free credits for the first 200). |
| **Wed Oct 22** | Concepts locked + rules asked | Each person has one sentence describing their app. Asked in Comfy Discord: *can two people on one team each submit their own entry?* (the form says "This is my only submission"). GPU decided: Comfy API deployment or Runpod. |
| **Thu Oct 23** | First real render | One real video out of ComfyUI from a workflow in `shared/workflows/`, run by `shared/scripts/` (comfy-sdk). Render time written in your notes file. **If neither of you has a real render by end of day: switch to Comfy Cloud / partner-model APIs and drop Open Weights Only.** |
| **Fri Oct 24** | Walking skeleton | One button in each app produces one real video end to end. Ugly is fine. |
| **Sat–Sun Oct 25–26** | Core features | The P0 list in `PLAN.md` is done. **Sun night: feature freeze.** Nothing new after this, only fixes. |
| **Mon Oct 27** | Examples + docs | 3–5 example outputs per app in `examples/`. README has local run steps that work. LICENSE present. |
| **Tue Oct 28** | Split + clean-machine test | Split into two repos (see README), each set public with a license. Fresh clone → follow README → it runs. Record the demo video (≤ 2 min: the build in action + how it was made). Optional: SF build night. |
| **Wed Oct 29** | **Submit** | Post the demo with **#OpenSourceHiggsfield** (the form requires the post link). Each person submits the [form](https://form.typeform.com/to/V1dSQrkS) with: public repo URL, video, post link, categories. Optional: LA build night. |
| Thu Oct 30, 9am PT | Hard deadline | Should already be done. |

## Daily sanity check (every evening)
- Does `main` run from a fresh clone?
- Did today's checkpoint happen? If not, what gets cut tomorrow?
- Is anything pending on the other person? Write it at the bottom of their `notes/*.md` file.

## Submission checklist (per project)
- [ ] Public GitHub repo with an open-source license
- [ ] Workflow files (API-format JSON) in the repo
- [ ] Local run instructions in README
- [ ] Example outputs
- [ ] Demo video ≤ 2 min
- [ ] Social post with #OpenSourceHiggsfield
- [ ] Built on the Comfy Developer Platform (Comfy API, Router and/or SDK). Say which in the form.
- [ ] Lawful, SFW, no unlicensed IP or real people's likenesses
- [ ] Optional live link (rate-limit it; judges expect ~5–10 runs)
