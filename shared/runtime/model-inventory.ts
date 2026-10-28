export type InstalledModel={category:string;file:string};
/** Read ComfyUI's configured paths, including extra model folders and adapters. */
export async function installedModels(base:string,request:typeof fetch=fetch){
 const read=async(path:string)=>{const response=await request(base+path,{redirect:'error',signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('ComfyUI model inventory unavailable');return response.json()};
 const categories=await read('/models');if(!Array.isArray(categories))throw Error('Invalid ComfyUI model inventory');
 const groups=await Promise.all(categories.filter((category:unknown):category is string=>typeof category==='string'&&!['configs','custom_nodes','datasets'].includes(category)&&/^[a-zA-Z0-9_-]+$/.test(category)).map(async category=>{
  const files=await read('/models/'+encodeURIComponent(category));if(!Array.isArray(files))throw Error('Invalid ComfyUI model category');
  return files.filter((file:unknown):file is string=>typeof file==='string').map(file=>({category,file:file.replaceAll('\\','/')}));
 }));return groups.flat().sort((a,b)=>a.category.localeCompare(b.category)||a.file.localeCompare(b.file));
}

export function modelTags(model:InstalledModel,manifest:{packs:{id:string;capability:string}[];models:{file:string;used_by:string;alternates?:string[]}[]}){
 const matches=manifest.models.filter(entry=>[entry.file,...(entry.alternates||[])].some(file=>file.replaceAll('\\','/')===model.category+'/'+model.file));
 const media=new Set<string>(),uses=new Set<string>();
 for(const entry of matches){const kind=manifest.packs.find(pack=>pack.id===entry.used_by)?.capability;
  if(kind==='video'||kind==='blockout'){media.add('Video');uses.add(kind==='blockout'?'Camera / depth guidance':'Generation')}
  if(kind==='image'){media.add('Image');uses.add('Generation')}
  if(kind==='audio'||kind==='speech'){media.add('Audio');uses.add(kind==='speech'?'Speech':'Generation')}
  if(kind==='geometry'){media.add('3D');uses.add('Geometry')}
  if(kind==='segmentation'){media.add('Image');uses.add('Object selection')}
 }
 const roles:Record<string,string>={loras:'LoRAs / adapters',text_encoders:'Text encoding',clip:'Text encoding',clip_vision:'Image encoding',vae:'Encoding / decoding',upscale_models:'Upscaling',background_removal:'Background removal',geometry_estimation:'Geometry'};
 if(roles[model.category])uses.add(roles[model.category]);
 if(model.category==='background_removal'||model.category==='upscale_models')media.add('Image');
 if(model.category==='geometry_estimation')media.add('3D');
 return {...model,media:[...media].length?[...media]:['Unknown'],uses:[...uses].length?[...uses]:['Unknown']};
}
