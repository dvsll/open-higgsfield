import {useEffect,useRef} from 'react';
import './file-drop.css';
export function FileDropOverlay({active,busy,message,errors,onDismiss,onFiles}:{active:boolean;busy:boolean;message:string;errors:string[];onDismiss:()=>void;onFiles:(files:File[])=>void}){
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{const open=()=>input.current?.click();window.addEventListener('osh-import-files',open);return()=>window.removeEventListener('osh-import-files',open)},[]);
 return <>
  <input ref={input} type="file" hidden multiple accept=".png,.jpg,.jpeg,.webp,.mp4,.webm,.mp3,.wav,.m4a,.flac,.ogg" aria-label="Import project files" onChange={event=>{onFiles(Array.from(event.target.files||[]));event.target.value=''}}/>
  {active&&<div className="project-file-drop" aria-hidden="true"><div><svg viewBox="0 0 48 48"><path d="M24 8v32M8 24h32"/></svg><strong>Add to project files</strong><span>Drop images, video or audio anywhere</span><small>Images fit within 2048 px · audio and video up to 100 MB / 10 minutes</small></div></div>}
  {(message||errors.length>0)&&<section className="file-import-status" role="status" aria-live="polite" aria-label="File import"><div><strong>{busy?'Importing files…':message}</strong>{busy&&<p>{message}</p>}{errors.length>0&&<ul>{errors.map((error,index)=><li key={index}>{error}</li>)}</ul>}</div>{!busy&&<button type="button" aria-label="Dismiss file import status" onClick={onDismiss}>×</button>}</section>}
 </>;
}
