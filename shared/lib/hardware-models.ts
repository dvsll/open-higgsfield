import type {ModelChoice} from '../runtime/model-catalog.ts';
export type HardwareDefault={id:string|null;label?:string;reason:string};
export type HardwareDefaults=Record<'keyframe'|'video'|'geometry',HardwareDefault>;
type Pack={id:string;capability:string;tier:string;minVramGB:number};
type File={file:string;used_by:string;alternates?:string[]};
/** Fit estimates for connected Studio workflows, not a model-quality benchmark. */
export function hardwareDefaults(catalog:{keyframe:ModelChoice[];video:ModelChoice[];geometry:ModelChoice[]},hardware:{name:string;vramGB:number;type?:string}|null,manifest:{packs:Pack[];models:File[]}):HardwareDefaults{
 const rank:Record<string,number>={best:3,balanced:2,fast:1},name=(path:string)=>path.replaceAll('\\','/').split('/').at(-1);
 return Object.fromEntries((['keyframe','video','geometry'] as const).map(kind=>{
  if(!hardware||hardware.type==='cpu'||/^cpu$/i.test(hardware.name)||!Number.isFinite(hardware.vramGB)||hardware.vramGB<=0)return [kind,{id:null,reason:'GPU memory is unavailable. Choose a model manually.'}];
  const capability=kind==='keyframe'?'image':kind;
  const options=catalog[kind].filter(model=>!model.parentId&&(kind!=='keyframe'||model.capabilities.some(cap=>cap.name==='Text to image'&&cap.status==='ready'))&&(kind!=='video'||!model.requiresStartImage&&model.capabilities.some(cap=>cap.name==='Shot prompt'&&cap.status==='ready'))).flatMap(model=>{
   const file=manifest.models.find(file=>[file.file,...file.alternates||[]].some(path=>name(path)===model.id));
   const pack=manifest.packs.find(pack=>pack.id===file?.used_by&&pack.capability===capability);
   return pack&&pack.minVramGB<=hardware.vramGB+.15?[{model,pack}]:[];
  }).sort((a,b)=>(rank[b.pack.tier]||0)-(rank[a.pack.tier]||0)||b.pack.minVramGB-a.pack.minVramGB);
  const selected=options[0];
  return [kind,selected?{id:selected.model.id,label:selected.model.label,reason:`${hardware.name} · ${hardware.vramGB} GB VRAM; ${selected.pack.minVramGB} GB fit estimate. Quality-oriented ${selected.pack.tier} preset.`}:{id:null,reason:`No installed ${capability} workflow has a fit estimate within ${hardware.vramGB} GB VRAM. Choose manually or add a smaller model.`}];
 })) as HardwareDefaults;
}
