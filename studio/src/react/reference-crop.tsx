import {useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Popup} from './popup';
import {OSH} from '../../../shared/runtime/client';

type Rect={x:number;y:number;w:number;h:number};
const full:Rect={x:0,y:0,w:1,h:1};
/** Selection coordinates stay relative to the original image, independently of popup size. */
export function ReferenceCrop({url,onSave,onClose}:{url:string;onSave:(url:string)=>void;onClose:()=>void}){
 const image=useRef<HTMLImageElement>(null),drag=useRef<{x:number;y:number;before:Rect}|null>(null);
 const [size,setSize]=useState({w:1,h:1}),[loaded,setLoaded]=useState(false),[rect,setRect]=useState(full),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const point=(event:React.PointerEvent<HTMLDivElement>)=>{const b=event.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-b.left)/b.width)),y:Math.max(0,Math.min(1,(event.clientY-b.top)/b.height))}};
 const save=async()=>{
  if(!loaded||busy||drag.current)return;
  setBusy(true);setError('');
  try{
   const x=Math.min(size.w-1,Math.floor(rect.x*size.w)),y=Math.min(size.h-1,Math.floor(rect.y*size.h));
   const w=Math.min(size.w-x,Math.max(1,Math.round(rect.w*size.w))),h=Math.min(size.h-y,Math.max(1,Math.round(rect.h*size.h)));
   if(w<2||h<2)throw Error('Select a larger area.');
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const context=canvas.getContext('2d');if(!context)throw Error('Could not prepare the crop.');
   context.drawImage(image.current!,x,y,w,h,0,0,w,h);
   const result=await OSH.upload(canvas.toDataURL('image/png'));onSave(result.url);
  }catch(e){setError((e as Error).message);setBusy(false)}
 };
 return createPortal(<Popup title="Crop reference" className="reference-crop" onClose={onClose} dismissible={!busy}>
  <p>Drag over the part you want to capture.</p>
  <div className="reference-crop-stage" style={{width:`min(100%, ${58*size.w/size.h}vh)`,aspectRatio:`${size.w}/${size.h}`}}
   onPointerDown={event=>{if(!loaded||busy||event.button!==0)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);const p=point(event);drag.current={...p,before:rect};setRect({...p,w:0,h:0})}}
   onPointerMove={event=>{if(!drag.current)return;const p=point(event),start=drag.current;setRect({x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),w:Math.abs(p.x-start.x),h:Math.abs(p.y-start.y)})}}
   onPointerUp={event=>{if(!drag.current)return;const p=point(event),start=drag.current;const next={x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),w:Math.abs(p.x-start.x),h:Math.abs(p.y-start.y)};setRect(next.w*size.w<2||next.h*size.h<2?start.before:next);drag.current=null;event.currentTarget.releasePointerCapture(event.pointerId)}}
   onPointerCancel={()=>{if(drag.current)setRect(drag.current.before);drag.current=null}}>
   <img ref={image} src={url} alt="Reference to crop" draggable={false} onLoad={event=>{setSize({w:event.currentTarget.naturalWidth,h:event.currentTarget.naturalHeight});setLoaded(true)}} onError={()=>setError('Reference image could not be loaded.')}/>
   {loaded&&<div className="reference-crop-selection" style={{left:`${rect.x*100}%`,top:`${rect.y*100}%`,width:`${rect.w*100}%`,height:`${rect.h*100}%`}}/>}
  </div>
  <footer className="popup-actions"><span role="status">{busy?'Saving crop…':error||`${Math.round(rect.w*size.w)} × ${Math.round(rect.h*size.h)} px`}</span><button type="button" disabled={busy} onClick={()=>setRect(full)}>Reset crop</button><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button type="button" className="reference-crop-save" disabled={!loaded||busy} onClick={()=>void save()}>Use crop</button></footer>
 </Popup>,document.body);
}
