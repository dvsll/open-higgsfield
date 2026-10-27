// One native, pinned background workflow. Inference is always Comfy SDK -> proxy.
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import type {Comfy} from '@comfyorg/sdk';
import {heroSha,HeroError,heroSource} from './hero-ad.ts';
import {verifyWeightFiles,inspectQwenNodes,inspectQwenPNG} from './qwen-hero.ts';
import {creativeSnapshot,validateCreativeInput,type CreativePlan,type CreativePrepared} from '../lib/creative-engine.ts';
import {draftReviewed} from '../lib/product-brief.ts';
import {adBackgroundPrompt,type AdBackground} from '../lib/ad-background.ts';
const workflows=join(dirname(fileURLToPath(import.meta.url)),'../workflows');
export const kleinContract=async()=>JSON.parse(await readFile(join(workflows,'klein4b_fp8_contract.json'),'utf8'));
export const kleinWorkflow=async()=>{const g=JSON.parse(await readFile(join(workflows,'klein4b_background.json'),'utf8')),pins=await kleinContract();if(heroSha(JSON.stringify(g))!==pins.graphSha256)throw new HeroError(503,'Pinned Klein workflow changed. No inference started.');return g;};
export async function releaseKleinCache(jobId:string,base:string){
 const u=new URL(base);if(u.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(u.hostname)||u.pathname!=='/'||u.username||u.password)throw new HeroError(503,'Local ComfyUI required.');
 const get=async(p:string)=>{const r=await fetch(u.origin+p,{signal:AbortSignal.timeout(3000)});if(!r.ok)throw Error('Memory check unavailable');return r.json();};
 try{const q=await get('/queue'),h=await get('/history?max_items=1');if(q.queue_running?.length||q.queue_pending?.length||!h[jobId])return false;
  // Normal Comfy cache release after our own last completed job; no queue deletion,
  // interruption, unrelated process termination or system GPU setting changes.
  const r=await fetch(u.origin+'/free',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({unload_models:true,free_memory:true}),signal:AbortSignal.timeout(3000)});return r.ok;
 }catch{return false;}
}
export function kleinResources(stats:any,queue:any,busy=false){
 if(busy||queue?.queue_running?.length||queue?.queue_pending?.length)return {available:false,status:'busy',reason:'Local generation is busy. Product-safe design remains available.'};
 if(!Array.isArray(queue?.queue_running)||!Array.isArray(queue?.queue_pending))return {available:false,status:'offline',reason:'Cannot verify the ComfyUI queue.'};
 const d=stats?.devices?.find((d:any)=>d.type==='cuda'),free=d&&d.vram_free+Math.max(0,d.torch_vram_total-d.torch_vram_free),ram=stats?.system?.ram_free;
 if(!Number.isFinite(free)||!Number.isFinite(ram)||free<3.5*1024**3||ram<4*1024**3)return {available:false,status:'insufficient-vram',reason:'Klein FP8 needs at least 3.5 GiB free/reclaimable VRAM and 4 GiB free RAM for this bounded 512x640 offloaded workflow.',vramFreeBytes:free,ramFreeBytes:ram};
 return {available:true,status:'available',reason:'Native offloading, 512x640 / 4 steps. Headroom admission is not a speed guarantee.',vramFreeBytes:free,ramFreeBytes:ram};
}
export async function kleinAvailability(outputs:string,modelsDir:string|undefined,nodes:any,stats:any,queue:any,busy=false){
 const pins=await kleinContract(),g=await kleinWorkflow(),checks=inspectQwenNodes(g,nodes||{}),missingFiles:string[]=[];
 for(const f of pins.files)try{if(!modelsDir||(await stat(join(modelsDir,f.file))).size!==f.bytes)missingFiles.push(f.file);}catch{missingFiles.push(f.file);}
 let proof:any;try{proof=JSON.parse(await readFile(join(outputs,'hero-klein','verified-runtime.json'),'utf8'));}catch{}
 let tested=proof?.workflowSha256===heroSha(JSON.stringify(g))&&proof?.weights===heroSha(JSON.stringify(pins.files))&&proof?.comfyVersion===stats?.system?.comfyui_version&&proof?.gpu===stats?.devices?.[0]?.name;
 if(tested&&modelsDir)try{await verifyWeightFiles(modelsDir,pins.files);}catch{tested=false;}
 const installed=checks.ready&&!missingFiles.length,resources=kleinResources(stats,queue,busy);
 return {id:'klein',label:'FLUX.2 Klein 4B FP8 · AI background',available:installed&&tested&&resources.available,installed,tested,status:!installed?'not-installed':!resources.available?resources.status:!tested?'unsupported':'available',reason:!installed?'Klein FP8 files or native workflow nodes are missing.':!resources.available?resources.reason:!tested?'Installed, but this workflow/runtime has not completed a verified image job with current verified files.':resources.reason,checks,missingFiles,license:'Apache-2.0',precision:'FP8 distilled; native dynamic offloading',diskBytes:pins.files.reduce((n:number,f:any)=>n+f.bytes,0),newDownloadBytes:pins.files.filter((f:any)=>!f.reused).reduce((n:number,f:any)=>n+f.bytes,0),generatesAiPixels:true,preservesOriginalPhotograph:true,editsReference:false,vramFreeBytes:resources.vramFreeBytes,ramFreeBytes:resources.ramFreeBytes};
}
export async function runKleinSDK(c:Comfy,graph:any,signal:AbortSignal,onProgress:(message:string,percent?:number)=>void=()=>{},reference?:string){
 const wf=c.workflows.fromJson(graph);if(reference)wf.setInput('14','image',c.assets.fromFile(reference));
 const job=await c.submit(wf,{signal}),stop=new AbortController();
 const events=(async()=>{try{for await(const e of job.events(stop.signal))if(e.kind==='progress')onProgress(e.currentNode==='11'?`Generating AI background · ${e.step||0}/${e.steps||4}`:'Loading/encoding local model or saving background',e.value);}catch{}})();
 try{await job.wait(600000,signal);await job.result(signal);const out=job.getOutputs('13')[0];if(!out)throw new HeroError(502,'Klein returned no image.');const bytes=Buffer.from(await out.toBytes({timeoutMs:15000,signal}));return {jobId:job.id,bytes};}
 catch(e){let cancellationRequested=false;try{await job.cancel(AbortSignal.timeout(5000));cancellationRequested=true;}catch{}throw Object.assign(e as Error,{jobId:job.id,cancellationRequested});}finally{stop.abort();void events;}
}
export async function renderKleinBackground(outputs:string,modelsDir:string,stats:any,queue:any,c:Comfy,prompt:string,seed:number,signal:AbortSignal,onProgress?:(m:string,p?:number)=>void):Promise<AdBackground>{
 const resource=kleinResources(stats,queue);if(!resource.available)throw new HeroError(503,resource.reason);
 const pins=await kleinContract(),g=await kleinWorkflow(),basis=heroSha(JSON.stringify(g));await verifyWeightFiles(modelsDir,pins.files);
 const id=randomBytes(8).toString('hex'),dir=join(outputs,'hero-klein',id),start=Date.now();await mkdir(dir,{recursive:true});g['4'].inputs.text=prompt;g['7'].inputs.noise_seed=seed;g['13'].inputs.filename_prefix='adstudio/klein-'+id;
 await writeFile(join(dir,'request.json'),JSON.stringify({prompt,seed,workflow:g,weights:pins.files},null,2));
 try{const result=await runKleinSDK(c,g,signal,onProgress),image=inspectQwenPNG(result.bytes,g);if(image.width!==512||image.height!==640)throw new HeroError(422,'Klein output dimensions differ from the executed workflow.');const response={url:'/outputs/'+id+'.png',sha256:heroSha(result.bytes),width:image.width,height:image.height,seconds:(Date.now()-start)/1000,model:'klein-background',jobId:result.jobId,provenanceId:id,prompt,seed,workflowSha256:heroSha(JSON.stringify(g))};
 await writeFile(join(dir,'raw.png'),result.bytes,{flag:'wx'});await writeFile(join(outputs,id+'.png'),result.bytes,{flag:'wx'});await writeFile(join(dir,'provenance.json'),JSON.stringify({...response,weights:pins.files,workflow:g,aiGenerated:'background only; no product or text generated'},null,2));
 await writeFile(join(outputs,'hero-klein','verified-runtime.json'),JSON.stringify({jobId:result.jobId,workflowSha256:basis,weights:heroSha(JSON.stringify(pins.files)),comfyVersion:stats.system.comfyui_version,gpu:stats.devices[0].name,checkedAt:Date.now()},null,2));return response;
 }catch(e){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String((e as Error).message),elapsedMs:Date.now()-start,automaticRetry:false}));throw e;}
}
export async function validateBackgroundRequest(outputs:string,body:any){
 if(!/^[a-f0-9]{16}$/.test(body?.planId)||!/^[a-f0-9]{16}$/.test(body?.preparedId))throw new HeroError(400,'Choose a reviewed creative plan.');
 const dir=join(outputs,'creative-plans',body.planId),plan=JSON.parse(await readFile(join(dir,'plan.json'),'utf8')) as CreativePlan,prepared=JSON.parse(await readFile(join(dir,'prepared-'+body.preparedId+'.json'),'utf8')) as CreativePrepared,current=validateCreativeInput(body.current);
 if(plan.projectId!==body.projectId||prepared.projectId!==body.projectId||prepared.planId!==plan.id||prepared.preparedId!==body.preparedId||!draftReviewed(prepared.draft)||creativeSnapshot(plan.input)!==creativeSnapshot(current))throw new HeroError(409,'Source, brand, product or direction changed. Review the current plan.');
 const source=await heroSource(outputs,body.image);if(source.sha256!==current.source.sha256||prepared.draft.input.source.sha256!==source.sha256||prepared.draft.input.source.originalSha256!==current.source.originalSha256)throw new HeroError(409,'Reviewed source hash mismatch.');
 return {plan,prompt:adBackgroundPrompt(plan),seed:current.seed??42,receipt:join(dir,'background-'+prepared.preparedId+'.json')};
}
