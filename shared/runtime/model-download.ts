import { createWriteStream } from 'node:fs';
import { mkdir, stat, link, open, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
export type ModelFile={file:string;size_gb:number;used_by:string;license:string;url:string};
export type DownloadUpdate={phase:'downloading';file:string;received:number;total:number|null;index:number;count:number};
export async function validModel(path:string):Promise<boolean>{
 try{const fd=await open(path,'r');try{const prefix=Buffer.alloc(8);await fd.read(prefix,0,8,0);const length=Number(prefix.readBigUInt64LE());const size=(await fd.stat()).size;if(length<2||length>16*1024*1024||size<=length+8)return false;const bytes=Buffer.alloc(length);await fd.read(bytes,0,length,8);const header=JSON.parse(bytes.toString('utf8'));const tensors=Object.entries(header).filter(([key])=>key!=='__metadata__').map(([,value])=>value as any),payload=size-length-8;return tensors.length>0&&tensors.every(value=>value&&Array.isArray(value.data_offsets)&&value.data_offsets.length===2&&value.data_offsets.every((n:unknown)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0)&&value.data_offsets[0]<=value.data_offsets[1]&&value.data_offsets[1]<=payload)&&tensors.reduce((max,value)=>Math.max(max,value.data_offsets[1]),0)===payload}finally{await fd.close()}}catch{return false}
}
export async function downloadModels(root:string,models:ModelFile[],options:{signal?:AbortSignal;onProgress?:(update:DownloadUpdate)=>void;fetcher?:typeof fetch}={}):Promise<void>{
 for(const[index,model]of models.entries()){
  options.signal?.throwIfAborted();const destination=join(root,model.file);if(await validModel(destination))continue;
  try{await stat(destination);throw new Error(`${model.file} already exists but is incomplete or invalid. Move it aside before retrying; it has not been overwritten.`)}catch(error:any){if(error.code!=='ENOENT')throw error}
  await mkdir(dirname(destination),{recursive:true});const part=destination+'.part';if(await validModel(part)){await link(part,destination);await rm(part);continue}let offset=await stat(part).then(s=>s.size).catch(()=>0);
  const response=await(options.fetcher||fetch)(model.url,{headers:offset?{Range:`bytes=${offset}-`}:{},signal:options.signal,redirect:'follow'});
  if(!response.ok||!response.body)throw new Error(`Download failed for ${model.file} (HTTP ${response.status}). Check the model source/license and your connection.`);
  if(response.status===206){const range=response.headers.get('content-range');if(!range?.startsWith(`bytes ${offset}-`))throw new Error('Download server returned an unexpected byte range.')}else offset=0;
  const length=Number(response.headers.get('content-length')),total=Number.isFinite(length)&&length>0?offset+length:null;let received=offset,last=0;
  const report=()=>options.onProgress?.({phase:'downloading',file:model.file,received,total,index:index+1,count:models.length});report();
  const stream=Readable.fromWeb(response.body as any);stream.on('data',(chunk:Buffer)=>{received+=chunk.length;if(Date.now()-last>200){last=Date.now();report()}});
  await pipeline(stream,createWriteStream(part,{flags:offset?'a':'w'}),{signal:options.signal});report();
  if(total!==null&&received!==total)throw new Error(`Incomplete download: ${model.file}. Retry to resume it.`);
  if(!await validModel(part)){await rm(part,{force:true});throw new Error(`Downloaded file is not a valid safetensors model: ${model.file}.`)}
  await link(part,destination);await rm(part);
 }
}
