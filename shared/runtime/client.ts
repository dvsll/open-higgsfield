// Browser client for the generation API in shared/runtime/api.ts (mounted on the Vite server).
// When the API isn't reachable (no ComfyUI, or a non-localhost host without the token),
// `online` stays false and apps show their offline state.

export type Health = { comfyui: boolean; proxy: boolean; queued: number };
export type KeyframeResult = { url: string; seconds: number };
export type ShotResult = { url: string; seconds: number; frames: number };
export type ShotKey = { image: string; t: number; strength?: number };

let online = false;
let info: Health | null = null;
let reason = "";

async function health(): Promise<{ online: boolean; info: Health | null; reason: string }> {
  try {
    const r = await fetch("/api/health", { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || r.statusText);
    info = j as Health;
    online = info.comfyui && info.proxy;
    reason = online ? "" : !info.comfyui ? "ComfyUI isn't running" : "comfy-api-proxy isn't running";
  } catch (e) {
    online = false;
    info = null;
    reason = (e as Error).message;
  }
  return { online, info, reason };
}

async function post<T>(name: string, body: unknown): Promise<T> {
  const r = await fetch("/api/" + name, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: r.statusText }));
  if (!r.ok || j.error) throw new Error(j.error || r.statusText);
  return j as T;
}

export const OSH = {
  health,
  get online() { return online; },
  get reason() { return reason; },
  keyframe: (prompt: string, seed = 1, size: { width?: number; height?: number } = {}) => post<KeyframeResult>("keyframe", { prompt, seed, ...size }),
  shot: (keys: ShotKey[], prompt: string, duration: number, seed = 1) => post<ShotResult>("shot", { keys, prompt, duration, seed }),
};
