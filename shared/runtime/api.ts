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
import { RuntimeSetup, setupAccess } from './setup.ts';
import {PromptRewriter,PromptRewriteError,promptInstruction,promptModel,promptDevice} from './prompt-rewriter.ts';
import {precisionSources} from './precision-image.ts';
import {captionSegments} from '../lib/captions.ts';
import { JobActivity, phaseForProgress } from './job-activity.ts';
import {ComfyDiagnostics,loadingLog,nodeProgressMessage} from './comfy-diagnostics.ts';
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
import {importMedia,composeAd,ComposeError,mediaTypes} from './ad-compose.ts';
import {analysisStatus,researchBrand,collectBrandImage} from './brand-research.ts';
import {BrandError} from './brand-web.ts';
import {exportStaticAd,StaticAdError} from './static-ad.ts';
import {finishHero,exportHeroAd,heroSource,heroSha,HeroError} from './hero-ad.ts';
import {validateHeroSettings} from '../lib/hero-ad.ts';
import {generateQwenHero,qwenAvailability,verifyWeightFiles,qwenContract} from './qwen-hero.ts';
import {qwenSDKTransport} from './qwen-sdk.ts';
import {createQwenRelay} from './qwen-relay.ts';
import {acceptanceGate,acceptanceRequest,claimAcceptanceJob} from './qwen-app-session.ts';
import {createCreativeEngine,creativeTextStatus,creativeSDKText,CreativeError,type CreativeBackend} from './creative-engine.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WORKFLOWS = join(ROOT, "shared", "workflows");
const OUTPUTS = join(ROOT, "outputs");
const FPS = 24;
const MAX_BODY = 64 * 1024;
const MAX_UPLOAD_BODY = 8 * 1024 * 1024;
const MAX_QUEUE = 4;
const OUTPUT_NAME = /^[a-f0-9]{16}\.(png|webm|mp4|flac|mp3|wav|m4a|ogg)$/;

type Env = Record<string, string | undefined>;
type Key = { image: string; t: number; strength?: number };

// ---------------- ComfyUI side ----------------

