import {OSH,type ShotResult} from '../../shared/runtime/client';
import {taglineOverlay} from './overlay';
import {prepareReference} from './reference';
import {Projects,openProjectDriver,memoryDriver,newProject,validName,restoredAttempt,ACTIVE_KEY,type AdProject,type Settings,type Take,type ProductAsset,type Ratio} from './projects';
import {blobDataURL,normalizeProduct} from './assets';

const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const photo=el<HTMLInputElement>('photo'),product=el<HTMLImageElement>('product'),fields=el<HTMLFieldSetElement>('fields'),go=el<HTMLButtonElement>('go'),status=el('status'),outs=el('outs'),exportAll=el<HTMLButtonElement>('export-all');
const sizes={'16:9':{width:512,height:288},'9:16':{width:288,height:512},'1:1':{width:384,height:384}};
const vibes={studio:'Clean studio background, controlled lighting, smooth camera movement.',life:'Natural daylight, lifestyle commercial, gentle cinematic camera movement.',ugc:'Natural handheld camera movement, authentic product demonstration.'};
let repository:Projects,project:AdProject,image='',busy=false,reading=true,exporting=0,selection=0,saving=Promise.resolve(),durable=false;
const projects=new Map<string,AdProject>(),pendingAssets=new Map<string,{projectId:string;asset:ProductAsset}>();
const dirtyProjects=new Set<string>(),writeVersions=new Map<string,number>();
type Card={take:Take;video:HTMLVideoElement;button:HTMLButtonElement;message:HTMLElement;exportLinks:HTMLElement};
const cards:Card[]=[];
const errorText=(error:unknown)=>error instanceof Error?error.message:String(error);
function storageNotice(text:string){el('storage-status').textContent=text;}
async function persist(asset?:ProductAsset) {
 if(asset)pendingAssets.set(asset.id,{projectId:project.id,asset});
 project.updated=Date.now();projects.set(project.id,project);
 dirtyProjects.add(project.id);const revision=(writeVersions.get(project.id)||0)+1;writeVersions.set(project.id,revision);
 const snapshot=structuredClone(project),assets=[...pendingAssets.values()].filter(a=>a.projectId===snapshot.id).map(a=>a.asset);
 const task=saving.then(async()=>{await repository.save(snapshot,assets);if(!durable)throw new Error('Browser database unavailable; this session is not saved.');for(const a of assets)pendingAssets.delete(a.id);if(writeVersions.get(snapshot.id)===revision)dirtyProjects.delete(snapshot.id);storageNotice(dirtyProjects.size?`Unsaved changes in ${dirtyProjects.size} project(s). Retry saving if this persists.`:'Saved on this browser.');});
 saving=task.catch(error=>storageNotice('Not saved — '+errorText(error)+' Keep this tab open and retry saving.'));
 await saving;
}
function working(){return busy||reading||exporting>0;}
function ready(){
 go.disabled=working()||!image||(project?.settings.mode!=='camera'&&!OSH.online);
 exportAll.disabled=working()||!cards.some(c=>!c.take.exports.length);
 photo.disabled=working();fields.disabled=busy||reading;
 for(const id of ['projects','new-project','rename-project','project-name'])el<HTMLInputElement>(id).disabled=working();
}
function readSettings():Settings {
 return {...project.settings,mode:el<HTMLSelectElement>('mode').value as Settings['mode'],motion:el<HTMLSelectElement>('camera-motion').value as Settings['motion'],ratios:[...document.querySelectorAll<HTMLInputElement>('input[name="ratio"]:checked')].map(c=>c.value as Ratio),duration:+el<HTMLSelectElement>('duration').value,seed:Number.isFinite(el<HTMLInputElement>('seed').valueAsNumber)?el<HTMLInputElement>('seed').valueAsNumber:project.settings.seed,pitch:el<HTMLTextAreaElement>('pitch').value,tagline:el<HTMLInputElement>('tagline').value,vibe:el<HTMLSelectElement>('vibe').value as Settings['vibe'],framing:el<HTMLSelectElement>('framing').value as Settings['framing']};
}
function updateMode(){
 const mode=el<HTMLSelectElement>('mode').value;
 for(const id of ['pitch','seed','vibe'])el<HTMLInputElement>(id).disabled=mode==='camera';
 el<HTMLTextAreaElement>('pitch').required=mode!=='camera';
 el<HTMLSelectElement>('camera-motion').disabled=mode!=='camera';el<HTMLSelectElement>('framing').disabled=mode!=='creative';
 el('mode-help').textContent=mode==='camera'?'Conventional push/pan of your photo. No AI scene movement.':mode==='locked'?'A static original-photo rectangle over an LTX background. No automatic product segmentation.':'Experimental LTX generation. Product shapes, textures and lettering can change; commercial quality has not passed acceptance.';
 go.textContent=mode==='camera'?'Animate photo':'Generate experimental video';ready();
}
function applySettings(){
 const s=project.settings;
 for(const [id,value]of Object.entries({mode:s.mode,'camera-motion':s.motion,pitch:s.pitch,tagline:s.tagline,vibe:s.vibe,framing:s.framing,duration:s.duration,seed:s.seed}))el<HTMLInputElement>(id).value=String(value);
 document.querySelectorAll<HTMLInputElement>('input[name="ratio"]').forEach(c=>c.checked=s.ratios.includes(c.value as Ratio));updateMode();
}
function projectOptions(){
 const select=el<HTMLSelectElement>('projects');select.replaceChildren();
 for(const p of [...projects.values()].sort((a,b)=>b.updated-a.updated)){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;select.append(option);}
 select.value=project.id;el<HTMLInputElement>('project-name').value=project.name;
}
async function openProject(next:AdProject){
 if(busy||exporting)return;
 const ticket=++selection;reading=true;project=next;image='';product.removeAttribute('src');cards.length=0;outs.replaceChildren();photo.value='';applySettings();projectOptions();
 try{localStorage.setItem(ACTIVE_KEY,project.id);}catch{storageNotice('Active project could not be remembered; browser storage is restricted.');}
 try {
  if(project.assetId){const asset=pendingAssets.get(project.assetId)?.asset||await repository.asset(project.assetId);if(!asset)throw new Error('Saved product reference is missing. Upload a replacement; previous takes are kept.');image=await blobDataURL(asset.normalized);if(ticket!==selection)return;product.src=image;}
  status.textContent=project.attempt?.error||'Project opened. Previous takes are kept when you generate variations.';
 }catch(error){status.textContent=errorText(error);}
 if(ticket!==selection)return;
 for(const take of project.takes)renderTake(take);
 if(restoredAttempt(project)){status.textContent=project.attempt!.error!;await persist();}
 reading=false;ready();
}
function outputLink(url:string,label:string,filename?:string){const a=document.createElement('a');a.href=url;a.textContent=label;if(filename)a.download=filename;return a;}
function exportLinks(card:Card){card.exportLinks.replaceChildren();for(const item of card.take.exports)card.exportLinks.append(outputLink(item.url,'Download MP4',`ad-${card.take.id}.mp4`));}
function renderTake(take:Take){
 const article=document.createElement('article');article.className='out';article.dataset.takeId=take.id;
 const title=document.createElement('strong');title.textContent=`${take.kind==='edit'?'Adjusted · ':''}${take.mode==='camera'?'Camera':take.mode==='locked'?'Product-Locked':'Creative experimental'} · ${take.ratio} · ${(take.frames/take.fps).toFixed(2)} s`;
 const video=document.createElement('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.src=take.exports.at(-1)?.url||take.source;
 const details=document.createElement('details'),summary=document.createElement('summary'),copy=document.createElement('p');summary.textContent='Generation details';copy.className='note';copy.textContent=take.mode==='camera'?`FFmpeg ${take.settings.motion}; no model, prompt or seed used.`:`${take.settings.model||'LTX-Video 2B fallback'} · seed ${take.settings.seed} · ${take.prompt}`;details.append(summary,copy);
 const button=document.createElement('button');button.type='button';button.textContent=take.exports.length?'Export another MP4':'Export MP4';
 const message=document.createElement('p');message.className='note';message.setAttribute('role','status');
 const links=document.createElement('div'),card={take,video,button,message,exportLinks:links};cards.push(card);exportLinks(card);
 video.addEventListener('error',()=>{message.textContent='Preview unavailable. The local API or output file may be missing. Retry loading, or generate a new variation; history is kept.';});
 const retry=document.createElement('button');retry.type='button';retry.textContent='Reload preview';retry.onclick=()=>{video.load();message.textContent='Checking the saved output…';};
 button.onclick=()=>void exportTake(card);
 article.append(title,video,outputLink(take.source,'Download original WebM',`ad-${take.id}.webm`),button,links,message,retry,details);
 if(take.background)article.append(outputLink(take.background,'Inspect Creative background'));
 outs.prepend(article);
}
async function exportTake(card:Card){
 if(working())return false;
 exporting++;card.button.disabled=true;ready();card.message.textContent='Exporting MP4…';
 try {
  const tagline=project.settings.tagline.trim(),overlay=tagline?(await OSH.upload(taglineOverlay(card.take.width,card.take.height,tagline))).url:undefined;
  const result=await OSH.exportVideo(card.take.source,overlay);
  card.take.exports.push({id:crypto.randomUUID(),url:result.url,tagline,created:Date.now()});await persist();exportLinks(card);card.video.src=result.url;card.button.textContent='Export another MP4';card.message.textContent=`MP4 ready · ${result.seconds}s. Original video kept.`;return true;
 }catch(error){card.message.textContent=errorText(error)+' Original video is unchanged; retry export.';return false;}
 finally {exporting--;card.button.disabled=false;ready();}
}
exportAll.onclick=async()=>{if(working())return;const pending=cards.filter(c=>!c.take.exports.length);for(const card of pending)if(!await exportTake(card))break;};
async function check(){const h=await OSH.health();el('health').textContent=h.online?'● Local ComfyUI connected':`Generation offline: ${h.reason}. Camera uses the local API and FFmpeg.`;ready();}
el('check').onclick=()=>void check();
photo.onchange=async()=>{
 const ticket=++selection,file=photo.files?.[0];if(!file)return;reading=true;ready();
 try {const asset=await normalizeProduct(file);const url=await blobDataURL(asset.normalized);if(ticket!==selection)return;project.assetId=asset.id;image=url;product.src=url;await persist(asset);status.textContent='Product ready. Your previous takes are kept.';}
 catch(error){status.textContent=errorText(error)+' Previous product reference is unchanged.';}
 finally{if(ticket===selection){reading=false;ready();}}
};
el<HTMLFormElement>('brief').addEventListener('input',()=>{if(!project||busy)return;project.settings=readSettings();updateMode();void persist();});
el<HTMLFormElement>('brief').onsubmit=async event=>{
 event.preventDefault();if(working()||!image)return;project.settings=readSettings();const settings=structuredClone(project.settings),assetId=project.assetId!;
 if(!settings.ratios.length){status.textContent='Select at least one format.';return;}
 if(settings.mode!=='camera'&&!settings.pitch.trim()){status.textContent='Write a motion brief.';return;}
 busy=true;ready();project.attempt={id:crypto.randomUUID(),created:Date.now(),status:'running',takeIds:[]};await persist();
 try {
  if(settings.mode!=='camera'){await check();if(!OSH.online)throw new Error(OSH.reason);}
  const prompt=`${settings.pitch.trim()} ${vibes[settings.vibe]} Preserve the reference product appearance and branding. No added text.`;
  const original=settings.mode!=='creative'?await OSH.upload(image):null;
  const cropped=settings.mode==='creative'&&settings.framing==='crop'?await OSH.upload(image):null;
  for(const ratio of settings.ratios){
   const size=sizes[ratio];let result:ShotResult,background:ShotResult|undefined;
   status.textContent=`${settings.mode==='camera'?'Animating':'Generating'} ${ratio}… ${project.attempt.takeIds.length+1}/${settings.ratios.length}.`;
   if(settings.mode==='camera')result=await OSH.productVideo({image:original!.url,mode:'camera',ratio,duration:settings.duration,motion:settings.motion});
   else {
    const reference=cropped||await OSH.upload(await prepareReference(image,size.width,size.height,settings.mode==='creative'?settings.framing:'fit'));
    result=await OSH.shot([{image:reference.url,t:0}],prompt,settings.duration,settings.seed,{...size,model:settings.model});
    if(settings.mode==='locked'){background=result;result=await OSH.productVideo({image:original!.url,background:result.url,mode:'locked',ratio,duration:settings.duration});}
   }
   const take:Take={id:crypto.randomUUID(),created:Date.now(),assetId,source:result.url,kind:'generation',mode:settings.mode,ratio,settings:structuredClone(settings),prompt:settings.mode==='camera'?'':prompt,frames:result.frames,fps:result.fps||24,...size,seconds:result.seconds+(background?.seconds||0),background:background?.url,exports:[]};
   project.takes.push(take);project.attempt.takeIds.push(take.id);await persist();renderTake(take);
  }
  project.attempt.status='complete';status.textContent='Videos ready. Preview, export, or make another variation. Earlier takes are kept.';
 }catch(error){project.attempt.status='failed';project.attempt.error=errorText(error);status.textContent=`${project.attempt.takeIds.length} take(s) ready in this tab. ${errorText(error)} Check results before retrying; a disconnected render may still be running.`;}
 finally {await persist();busy=false;updateMode();}
};
el<HTMLSelectElement>('projects').onchange=async()=>{if(working())return;await saving;const next=projects.get(el<HTMLSelectElement>('projects').value);if(next)await openProject(next);};
el('new-project').onclick=async()=>{if(working())return;try{await saving;const next=newProject(el<HTMLInputElement>('project-name').value||'Untitled ad');project=next;projects.set(next.id,next);await persist();await openProject(next);}catch(error){status.textContent=errorText(error);}};
el('rename-project').onclick=async()=>{if(working())return;try{project.name=validName(el<HTMLInputElement>('project-name').value);await persist();projectOptions();}catch(error){status.textContent=errorText(error);}};
el('retry-save').onclick=async()=>{
 if(working())return;
 try {await saving;repository=new Projects(await openProjectDriver());durable=true;for(const saved of projects.values()){const assets=[...pendingAssets.values()].filter(a=>a.projectId===saved.id).map(a=>a.asset);await repository.save(saved,assets);}pendingAssets.clear();dirtyProjects.clear();storageNotice('Saved on this browser.');const existing=await repository.list();for(const p of existing)if(!projects.has(p.id))projects.set(p.id,p);projectOptions();}
 catch(error){durable=false;storageNotice('Not saved — '+errorText(error)+' Keep this tab open.');}
};
async function start(){
 try {repository=new Projects(await openProjectDriver());const list=await repository.list();for(const p of list)projects.set(p.id,p);durable=true;storageNotice('Saved projects stay on this browser.');}
 catch(error){repository=new Projects(memoryDriver());storageNotice('Session only — '+errorText(error)+' Keep this tab open; retry saving.');}
 let active='';try{active=localStorage.getItem(ACTIVE_KEY)||'';}catch{}
 project=projects.get(active)||[...projects.values()][0]||newProject();projects.set(project.id,project);await persist();await openProject(project);void check();
}
void start();
