# Open Source Higgsfield

Open-model cinema Studio for Comfy Org's Open Source Higgsfield competition.

## Quick Start:

Download this project, then run corresponding command file:

- **Windows** : `start.cmd`
- **Mac:** or **Linux** : `start.command`

The first time, a short setup asks a few yes/no questions. It does the rest itself:

- Installs anything missing (Node.js, and Python and Git if ComfyUI has to be installed).
- Finds the ComfyUI you already have and reuses your models, or installs ComfyUI for you.
- Downloads the best models your graphics card can run.
- Offers optional extras: captions, smart search, and sharing with other devices on your network.

After that, double-clicking **start** opens the app in your browser. Close the window to stop it.

## Manual start

Requires Node.js **22.18+**, an existing ComfyUI with the models you want to use, and `comfy-api-proxy` (`pip install -r shared/runtime/requirements.txt` in your Python environment). FFmpeg on PATH for media import/export.

Copy `.env.example` to `.env` and point it at your setup:

```dotenv
COMFYUI_URL=http://127.0.0.1:8188
COMFY_BASE_URL=http://127.0.0.1:8189
COMFYUI_DIR=/path/to/ComfyUI
COMFYUI_MODELS_DIR=/path/to/ComfyUI/models
# If the proxy executable isn't on PATH:
# COMFY_API_PROXY=/path/to/comfy-api-proxy
```

Start ComfyUI normally, then:

```sh
npm install
npm start
```

Studio opens at **http://127.0.0.1:8288/studio/director** and starts the proxy on **8189**; ComfyUI's own UI stays on **8188**. `COMFYUI_DIR` is optional, for starting ComfyUI from Admin; the models path is for downloads, so point it at a folder ComfyUI actually loads (including shared folders configured in `extra_model_paths.yaml`).

Missing models: `npm run setup -- --dry-run` previews the plan; `npm run models -- --models-dir /path/to/models` downloads from `shared/runtime/models.json`. Pick installed models in Studio; Admin handles connection/model setup.

## If something goes wrong

- **The app says "Not connected":** open **Admin** in the app and click **Start & reconnect**.
- **Setup stopped partway:** double-click **start** again. Downloads pick up where they left off.
- **Your generated files** are in the `outputs` folder.

## For developers

See [`AGENTS.md`](AGENTS.md), [`RULES.md`](RULES.md), [`DEADLINES.md`](DEADLINES.md). The installer is `shared/runtime/install.ts`, and the model list is `shared/runtime/models.json`.

## License

MIT. See [LICENSE](LICENSE). Each AI model has its own license, which setup shows before you download it.
