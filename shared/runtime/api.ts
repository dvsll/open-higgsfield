/**
 * Local generation API for both apps, as a Vite plugin (dev + preview).
 *
 *   browser → Vite (/api/*, /outputs/*) → @comfyorg/sdk → comfy-api-proxy :8189 → ComfyUI :8188
 *
 * Security model:
 * - ComfyUI and comfy-api-proxy stay on 127.0.0.1; only Vite is ever exposed.
 * - /api is open to localhost only. From any other Host (e.g. a tunnel domain) it requires
 *   OSH_TOKEN: open the site once with ?token=… and an HttpOnly cookie is set.
 * - Inputs are validated, bodies are size-capped, jobs run one at a time with a short queue,
 *   and /outputs only serves files this API wrote (random hex names).
 */
import { Comfy } from "@comfyorg/sdk";
import { spawn } from "node:child_process";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, createReadStream, statSync } from "node:fs";
import { readFile, writeFile, unlink } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Connect, Plugin } from "vite";
import { imageModel, videoModel } from './model-catalog.ts';
import { identifyHardware, serverTiming, recordRender } from './render-timings.ts';
import { productFormats, productPlan, renderProduct, ProductRenderError, type ProductRatio, type ProductMode, type CameraMotion } from './product-video.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WORKFLOWS = join(ROOT, "shared", "workflows");
const OUTPUTS = join(ROOT, "outputs");
const FPS = 24;
const MAX_BODY = 64 * 1024;
const MAX_UPLOAD_BODY = 8 * 1024 * 1024;
const MAX_QUEUE = 4;
const OUTPUT_NAME = /^[a-f0-9]{16}\.(png|webm|mp4)$/;

type Env = Record<string, string | undefined>;
type Key = { image: string; t: number; strength?: number };

// ---------------- ComfyUI side ----------------

let comfy: Comfy | null = null;
function client(env: Env): Comfy {
  process.env.COMFY_BASE_URL = env.COMFY_BASE_URL || "http://127.0.0.1:8189"; // read by the SDK
  return (comfy ??= new Comfy());
}

