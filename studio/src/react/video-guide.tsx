import {NumberInput} from './number-input';
import {useEffect,useState} from 'react';
import {SHELL} from '../shell';
export function VideoGuide(){
 const [depth,setDepth]=useState(0);
 useEffect(()=>{const update=(event:Event)=>setDepth((event as CustomEvent<number>).detail);addEventListener('osh-blockout-guide',update);return()=>removeEventListener('osh-blockout-guide',update)},[]);
 const [strength,setStrength]=useState<number|null>(null);
 const [video,setVideo]=useState(()=>SHELL.selected()?.video||''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{const selected=()=>{setVideo(SHELL.selected()?.video||'');setMessage('')},settings=(event:Event)=>setStrength((event as CustomEvent).detail),status=(event:Event)=>{const detail=(event as CustomEvent).detail;setBusy(detail.busy);setMessage(detail.message)};addEventListener('osh-video-guide-settings',settings);addEventListener('osh-media-selection',selected);addEventListener('osh-video-guide-status',status);return()=>{removeEventListener('osh-video-guide-settings',settings);removeEventListener('osh-media-selection',selected);removeEventListener('osh-video-guide-status',status)}},[]);
 if(!video&&!message&&strength===null&&!depth)return null;
 return <div className="video-guide-action">{depth>0&&<><span>3D depth · {depth} frames</span><button type="button" onClick={()=>dispatchEvent(new Event('osh-remove-blockout-guide'))}>Remove blockout guide</button></>}{strength!==null&&<label>Guide influence<NumberInput aria-label="Video guide influence percent" min={0} max={100} step={5} value={Math.round(strength*100)} onChange={event=>dispatchEvent(new CustomEvent('osh-video-guide-strength',{detail:+event.target.value/100}))}/>%</label>}{video&&<button type="button" disabled={busy} onClick={()=>dispatchEvent(new Event('osh-use-video-guide'))}>{busy?'Preparing guides…':'Use selected video as guide'}</button>}{message&&<span role="status">{message}</span>}</div>;
}
