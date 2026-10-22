// Ad Studio domain/storage only. No Director UI imports or initialization side effects.
export const DATABASE = 'osh-adstudio-projects';
export const ACTIVE_KEY = 'osh-adstudio:active:v1';
export type Ratio = '16:9'|'9:16'|'1:1';
export type Mode = 'camera'|'locked'|'creative';
export type Settings = {template:string;mode:Mode;motion:'push'|'pan-left'|'pan-right';ratios:Ratio[];duration:number;seed:number;pitch:string;tagline:string;vibe:'studio'|'life'|'ugc';framing:'fit'|'crop';model?:string};
export type ProductAsset = {id:string;name:string;original:Blob;normalized:Blob;width:number;height:number;created:number};
export type EditRecipe = {start:number;end:number;speed:number;reverse:boolean;width:number;height:number};
export type Take = {id:string;created:number;assetId:string;source:string;parentId?:string;kind:'generation'|'edit';mode:Mode;ratio:Ratio;settings:Settings;prompt:string;frames:number;fps:number;width:number;height:number;seconds:number;background?:string;edit?:EditRecipe;exports:{id:string;url:string;tagline:string;created:number}[]};
export type Attempt = {id:string;status:'running'|'complete'|'failed'|'interrupted';created:number;takeIds:string[];error?:string};
export type AdProject = {version:2;id:string;name:string;created:number;updated:number;settings:Settings;assetId?:string;takes:Take[];attempt?:Attempt};
export const defaults = ():Settings => ({template:'portrait-push',mode:'camera',motion:'push',ratios:['9:16'],duration:3,seed:1,pitch:'A slow camera push toward the product, soft studio lighting, subtle reflections, premium commercial product shot.',tagline:'',vibe:'studio',framing:'fit'});
export function newProject(name='Untitled ad'):AdProject {
 const now=Date.now();return {version:2,id:crypto.randomUUID(),name:validName(name),created:now,updated:now,settings:defaults(),takes:[]};
}
export function validName(name:string) {const value=name.trim();if(!value||value.length>60)throw new Error('Use a project name of 1–60 characters.');return value;}
export function migrateProject(value:unknown):AdProject {
 if(!value||typeof value!=='object')throw new Error('Project data is unreadable. Saved data was not overwritten.');
 const p=value as Record<string,any>;
 if(![1,2].includes(p.version)||typeof p.id!=='string'||typeof p.name!=='string')throw new Error('Unsupported project version. Saved data was not overwritten.');
 const settings={...defaults(),...p.settings};
 if(!['camera','locked','creative'].includes(settings.mode)||!Array.isArray(settings.ratios)||settings.ratios.some((r:unknown)=>!['16:9','9:16','1:1'].includes(String(r))))throw new Error('Invalid project settings. Saved data was not overwritten.');
 const takes=p.version===1?(p.outputs||[]).map((t:any,i:number)=>({...t,id:t.id||`legacy-${p.id}-${i}`,kind:t.kind||'generation',settings:t.settings||structuredClone(settings),exports:t.exports||[]})):p.takes;
 const video=(url:unknown)=>typeof url==='string'&&/^\/outputs\/[a-f0-9]{16}\.(webm|mp4)$/.test(url);
 if(!Array.isArray(takes)||takes.some((t:any)=>typeof t.id!=='string'||!video(t.source)||(t.background&&!video(t.background))||!Array.isArray(t.exports)||t.exports.some((e:any)=>!video(e.url))))throw new Error('Invalid saved history. Saved data was not overwritten.');
 return {...p,version:2,settings,takes} as AdProject;
}
export interface ProjectDriver {all():Promise<unknown[]>;put(project:AdProject,assets?:ProductAsset[]):Promise<void>;asset(id:string):Promise<ProductAsset|undefined>}
export class Projects {
 private driver:ProjectDriver;
 constructor(driver:ProjectDriver) {this.driver=driver;}
 async list(){return (await this.driver.all()).map(migrateProject).sort((a,b)=>b.updated-a.updated);}
 async save(project:AdProject,assets:ProductAsset|ProductAsset[]=[]){const snapshot=structuredClone(project);snapshot.updated=Date.now();await this.driver.put(snapshot,structuredClone(Array.isArray(assets)?assets:[assets]));}
 asset(id:string){return this.driver.asset(id);}
}
export function memoryDriver():ProjectDriver {
 const projects=new Map<string,AdProject>(),assets=new Map<string,ProductAsset>();
 return {all:async()=>structuredClone([...projects.values()]),put:async(p,list=[])=>{projects.set(p.id,structuredClone(p));for(const a of list)assets.set(a.id,structuredClone(a));},asset:async id=>structuredClone(assets.get(id))};
}
export function openProjectDriver():Promise<ProjectDriver> {
 return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB)return reject(new Error('Browser database unavailable.'));
  const request=indexedDB.open(DATABASE,1);
  request.onupgradeneeded=()=>{const db=request.result;for(const store of ['projects','assets'])if(!db.objectStoreNames.contains(store))db.createObjectStore(store,{keyPath:'id'});};
  request.onerror=()=>reject(request.error||new Error('Could not open project storage.'));
  request.onblocked=()=>reject(new Error('Close other Ad Studio tabs, then retry saving.'));
  request.onsuccess=()=>{
   const db=request.result;db.onversionchange=()=>db.close();
   function read<T>(store:string,key?:string):Promise<T>{return new Promise((ok,fail)=>{const tx=db.transaction(store,'readonly'),req=key===undefined?tx.objectStore(store).getAll():tx.objectStore(store).get(key);req.onsuccess=()=>ok(req.result);req.onerror=()=>fail(req.error);});}
   resolve({all:()=>read<unknown[]>('projects'),asset:id=>read<ProductAsset|undefined>('assets',id),put:(project,assets=[])=>new Promise<void>((ok,fail)=>{const tx=db.transaction(['projects','assets'],'readwrite');tx.oncomplete=()=>ok();tx.onabort=()=>fail(tx.error||new Error('Storage full or unavailable.'));tx.onerror=()=>{};tx.objectStore('projects').put(project);for(const asset of assets)tx.objectStore('assets').put(asset);})});
  };
 });
}
export function restoredAttempt(project:AdProject):boolean {
 if(project.attempt?.status!=='running')return false;
 project.attempt.status='interrupted';project.attempt.error='A previous render was interrupted. Inspect saved takes and the local queue before generating again.';return true;
}
