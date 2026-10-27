import {useEffect,useRef,useState} from 'react';
import {SC} from '../scene';
import {OSH} from '../../../shared/runtime/client';
import {MediaModelPicker} from './media-model-picker';
import {NumberInput} from './number-input';
import {AudioPlayer} from './audio-player';
import './prompt-media.css';

export function PromptMedia(){
 const root=useRef<HTMLDivElement>(null),[media,setMedia]=useState<'video'|'audio'>('video');
 useEffect(()=>{const change=(event:Event)=>setMedia((event as CustomEvent).detail==='audio'?'audio':'video');addEventListener('osh-prompt-media',change);return()=>removeEventListener('osh-prompt-media',change)},[]);
 useEffect(()=>{const composer=root.current?.closest<HTMLElement>('.composer');if(composer)composer.dataset.media=media},[media]);
 return <div className="prompt-media" ref={root}><label className="prompt-media-type">Media<select aria-label="Prompt media type" value={media} onChange={e=>setMedia(e.target.value as 'video'|'audio')}><option value="video">Video</option><option value="audio">Audio</option></select></label><div hidden={media!=='audio'}><AudioComposer/></div></div>;
}
function AudioComposer(){
 const saved=SC.get('osh-audio-composer')||{};
 const [prompt,setPrompt]=useState<string>(saved.prompt||''),[duration,setDuration]=useState<number>(saved.duration||4),[seed,setSeed]=useState<number>(saved.seed??7),[model,setModel]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[url,setUrl]=useState('');
 useEffect(()=>{SC.set('osh-audio-composer',{prompt,duration,seed})},[prompt,duration,seed]);
 useEffect(()=>{let alive=true;const refresh=()=>void fetch('/api/models').then(r=>r.json()).then(value=>{if(alive)setModel(value.audio?.available?value.audio.model:'')}).catch(()=>{if(alive)setModel('')});refresh();addEventListener('osh-models-changed',refresh);return()=>{alive=false;removeEventListener('osh-models-changed',refresh)}},[]);
 async function generate(){if(busy||!model||!prompt.trim()||duration<=0||duration>47)return;setBusy(true);setStatus('Generating audio…');try{const result=await OSH.audio(prompt,duration,seed);const layer={id:crypto.randomUUID(),name:prompt.trim().slice(0,80),kind:'sfx',start:0,duration:result.duration||duration,text:prompt,url:result.audio};dispatchEvent(new CustomEvent('osh-audio-generated',{detail:layer}));setUrl(result.audio);setStatus('Audio added to the sequence.')}catch(error){setStatus((error as Error).message)}finally{setBusy(false)}}
 return <form className="audio-composer" data-generating={busy} onSubmit={e=>{e.preventDefault();void generate()}}><div className="audio-composer-scroll"><MediaModelPicker media="Audio" models={model?[model]:[]} value={model} disabled={busy} formatLabel={()=>'Stable Audio Open 1.0'} onChange={()=>{}}/><label className="audio-composer-prompt">Prompt<textarea id="audioComposerPrompt" value={prompt} disabled={busy} maxLength={1500} placeholder="Describe sounds, ambience or music…" onChange={e=>setPrompt(e.target.value)}/></label><details className="prompt-advanced"><summary>Advanced</summary><div className="audio-composer-settings"><label>Duration (s)<NumberInput aria-label="Audio duration" min={.1} max={47} step={.1} disabled={busy} value={duration} onChange={e=>setDuration(+e.target.value)}/></label><label>Seed<NumberInput aria-label="Audio seed" min={0} max={2147483647} step={1} disabled={busy} value={seed} onChange={e=>setSeed(+e.target.value)}/></label></div></details>{url&&<AudioPlayer url={url} label="Generated audio"/>}</div><div className="generate-action"><button className="pill solid" type="submit" disabled={busy||!model||!prompt.trim()||!Number.isFinite(duration)||duration<=0||duration>47||!Number.isInteger(seed)}>{busy?'Generating audio…':'Generate audio'}</button><span role="status">{status}</span></div></form>;
}
