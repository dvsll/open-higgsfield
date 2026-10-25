import {useEffect,useState} from 'react';
import './admin.css';
type Runtime={connected:boolean;proxy:boolean;url:string;config?:{mode:string}|null};
export function AdminButton(){return <button className="toolbar-admin" onClick={()=>{location.href='/studio/admin'}}>Admin</button>}
export function AdminPage(){
 const [runtime,setRuntime]=useState<Runtime|null>(null),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();let pending=false;const refresh=async()=>{if(pending)return;pending=true;try{const response=await fetch('/api/setup',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('Connection status unavailable');setRuntime(await response.json());setError('')}catch(e){if(!controller.signal.aborted)setError((e as Error).message)}finally{pending=false}};void refresh();const timer=setInterval(refresh,3000);return()=>{controller.abort();clearInterval(timer)}},[]);
 const url=runtime?.url&&/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+\/?$/.test(runtime.url)?runtime.url:null;
 return <div className="admin-page"><header><a href="/studio/director">← Studio</a><h1>Admin</h1></header><main><h2>Local runtime</h2>
  <p>Manage the local generation runtime.</p>
  <dl className="admin-runtime"><dt>ComfyUI</dt><dd>{runtime?runtime.connected?'Connected':'Offline':'Checking…'}</dd><dt>Studio connector</dt><dd>{runtime?runtime.proxy?'Connected':'Offline':'Checking…'}</dd><dt>Installation</dt><dd>{runtime?.config?.mode==='managed'?'Managed by Studio':runtime?.config?'Existing ComfyUI':'Not configured'}</dd></dl>
  {error&&<p role="status">{error}</p>}
  <div className="popup-actions">{url&&<a href={url} target="_blank" rel="noopener noreferrer">Open ComfyUI ↗</a>}<button onClick={()=>dispatchEvent(new Event('osh-open-runtime-setup'))}>Local setup</button></div>
 </main></div>;
}
