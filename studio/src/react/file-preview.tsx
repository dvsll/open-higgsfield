import {useEffect,useRef,useState} from 'react';
import type {ProjectFile} from '../project-files-index';
import {waveform} from '../audio-track';

export function FilePreview({file}:{file:ProjectFile}){
 const host=useRef<HTMLSpanElement>(null);
 const [thumbnail,setThumbnail]=useState(''),[visible,setVisible]=useState(false),[failed,setFailed]=useState(false),[peaks,setPeaks]=useState<number[]|null>(null);
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect()}},{rootMargin:'80px'});if(host.current)observer.observe(host.current);return()=>observer.disconnect()},[]);
 useEffect(()=>{if(!visible||file.kind!=='audio')return;let alive=true;void waveform(file.url).then(value=>{if(alive)setPeaks(value)}).catch(()=>{if(alive)setFailed(true)});return()=>{alive=false}},[visible,file.url,file.kind]);
 useEffect(()=>{setThumbnail('');if(!visible||file.kind!=='mesh')return;let alive=true;void import('../mesh-thumbnail').then(module=>module.meshThumbnail(file.previewUrl||file.url)).then(image=>{if(alive)setThumbnail(image)}).catch(()=>{});return()=>{alive=false}},[visible,file.kind,file.url,file.previewUrl]);
 return <span ref={host} className={'file-preview file-preview-'+file.kind} aria-hidden="true">
  {file.kind==='mesh'&&(thumbnail?<img src={thumbnail} alt=""/>:<span className="file-preview-fallback">3D</span>)}
  {file.kind==='captions'&&<span className="file-preview-fallback">SRT</span>}
  {visible&&!failed&&file.kind==='image'&&<img src={file.url} alt="" loading="lazy" onError={()=>setFailed(true)}/>}
  {visible&&!failed&&file.kind==='video'&&<video src={file.url} muted playsInline preload="metadata" onLoadedMetadata={event=>{const video=event.currentTarget;if(Number.isFinite(video.duration))video.currentTime=Math.min(.1,video.duration/2)}} onError={()=>setFailed(true)}/>}
  {file.kind==='audio'&&peaks?<svg viewBox="0 0 160 48" preserveAspectRatio="none"><path d={peaks.map((peak,x)=>`M${x} ${24-Math.max(.5,peak*21)}v${Math.max(1,peak*42)}`).join(' ')} /></svg>:null}
  {(file.kind!=='captions'&&file.kind!=='mesh'&&(failed||!visible||file.kind==='audio'&&!peaks))&&<span className="file-preview-fallback">{file.kind==='audio'?'♫':file.kind==='video'?'▻':'▧'}</span>}
  {file.kind==='video'&&<span className="file-video-badge"><svg viewBox="0 0 16 16"><path d="m5 3 8 5-8 5Z"/></svg></span>}
 </span>;
}
