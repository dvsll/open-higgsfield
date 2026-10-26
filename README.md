# Open Source Higgsfield

Two creative apps built on open AI models and [ComfyUI](https://www.comfy.org/), made for Comfy Org's [Open Source Higgsfield](https://comfy.org/open-source-higgsfield/) competition.

- **Studio** (`studio/`): a cinema studio. Write a prompt, generate keyframes and video shots, arrange them on a timeline, then edit.
- **Ad Studio** (`adstudio/`): turn a product photo into ads.

Everything runs on your own computer. No paid AI services are used.

## What you need

- **Node.js 22.18 or newer**: [nodejs.org](https://nodejs.org/)
- **An NVIDIA GPU** is recommended. Apple Silicon and CPU also work, but they are slower.
- **About 15 GB of free disk space** for the video models.
- **ComfyUI** is optional. If you don't have it, the app can install it for you. That needs [Python 3.12 or 3.13](https://www.python.org/downloads/) and [Git](https://git-scm.com/downloads).

## Get started

1. Download this project and open a terminal in its folder.
2. Install and start the app:
   ```bash
   npm install
   npm run dev
   ```
3. Open **http://127.0.0.1:8288/studio/director** in your browser.
4. On first run, a **Local setup** window opens. Pick one option:
   - **I already have ComfyUI:** start it, then click **Connect**. The app reuses your existing models.
   - **I don't have ComfyUI:** choose your hardware (NVIDIA, Apple Silicon or CPU) and click **Download & install ComfyUI**.
5. Tick the model packs you want. You need the **Video** pack (about 11.5 GB). The Image and Audio packs are optional. If a download stops, run it again and it continues where it left off.
6. When setup finishes, type a prompt and press **Generate**.

The first generation takes a few minutes because the models have to load. Later generations are faster.

To change settings later, open **Admin** in the top bar.

## Pages

| Page | Address |
|---|---|
| Studio | http://127.0.0.1:8288/studio/director |
| Ad Studio | http://127.0.0.1:8288/adstudio/ |

## Optional extras

### Captions
Studio can turn speech into captions on your own computer. To set it up, run this once with **your ComfyUI's Python**:

```bash
path/to/ComfyUI/.venv/Scripts/python.exe shared/runtime/setup-captions.py --comfy-root path/to/ComfyUI
```

On macOS or Linux, use `.venv/bin/python` instead. Restart ComfyUI afterwards, then open **Windows → Captions** in Studio.

### Share with someone on your network
1. Copy `.env.example` to `.env`.
2. Set `OSH_HOST=0.0.0.0`, list your hostname in `OSH_ALLOWED_HOSTS`, and set `OSH_TOKEN` to a long random password.
3. Run `npm run dev` and share `http://<your-host>:8288/?token=<your OSH_TOKEN>`.

People you share with can use the app. They can't install anything or download models.

## Troubleshooting

- **"Not connected":** make sure ComfyUI is running, then open **Admin** and click **Start & reconnect**.
- **ComfyUI is installed in an unusual folder:** set `COMFYUI_DIR` in `.env` to that folder.
- **Video export fails:** install [FFmpeg](https://ffmpeg.org/download.html), or set `FFMPEG_PATH` in `.env`.
- **Your generated files** are saved in the `outputs/` folder.

## For developers

- `npm run typecheck`, `npm run build` and `npm run preview`.
- Generation path: browser → Vite `/api` → `@comfyorg/sdk` → comfy-api-proxy (:8189) → ComfyUI (:8188).
- Workflows and API details: [`shared/workflows/CONTRACT.md`](shared/workflows/CONTRACT.md). Competition rules: [`RULES.md`](RULES.md). Plan and dates: [`PLAN.md`](PLAN.md) and [`DEADLINES.md`](DEADLINES.md).
- Models can also be downloaded from the command line: `npm run models -- --models-dir "<ComfyUI>/models" --only shot_ltxv`.

## License

MIT. See [LICENSE](LICENSE). Each AI model has its own license, which the setup screen shows before you download it.