async function up(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

/** Start comfy-api-proxy (pip tool) in front of ComfyUI if it isn't running. */
async function ensureProxy(env: Env): Promise<void> {
  const base = env.COMFY_BASE_URL || "http://127.0.0.1:8189";
  if (await up(base + "/api/v2/health")) return;
  const win = process.platform === "win32";
  const candidates = [env.COMFY_API_PROXY, join(ROOT, ".venv", win ? "Scripts/comfy-api-proxy.exe" : "bin/comfy-api-proxy"), "comfy-api-proxy"];
  const exe = candidates.find((c) => c && (c === "comfy-api-proxy" || existsSync(c)))!;
  const port = new URL(base).port || "8189";
  const comfyui = env.COMFYUI_URL || "http://127.0.0.1:8188";
  console.log(`[api] starting comfy-api-proxy on 127.0.0.1:${port} -> ${comfyui}`);
  const p = spawn(exe, ["run", "--comfyui", comfyui, "--host", "127.0.0.1", "--port", port], { stdio: "ignore", windowsHide: true });
  p.on("error", (e) => console.warn(`[api] could not start comfy-api-proxy (${e.message}). Install it: pip install comfy-api-proxy`));
  for (let i = 0; i < 30 && !(await up(base + "/api/v2/health")); i++) await new Promise((r) => setTimeout(r, 500));
}

async function loadGraph(name: string): Promise<Record<string, any>> {
  return JSON.parse(await readFile(join(WORKFLOWS, `${name}.json`), "utf8"));
}

function outputName(ext: string): string {
  mkdirSync(OUTPUTS, { recursive: true });
  return `${randomBytes(8).toString("hex")}.${ext}`;
}

async function save(job: Awaited<ReturnType<Comfy["run"]>>, node: string, ext: "png" | "webm"): Promise<string> {
  const out = job.getOutputs(node)[0];
  if (!out) throw new Error(`workflow produced no output on node ${node}`);
  const name = outputName(ext);
  await out.toFile(join(OUTPUTS, name));
  return `/outputs/${name}`;
}

/** /outputs/<name> as returned by this API -> absolute path. Rejects anything else. */
function outputPath(url: unknown): string {
  const name = typeof url === "string" ? url.replace(/^\/outputs\//, "") : "";
  if (!OUTPUT_NAME.test(name)) throw new HttpError(400, "image must be an /outputs/… file from this API");
  const p = join(OUTPUTS, name);
  if (!existsSync(p)) throw new HttpError(400, `missing output ${name}`);
  return p;
}

/** Run a workflow; retry once if the proxy reports the job expired (happens right after a proxy restart). */
async function runWf(c: Comfy, wf: Parameters<Comfy["run"]>[0]) {
  try {
    return await c.run(wf);
  } catch (e: any) {
    if (e?.code === "job_failed" && /expired/i.test(String(e.message))) return c.run(wf);
    throw e;
  }
}

// One job at a time on the GPU; small queue, then 429.
let chain: Promise<unknown> = Promise.resolve();
let queued = 0;
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  if (queued >= MAX_QUEUE) throw new HttpError(429, "GPU busy, try again in a moment");
  queued++;
  const run = chain.then(fn, fn).finally(() => queued--);
  chain = run.catch(() => {});
  return run;
}

// ---------------- endpoints ----------------

async function comfyJson(env: Env, path: string): Promise<any> {
  try {
    const r = await fetch((env.COMFYUI_URL || "http://127.0.0.1:8188") + path, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`ComfyUI returned ${r.status}`);
    return await r.json();
  } catch { throw new HttpError(503, "Cannot read local models. Check ComfyUI on port 8188 and refresh."); }
}

async function localModels(env: Env) {
  const [categories, nodes] = await Promise.all([comfyJson(env, "/models"), comfyJson(env, "/object_info")]);
  const inventory = await Promise.all((categories as string[]).filter(c => !["configs", "custom_nodes"].includes(c)).map(async category => ({ category, files: await comfyJson(env, "/models/" + encodeURIComponent(category)) as string[] })));
  const has = (node: string, input: string, file: string) => nodes[node]?.input?.required?.[input]?.[0]?.includes(file) === true;
  const graphReady = (graph: Record<string, any>) => Object.values(graph).every(n => Boolean(nodes[n.class_type]));
  const [imageGraph, videoGraph] = await Promise.all([loadGraph("keyframe_zimage"), loadGraph("shot_ltxv")]);
  const keyframe = has("UNETLoader", "unet_name", "z_image_turbo_bf16.safetensors") && has("CLIPLoader", "clip_name", "qwen_3_4b_fp8_mixed.safetensors") && has("VAELoader", "vae_name", "ae.safetensors") && graphReady(imageGraph)
    ? [imageModel] : [];
  const video = has("CheckpointLoaderSimple", "ckpt_name", "ltxv-2b-0.9.8-distilled.safetensors") && has("CLIPLoader", "clip_name", "t5xxl_fp8_e4m3fn_scaled.safetensors") && graphReady(videoGraph)
    ? [videoModel] : [];
  let research: { repo: string; revision: string; bytes: number }[] = [];
  try {
    const lab = JSON.parse(await readFile(join(OUTPUTS, 'lora-lab', 'manifest.json'), 'utf8'));
    research = lab.models.map((m: any) => ({ repo: m.repo, revision: m.revision, bytes: m.files.reduce((sum: number, f: any) => sum + f.bytes, 0) }));
  } catch { /* Training assets are optional and not generation choices. */ }
  const hardware = identifyHardware(await comfyJson(env,'/system_stats').catch(()=>null));
  return { keyframe, video, research, timing: await serverTiming(OUTPUTS,hardware,queued), inventory: inventory.filter(c => c.files.length > 0) };
}

async function selectedModel(body: any, env: Env, kind: "keyframe" | "video") {
  const models = (await localModels(env))[kind];
  const model = body.model ?? models[0]?.id;
  if (!models.some(m => m.id === model)) throw new HttpError(400, `Selected ${kind} model is unavailable or has no compatible workflow. Refresh local models.`);
  await ensureProxy(env);
  return model as string;
}

const str = (v: unknown, max: number, name: string): string => {
  if (typeof v !== "string" || !v.trim() || v.length > max) throw new HttpError(400, `${name} must be a non-empty string (≤ ${max} chars)`);
  return v;
};
const num = (v: unknown, lo: number, hi: number, dflt: number): number => {
  const n = v === undefined ? dflt : Number(v);
  if (!Number.isFinite(n) || n < lo || n > hi) throw new HttpError(400, `number out of range [${lo}, ${hi}]`);
  return n;
};
function dimension(value: unknown, max: number, fallback: number, step: number) {
  const n=num(value,256,max,fallback);
  if (!Number.isInteger(n)) throw new HttpError(400,`Dimensions must be whole pixels (256–${max}).`);
  return n;
}
function cropOutput(graph:Record<string,any>,decode:string,output:string,width:number,height:number,step:number){
  const rw=Math.ceil(width/step)*step,rh=Math.ceil(height/step)*step;
  if(rw!==width||rh!==height){graph['exact_size']={class_type:'ImageCrop',inputs:{image:[decode,0],width,height,x:Math.floor((rw-width)/2),y:Math.floor((rh-height)/2)}};graph[output].inputs.images=['exact_size',0]}
  return {rw,rh};
}
async function timedRun(c: Comfy, wf: Parameters<Comfy['run']>[0], env: Env, model: string, width: number, height: number, frames: number) {
  const hardware=identifyHardware(await comfyJson(env,'/system_stats').catch(()=>null));
  let executionSeconds=0;
  const job=await serialize(async()=>{const start=Date.now();const result=await runWf(c,wf);const ms=result.metrics?.execution_ms;executionSeconds=typeof ms==='number'?ms/1000:(Date.now()-start)/1000;
    const history=await comfyJson(env,'/history/'+encodeURIComponent(result.id)).catch(()=>null);
    const messages=history?.[result.id]?.status?.messages;
    const cached=Array.isArray(messages)&&messages.some(([event,data]:[string,any])=>event==='execution_cached'&&data.nodes?.includes(frames===1?'8':'14'));
    if(!cached&&history)await recordRender(OUTPUTS,hardware,{model,width,height,frames,seconds:executionSeconds,jobId:result.id});return result});
  return {job,executionSeconds};
}

/** Prompt -> image. shared/workflows/keyframe_zimage.json (Z-Image Turbo). */
async function keyframe(body: any, env: Env) {
  const prompt = str(body.prompt, 2000, "prompt");
  const seed = Math.floor(num(body.seed, 0, 2 ** 32, 1));
  const width=dimension(body.width,1536,768,16),height=dimension(body.height,1536,448,16);
  const model = await selectedModel(body, env, "keyframe");
  const c = client(env);
  const graph=await loadGraph('keyframe_zimage');const {rw,rh}=cropOutput(graph,'9','10',width,height,16);
  const wf = c.workflows.fromJson(graph);
  wf.setInput("1", "unet_name", model);
  wf.setInput("5", "text", prompt);
  wf.setInput("8", "seed", seed);
  wf.setInput('7','width',rw);wf.setInput('7','height',rh);
  const t = Date.now();
  const {job} = await timedRun(c,wf,env,model,rw,rh,1);
  return { url: await save(job, "10", "png"), seconds: +((Date.now() - t) / 1000).toFixed(1) };
}

/** shot_ltxv.json has one keyframe guide (node 8); clone image/scale/guide nodes for each extra keyframe. */
function shotGraph(g: Record<string, any>, nKeys: number): Record<string, any> {
  if (!nKeys) {
    delete g['5']; delete g['6']; delete g['8']; delete g['15'];
    Object.assign(g['11'].inputs,{positive:['3',0],negative:['4',0]});
    g['13'].inputs.latent=['7',0];g['14'].inputs.latent_image=['7',0];g['16'].inputs.samples=['14',0];
    return g;
  }
  let prev = "8";
  for (let i = 1; i < nKeys; i++) {
    const n = String(i).padStart(2, "0"), img = `5${n}`, scale = `6${n}`, guide = `8${n}`;
    g[img] = structuredClone(g["5"]);
    g[scale] = structuredClone(g["6"]);
    g[scale].inputs.image = [img, 0];
    g[guide] = structuredClone(g["8"]);
    Object.assign(g[guide].inputs, { positive: [prev, 0], negative: [prev, 1], latent: [prev, 2], image: [scale, 0] });
    prev = guide;
  }
  Object.assign(g["11"].inputs, { positive: [prev, 0], negative: [prev, 1] });
  g["13"].inputs.latent = [prev, 2];
  g["14"].inputs.latent_image = [prev, 2];
  return g;
}

/** Keyframes (images at times) + motion prompt -> video. shared/workflows/shot_ltxv.json (LTX-Video). */
async function shot(body: any, env: Env) {
  if (body.keys === undefined) body.keys = [];
  if (!Array.isArray(body.keys) || body.keys.length > 8) throw new HttpError(400, "keys: 0–8 keyframes");
  const duration = num(body.duration, 1, 8, 4);
  const keys: Key[] = body.keys
    .map((k: any) => ({ image: k.image, t: num(k.t, 0, duration, 0), strength: num(k.strength, 0, 1, 1) }))
    .sort((a: Key, b: Key) => a.t - b.t);
  const paths = keys.map((k) => {
    if (typeof k.image !== "string" || !/^\/outputs\/[a-f0-9]{16}\.png$/.test(k.image)) throw new HttpError(400, "keyframe image must be an API-owned PNG");
    return outputPath(k.image);
  });
  const model = await selectedModel(body, env, "video");
  const length = Math.max(25, Math.min(121, Math.round((duration * FPS) / 8) * 8 + 1)); // LTX wants 8n+1 frames
  const last = length - 1;
  const c = client(env);
  const width = dimension(body.width,1024,768,32);
  const height = dimension(body.height,1024,448,32);
  const graph=shotGraph(await loadGraph('shot_ltxv'),keys.length);const {rw,rh}=cropOutput(graph,'16','17',width,height,32);
  if (rw * rh > 768 * 768) throw new HttpError(400, "shot resolution too large");
  const wf=c.workflows.fromJson(graph);wf.setInput('1','ckpt_name',model);
  wf.setInput("7", "width", rw);
  wf.setInput("7", "height", rh);
  keys.forEach((_, i) => {
    const node = i ? `6${String(i).padStart(2, "0")}` : "6";
    wf.setInput(node, "width", rw);
    wf.setInput(node, "height", rh);
  });
  wf.setInput("3", "text", body.prompt ? str(body.prompt, 2000, "prompt") : "cinematic shot");
  wf.setInput("7", "length", length);
  wf.setInput("14", "noise_seed", Math.floor(num(body.seed, 0, 2 ** 32, 1)));
  keys.forEach((k, i) => {
    const n = i ? String(i).padStart(2, "0") : "";
    const f = Math.round((k.t * FPS) / 8) * 8;
    wf.setInput(i ? `8${n}` : "8", "frame_idx", f >= last - 4 ? -1 : Math.min(f, last - 8)); // snap to latent frames; last key = end
    wf.setInput(i ? `8${n}` : "8", "strength", k.strength);
    wf.setInput(i ? `5${n}` : "5", "image", c.assets.fromFile(paths[i]));
  });
  const t = Date.now();
  const {job} = await timedRun(c,wf,env,model,rw,rh,length);
  return { url: await save(job, "17", "webm"), seconds: +((Date.now() - t) / 1000).toFixed(1), frames: length };
}

async function health(env: Env) {
  const comfyui = await up((env.COMFYUI_URL || "http://127.0.0.1:8188") + "/system_stats");
  if (comfyui) await ensureProxy(env);
  return {
    comfyui,
    proxy: await up((env.COMFY_BASE_URL || "http://127.0.0.1:8189") + "/api/v2/health"),
    queued,
  };
}

/** Browser-normalized PNG only; saved under an opaque API-owned filename. */
async function upload(body: any) {
  if (typeof body.image !== "string" || !body.image.startsWith("data:image/png;base64,")) throw new HttpError(400, "upload must be a PNG data URL");
  const encoded = body.image.slice(22);
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new HttpError(400, "invalid PNG encoding");
  const data = Buffer.from(encoded, "base64");
  if (data.length > 5 * 1024 * 1024) throw new HttpError(413, "PNG exceeds 5 MB");
  if (data.length < 33 || data.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || data.subarray(12, 16).toString() !== "IHDR") throw new HttpError(400, "invalid PNG");
  const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
  if (!width || !height || width > 2048 || height > 2048) throw new HttpError(400, "PNG dimensions must be 1–2048 pixels");
  const name = outputName("png");
  await writeFile(join(OUTPUTS, name), data);
  return { url: `/outputs/${name}`, width, height };
}

/** Local postprocessing only: FFmpeg never receives a client-supplied path or filter. */
async function exportVideo(body: any, env: Env) {
  if (typeof body.video !== "string" || !/^\/outputs\/[a-f0-9]{16}\.webm$/.test(body.video)) throw new HttpError(400, "video must be an API-owned WebM");
  const video = outputPath(body.video);
  let overlay: string | undefined;
  if (body.overlay !== undefined) {
    if (typeof body.overlay !== "string" || !/^\/outputs\/[a-f0-9]{16}\.png$/.test(body.overlay)) throw new HttpError(400, "overlay must be an API-owned PNG");
    overlay = outputPath(body.overlay);
  }
  const name = outputName("mp4"), destination = join(OUTPUTS, name);
  const args = ["-nostdin", "-hide_banner", "-loglevel", "error", "-n", "-i", video];
  if (overlay) args.push("-i", overlay, "-filter_complex", "[0:v][1:v]overlay=0:0:format=auto[v]", "-map", "[v]");
  else args.push("-map", "0:v:0");
  args.push("-an", "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", destination);
  const t = Date.now();
  try {
    await serialize(() => new Promise<void>((ok, fail) => {
      const p = spawn(env.FFMPEG_PATH || "ffmpeg", args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      const timeout = setTimeout(() => { p.kill(); fail(new HttpError(504, "video export timed out")); }, 90_000);
      p.stderr.on("data", (data: Buffer) => { stderr = (stderr + data.toString()).slice(-16000); });
      p.on("error", (error) => {
        clearTimeout(timeout);
        console.error("[api] FFmpeg could not start:", error);
        fail(new HttpError(503, "FFmpeg unavailable: install it and set FFMPEG_PATH, then restart Vite"));
      });
      p.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0) ok();
        else { console.error("[api] FFmpeg export failed:", stderr); fail(new HttpError(500, "video export failed (see server log)")); }
      });
    }));
  } catch (error) {
    await unlink(destination).catch(() => {});
    throw error;
  }
  return { url: `/outputs/${name}`, seconds: +((Date.now() - t) / 1000).toFixed(1) };
}

