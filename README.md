# Open Source Higgsfield

Open-model creative apps (Studio and Ad Studio) for Comfy Org's Open Source Higgsfield competition.

## Start

Download this project, then double-click **start**:

- **Windows:** `start.cmd`
- **Mac:** `start.command`
- **Linux:** run `./start.command`

The first time, a short setup asks a few yes/no questions. It does the rest itself:

- Installs anything missing (Node.js, and Python and Git if ComfyUI has to be installed).
- Finds the ComfyUI you already have and reuses your models, or installs ComfyUI for you.
- Downloads the best models your graphics card can run.
- Offers optional extras: captions, smart search, and sharing with other devices on your network.

After that, double-clicking **start** opens the app in your browser. Close the window to stop it.

## If something goes wrong

- **The app says "Not connected":** open **Admin** in the app and click **Start & reconnect**.
- **Setup stopped partway:** double-click **start** again. Downloads pick up where they left off.
- **Your generated files** are in the `outputs` folder.

## For developers

See [`AGENTS.md`](AGENTS.md), [`shared/workflows/CONTRACT.md`](shared/workflows/CONTRACT.md), [`RULES.md`](RULES.md), [`PLAN.md`](PLAN.md) and [`DEADLINES.md`](DEADLINES.md). The installer is `shared/runtime/install.ts`, and the model list is `shared/runtime/models.json`.

## License

MIT. See [LICENSE](LICENSE). Each AI model has its own license, which setup shows before you download it.