let comfy: Comfy | null = null;
const activity=new JobActivity();
const diagnostics=new ComfyDiagnostics(),clientUrls=new WeakMap<Comfy,string>();
function client(env: Env): Comfy {
  process.env.COMFY_BASE_URL = env.COMFY_BASE_URL || "http://127.0.0.1:8189"; // read by the SDK
  const value=(comfy ??= new Comfy());clientUrls.set(value,env.COMFYUI_URL||'http://127.0.0.1:8188');return value;
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
const proxyStarts=new Map<string,Promise<void>>();
async function ensureProxy(env:Env):Promise<void>{
 const key=(env.COMFY_BASE_URL||'http://127.0.0.1:8189')+'|'+(env.COMFYUI_URL||'http://127.0.0.1:8188');
 const pending=proxyStarts.get(key);if(pending)return pending;
 const work=startProxyProcess(env);proxyStarts.set(key,work);try{await work}finally{proxyStarts.delete(key)}
}
async function startProxyProcess(env: Env): Promise<void> {
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

async function save(job: Awaited<ReturnType<Comfy["run"]>>, node: string, ext: "png" | "webm" | "flac"): Promise<string> {
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
async function runWf(c: Comfy, wf: Parameters<Comfy['run']>[0], requestId?:string) {
 async function execute(){
  activity.update(requestId,'preparing','Preparing model and prompt. First-time loading can take a few minutes; no generation steps yet.');
  const stopDiagnostics=requestId?await diagnostics.watch(clientUrls.get(c)||'http://127.0.0.1:8188',entry=>activity.note(requestId,entry)):()=>{};
  try{
  const job=await c.submit(wf),controller=new AbortController();
  const stream=(async()=>{try{for await(const event of job.events(controller.signal)){
   if(event.kind==='progress'){const node=event.currentNode?(wf.json[event.currentNode] as any):undefined;const phase=phaseForProgress({...event,currentNodeClass:event.currentNodeClass||node?.class_type});const detail=nodeProgressMessage(node);activity.update(requestId,phase,phase==='generating'?`Generating${event.step!=null&&event.steps?' · step '+event.step+'/'+event.steps:''}`:phase==='encoding'?'Encoding and saving your media.':detail|| (phase==='running'?'ComfyUI is running. Waiting for its next progress update.':'Preparing model and prompt.'),{percent:phase!=='running'&&Number.isFinite(event.value)?Math.max(0,Math.min(100,event.value*100)):null,step:event.step,steps:event.steps})}
   else if(event.kind==='statusChange'&&event.status==='queued')activity.update(requestId,'queued','Waiting for the local generation worker.');
   else if(event.kind==='log'){const message=loadingLog(event.message);if(message){activity.note(requestId,{at:Date.now(),source:'sdk',message});if(/downloading/i.test(message))activity.update(requestId,'downloading',message);else if(/requested to load|loading (?:model|weights|checkpoint|text encoder)/i.test(message))activity.update(requestId,'preparing',message)}}
  }}catch{/* Completion polling remains authoritative if live progress is unavailable. */}})();
  try{await job.wait(30*60*1000);await job.result();return job}finally{controller.abort();void stream}
  }finally{stopDiagnostics()}
 }
 try{return await execute()}catch(error:any){if(error?.code==='job_failed'&&/expired/i.test(String(error.message)))return execute();throw error}
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
  const audio=has('CheckpointLoaderSimple','ckpt_name','stable-audio-open-1.0.safetensors')&&has('CLIPLoader','clip_name','t5_base.safetensors')&&graphReady(await loadGraph('audio_stable'));
  return { keyframe, video, audio:{available:audio,model:'Stable Audio Open 1.0'}, research, timing: await serverTiming(OUTPUTS,hardware,queued), inventory: inventory.filter(c => c.files.length > 0) };
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
async function timedRun(c: Comfy, wf: Parameters<Comfy['run']>[0], env: Env, model: string, width: number, height: number, frames: number, requestId?:string) {
  const hardware=identifyHardware(await comfyJson(env,'/system_stats').catch(()=>null));
  let executionSeconds=0;
  const job=await serialize(async()=>{const start=Date.now();const result=await runWf(c,wf,requestId);const ms=result.metrics?.execution_ms;executionSeconds=typeof ms==='number'?ms/1000:(Date.now()-start)/1000;
    const history=await comfyJson(env,'/history/'+encodeURIComponent(result.id)).catch(()=>null);
    const messages=history?.[result.id]?.status?.messages;
    const cached=Array.isArray(messages)&&messages.some(([event,data]:[string,any])=>event==='execution_cached'&&data.nodes?.includes(frames===1?'8':'14'));
    if(!cached&&history)await recordRender(OUTPUTS,hardware,{model,width,height,frames,seconds:executionSeconds,jobId:result.id});return result});
  return {job,executionSeconds};
}

/** Prompt -> image. shared/workflows/keyframe_zimage.json (Z-Image Turbo). */
async function keyframe(body: any, env: Env) {
  const textDevice=promptDevice(body.textDevice);
  const prompt = str(body.prompt, 2000, "prompt");
  const seed = Math.floor(num(body.seed, 0, 2 ** 32, 1));
  const width=dimension(body.width,1536,768,16),height=dimension(body.height,1536,448,16);
  const model = await selectedModel(body, env, "keyframe");
  const c = client(env);
  const graph=await loadGraph('keyframe_zimage');const {rw,rh}=cropOutput(graph,'9','10',width,height,16);
  const wf = c.workflows.fromJson(graph);
  wf.setInput("1", "unet_name", model);
  wf.setInput("2", "device", textDevice);
  wf.setInput("5", "text", prompt);
  wf.setInput("8", "seed", seed);
  wf.setInput('7','width',rw);wf.setInput('7','height',rh);
  const t = Date.now();
  const {job} = await timedRun(c,wf,env,model,rw,rh,1,body._requestId);
  return { url: await save(job, "10", "png"), seconds: +((Date.now() - t) / 1000).toFixed(1) };
}

/** Isolated experimental img2img. Production keyframes/video graphs are untouched. */
async function reimagineHero(body:any,env:Env){
 let settings;try{settings=validateHeroSettings(body?.settings)}catch(e){throw new HttpError(400,(e as Error).message)}
 if(settings.imageModel==='qwen-fp8')throw new HttpError(400,'Qwen requires /api/hero/qwen. No Z-Image fallback was started.');
 if(settings.method!=='reimagine'||!settings.prompt.trim())throw new HttpError(400,'Choose reimagine and provide a product-specific prompt.');
 const source=await heroSource(OUTPUTS,body.image),catalog=await localModels(env),nodes=await comfyJson(env,'/object_info');
 const graph=await loadGraph('hero_zimage_experimental');
 if(!catalog.keyframe.length||!Object.values(graph).every(n=>nodes[n.class_type]))throw new HttpError(503,'Reference-conditioned image generation is unavailable: install a compatible Z-Image model pack yourself. No model download or fallback was started.');
 const model=await selectedModel(body,env,'keyframe'),c=client(env);graph['1'].inputs.unet_name=model;graph['5'].inputs.text=settings.prompt;graph['8'].inputs.seed=settings.seed;graph['8'].inputs.denoise=settings.strength;
 const workflowSha256=heroSha(JSON.stringify(graph)),wf=c.workflows.fromJson(graph);wf.setInput('11','image',c.assets.fromFile(source.path));const started=Date.now();
 const {job}=await timedRun(c,wf,env,model,768,960,1,body._requestId),url=await save(job,'10','png');
 return {url,width:768,height:960,sha256:heroSha(await readFile(outputPath(url))),sourceSha256:source.sha256,workflowSha256,seconds:(Date.now()-started)/1000,method:'Experimental Z-Image latent img2img',model,prompt:settings.prompt,seed:settings.seed,strength:settings.strength,warning:'Unvalidated for commercial product fidelity. Compare structure, ingredients and texture against the original before use.'};
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
  const textDevice=promptDevice(body.textDevice);
  if (body.keys === undefined) body.keys = [];
  if (!Array.isArray(body.keys) || body.keys.length > 8) throw new HttpError(400, "keys: 0–8 keyframes");
  const fps=num(body.fps,1,120,FPS);
  const length=body.frames===undefined?Math.max(25,Math.min(121,Math.round(num(body.duration,1,8,4)*fps/8)*8+1)):num(body.frames,9,121,97);
  if(!Number.isInteger(length)||(length-1)%8!==0)throw new HttpError(400,'frames must be 8n+1 (9, 17, 25…121)');
  const duration = body.frames===undefined?num(body.duration,1,8,4):length/fps;
  const keys: Key[] = body.keys
    .map((k: any) => ({ image: k.image, t: num(k.t, 0, duration, 0), strength: num(k.strength, 0, 1, 1) }))
    .sort((a: Key, b: Key) => a.t - b.t);
  const paths = keys.map((k) => {
    if (typeof k.image !== "string" || !/^\/outputs\/[a-f0-9]{16}\.png$/.test(k.image)) throw new HttpError(400, "keyframe image must be an API-owned PNG");
    return outputPath(k.image);
  });
  const model = await selectedModel(body, env, "video");
  const last = length - 1;
  const c = client(env);
  const width = dimension(body.width,1024,768,32);
  const height = dimension(body.height,1024,448,32);
  const graph=shotGraph(await loadGraph('shot_ltxv'),keys.length);const {rw,rh}=cropOutput(graph,'16','17',width,height,32);
  if (rw * rh > 768 * 768) throw new HttpError(400, "shot resolution too large");
  const wf=c.workflows.fromJson(graph);wf.setInput('1','ckpt_name',model);wf.setInput('2','device',textDevice);
  wf.setInput("7", "width", rw);
  wf.setInput("7", "height", rh);
  keys.forEach((_, i) => {
    const node = i ? `6${String(i).padStart(2, "0")}` : "6";
    wf.setInput(node, "width", rw);
    wf.setInput(node, "height", rh);
  });
  wf.setInput("3", "text", body.prompt ? str(body.prompt, 2000, "prompt") : "cinematic shot");
  wf.setInput("7", "length", length);
  wf.setInput('11','frame_rate',fps);
  wf.setInput('17','fps',fps);
  wf.setInput("14", "noise_seed", Math.floor(num(body.seed, 0, 2 ** 32, 1)));
  keys.forEach((k, i) => {
    const n = i ? String(i).padStart(2, "0") : "";
    const f = Math.round((k.t * fps) / 8) * 8;
    wf.setInput(i ? `8${n}` : "8", "frame_idx", f >= last - 4 ? -1 : Math.min(f, last - 8)); // snap to latent frames; last key = end
    wf.setInput(i ? `8${n}` : "8", "strength", k.strength);
    wf.setInput(i ? `5${n}` : "5", "image", c.assets.fromFile(paths[i]));
  });
  const t = Date.now();
  const {job} = await timedRun(c,wf,env,model,rw,rh,length,body._requestId);
  return { url: await save(job, "17", "webm"), seconds: +((Date.now() - t) / 1000).toFixed(1), frames: length, fps, duration:length/fps };
}

async function health(env: Env, runtimeBusy=false) {
  const comfyui = await up((env.COMFYUI_URL || "http://127.0.0.1:8188") + "/system_stats");
  if (comfyui&&!runtimeBusy) await ensureProxy(env);
  return {
    comfyui,
    proxy: await up((env.COMFY_BASE_URL || "http://127.0.0.1:8189") + "/api/v2/health"),
    queued,
  };
}

// Local postprocessing readiness must not depend on ComfyUI or model availability.
let ffmpegCheck:Promise<boolean>|null=null,ffmpegCheckedAt=0;
async function capabilities(env:Env){
  if(!ffmpegCheck||Date.now()-ffmpegCheckedAt>30000){ffmpegCheckedAt=Date.now();ffmpegCheck=new Promise<boolean>(ok=>{
    const child=spawn(env.FFMPEG_PATH||'ffmpeg',['-version'],{windowsHide:true,stdio:'ignore'});
    const timer=setTimeout(()=>{child.kill();ok(false)},3000);
    child.on('error',()=>{clearTimeout(timer);ok(false)});child.on('close',code=>{clearTimeout(timer);ok(code===0)});
  });}
  return {upload:true,shot:true,keyframe:true,audio:true,productVideo:true,editVideo:true,exportVideo:true,ffmpeg:{available:await ffmpegCheck}};
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
  args.push('-map','0:a?','-c:a','aac', "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", destination);
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

async function generateAudio(body:any,env:Env){
  const prompt=str(body.prompt,1500,'audio prompt'),duration=num(body.duration,.1,47,4),seed=Math.floor(num(body.seed,0,2**32,1));
  let source:string|undefined;
  if(body.video!==undefined){if(typeof body.video!=='string'||!/^\/outputs\/[a-f0-9]{16}\.(webm|mp4)$/.test(body.video))throw new HttpError(400,'Choose an API-owned video');source=outputPath(body.video)}
  if(!(await localModels(env)).audio.available)throw new HttpError(400,'Install Stable Audio Open 1.0 and T5-base, then refresh local models');
  await ensureProxy(env);const c=client(env),wf=c.workflows.fromJson(await loadGraph('audio_stable'));
  wf.setInput('3','text',prompt);wf.setInput('5','seconds_total',Math.max(1,duration));wf.setInput('6','seconds',Math.max(1,duration));wf.setInput('7','seed',seed);
  const t=Date.now(),job=await serialize(async()=>{const started=Date.now(),result=await runWf(c,wf,body._requestId),hardware=identifyHardware(await comfyJson(env,'/system_stats').catch(()=>null));await recordRender(OUTPUTS,hardware,{model:'stable-audio-open-1.0.safetensors',width:1,height:1,frames:Math.round(Math.max(1,duration)*44100),seconds:(Date.now()-started)/1000,jobId:result.id});return result}),audio=await save(job,'9','flac');
  let video:string|undefined;
  if(source){const name=outputName('webm'),destination=join(OUTPUTS,name),videoCodec=source.endsWith('.webm')?['-c:v','copy']:['-c:v','libvpx-vp9','-deadline','good','-cpu-used','4','-crf','25','-b:v','0'],args=['-nostdin','-hide_banner','-loglevel','error','-n','-i',source,'-i',outputPath(audio),'-map','0:v:0','-map','1:a:0',...videoCodec,'-c:a','libopus','-af','apad','-t',String(duration),destination];
    try{await serialize(()=>new Promise<void>((ok,fail)=>{const child=spawn(env.FFMPEG_PATH||'ffmpeg',args,{windowsHide:true,stdio:['ignore','ignore','pipe']});let error='';const timer=setTimeout(()=>{child.kill();fail(new HttpError(504,'Audio mux timed out'))},90000);child.stderr.on('data',(b:Buffer)=>error=(error+b.toString()).slice(-4000));child.on('error',()=>{clearTimeout(timer);fail(new HttpError(503,'FFmpeg unavailable'))});child.on('close',code=>{clearTimeout(timer);if(code===0)ok();else{console.error('[api] audio mux:',error);fail(new HttpError(500,'Could not combine audio and video; originals kept'))}})}));video='/outputs/'+name}catch(e){await unlink(destination).catch(()=>{});throw e}
  }
  return{audio,video,duration,seconds:(Date.now()-t)/1000};
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
  const audioFilters=[...(body.reverse?['areverse']:[]),'asetpts=PTS-STARTPTS',`atempo=${Math.sqrt(speed)}`,`atempo=${Math.sqrt(speed)}`];
  if(body.keepAudio!==undefined&&typeof body.keepAudio!=='boolean')throw new HttpError(400,'keepAudio must be true or false');
  const audioArgs=body.keepAudio===false?['-an']:['-map','0:a?','-af',audioFilters.join(','),'-c:a','libopus'];
  const args=['-nostdin','-hide_banner','-loglevel','error','-n','-ss',String(start),'-t',String(end-start),'-i',source,'-map','0:v:0',...audioArgs,'-vf',filters.join(','),'-c:v','libvpx-vp9','-deadline','good','-cpu-used','4','-crf','25','-b:v','0',destination];
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

function requirePathSeparator(){return process.platform==='win32'?'\\':'/';}

function middleware(env: Env,setup:RuntimeSetup,rewriter:PromptRewriter,creative:ReturnType<typeof createCreativeEngine>): Connect.NextHandleFunction {
  const token = env.OSH_TOKEN || "";
  const session=env.QWEN_APP_SESSION_DIR?resolve(env.QWEN_APP_SESSION_DIR):'';
  if(env.QWEN_APP_RELAY_URL&&(!session.startsWith(OUTPUTS+requirePathSeparator())||!session.endsWith(requirePathSeparator()+'session')))throw new Error('Qwen acceptance session must be an outputs/.../session folder.');
  const gateFiles=(folder:string)=>({approval:join(folder,'acceptance.json'),lease:join(folder,'lease.json'),watchdog:join(folder,'pod-watchdog-ready.json'),receipt:join(folder,'one-job.json')});
  const relay=env.QWEN_APP_RELAY_URL?createQwenRelay(OUTPUTS,env.QWEN_APP_RELAY_URL,gateFiles(session)):null;
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
        if (!['GET','HEAD'].includes(req.method||'') || !OUTPUT_NAME.test(name)) return send(res, 404, { error: "not found" });
        const p = join(OUTPUTS, name);
        if (!existsSync(p)) return send(res, 404, { error: "not found" });
        const size=statSync(p).size,headers:Record<string,string|number>={"Content-Type":name.endsWith('.png')?'image/png':mediaTypes[name.split('.').at(-1)!]||'video/webm',"Accept-Ranges":"bytes","Cache-Control":"private, max-age=31536000, immutable","X-Content-Type-Options":"nosniff"};
        const range=req.headers.range;
        if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);let start=Number(match?.[1]||0),end=match?.[2]?Number(match[2]):size-1;if(match&&!match[1]&&match[2]){start=Math.max(0,size-Number(match[2]));end=size-1;}
          if(!match||(!match[1]&&!match[2])||start>end||start>=size||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
          end=Math.min(end,size-1);res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});if(req.method==='HEAD')return res.end();return createReadStream(p,{start,end}).pipe(res);
        }
        res.writeHead(200,{...headers,'Content-Length':size});if(req.method==='HEAD')return res.end();return createReadStream(p).pipe(res);
      }
      const route = `${req.method} ${url.pathname}`;
      if(route==='GET /api/creative/status')return send(res,200,await creative.status());
      if(req.method==='GET'&&/^\/api\/creative\/plan\/[a-f0-9]{16}$/.test(url.pathname))return send(res,200,await creative.get(url.pathname.split('/').pop()!,url.searchParams.get('projectId')||''));
      if(route==='POST /api/creative/plan')return send(res,200,await creative.plan(await readBody(req,256*1024)));
      if(route==='POST /api/creative/prepare')return send(res,200,await creative.prepare(await readBody(req,20*1024*1024)));
      if(route==='POST /api/creative/compose')return send(res,200,await creative.compose(await readBody(req)));
      if(req.method==='GET'&&/^\/api\/hero\/qwen\/provenance\/[a-f0-9]{16}$/.test(url.pathname)){
       const path=join(OUTPUTS,'hero-qwen',url.pathname.split('/').pop()!,'provenance.json');if(!existsSync(path))return send(res,404,{error:'No saved Qwen provenance'});if(statSync(path).size>512*1024)throw new HttpError(413,'Qwen provenance too large');return send(res,200,JSON.parse(await readFile(path,'utf8')));
      }
      if(route==='GET /api/hero/capabilities'){
       const nodes=await comfyJson(env,'/object_info').catch(()=>({}));let reimagine=false;try{const models=await localModels(env),graph=await loadGraph('hero_zimage_experimental');reimagine=models.keyframe.length>0&&Object.values(graph).every(n=>nodes[n.class_type]);}catch{}
       return send(res,200,{finish:true,reimagine,experimental:true,qwen:relay?await relay.capability('http://'+req.headers.host):await qwenAvailability(nodes,setup.config?.modelsDir||env.COMFYUI_MODELS_DIR)});
      }
      if(route==='POST /api/hero/finish')return send(res,200,await finishHero(await readBody(req),OUTPUTS,env));
      if(route==='POST /api/hero/export')return send(res,200,await exportHeroAd(await readBody(req),OUTPUTS));
      if(route==='GET /api/hero/demo'){const file=join(OUTPUTS,'benchmark-ad-v1','demo.json');if(!existsSync(file))return send(res,404,{error:'No private benchmark example prepared.'});if(statSync(file).size>45*1024*1024)throw new HttpError(400,'Example too large');return send(res,200,JSON.parse(await readFile(file,'utf8')));}
      if(route==='POST /api/static-ad')return send(res,200,await exportStaticAd(await readBody(req),OUTPUTS));
      if(route==='GET /api/static-ad-demo'){
        const file=join(OUTPUTS,'static-ads-demo','demo.json');if(!existsSync(file))return send(res,404,{error:'No local static-ad example has been prepared.'});
        if(statSync(file).size>32*1024*1024)throw new HttpError(400,'Local static example is too large');return send(res,200,JSON.parse(await readFile(file,'utf8')));
      }
      if(url.pathname.startsWith('/api/setup')){
       if(!setupAccess(req))return send(res,403,{error:'Runtime setup is only available from this computer and the app’s own origin.'});
       if(route==='GET /api/setup')return send(res,200,{...await setup.status(),rendering:queued>0});
       if(req.method==='POST'){if(queued>0&&route!=='POST /api/setup/cancel')return send(res,409,{error:'Finish the current generation before changing the local runtime or model files.'});const body=await readBody(req);try{const result=route==='POST /api/setup/connect'?setup.connect(body):route==='POST /api/setup/install'?setup.install(body):route==='POST /api/setup/download'?setup.download(body):route==='POST /api/setup/start'?setup.start():route==='POST /api/setup/cancel'?setup.cancel():null;return send(res,result?202:404,result||{error:'Unknown setup action'})}catch(error:any){return send(res,400,{error:error.message})}}
      }
      if(req.method==='GET'&&/^\/api\/activity\/[a-f0-9]{32}$/.test(url.pathname)){const state=activity.get(url.pathname.split('/').pop()!);return send(res,state?200:404,state?{...state,serverNow:Date.now()}:{error:'No activity for this request'})}
      const tracked=async(handler:(body:any)=>Promise<any>,limit=MAX_BODY)=>{if(setup.task.busy)throw new HttpError(503,'Local runtime setup is in progress. Finish or stop setup before generating.');const body=await readBody(req,limit);if(!body||typeof body!=='object'||Array.isArray(body))throw new HttpError(400,'Expected a JSON request object.');body._requestId=req.headers['x-osh-request']||body._requestId;let id:string|null;try{id=activity.begin(body._requestId)}catch(error:any){throw new HttpError(400,error.message)}try{const result=await handler(body);activity.update(id,'complete','Media ready.');return result}catch(error:any){activity.update(id,'error','Generation stopped: '+String(error.message||error));throw error}};
      if (route === "GET /api/health") return send(res, 200, await health(env,setup.task.busy));
      if(route==='GET /api/prompt-rewriter')return send(res,200,await rewriter.status());
      if(route==='POST /api/prompt-rewriter'){const body=await readBody(req);return send(res,200,await rewriter.rewrite(body.prompt,body.details,body.device));}
      if(route==='GET /api/brand/status')return send(res,200,await analysisStatus(env));
      if(route==='POST /api/brand/research')return send(res,200,await researchBrand(await readBody(req),env));
      if(route==='POST /api/brand/image')return send(res,200,await collectBrandImage(await readBody(req)));
      if(route==='GET /api/brand/demo'){
        const file=join(OUTPUTS,'brand-demo','demo.json');if(!existsSync(file))return send(res,404,{error:'No private local brand demo has been prepared.'});
        if(statSync(file).size>25*1024*1024)throw new HttpError(400,'Local demo is too large');return send(res,200,JSON.parse(await readFile(file,'utf8')));
      }
      if(route==='GET /api/ad-composer-demo'){
        const file=join(OUTPUTS,'composer-demo','project.json');if(!existsSync(file))return send(res,404,{error:'No local cookie example has been built.'});
        if(statSync(file).size>512*1024)throw new HttpError(400,'Local example is too large');return send(res,200,JSON.parse(await readFile(file,'utf8')));
      }
      if(route==='POST /api/media')return send(res,200,await importMedia(req,OUTPUTS,env));
      if(route==='POST /api/compose-ad')return send(res,200,await composeAd(await readBody(req),OUTPUTS,env));
      if (route === 'GET /api/capabilities') return send(res,200,await capabilities(env));
      if (route === "GET /api/models") return send(res, 200, await localModels(env));
      if (route === 'GET /api/captions') {
        const nodes=await comfyJson(env,'/object_info');
        return send(res,200,{available:!!nodes.LoadAudio&&!!nodes.OSHWhisperCaptions?.input?.required?.model?.[0]?.includes('Whisper Tiny · CPU'),model:'Whisper Tiny · CPU',setup:'Run shared/runtime/setup-captions.py with ComfyUI Python, then restart ComfyUI.'});
      }
      if (route === 'POST /api/captions') return send(res,200,await tracked(async body=>{
        if(typeof body.audio!=='string'||!/^\/outputs\/[a-f0-9]{16}\.(flac|wav|mp3|m4a|ogg|webm|mp4)$/.test(body.audio))throw new HttpError(400,'Select an audio or video file from this project.');
        const source=outputPath(body.audio);if(statSync(source).size>32*1024*1024)throw new HttpError(400,'Select audio under 32 MB and 10 minutes.');
        const nodes=await comfyJson(env,'/object_info');if(!nodes.OSHWhisperCaptions?.input?.required?.model?.[0]?.includes('Whisper Tiny · CPU'))throw new HttpError(503,'Local captions need setup. Install the Studio caption node and Whisper Tiny, then restart ComfyUI.');
        await ensureProxy(env);const c=client(env),wf=c.workflows.fromJson(await loadGraph('captions_whisper'));
        wf.setInput('1','audio',c.assets.fromFile(source));const started=Date.now(),job=await serialize(()=>runWf(c,wf,body._requestId)),output=job.getOutputs('2')[0];
        if(!output)throw new HttpError(502,'The caption workflow returned no transcript.');
        const result=JSON.parse(Buffer.from(await output.toBytes()).toString('utf8'));
        return {model:'Whisper Tiny · CPU',language:typeof result.language==='string'?result.language:null,duration:result.duration,seconds:(Date.now()-started)/1000,segments:captionSegments(result.segments)};
      }));
      if (route === 'GET /api/precision-image') {
        const catalog = await localModels(env), nodes = await comfyJson(env, '/object_info'), graph = await loadGraph('precision_zimage');
        return send(res, 200, {
          available: catalog.keyframe.length > 0 && Object.values(graph).every(n => nodes[n.class_type]),
          automaticSubjectSelection: false,
          model: 'Z-Image Turbo · masked resynthesis',
          note: 'Experimental masked resynthesis, not an instruction-edit checkpoint. Outside the mask is composited from the original.',
        });
      }
      if (route === 'POST /api/precision-image') return send(res, 200, await tracked(async body => {
        let sources;
        try { sources = await precisionSources(OUTPUTS, body); }
        catch (error: any) { throw new HttpError(error.status || 400, error.message); }
        const catalog = await localModels(env);
        if (!catalog.keyframe.length) throw new HttpError(503, 'The installed image model is unavailable.');
        const c = client(env), wf = c.workflows.fromJson(await loadGraph('precision_zimage'));
        wf.setInput('11', 'image', c.assets.fromFile(sources.image.path));
        wf.setInput('12', 'image', c.assets.fromFile(sources.mask.path));
        wf.setInput('5', 'text', body.prompt);
        wf.setInput('8', 'seed', Math.floor(num(body.seed, 0, 2 ** 32, 1)));
        const start = Date.now(), job = await serialize(() => runWf(c, wf, body._requestId));
        return { url: await save(job, '10', 'png'), seconds: (Date.now() - start) / 1000, width: sources.image.width, height: sources.image.height };
      }));
      if (route === "POST /api/upload") return send(res, 200, await upload(await readBody(req, MAX_UPLOAD_BODY)));
      if (route === "POST /api/export") return send(res, 200, await exportVideo(await readBody(req), env));
      if (route === "POST /api/product-video") return send(res, 200, await productVideo(await readBody(req), env));
      if (route === 'POST /api/audio') return send(res,200,await tracked(body=>generateAudio(body,env)));
      if (route === 'POST /api/edit-video') return send(res,200,await editVideo(await readBody(req),env));
      if(route==='POST /api/hero/qwen'&&relay)return send(res,200,await tracked(body=>relay.generate(body,String(req.headers.origin||'http://'+req.headers.host),(phase,message,more)=>activity.update(body._requestId,phase,message,more)),20*1024*1024));
      if(route==='POST /api/hero/qwen')return send(res,200,await tracked(body=>serialize(async()=>{
       const modelsDir=setup.config?.modelsDir||env.COMFYUI_MODELS_DIR;
       return generateQwenHero(body,OUTPUTS,{
        check:async()=>qwenAvailability(await comfyJson(env,'/object_info'),modelsDir),
        weights:async()=>{if(!modelsDir)throw new HeroError(503,'Configure the connected ComfyUI models folder before Qwen generation.');return verifyWeightFiles(modelsDir,(await qwenContract()).files);},
        execute:async(graph,reference,output,progress)=>{
         if(env.QWEN_APP_REMOTE_SESSION){const files={approval:env.QWEN_APP_REMOTE_SESSION,lease:'/workspace/qwen-lease.json',watchdog:'/workspace/qwen-watchdog.json',receipt:join(OUTPUTS,'qwen-app-one-job.json')},gate=await acceptanceGate(files);acceptanceRequest(gate.plan,body);await claimAcceptanceJob(files,{podId:gate.lease.podId,requestId:body._requestId});}
         return qwenSDKTransport(client(env),()=>ensureProxy(env))(graph,reference,output,progress);
        },
        progress:(phase,message,more)=>activity.update(body._requestId,phase,message,more)
       });
      }),20*1024*1024));
      if(route==='POST /api/hero/reimagine')return send(res,200,await tracked(body=>reimagineHero(body,env)));
      if (route === "POST /api/keyframe") return send(res, 200, await tracked(body=>keyframe(body, env)));
      if (route === "POST /api/shot") return send(res, 200, await tracked(body=>shot(body, env)));
      return send(res, 404, { error: "unknown endpoint" });
    } catch (e: any) {
      const status = e instanceof HttpError || e instanceof ComposeError || e instanceof BrandError || e instanceof StaticAdError || e instanceof HeroError || e instanceof PromptRewriteError || e instanceof CreativeError ? e.status : 500;
      if (status === 500) console.error(`[api] ${url.pathname} failed:`, e);
      send(res, status, { error: status === 500 ? "generation failed (see server log)" : e.message });
    }
  };
}

