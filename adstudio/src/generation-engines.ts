// Compact image-generation engine probe for Ad Studio. Deterministic product-safe
// design stays available without ComfyUI; AI modes report honest readiness only.
export type GenerationEngineId='automatic'|'product-safe'|'qwen'|'zimage';
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
 finish:boolean;
 qwen:{available:boolean;reason?:string;missingFiles?:string[]};
 reimagine?:boolean;
 zimage?:{available:boolean;reason?:string};
 vramFreeBytes?:number;
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
export function describeEngines(ready:GenerationReadiness):EngineCapability[]{
 const productSafe:EngineCapability={...PRODUCT_SAFE,available:true,status:'available',reason:'Deterministic composition using your approved original photograph. No AI pixels. Works offline.'};
 const qwenAvailable=!!ready.qwen?.available;
 const qwen:EngineCapability={...QWEN,available:qwenAvailable,status:qwenAvailable?'available':(ready.qwen?.missingFiles?.length?'not-installed':'offline'),reason:ready.qwen?.reason||(qwenAvailable?'Local Qwen Image Edit is ready.':'Qwen Image Edit weights or ComfyUI are unavailable.')};
 const zWanted=!!ready.zimage?.available||!!ready.reimagine;
 const vramTight=typeof ready.vramFreeBytes==='number'&&ready.vramFreeBytes>0&&ready.vramFreeBytes<3.5*1024*1024*1024;
 const zAvail=zWanted&&!vramTight;
 const zimage:EngineCapability={...ZIMAGE,available:zAvail,status:zWanted?(vramTight?'insufficient-vram':'available'):'not-installed',reason:zWanted?(vramTight?'Z-Image weights are present, but free GPU memory is too low for a safe local run. Free VRAM or choose Product-safe design.':(ready.zimage?.reason||'Experimental local Z-Image is ready.')):(ready.zimage?.reason||'No compatible local still-image weights are installed for this runtime.')};
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
 return [automatic,productSafe,qwen,zimage];
}
function zimageReady(ready:GenerationReadiness){
 const wanted=!!ready.zimage?.available||!!ready.reimagine;
 if(!wanted)return {ok:false as const,reason:ready.zimage?.reason||'No compatible local still-image model is installed. Choose Product-safe design instead.'};
 if(typeof ready.vramFreeBytes==='number'&&ready.vramFreeBytes>0&&ready.vramFreeBytes<3.5*1024*1024*1024)
  return {ok:false as const,reason:'Free GPU memory is too low for a safe local Z-Image run. Choose Product-safe design, or free VRAM and retry.'};
 return {ok:true as const};
}
export function resolveGenerationEngine(choice:GenerationEngineId,ready:GenerationReadiness):EngineCapability{
 if(choice==='product-safe')return {...PRODUCT_SAFE,available:true,status:'available',reason:'Product-safe design · original photograph'};
 if(choice==='qwen'){
  if(!ready.qwen?.available)throw Error(ready.qwen?.reason||'Qwen Image Edit is not ready on this connection. Choose Product-safe design, or install the required weights. Your direction is saved.');
  return {...QWEN,available:true,status:'available',reason:'Local Qwen Image Edit'};
 }
 if(choice==='zimage'){
  const z=zimageReady(ready);if(!z.ok)throw Error(z.reason);
  return {...ZIMAGE,available:true,status:'available',reason:'Experimental local image model'};
 }
 if(ready.qwen?.available)return {...QWEN,available:true,status:'available',reason:'Automatic selected Qwen Image Edit'};
 if(zimageReady(ready).ok)return {...ZIMAGE,available:true,status:'available',reason:'Automatic selected local AI image'};
 return {...PRODUCT_SAFE,available:true,status:'available',reason:'Automatic selected Product-safe design · original photograph'};
}
export function engineSelectable(engines:EngineCapability[]){return engines.filter(e=>e.id==='automatic'||e.id==='product-safe'||e.available||e.id==='qwen'||e.id==='zimage');}
