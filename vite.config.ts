import { defineConfig, loadEnv } from "vite";
import { comfyApi } from "./shared/runtime/api.ts";

// One Vite server for the whole repo: studio + adstudio + archive, with the generation API mounted.
// Settings come from .env (see .env.example). Defaults are local-only.
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env } as Record<string, string | undefined>;
  const allowedHosts = (env.OSH_ALLOWED_HOSTS || "").split(",").map((h) => h.trim()).filter(Boolean);
  const port = Number(env.OSH_PORT || 8288);
  const deny = [".env", ".env.*", "*.{crt,pem,key}", "**/.git/**", "**/.venv/**", "**/.runtime/**", "**/.claude/**", "**/node_modules/.vite/**"];
  return {
    appType: "mpa",
    plugins: [comfyApi(env)],
    server: { watch: { ignored: ['**/.runtime/**','**/.venv/**','**/outputs/**'] }, port, strictPort: true, host: env.OSH_HOST || "127.0.0.1", allowedHosts, fs: { strict: true, deny } },
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
