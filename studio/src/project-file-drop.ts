import {createElement} from 'react';
import {SC} from './scene';
import {renderView,unmountView} from './react/render';
import {FileDropOverlay} from './react/file-drop';
import {externalFiles,importType} from './file-import-policy';
import type {ProjectFile} from './project-files-index';

let mounted=false;
export function mountProjectFileDrop(){
 if(mounted)return;mounted=true;
 const host=document.createElement('div');host.className='project-file-drop-host';document.body.append(host);
 const abort=new AbortController();
 let active=false,busy=false,disposed=false,depth=0,watchdog:ReturnType<typeof setTimeout>|undefined,message='',errors:string[]=[],queue:File[]=[],done=0,total=0;
 const draw=()=>{if(!disposed)renderView(host,createElement(FileDropOverlay,{active,busy,message,errors,onFiles:enqueue,onDismiss:()=>{message='';errors=[];draw()}}))};
 const reset=()=>{clearTimeout(watchdog);depth=0;if(active){active=false;draw()}};
 const guided=()=>{const popup=document.querySelector<HTMLElement>('.tour-popover');return !!document.querySelector('.tour-choice[open]')||!!popup&&!popup.hidden};
 const hover=(event:DragEvent)=>{
  if(!externalFiles(event.dataTransfer))return;
  event.preventDefault();if(guided())return;
  event.dataTransfer!.dropEffect='copy';
  if(event.type==='dragenter')depth++;
  if(!active){active=true;draw()}
  clearTimeout(watchdog);watchdog=setTimeout(reset,1500);
 };
 const leave=(event:DragEvent)=>{if(!active)return;depth=Math.max(0,depth-1);if(!depth||event.clientX<=0||event.clientY<=0||event.clientX>=innerWidth||event.clientY>=innerHeight)reset()};
 async function image(input:File):Promise<ProjectFile>{
  const bitmap=await createImageBitmap(input);
  try{
   const scale=Math.min(1,2048/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const context=canvas.getContext('2d');if(!context)throw Error('Could not read this image.');context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   const png=canvas.toDataURL('image/png');if((png.length-22)*.75>5*1024*1024)throw Error('Image is too detailed for the 5 MB image import limit. Try a smaller copy.');
   const result=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:png}),signal:abort.signal});
   const value=await result.json();if(!result.ok)throw Error(value.error||'Image import failed.');return {url:value.url,label:input.name,kind:'image',origin:'uploaded'};
  }finally{bitmap.close()}
 }
 async function run(){
  if(busy)return;busy=true;draw();
  while(queue.length&&!disposed){
   const input=queue.shift()!;message=`${done+1} of ${total} · ${input.name}`;draw();
   try{
    const type=importType(input);let file:ProjectFile;
    if(type.startsWith('image/'))file=await image(input);
    else{
     const response=await fetch('/api/media',{method:'POST',headers:{'Content-Type':type},body:input,signal:abort.signal});
     const value=await response.json();if(!response.ok)throw Error(value.error||'Media import failed.');file={url:value.url,label:input.name,kind:value.kind,origin:'uploaded'};
    }
    if(disposed)return;
    SC.set('osh-project-files',[...(SC.get('osh-project-files')||[]),file]);dispatchEvent(new Event('osh-project-media'));
   }catch(error){if(disposed)return;errors.push(`${input.name}: ${(error as Error).message}`)}
   done++;
  }
  busy=false;message=`${done-errors.length} ${done-errors.length===1?'file':'files'} added to project files${errors.length?` · ${errors.length} failed`:''}`;draw();
  if(done>errors.length)dispatchEvent(new CustomEvent('osh-reveal-window',{detail:'files'}));
 }
 function enqueue(files:File[]){
  if(!files.length)return;
  if(!busy){done=0;total=0;errors=[]}queue.push(...files);total+=files.length;void run();
 }
 const drop=(event:DragEvent)=>{
  if(!externalFiles(event.dataTransfer))return;
  event.preventDefault();event.stopImmediatePropagation();reset();if(guided())return;
  const files=Array.from(event.dataTransfer?.files||[]);if(!files.length){message='Drop individual files to import them.';draw();return}enqueue(files);
 };
 const cancel=(event:KeyboardEvent)=>{if(event.key==='Escape')reset()};
 window.addEventListener('dragenter',hover,true);window.addEventListener('dragover',hover,true);window.addEventListener('dragleave',leave,true);window.addEventListener('drop',drop,true);window.addEventListener('blur',reset);window.addEventListener('keydown',cancel,true);
 window.addEventListener('pagehide',()=>{disposed=true;abort.abort();reset();window.removeEventListener('dragenter',hover,true);window.removeEventListener('dragover',hover,true);window.removeEventListener('dragleave',leave,true);window.removeEventListener('drop',drop,true);window.removeEventListener('blur',reset);window.removeEventListener('keydown',cancel,true);unmountView(host);host.remove();mounted=false},{once:true});
 draw();
}