// ---------------- HTTP plumbing ----------------

/** Original-photo compositing/camera prototypes. Existing generation/export routes are unchanged. */
async function productVideo(body: any, env: Env) {
  if (!body || !['locked', 'camera'].includes(body.mode)) throw new HttpError(400, 'mode must be locked or camera');
  if (typeof body.ratio !== 'string' || !Object.hasOwn(productFormats, body.ratio)) throw new HttpError(400, 'ratio must be 16:9, 9:16 or 1:1');
  const motion = body.motion === undefined ? 'push' : body.motion;
  if (!['push', 'pan-left', 'pan-right'].includes(motion)) throw new HttpError(400, 'unknown camera motion');
  if (typeof body.image !== 'string' || !/^\/outputs\/[a-f0-9]{16}\.png$/.test(body.image)) throw new HttpError(400, 'image must be an API-owned PNG');
  const source = outputPath(body.image);
  const png = await readFile(source);
  if (png.length < 24 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new HttpError(400, 'invalid source PNG');
  const sw = png.readUInt32BE(16), sh = png.readUInt32BE(20);
  if (!sw || !sh || sw > 2048 || sh > 2048) throw new HttpError(400, 'invalid source dimensions');
  const mode = body.mode as ProductMode;
  let background: string | undefined;
  if (mode === 'locked') {
    if (typeof body.background !== 'string' || !/^\/outputs\/[a-f0-9]{16}\.webm$/.test(body.background)) throw new HttpError(400, 'locked mode needs an API-owned WebM background');
    background = outputPath(body.background);
  }
  const duration = num(body.duration, 2, 5, 3);
  const plan = productPlan(mode, body.ratio as ProductRatio, duration, motion as CameraMotion, sw, sh);
  const name = outputName('webm'), destination = join(OUTPUTS, name);
  const args = ['-nostdin', '-hide_banner', '-loglevel', 'error', '-n'];
  if (background) args.push('-i', background);
  args.push('-i', source, '-filter_complex', plan.filter, '-map', '[out]', '-frames:v', String(plan.frames), '-an',
    '-c:v', 'libvpx-vp9', '-lossless', '1', '-pix_fmt', 'yuv420p', '-deadline', 'realtime', '-cpu-used', '6', destination);
  const start = Date.now();
  try { await serialize(() => renderProduct(env.FFMPEG_PATH || 'ffmpeg', args)); }
  catch (error) {
    await unlink(destination).catch(() => {});
    if (error instanceof ProductRenderError) throw new HttpError(error.status, error.message);
    throw error;
  }
  return { url: `/outputs/${name}`, seconds: +((Date.now() - start) / 1000).toFixed(1), frames: plan.frames,
    width: plan.width, height: plan.height, mode, motion: plan.motion, protectedRect: mode === 'locked' ? plan.rect : null };
}
async function editVideo(body:any,env:Env){
  if(typeof body.video!=='string'||!/^\/outputs\/[a-f0-9]{16}\.(webm|mp4)$/.test(body.video))throw new HttpError(400,'Choose an API-owned video');
  const source=outputPath(body.video),start=num(body.start,0,60,0),end=num(body.end,0,60,5),speed=num(body.speed,.25,4,1);
  if(end<=start)throw new HttpError(400,'Trim end must be after start');
  const width=num(body.width,16,4096,768),height=num(body.height,16,4096,448);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width*height>4096*2160)throw new HttpError(400,'Choose whole-pixel dimensions up to 4096×2160 total pixels');
  if(body.reverse!==undefined&&typeof body.reverse!=='boolean')throw new HttpError(400,'reverse must be true or false');
  const name=outputName('webm'),destination=join(OUTPUTS,name),filters=[...(body.reverse?['reverse']:[]),`setpts=(PTS-STARTPTS)/${speed}`,'fps=24',`scale=${width}:${height}:flags=lanczos`, 'setsar=1'];
  const args=['-nostdin','-hide_banner','-loglevel','error','-n','-ss',String(start),'-t',String(end-start),'-i',source,'-map','0:v:0','-an','-vf',filters.join(','),'-c:v','libvpx-vp9','-deadline','good','-cpu-used','4','-crf','25','-b:v','0',destination];
  const t=Date.now();
  try{await serialize(()=>new Promise<void>((ok,fail)=>{const child=spawn(env.FFMPEG_PATH||'ffmpeg',args,{windowsHide:true,stdio:['ignore','ignore','pipe']});let error='';const timeout=setTimeout(()=>{child.kill();fail(new HttpError(504,'Video edit timed out'))},90000);child.stderr.on('data',(chunk:Buffer)=>error=(error+chunk.toString()).slice(-8000));child.on('error',()=>{clearTimeout(timeout);fail(new HttpError(503,'FFmpeg is unavailable'))});child.on('close',code=>{clearTimeout(timeout);if(code===0)ok();else{console.error('[api] edit failed:',error);fail(new HttpError(500,'Video edit failed; source is unchanged'))}})}))}catch(error){await unlink(destination).catch(()=>{});throw error}
  return {url:'/outputs/'+name,seconds:(Date.now()-t)/1000,width,height};
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(res: ServerResponse, status: number, obj: unknown) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(body);
}

