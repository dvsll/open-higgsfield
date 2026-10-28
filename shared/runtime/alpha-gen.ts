import {spawn} from 'node:child_process';
import {join,dirname} from 'node:path';
import {stat,unlink} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
export class AlphaError extends Error{constructor(public status:number,message:string){super(message)}}
type Graph=Record<string,{class_type:string;inputs:Record<string,any>}>;
type Env=Record<string,string|undefined>;
export const alphaAdapter='ltx-2.5-22b-ic-lora-alpha-gen-0.9.safetensors';
const modelChoices={
 transformer:['ltx-2.5-22b-distilled-transformer-bf16.safetensors','ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors','ltx-2.5-22b-distilled-transformer-nvfp4.safetensors'],
 text:['gemma4-12b-with-proj-ltx-2.5-bf16.safetensors','gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors'],
 video:['ltx-2.5-video-vae-bf16.safetensors'],audio:['ltx-2.5-audio-vae-bf16.safetensors']
};
function options(nodes:any,node:string,key:string):string[]{const field=nodes[node]?.input?.required?.[key];return Array.isArray(field?.[0])?field[0]:field?.[1]?.options||[]}
export function alphaReadiness(nodes:any,graph:Graph){
 const missingNodes=[...new Set(Object.values(graph).map(node=>node.class_type))].filter(node=>!nodes[node]);
 const choose=(list:string[],node:string,key:string)=>{for(const name of list){const found=options(nodes,node,key).find(value=>value.replaceAll(String.fromCharCode(92),'/').split('/').at(-1)===name);if(found)return found}return undefined};
 const models={transformer:choose(modelChoices.transformer,'UNETLoader','unet_name'),text:choose(modelChoices.text,'CLIPLoader','clip_name'),video:choose(modelChoices.video,'VAELoader','vae_name'),audio:choose(modelChoices.audio,'VAELoader','vae_name'),adapter:choose([alphaAdapter],'LTXICLoRALoaderModelOnly','lora_name')||choose([alphaAdapter],'LoraLoaderModelOnly','lora_name')};
 const missingModels=Object.entries(models).filter(([,value])=>!value).map(([key])=>key==='adapter'?alphaAdapter:modelChoices[key as keyof typeof modelChoices][0]);
 return {available:!missingNodes.length&&!missingModels.length,missingNodes,missingModels,models,model:'LTX2.5 Alpha Gen',licenseUrl:'https://huggingface.co/Lightricks/LTX-2.5-22b-IC-LoRA-Alpha-Gen',nodeUrl:'https://github.com/Lightricks/ComfyUI-LTXVideo',limits:{frames:121,width:1920,height:1088}};
}
function run(exe:string,args:string[],timeout=30000):Promise<string>{return new Promise((resolve,reject)=>{const child=spawn(exe,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='',error='';const timer=setTimeout(()=>{child.kill();reject(new AlphaError(504,'Video preparation timed out.'))},timeout);child.stdout.on('data',data=>output=(output+data).slice(-50000));child.stderr.on('data',data=>error=(error+data).slice(-2000));child.on('error',()=>{clearTimeout(timer);reject(new AlphaError(503,'Local FFmpeg/FFprobe is unavailable.'))});child.on('close',code=>{clearTimeout(timer);if(code)reject(new AlphaError(422,'Could not prepare this video for cutout.'));else resolve(output)})})}
function tools(env:Env){const ffmpeg=env.FFMPEG_PATH||'ffmpeg';return {ffmpeg,ffprobe:env.FFPROBE_PATH||(ffmpeg==='ffmpeg'?'ffprobe':join(dirname(ffmpeg),process.platform==='win32'?'ffprobe.exe':'ffprobe'))}}
export function alphaDimensions(width:number,height:number,frames:number,fps:number){
 if(![width,height,frames].every(v=>Number.isInteger(v)&&v>0)||!Number.isFinite(fps)||fps<1||fps>60)throw new AlphaError(400,'Use a video with a stable frame rate between 1 and 60 FPS.');
 const paddedWidth=Math.ceil(width/32)*32,paddedHeight=Math.ceil(height/32)*32,modelFrames=Math.ceil((frames-1)/8)*8+1;
 if(paddedWidth>1920||paddedHeight>1088)throw new AlphaError(400,'Alpha Gen supports videos up to 1920×1088.');
 if(frames<9||modelFrames>121)throw new AlphaError(400,'Choose a short clip between 9 and 121 frames for Alpha Gen.');
 return {width,height,paddedWidth,paddedHeight,frames,modelFrames,fps,duration:frames/fps};
}
export async function prepareAlphaSource(root:string,input:unknown,env:Env){
 if(typeof input!=='string'||!/^\/outputs\/[a-f0-9]{16}\.(mp4|webm)$/.test(input))throw new AlphaError(400,'Select a video from Project files.');
 const path=join(root,input.slice(9));let info;try{info=await stat(path)}catch{throw new AlphaError(404,'The selected video is missing.')};if(!info.isFile()||info.size>100*1024*1024)throw new AlphaError(400,'Choose a video under 100 MB.');
 const executable=tools(env),probe=JSON.parse(await run(executable.ffprobe,['-v','error','-protocol_whitelist','file,pipe','-show_streams','-show_format','-of','json',path]));
 const stream=probe.streams?.find((s:any)=>s.codec_type==='video'&&s.disposition?.attached_pic!==1),hasAudio=probe.streams?.some((s:any)=>s.codec_type==='audio'),duration=Number(probe.format?.duration||stream?.duration);if(!stream||!Number.isFinite(duration)||duration<=0||duration>121)throw new AlphaError(400,'Choose a short video clip.');
 const rate=String(stream.avg_frame_rate||stream.r_frame_rate).split('/').map(Number),fps=rate[0]/(rate[1]||1);
 const referenceRate=String(stream.r_frame_rate||'0/1').split('/').map(Number),referenceFps=referenceRate[0]/(referenceRate[1]||1);if(Number.isFinite(referenceFps)&&referenceFps>0&&Math.abs(referenceFps-fps)>.02)throw new AlphaError(400,'Use a constant-frame-rate video for frame-aligned cutouts.');
 if(!Number.isFinite(fps)||duration*fps>122)throw new AlphaError(400,'Choose a clip with at most 121 frames.');
 const counted=JSON.parse(await run(executable.ffprobe,['-v','error','-protocol_whitelist','file,pipe','-select_streams','v:0','-count_frames','-show_entries','stream=nb_read_frames','-of','json',path]));
 const shape=alphaDimensions(stream.width,stream.height,Number(counted.streams?.[0]?.nb_read_frames),fps),prepared=join(root,randomBytes(8).toString('hex')+'.mp4');
 try{await run(executable.ffmpeg,['-nostdin','-v','error','-protocol_whitelist','file,pipe','-i',path,'-an','-vf',`pad=${shape.paddedWidth}:${shape.paddedHeight}:0:0:black,tpad=stop_mode=clone:stop_duration=1`,'-r',String(fps),'-frames:v',String(shape.modelFrames),'-c:v','libx264rgb','-crf','0','-pix_fmt','rgb24',prepared]);return {...shape,path,prepared,hasAudio:!!hasAudio}}catch(error){await unlink(prepared).catch(()=>{});throw error}
}
export function alphaGraph(base:Graph,shape:ReturnType<typeof alphaDimensions>,models:ReturnType<typeof alphaReadiness>['models']){
 const graph=structuredClone(base);if(Object.values(models).some(value=>!value))throw new AlphaError(503,'Install the matching LTX2.5 Alpha Gen models.');
 graph['1'].inputs.unet_name=models.transformer;graph['2'].inputs.clip_name=models.text;graph['3'].inputs.vae_name=models.video;graph['4'].inputs.vae_name=models.audio;graph['10'].inputs.lora_name=models.adapter;
 Object.assign(graph['9'].inputs,{width:shape.paddedWidth,height:shape.paddedHeight,length:shape.modelFrames});Object.assign(graph['12'].inputs,{frames_number:shape.modelFrames,frame_rate:shape.fps});graph['8'].inputs.frame_rate=shape.fps;
 for(const id of ['26','29'])Object.assign(graph[id].inputs,{width:shape.width,height:shape.height});for(const id of ['27','30'])graph[id].inputs.length=shape.frames;for(const id of ['22','28'])graph[id].inputs.fps=shape.fps;
 return graph;
}

export async function preserveCutoutAudio(root:string,cutout:string,source:{path:string;duration:number;hasAudio:boolean},env:Env){
 if(!source.hasAudio)return cutout;
 if(!/^\/outputs\/[a-f0-9]{16}\.webm$/.test(cutout))throw new AlphaError(500,'Invalid cutout output.');
 const filename=randomBytes(8).toString('hex')+'.webm',path=join(root,filename);
 try{await run(tools(env).ffmpeg,['-nostdin','-v','error','-protocol_whitelist','file,pipe','-i',join(root,cutout.slice(9)),'-i',source.path,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','libopus','-t',String(source.duration),path]);return '/outputs/'+filename}catch(error){await unlink(path).catch(()=>{});throw error}
}
