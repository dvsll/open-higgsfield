Read CLAUDE.md in this folder: it is the full brief for our Open Source Higgsfield entry (deadline Oct 30, 9am PT). osh-flows.html is the UI flow mock.
Treat the "Verified" section as sourced; re-check anything under "Unverified" before relying on it.

Setup (first run only, skip any step already done):
1. git init, commit everything, then `gh repo create open-higgsfield --private --source=. --push`.
2. Ask me for my partner's GitHub username and add them: `gh api -X PUT repos/{owner}/open-higgsfield/collaborators/<username>`.
3. Ask me which lane I'm on (gpu or app) and write it to CLAUDE.local.md.

Then, if I'm on the GPU lane: start the Oct 19-21 capability spike. Pull the LTX-2.5 example workflows from Lightricks/ComfyUI-LTXVideo, get one Layout to Render render and one Relight render out on a rented NVIDIA GPU (32GB+). Ask me before spending money or creating accounts. Log render times and quality notes in notes/gpu.md and write workflows/CONTRACT.md.
If I'm on the app lane: scaffold app/ from osh-flows.html (Blockout concept first), stubbing model calls against workflows/CONTRACT.md.

Make a task list. Stop at the Oct 22 go/pivot gate with a recommendation.
