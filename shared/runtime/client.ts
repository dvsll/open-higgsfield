// Browser client for the generation API in shared/runtime/api.ts (mounted on the Vite server).
// When the API isn't reachable (no ComfyUI, or a non-localhost host without the token),
// `online` stays false and apps show their offline state.

export type Health = { comfyui: boolean; proxy: boolean; queued: number };
export type KeyframeResult = { url: string; seconds: number };
export type ShotResult = { url: string; seconds: number; frames: number; fps?: number; duration?: number };
export type ShotKey = { image: string; t: number; strength?: number };
export type ProductVideoOptions = { image: string; background?: string; mode: 'locked' | 'camera'; ratio: '16:9' | '9:16' | '1:1'; duration: number; motion?: 'push' | 'pan-left' | 'pan-right' };
export type ProductVideoResult = ShotResult & { width: number; height: number; mode: 'locked' | 'camera'; motion: string; protectedRect: { x: number; y: number; width: number; height: number } | null };
import type { ModelChoice } from './model-catalog';
import type { ServerTiming } from './render-timings';
export type LocalModels = { keyframe: ModelChoice[]; video: ModelChoice[]; timing: ServerTiming; research: { repo: string; revision: string; bytes: number }[]; inventory: { category: string; files: string[] }[] };

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
  async models(): Promise<LocalModels> {
    const r = await fetch('/api/models', { cache: 'no-store' });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || r.statusText);
    return data;
  },
  get online() { return online; },
  get reason() { return reason; },
  upload: (image: string) => post<{ url: string; width: number; height: number }>("upload", { image }),
  exportVideo: (video: string, overlay?: string) => post<{ url: string; seconds: number }>("export", { video, overlay }),
  productVideo: (options: ProductVideoOptions) => post<ProductVideoResult>('product-video', options),
  editVideo:(options:{video:string;start:number;end:number;speed:number;reverse:boolean;width:number;height:number})=>post<{url:string;seconds:number;width:number;height:number}>('edit-video',options),
  keyframe: (prompt: string, seed = 1, size: { width?: number; height?: number } = {}, model?: string) => post<KeyframeResult>("keyframe", { prompt, seed, ...size, model }),
  // Preserve Director's model argument and Ad Studio's size argument; options can combine both.
  shot: (keys: ShotKey[], prompt: string, duration: number, seed = 1, options: string | { width?: number; height?: number; model?: string; frames?: number; fps?: number } = {}) => post<ShotResult>("shot", { keys, prompt, duration, seed, ...(typeof options === 'string' ? { model: options } : options) }),
};
