import {useEffect,useState} from 'react';
import {Popup} from './popup';
import type {ModelPack} from '../model-install-plan';
export type ModelSetup={connected:boolean;rendering?:boolean;url:string;config?:{mode:string;modelsDir?:string}|null;modelsDirs?:string[];packs?:ModelPack[];task?:{busy:boolean;phase:string;message:string;received?:number;total?:number|null}};
type InstalledModel={category:string;file:string};
export function AdminModels({setup}:{setup:ModelSetup|null}){
 const [open,setOpen]=useState(false),[models,setModels]=useState<InstalledModel[]>([]),[query,setQuery]=useState(''),[category,setCategory]=useState('all'),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const refresh=async(signal?:AbortSignal)=>{setLoading(true);setError('');try{const response=await fetch('/api/setup/models',{cache:'no-store',signal}),data=await response.json();if(!response.ok)throw Error(data.error||'Could not read installed models');setModels(data.models)}catch(error){if(!signal?.aborted)setError((error as Error).message)}finally{if(!signal?.aborted)setLoading(false)}};
 useEffect(()=>{const controller=new AbortController();void refresh(controller.signal);return()=>controller.abort()},[setup?.connected]);
 const categories=[...new Set(models.map(model=>model.category))];
 const visible=models.filter(model=>(category==='all'||model.category===category)&&(model.category+'/'+model.file).toLowerCase().includes(query.toLowerCase()));
 const url=setup?.url&&/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+\/?$/.test(setup.url)?setup.url:null;
 return <section className="admin-section"><div className="admin-section-title"><div><h2>Models</h2><p>{models.length} installed files · {models.filter(model=>model.category==='loras').length} LoRAs / adapters</p></div><button onClick={()=>setOpen(true)}>Add models</button></div>
 <div className="model-inventory-toolbar"><input aria-label="Search installed models" placeholder="Search installed models and fine-tunes…" value={query} onChange={event=>setQuery(event.target.value)}/><select aria-label="Model category" value={category} onChange={event=>setCategory(event.target.value)}><option value="all">All types</option>{categories.map(type=><option key={type} value={type}>{type==='loras'?'LoRAs / adapters':type==='checkpoints'?'Checkpoints / fine-tunes':type}</option>)}</select><button disabled={loading} onClick={()=>void refresh()}>{loading?'Refreshing…':'Refresh'}</button></div>
 {error?<p role="status">{error}</p>:<div className="model-inventory-list">{visible.map(model=><div key={model.category+'/'+model.file}><span>{model.file}</span><small>{model.category}</small></div>)}{!loading&&!visible.length&&<p>No matching model files.</p>}</div>}
 <p className="model-inventory-hint">Files visible to ComfyUI, including shared folders. Full fine-tunes appear under checkpoints or diffusion models; filenames do not identify their base model reliably. Studio can use files supported by its workflows.</p>
 {open&&<Popup title="Add models through ComfyUI" onClose={()=>{setOpen(false);void refresh()}} className="admin-model-popup"><p>Use ComfyUI’s model browser or Manager to search and add models. Return here and refresh after downloading.</p><p>Only use open-weight models. Check the model’s license and required workflow before downloading.</p><div className="popup-actions">{url&&<a href={url} target="_blank" rel="noopener noreferrer">Open ComfyUI ↗</a>}<button onClick={()=>void refresh()}>Refresh installed models</button></div><p>Search and download options depend on your ComfyUI version and installed Manager. Studio no longer uses a fixed model-pack list here.</p></Popup>}
 </section>;
}
