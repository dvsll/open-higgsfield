import {NumberInput} from './number-input';
import {useEffect,useState} from 'react';
import {SHELL} from '../shell';
export function VideoGuide(){
 const [strength,setStrength]=useState<number|null>(null);
 const [video,setVideo]=useState(()=>SHELL.selected()?.video||''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{const selected=()=>{setVideo(SHELL.selected()?.video||'');setMessage('')},settings=(event:Event)=>setStrength((event as CustomEvent).detail),status=(event:Event)=>{const detail=(event as CustomEvent).detail;setBusy(detail.busy);setMessage(detail.message)};addEventListener('osh-video-guide-settings',settings);addEventListener('osh-media-selection',selected);addEventListener('osh-video-guide-status',status);return()=>{removeEventListener('osh-video-guide-settings',settings);removeEventListener('osh-media-selection',selected);removeEventListener('osh-video-guide-status',status)}},[]);
 if(!video&&!message&&strength===null)return null;
 return <div className="video-guide-action">{strength!==null&&<label>Guide influence<NumberInput aria-label="Video guide influence percent" min={0} max={100} step={5} value={Math.round(strength*100)} onChange={event=>dispatchEvent(new CustomEvent('osh-video-guide-strength',{detail:+event.target.value/100}))}/>%</label>}{video&&<button type="button" disabled={busy} onClick={()=>dispatchEvent(new Event('osh-use-video-guide'))}>{busy?'Preparing guides…':'Use selected video as guide'}</button>}{message&&<span role="status">{message}</span>}</div>;
}
