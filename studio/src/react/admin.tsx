import {Popup} from './popup';
import {AdminModels,type ModelSetup} from './admin-models';
import {logBrowserError} from '../error-log';
import {ErrorLogs} from './error-logs';
import {useEffect,useState,useRef} from 'react';
import './admin.css';
type Runtime=ModelSetup&{connected:boolean;canStart?:boolean;launchDirectory?:string;proxy:boolean;url:string;rendering?:boolean;detectedInstances?:string[];config?:{mode:string;modelsDir?:string}|null;task?:{busy:boolean;phase:string;message:string}};
export function AdminButton(){return <button className="toolbar-admin" onClick={()=>{location.href='/studio/admin'}}>Admin</button>}
export function AdminPage(){
 const [logsOpen,setLogsOpen]=useState(false);
 const [runtime,setRuntime]=useState<Runtime|null>(null),[error,setError]=useState('');
 const [address,setAddress]=useState(''),[connecting,setConnecting]=useState(false),[notice,setNotice]=useState('');
 const initialized=useRef(false);useEffect(()=>{if(runtime&&!initialized.current){initialized.current=true;setAddress(runtime.url)}},[runtime]);
 useEffect(()=>{const controller=new AbortController();let pending=false;const refresh=async()=>{if(pending)return;pending=true;try{const response=await fetch('/api/setup',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('Connection status unavailable');setRuntime(await response.json());setError('')}catch(e){if(!controller.signal.aborted)setError((e as Error).message)}finally{pending=false}};void refresh();const timer=setInterval(refresh,3000);return()=>{controller.abort();clearInterval(timer)}},[]);
 const url=runtime?.url&&/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+\/?$/.test(runtime.url)?runtime.url:null;
 async function reconnect(){
  if(connecting||runtime?.task?.busy||runtime?.rendering)return;
  setConnecting(true);setNotice('Reconnecting…');
  try{
   const managed=(runtime?.config?.mode==='managed'||runtime?.canStart)&&address.replace(/\/$/,'')===runtime.url.replace(/\/$/,'');
   const response=await fetch('/api/setup/'+(managed?'start':'connect'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(managed?{}:{url:address,modelsDir:runtime?.config?.modelsDir||''})});
   const result=await response.json();if(!response.ok)throw Error(result.error||'Reconnection failed');
   setNotice('Reconnection requested. Checking the runtime…');
   const status=await fetch('/api/setup',{cache:'no-store'});if(status.ok)setRuntime(await status.json());
  }catch(e){logBrowserError(e,'Admin reconnect');setNotice((e as Error).message)}finally{setConnecting(false)}
 }
 return <div className="admin-page"><header><a href="/studio/director">← Studio</a><h1>Admin</h1></header><main><h2>Local runtime</h2>
  <p>Manage the local generation runtime.</p>
  <dl className="admin-runtime"><dt>ComfyUI</dt><dd>{runtime?runtime.connected?'Connected':'Offline':'Checking…'}</dd><dt>Studio connector</dt><dd>{runtime?runtime.proxy?'Connected':'Offline':'Checking…'}</dd><dt>Installation</dt><dd>{runtime?.config?.mode==='managed'?'Managed by Studio':runtime?.config?'Existing ComfyUI':'Not configured'}</dd></dl>
  <form className="admin-reconnect" onSubmit={event=>{event.preventDefault();void reconnect()}}><label>ComfyUI address<input aria-label="ComfyUI address" value={address} onChange={event=>setAddress(event.target.value)} placeholder="http://127.0.0.1:8188" required disabled={connecting||runtime?.task?.busy}/></label><button type="submit" disabled={!runtime||connecting||runtime.task?.busy||runtime.rendering}>{connecting||runtime?.task?.busy?'Connecting…':runtime?.canStart&&!runtime.connected?'Start & reconnect':'Reconnect'}</button></form>
  {!!runtime?.detectedInstances?.length&&!runtime.connected&&<div className="admin-detected">{runtime.detectedInstances.map(found=><button key={found} disabled={connecting||runtime.task?.busy} onClick={()=>setAddress(found)}>Use {found}</button>)}</div>}
  <p role="status">{runtime?.task?.busy||runtime?.task?.phase==='error'?runtime.task.message:runtime?.connected&&runtime.proxy?'Connected and ready.':notice}</p>
  {runtime&&!runtime.connected&&<p>{runtime.canStart?'Studio can start the detected local ComfyUI and reconnect automatically.':'No launchable local installation found. Use Local setup to install ComfyUI, or configure its folder with COMFYUI_DIR.'}</p>}
  {error&&<p role="status">{error}</p>}
  <div className="popup-actions">{url&&<a href={url} target="_blank" rel="noopener noreferrer">Open ComfyUI ↗</a>}<button onClick={()=>dispatchEvent(new Event('osh-open-runtime-setup'))}>Local setup</button></div>
 <AdminModels setup={runtime}/>
 <section className="admin-section"><div className="admin-section-title"><div><h2>Diagnostics</h2><p>Runtime and browser errors</p></div><button onClick={()=>setLogsOpen(true)}>Open error logs</button></div></section>
 {logsOpen&&<Popup title="Error logs" onClose={()=>setLogsOpen(false)} className="admin-logs-popup"><ErrorLogs/></Popup>}
 </main></div>;
}
