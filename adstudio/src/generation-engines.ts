// Compact image-generation engine probe for Ad Studio. Deterministic product-safe
// design stays available without ComfyUI; AI modes report honest readiness only.
export type GenerationEngineId='automatic'|'product-safe'|'qwen'|'zimage'|'klein';
export type EngineCapability={
 id:GenerationEngineId;
 label:string;
 short:string;
 available:boolean;
 status:'available'|'not-installed'|'busy'|'insufficient-vram'|'offline'|'unsupported';
 reason:string;
 generatesAiPixels:boolean;
 preservesOriginalPhotograph:boolean;
 requiresWeights:boolean;
};
export type GenerationReadiness={
 klein?:{available:boolean;installed:boolean;tested:boolean;status?:string;reason:string};
 finish:boolean;
 qwen:{available:boolean;reason?:string;missingFiles?:string[]};
 reimagine?:boolean;
 zimage?:{available:boolean;installed?:boolean;reason?:string};
 vramFreeBytes?:number|null;
 comfyConnected?:boolean;
 busy?:boolean;
};
const PRODUCT_SAFE:Omit<EngineCapability,'available'|'status'|'reason'>={
 id:'product-safe',label:'Product-safe design',short:'Original photograph · brand layout',
 generatesAiPixels:false,preservesOriginalPhotograph:true,requiresWeights:false
};
const QWEN:Omit<EngineCapability,'available'|'status'|'reason'>={
 id:'qwen',label:'Qwen Image Edit',short:'Local AI photograph edit',
 generatesAiPixels:true,preservesOriginalPhotograph:false,requiresWeights:true
};
const ZIMAGE:Omit<EngineCapability,'available'|'status'|'reason'>={
 id:'zimage',label:'Local AI image',short:'Experimental Z-Image',
 generatesAiPixels:true,preservesOriginalPhotograph:false,requiresWeights:true
};
const Z_MIN=3.5*1024*1024*1024,Q_MIN=8*1024*1024*1024;
/** Unknown VRAM never counts as sufficient. Busy never blocks product-safe. */
function memoryStatus(ready:GenerationReadiness,minBytes:number):{ok:boolean;status:EngineCapability['status'];reason:string}{
 if(ready.busy)return {ok:false,status:'busy',reason:'Local ComfyUI or setup is busy. Product-safe design remains available.'};
 if(typeof ready.vramFreeBytes!=='number')return {ok:false,status:'insufficient-vram',reason:'Free GPU memory has not been verified. AI image engines stay unavailable until ComfyUI reports usable VRAM. Product-safe design remains available.'};
 if(ready.vramFreeBytes<minBytes)return {ok:false,status:'insufficient-vram',reason:`Free/reclaimable VRAM ${(ready.vramFreeBytes/1024**3).toFixed(1)} GiB is below the ${(minBytes/1024**3).toFixed(1)} GiB admission floor. Product-safe design remains available.`};
 return {ok:true,status:'available',reason:''};
}
export function describeEngines(ready:GenerationReadiness):EngineCapability[]{
 const productSafe:EngineCapability={...PRODUCT_SAFE,available:true,status:'available',reason:'Deterministic composition using your approved original photograph. No AI pixels. Works offline.'};
 const qMem=memoryStatus(ready,Q_MIN);
 const qwen:EngineCapability=ready.qwen?.available&&qMem.ok
  ?{...QWEN,available:true,status:'available',reason:ready.qwen.reason||'Local Qwen Image Edit is ready.'}
  :{...QWEN,available:false,status:ready.qwen?.available?qMem.status:(ready.qwen?.missingFiles?.length?'not-installed':(ready.comfyConnected===false?'offline':'not-installed')),reason:ready.qwen?.available?qMem.reason:(ready.qwen?.reason||'Qwen Image Edit weights or ComfyUI are unavailable.')};
 const zInstalled=!!ready.zimage?.installed||!!ready.zimage?.available||!!ready.reimagine;
 const zServerOk=!!ready.zimage?.available||!!ready.reimagine;
 const zMem=memoryStatus(ready,Z_MIN);
 const zimage:EngineCapability=zServerOk&&zMem.ok
  ?{...ZIMAGE,available:true,status:'available',reason:ready.zimage?.reason||'Experimental local Z-Image is ready.'}
  :{...ZIMAGE,available:false,status:zInstalled?zMem.status:'not-installed',reason:zInstalled?(zServerOk?zMem.reason:(ready.zimage?.reason||zMem.reason)):(ready.zimage?.reason||'No compatible local still-image weights are installed for this runtime.')};
 const klein=kleinCapability(ready);
 const autoTarget=resolveGenerationEngine('automatic',ready);
 const automatic:EngineCapability={
  id:'automatic',label:'Automatic',short:autoTarget.label,
  available:true,status:'available',
  reason:autoTarget.id==='product-safe'
   ?'No ready local AI image engine. Automatic uses Product-safe design.'
   :`Automatic will use ${autoTarget.label}.`,
  generatesAiPixels:autoTarget.generatesAiPixels,
  preservesOriginalPhotograph:autoTarget.preservesOriginalPhotograph,
  requiresWeights:autoTarget.requiresWeights
 };
 return [automatic,productSafe,klein,qwen,zimage];
}
function zimageReady(ready:GenerationReadiness){
 const wanted=!!ready.zimage?.available||!!ready.reimagine;
 if(!wanted){
  if(ready.zimage?.installed){const mem=memoryStatus(ready,Z_MIN);return {ok:false as const,reason:mem.ok?(ready.zimage.reason||'Local Z-Image is installed but not ready.'):mem.reason};}
  return {ok:false as const,reason:ready.zimage?.reason||'No compatible local still-image model is installed. Choose Product-safe design instead.'};
 }
 const mem=memoryStatus(ready,Z_MIN);if(!mem.ok)return {ok:false as const,reason:mem.reason};
 return {ok:true as const};
}
function qwenReady(ready:GenerationReadiness){
 if(!ready.qwen?.available)return {ok:false as const,reason:ready.qwen?.reason||'Qwen Image Edit is not ready on this connection. Choose Product-safe design, or install the required weights. Your direction is saved.'};
 const mem=memoryStatus(ready,Q_MIN);if(!mem.ok)return {ok:false as const,reason:mem.reason};
 return {ok:true as const};
}
function kleinCapability(ready:GenerationReadiness):EngineCapability{const k=ready.klein;return {id:'klein',label:'FLUX.2 Klein 4B FP8',short:'AI background + original photograph ? Apache-2.0',available:!!k?.available,status:(k?.status||'not-installed') as EngineCapability['status'],reason:k?.reason||'Klein is not installed or has not completed a verified runtime test.',generatesAiPixels:true,preservesOriginalPhotograph:true,requiresWeights:true};}
export function resolveGenerationEngine(choice:GenerationEngineId,ready:GenerationReadiness):EngineCapability{
 if(choice==='product-safe')return {...PRODUCT_SAFE,available:true,status:'available',reason:'Product-safe design · original photograph'};
 if(choice==='klein'){const k=kleinCapability(ready);if(!k.available)throw Error(k.reason);return k;}
 if(choice==='qwen'){
  const q=qwenReady(ready);if(!q.ok)throw Error(q.reason);
  return {...QWEN,available:true,status:'available',reason:'Local Qwen Image Edit'};
 }
 if(choice==='zimage'){
  const z=zimageReady(ready);if(!z.ok)throw Error(z.reason);
  return {...ZIMAGE,available:true,status:'available',reason:'Experimental local image model'};
 }
 if(ready.klein?.available)return kleinCapability(ready);
 if(qwenReady(ready).ok)return {...QWEN,available:true,status:'available',reason:'Automatic selected Qwen Image Edit'};
 if(zimageReady(ready).ok)return {...ZIMAGE,available:true,status:'available',reason:'Automatic selected local AI image'};
 return {...PRODUCT_SAFE,available:true,status:'available',reason:'Automatic selected Product-safe design · original photograph'};
}
export function engineSelectable(engines:EngineCapability[]){return engines.filter(e=>e.id==='automatic'||e.id==='product-safe'||e.available||e.id==='qwen'||e.id==='zimage'||e.id==='klein');}
