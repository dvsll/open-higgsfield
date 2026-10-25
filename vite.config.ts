import {resolve} from 'node:path';
import { defineConfig, loadEnv } from "vite";
import { comfyApi } from "./shared/runtime/api.ts";
import {cleanStudioUrls} from './studio/clean-urls.ts';

// One Vite server for the whole repo: studio + adstudio + archive, with the generation API mounted.
// Settings come from .env (see .env.example). Defaults are local-only.
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env } as Record<string, string | undefined>;
  const allowedHosts = (env.OSH_ALLOWED_HOSTS || "").split(",").map((h) => h.trim()).filter(Boolean);
  const port = Number(env.OSH_PORT || 8288);
  // Worktrees may themselves live under an ancestor outputs/. Ignore only this
  // app's media directory; **/outputs/** also silences all source invalidation.
  const outputFiles = resolve(process.cwd(), 'outputs').replace(/\\/g, '/') + '/**';
  const deny = [".env", ".env.*", "*.{crt,pem,key}", "**/.git/**", "**/.venv/**", "**/.runtime/**", "**/.claude/**", "**/node_modules/.vite*/**"];
  return {
    // Keep the live application's optimizer separate from standalone test servers.
    cacheDir: 'node_modules/.vite-app',
    appType: "mpa",
    plugins: [cleanStudioUrls(),comfyApi(env), {
      name: 'studio-controller-reload',
      // Controllers own native media/pointer services for a page lifetime. Never hot-mount a second copy.
      handleHotUpdate({ file, server }) {
        if (/[/\\]studio[/\\]src[/\\].*\.(ts|tsx)$/.test(file)) {
          server.ws.send({ type: 'full-reload' });
          return [];
        }
      },
    }],
    server: { watch: { ignored: ['**/.runtime/**','**/.venv/**',outputFiles] }, port, strictPort: true, host: env.OSH_HOST || "127.0.0.1", allowedHosts, fs: { strict: true, deny } },
    preview: { port, strictPort: true, host: env.OSH_HOST || "127.0.0.1", allowedHosts },
    build: {
      outDir: "dist",
      rollupOptions: {
        input: {
          home: "index.html",
          studio: "studio/index.html",
          director: "studio/director.html",
          edit: "studio/edit.html",
          designLab: "studio/design-lab.html",
          adstudio: "adstudio/index.html",
        },
      },
    },
  };
});
