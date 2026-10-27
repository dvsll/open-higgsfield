import {useEffect,useState} from 'react';
import {SHELL} from '../shell';
export function VideoGuide(){
 const [video,setVideo]=useState(()=>SHELL.selected()?.video||''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{const selected=()=>{setVideo(SHELL.selected()?.video||'');setMessage('')},status=(event:Event)=>{const detail=(event as CustomEvent).detail;setBusy(detail.busy);setMessage(detail.message)};addEventListener('osh-media-selection',selected);addEventListener('osh-video-guide-status',status);return()=>{removeEventListener('osh-media-selection',selected);removeEventListener('osh-video-guide-status',status)}},[]);
 if(!video&&!message)return null;
 return <div className="video-guide-action">{video&&<button type="button" disabled={busy} onClick={()=>dispatchEvent(new Event('osh-use-video-guide'))}>{busy?'Preparing guides…':'Use selected video as guide'}</button>}{message&&<span role="status">{message}</span>}</div>;
}
