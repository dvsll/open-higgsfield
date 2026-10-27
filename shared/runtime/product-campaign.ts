// Source-preserving campaign: native mask -> real Klein environment -> original
// product pixels + contact shadows. No product redraw, rectangular photo or frame.
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {Resvg} from '@resvg/resvg-js';
import type {Comfy} from '@comfyorg/sdk';
import type {CreativePlan} from '../lib/creative-engine.ts';
import {adCampaignPrompt,sceneDirection,type AdScene} from '../lib/ad-scene.ts';
import {heroSource,heroSha,HeroError} from './hero-ad.ts';
import {verifyWeightFiles,inspectQwenNodes} from './qwen-hero.ts';
import {kleinAvailability,runKleinSDK,renderKleinBackground,releaseKleinCache} from './klein-background.ts';
import {verifyScenePNG} from './klein-scene.ts';
const workflows=join(dirname(fileURLToPath(import.meta.url)),'../workflows');
export async function cutoutContract(){return JSON.parse(await readFile(join(workflows,'product_cutout_contract.json'),'utf8'));}
export async function cutoutWorkflow(){const g=JSON.parse(await readFile(join(workflows,'product_cutout.json'),'utf8')),pin=await cutoutContract();if(heroSha(JSON.stringify(g))!==pin.graphSha256)throw new HeroError(503,'Pinned product extraction workflow changed.');return g;}
export async function campaignAvailability(outputs:string,modelsDir:string|undefined,nodes:any,stats:any,queue:any,busy=false){
 const k=await kleinAvailability(outputs,modelsDir,nodes,stats,queue,busy),pin=await cutoutContract(),g=await cutoutWorkflow(),checks=inspectQwenNodes(g,nodes||{});let installed=checks.ready;
 try{if(!modelsDir)installed=false;else await verifyWeightFiles(modelsDir,pin.files);}catch{installed=false;}
 let proof:any;try{proof=JSON.parse(await readFile(join(outputs,'hero-cutouts','verified-runtime.json'),'utf8'));}catch{}
 const tested=installed&&proof?.workflowSha256===heroSha(JSON.stringify(g))&&proof?.weights===heroSha(JSON.stringify(pin.files))&&proof?.comfyVersion===stats?.system?.comfyui_version&&proof?.gpu===stats?.devices?.[0]?.name;
 const extractionBytes=pin.files.reduce((sum:number,f:any)=>sum+f.bytes,0);
 return {...k,mode:'source-integrated',label:'Klein + isolated original product',license:'Apache-2.0 + MIT',diskBytes:k.diskBytes+extractionBytes,newDownloadBytes:k.newDownloadBytes+extractionBytes,extraction:{model:'BiRefNet',license:'MIT',bytes:extractionBytes,checks,installed,tested},installed:k.installed&&installed,tested:k.tested&&tested,available:k.available&&tested,status:!installed?'not-installed':!tested?'unsupported':k.status,reason:!installed?'Local MIT BiRefNet extraction files/nodes are missing. Product-safe remains available.':!tested?'Source extraction has not been verified on this local runtime.':!k.available?k.reason:'Local AI campaign ready: generated scene, isolated original product and grounding shadows. Inspect extraction edges before publishing.',preservesOriginalPhotograph:true,editsReference:false};
}
type Box={x:number;y:number;width:number;height:number};
function hull(points:number[][]){points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(a:number[],b:number[],c:number[])=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);const half=(p:number[][])=>{const out:number[][]=[];for(const q of p){while(out.length>1&&cross(out.at(-2)!,out.at(-1)!,q)<=0)out.pop();out.push(q);}return out;};return [...half(points).slice(0,-1),...half([...points].reverse()).slice(0,-1)];}
export function productMatte(source:{data:string;width:number;height:number},mask:Buffer,container:string){
 const uri='data:image/png;base64,'+mask.toString('base64'),w=source.width,h=source.height,decoded=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><image href="${uri}" width="${w}" height="${h}"/></svg>`).render().pixels;
 let left=w,top=h,right=0,bottom=0,area=0;const points:number[][]=[];
 for(let y=0;y<h;y++){let lo=w,hi=-1;for(let x=0;x<w;x++)if(decoded[(y*w+x)*4]>64){lo=Math.min(lo,x);hi=Math.max(hi,x);area++;}if(hi>=0){points.push([lo,y],[hi,y]);left=Math.min(left,lo);right=Math.max(right,hi);top=Math.min(top,y);bottom=y;}}
 if(area<w*h*.03||area>w*h*.92||right-left<16||bottom-top<16)throw new HeroError(422,'The subject mask is empty or ambiguous. No framed fallback was produced. Original preserved.');
 // Convex container assembly: retain foil/dish seams rather than cutting model
 // holes through them. Never apply this to bottles/necks or unrelated objects.
 const convex=/\b(tray|baking dish|pan|plate)\b/i.test(container),shape=convex?`<polygon points="${hull(points).map(p=>p.join(',')).join(' ')}" fill="white"/>`:`<image href="${uri}" width="${w}" height="${h}"/>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><mask id="subject" mask-type="luminance">${shape}</mask></defs><image href="${source.data}" width="${w}" height="${h}" mask="url(#subject)"/></svg>`,r=new Resvg(svg).render();
 return {bytes:Buffer.from(r.asPng()),box:{x:left,y:top,width:right-left+1,height:bottom-top+1},method:convex?'BiRefNet + convex container seam repair':'BiRefNet soft matte',coverage:area/(w*h)};
}
export function integrateProduct(background:Buffer,cutout:Buffer,box:Box,archetype='material-study'){
 const w=768,h=960,scale=Math.min(560/box.width,610/box.height),pw=box.width*scale,ph=box.height*scale,x=(w-pw)/2+(archetype==='food-editorial'?40:0),y=320+(610-ph)/2,rotation=archetype==='food-editorial'?-12:archetype==='beauty-sensory'?-5:0,bg='data:image/png;base64,'+background.toString('base64'),fg='data:image/png;base64,'+cutout.toString('base64');
 const product=`<g transform="rotate(${rotation} ${x+pw/2} ${y+ph/2})"><svg x="${x}" y="${y}" width="${pw}" height="${ph}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}"><image href="${fg}" width="${cutout.readUInt32BE(16)}" height="${cutout.readUInt32BE(20)}"/></svg></g>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/><feColorMatrix type="matrix" values="0 0 0 0 0.035 0 0 0 0 0.025 0 0 0 0 0.02 0 0 0 .32 0"/></filter><filter id="contact" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/><feColorMatrix type="matrix" values="0 0 0 0 0.03 0 0 0 0 0.02 0 0 0 0 0.01 0 0 0 .55 0"/></filter></defs><image href="${bg}" width="${w}" height="${h}"/><g transform="translate(8 12)" filter="url(#soft)">${product}</g><g transform="translate(1 3)" filter="url(#contact)">${product}</g>${product}</svg>`;
 return {bytes:Buffer.from(new Resvg(svg).render().asPng()),placement:{x,y,width:pw,height:ph,rotation},sourceBox:box};
}
export async function renderProductCampaign(outputs:string,modelsDir:string,stats:any,queue:any,c:Comfy,plan:CreativePlan,image:string,base:string,signal:AbortSignal,progress:(m:string,p?:number)=>void):Promise<AdScene>{
 const source=await heroSource(outputs,image),pins=await cutoutContract(),g=await cutoutWorkflow();await verifyWeightFiles(modelsDir,pins.files);const id=randomBytes(8).toString('hex'),dir=join(outputs,'hero-cutouts',id);await mkdir(dir,{recursive:true});
 let maskJobId='',backgroundJobId='';const started=Date.now();try{progress('Isolating the original product locally');const expected=structuredClone(g),result=await runKleinSDK(c,g,signal,()=>{},source.path);maskJobId=result.jobId;
  await writeFile(join(dir,'received-mask.png'),result.bytes);await verifyScenePNG(result.bytes,expected,source.sha256,base,signal,source);
  const matte=productMatte(source,result.bytes,plan.input.facts.container||''),cutoutName=randomBytes(8).toString('hex')+'.png';await writeFile(join(outputs,cutoutName),matte.bytes,{flag:'wx'});await writeFile(join(dir,'cutout.png'),matte.bytes);
  await writeFile(join(dir,'provenance.json'),JSON.stringify({sourceSha256:source.sha256,maskJobId,method:matte.method,box:matte.box,coverage:matte.coverage,weights:pins.files,workflow:expected},null,2));
  await writeFile(join(outputs,'hero-cutouts','verified-runtime.json'),JSON.stringify({workflowSha256:heroSha(JSON.stringify(expected)),weights:heroSha(JSON.stringify(pins.files)),comfyVersion:stats.system.comfyui_version,gpu:stats.devices[0].name,jobId:maskJobId}));
  await releaseKleinCache(maskJobId,base);progress('Generating the art-directed environment');
  const native=async(path:string)=>(await fetch(new URL(path,base),{signal:AbortSignal.any([signal,AbortSignal.timeout(5000)])})).json(),freshStats=await native('/system_stats'),freshQueue=await native('/queue');
  const bg=await renderKleinBackground(outputs,modelsDir,freshStats,freshQueue,c,adCampaignPrompt(plan),plan.input.seed??42,signal,progress);backgroundJobId=bg.jobId;const plate=await readFile(join(outputs,bg.url.slice(9))),integrated=integrateProduct(plate,matte.bytes,matte.box,sceneDirection(plan).archetype),filename=randomBytes(8).toString('hex')+'.png';await writeFile(join(outputs,filename),integrated.bytes,{flag:'wx'});
  const response:AdScene={...bg,url:'/outputs/'+filename,model:'klein-integrated',width:768,height:960,sha256:heroSha(integrated.bytes),sourceSha256:source.sha256,archetype:sceneDirection(plan).archetype,seconds:(Date.now()-started)/1000,warning:'Original product isolated with an AI mask. Inspect matte edges, lighting and transparency; no product geometry was generated.',background:bg,cutout:{url:'/outputs/'+cutoutName,sha256:heroSha(matte.bytes),jobId:maskJobId,method:matte.method,box:matte.box,width:source.width,height:source.height},placement:integrated.placement};
  await writeFile(join(outputs,'hero-klein',bg.provenanceId,'integration.json'),JSON.stringify({...response,originalSha256:plan.input.source.originalSha256,source:plan.input.source,ownerApproved:false},null,2));return response;
 }catch(error){await writeFile(join(dir,'failure.json'),JSON.stringify({error:String((error as Error).message),maskJobId,backgroundJobId,automaticRetry:false}));throw Object.assign(error as Error,{jobId:(error as any).jobId||backgroundJobId||maskJobId});}
}