/** Vite plugin: mounts /api + /outputs on the dev and preview servers. */
export function comfyApi(env: Env): Plugin {
  const setup=new RuntimeSetup(ROOT,env,ensureProxy,()=>{comfy=null},(url,text)=>diagnostics.capture(url,text));
  const rewriter=new PromptRewriter({
   status:async()=>{try{const nodes=await comfyJson(env,'/object_info');const available=!!nodes.TextGenerate?.input?.optional?.system_prompt&&!!nodes.SaveText&&nodes.CLIPLoader?.input?.required?.clip_name?.[0]?.includes(promptModel);return {available,cpuSupported:false,id:promptModel,model:'Qwen3 4B · ComfyUI',reason:available?'Uses installed Qwen3 through ComfyUI. GPU/offload is managed by ComfyUI unless CPU is selected.':'Prompt polishing needs current ComfyUI TextGenerate/SaveText nodes and the Qwen3 4B text encoder from the image model pack.'}}catch{return {available:false,id:promptModel,model:'Qwen3 4B · ComfyUI',reason:'Connect ComfyUI to polish prompts. Advanced manual editing is available.'}}},
   generate:async(content,device)=>{if(queued>0)throw new PromptRewriteError(409,'ComfyUI is busy generating. Polish again when the current job finishes.');await ensureProxy(env);const c=client(env),wf=c.workflows.fromJson(await loadGraph('prompt_polish'));wf.setInput('1','device',device);wf.setInput('2','prompt',content);wf.setInput('2','system_prompt',promptInstruction);if(queued>0)throw new PromptRewriteError(409,'ComfyUI is busy generating. Polish again when the current job finishes.');const job=await serialize(()=>runWf(c,wf));const output=job.getOutputs('3')[0];if(!output)throw new PromptRewriteError(502,'ComfyUI returned no polished prompt. Your prompt is unchanged.');return Buffer.from(await output.toBytes()).toString('utf8')}
  });
  const creativeBackend:CreativeBackend={
   status:async()=>creativeTextStatus(await comfyJson(env,'/object_info').catch(()=>({}))),
   generate:async(system,content)=>{if(queued>0||setup.task.busy)throw new CreativeError(409,'Local generation/setup is busy. Finish it before creative planning.');await ensureProxy(env);const c=client(env);return creativeSDKText(c,await loadGraph('prompt_polish'),system,content,wf=>serialize(()=>runWf(c,wf)));}
  };
  const creative=createCreativeEngine(OUTPUTS,creativeBackend);
  return {
    name: "osh-comfy-api",
    async configureServer(server) {
      server.middlewares.use(middleware(env,setup,rewriter,creative));
      if(setup.config?.mode==='managed')setup.start();
      else void (async()=>{if (!(await up((env.COMFYUI_URL || "http://127.0.0.1:8188") + "/system_stats"))) console.warn("[api] ComfyUI not reachable; open Local setup in Studio.");else await ensureProxy(env)})().catch(error=>console.warn('[setup]',error.message));
    },
    async configurePreviewServer(server) {
      server.middlewares.use(middleware(env,setup,rewriter,creative));
      if(setup.config?.mode==='managed')setup.start();else void ensureProxy(env).catch(error=>console.warn('[setup]',error.message));
    },
  };
}