function readBody(req: IncomingMessage, limit = MAX_BODY): Promise<any> {
  return new Promise((ok, fail) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > limit) { fail(new HttpError(413, "request too large")); req.removeAllListeners("data"); req.resume(); }
      else chunks.push(c);
    });
    req.on("end", () => { try { ok(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); } catch { fail(new HttpError(400, "invalid JSON")); } });
    req.on("error", fail);
  });
}

const isLocalHost = (host = "") => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host);
const cookie = (req: IncomingMessage, name: string) => (req.headers.cookie || "").split(/;\s*/).find((c) => c.startsWith(name + "="))?.slice(name.length + 1);
function sameToken(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function middleware(env: Env): Connect.NextHandleFunction {
  const token = env.OSH_TOKEN || "";
  return async (req, res, next) => {
    const url = new URL(req.url || "/", "http://x");
    // ?token=… on any page: set the access cookie, then strip the token from the URL.
    if (token && url.searchParams.has("token")) {
      if (sameToken(url.searchParams.get("token") || undefined, token)) {
        url.searchParams.delete("token");
        res.writeHead(302, {
          "Set-Cookie": `osh_token=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${60 * 60 * 24 * 14}`,
          Location: url.pathname + url.search,
        });
        return res.end();
      }
      return send(res, 403, { error: "bad token" });
    }
    const isApi = url.pathname.startsWith("/api/"), isOut = url.pathname.startsWith("/outputs/");
    if (!isApi && !isOut) return next();
    // Access: localhost always; anything else needs the token cookie (or Authorization: Bearer).
    const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "") || undefined;
    if (!isLocalHost(req.headers.host) && !(token && (sameToken(cookie(req, "osh_token"), token) || sameToken(bearer, token)))) {
      return send(res, 401, { error: token ? "locked: open the site with ?token=…" : "generation is only available on localhost" });
    }
    try {
      if (isOut) {
        const name = url.pathname.slice("/outputs/".length);
        if (req.method !== "GET" || !OUTPUT_NAME.test(name)) return send(res, 404, { error: "not found" });
        const p = join(OUTPUTS, name);
        if (!existsSync(p)) return send(res, 404, { error: "not found" });
        res.writeHead(200, { "Content-Type": name.endsWith(".png") ? "image/png" : name.endsWith(".mp4") ? "video/mp4" : "video/webm", "Content-Length": statSync(p).size, "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" });
        return createReadStream(p).pipe(res);
      }
      const route = `${req.method} ${url.pathname}`;
      if (route === "GET /api/health") return send(res, 200, await health(env));
      if (route === "GET /api/models") return send(res, 200, await localModels(env));
      if (route === "POST /api/upload") return send(res, 200, await upload(await readBody(req, MAX_UPLOAD_BODY)));
      if (route === "POST /api/export") return send(res, 200, await exportVideo(await readBody(req), env));
      if (route === "POST /api/product-video") return send(res, 200, await productVideo(await readBody(req), env));
      if (route === 'POST /api/edit-video') return send(res,200,await editVideo(await readBody(req),env));
      if (route === "POST /api/keyframe") return send(res, 200, await keyframe(await readBody(req), env));
      if (route === "POST /api/shot") return send(res, 200, await shot(await readBody(req), env));
      return send(res, 404, { error: "unknown endpoint" });
    } catch (e: any) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(`[api] ${url.pathname} failed:`, e);
      send(res, status, { error: status === 500 ? "generation failed (see server log)" : e.message });
    }
  };
}

/** Vite plugin: mounts /api + /outputs on the dev and preview servers. */
export function comfyApi(env: Env): Plugin {
  return {
    name: "osh-comfy-api",
    async configureServer(server) {
      server.middlewares.use(middleware(env));
      if (!(await up((env.COMFYUI_URL || "http://127.0.0.1:8188") + "/system_stats"))) console.warn("[api] ComfyUI not reachable; pages work, generation won't.");
      else await ensureProxy(env);
    },
    async configurePreviewServer(server) {
      server.middlewares.use(middleware(env));
      await ensureProxy(env);
    },
  };
}
