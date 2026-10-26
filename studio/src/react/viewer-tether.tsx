import {viewerTetherPath} from '../viewer-tether-path';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import '../viewer-tether.css';

export function ViewerTether({target,onChange}:{target:string|null;onChange:(target:string|null)=>void}){
 const [line,setLine]=useState<{x:number;y:number;endX:number;endY:number}|null>(null),[status,setStatus]=useState('');
 const cleanup=useRef<()=>void>(()=>{});
 useEffect(()=>()=>cleanup.current(),[]);
 useEffect(()=>{if(!status)return;const timer=setTimeout(()=>setStatus(''),1400);return()=>clearTimeout(timer)},[status]);
 return <div className="viewer-tether">
  <button type="button" className="viewer-pickwhip" aria-pressed={!!target} aria-label="Link Timeline viewer to a Sequence window" title="Drag Link sequence onto a Sequence window. Enter links Sequence; Escape cancels a drag." onClick={event=>{if(event.detail===0){onChange('timeline');setStatus('Linked to Sequence.')}}} onPointerDown={event=>{
   if(event.button!==0)return;event.preventDefault();event.stopPropagation();cleanup.current();
   const rect=event.currentTarget.getBoundingClientRect(),start={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
   document.body.classList.add('viewer-tether-dragging');setLine({...start,endX:event.clientX,endY:event.clientY});
   let candidate:HTMLElement|null=null;
   const move=(e:globalThis.PointerEvent)=>{candidate?.classList.remove('viewer-tether-target');candidate=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('.studio-window[data-window="timeline"]')||null;candidate?.classList.add('viewer-tether-target');setLine({...start,endX:e.clientX,endY:e.clientY})};
   const stop=()=>{document.body.classList.remove('viewer-tether-dragging');candidate?.classList.remove('viewer-tether-target');document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',stop);document.removeEventListener('keydown',key);window.removeEventListener('blur',stop);setLine(null);cleanup.current=()=>{}};
   const up=(e:globalThis.PointerEvent)=>{move(e);if(candidate){onChange('timeline');setStatus('Linked to Sequence.')}else setStatus('Link unchanged');stop()};
   const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();stop()}};
   cleanup.current=stop;document.addEventListener('pointermove',move);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',stop);document.addEventListener('keydown',key);window.addEventListener('blur',stop);
  }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.00 12.00 L12.12 12.02 L12.23 12.09 L12.32 12.19 L12.38 12.32 L12.40 12.48 L12.38 12.65 L12.30 12.82 L12.17 12.98 L12.00 13.12 L11.78 13.23 L11.53 13.29 L11.25 13.30 L10.96 13.24 L10.66 13.12 L10.38 12.94 L10.12 12.68 L9.91 12.37 L9.75 12.00 L9.66 11.59 L9.65 11.14 L9.73 10.69 L9.89 10.23 L10.15 9.80 L10.50 9.40 L10.93 9.06 L11.44 8.80 L12.00 8.62 L12.61 8.55 L13.24 8.59 L13.88 8.75 L14.49 9.03 L15.06 9.43 L15.57 9.94 L15.99 10.55 L16.31 11.24 L16.50 12.00 L16.55 12.80 L16.46 13.62 L16.22 14.44 L15.83 15.21 L15.29 15.93 L14.62 16.55 L13.84 17.05 L12.96 17.42 L12.00 17.62 L11.00 17.66 L9.99 17.52 L9.00 17.20 L8.06 16.69 L7.21 16.02 L6.48 15.19 L5.89 14.22 L5.48 13.15 L5.25 12.00 L5.23 10.81 L5.42 9.61 L5.83 8.44 L6.45 7.34 L7.26 6.35 L8.25 5.50 L9.39 4.83 L10.65 4.37 L12.00 4.12 L13.39 4.12 L14.78 4.36 L16.12 4.86 L17.38 5.58 L18.51 6.54 L19.47 7.69 L20.22 9.01 L20.74 10.46 L21.00 12.00"/></svg></button>

  <span className="viewer-tether-status" role="status" hidden={!status}>{status}</span>
  {line&&createPortal(<svg className="viewer-tether-line" aria-hidden="true"><path d={viewerTetherPath(line.x,line.y,line.endX,line.endY)}/><circle cx={line.endX} cy={line.endY} r="4"/></svg>,document.body)}
 </div>;
}
