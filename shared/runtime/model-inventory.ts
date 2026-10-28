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
