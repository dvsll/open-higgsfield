import {useEffect,useState} from 'react';
import {Popup} from './popup';
type Runtime={connected:boolean;proxy:boolean;url:string;config?:{mode:string}|null};
export function AdminButton(){
 const [open,setOpen]=useState(false),[runtime,setRuntime]=useState<Runtime|null>(null),[error,setError]=useState('');
 useEffect(()=>{if(!open)return;const controller=new AbortController();let pending=false;const refresh=async()=>{if(pending)return;pending=true;try{const response=await fetch('/api/setup',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('Connection status unavailable');setRuntime(await response.json());setError('')}catch(e){if(!controller.signal.aborted)setError((e as Error).message)}finally{pending=false}};void refresh();const timer=setInterval(refresh,3000);return()=>{controller.abort();clearInterval(timer)}},[open]);
 const url=runtime?.url&&/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+\/?$/.test(runtime.url)?runtime.url:null;
 return <><button className="toolbar-admin" onClick={()=>setOpen(true)}>Admin</button>{open&&<Popup title="Admin" closeLabel="Close admin" onClose={()=>setOpen(false)}>
  <p>Manage the local generation runtime.</p>
  <dl className="admin-runtime"><dt>ComfyUI</dt><dd>{runtime?runtime.connected?'Connected':'Offline':'Checking…'}</dd><dt>Studio connector</dt><dd>{runtime?runtime.proxy?'Connected':'Offline':'Checking…'}</dd><dt>Installation</dt><dd>{runtime?.config?.mode==='managed'?'Managed by Studio':runtime?.config?'Existing ComfyUI':'Not configured'}</dd></dl>
  {error&&<p role="status">{error}</p>}
  <div className="popup-actions">{url&&<a href={url} target="_blank" rel="noopener noreferrer">Open ComfyUI ↗</a>}<button onClick={()=>dispatchEvent(new Event('osh-open-runtime-setup'))}>Local setup</button></div>
 </Popup>}</>;
}
