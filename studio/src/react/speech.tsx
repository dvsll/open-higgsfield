import {GenerateButton,PromptInput} from './prompt-input';
import {useEffect,useRef,useState} from 'react';
import {OSH} from '../../../shared/runtime/client';
import {captionText,parseCaptionSrt} from '../../../shared/lib/captions';
import {SC} from '../scene';
import {revealGeneratedFile} from '../generated-file';
import {MediaModelPicker} from './media-model-picker';
import {NumberInput} from './number-input';
import './speech.css';
export function SpeechWindow(){
 const saved=SC.get('osh-speech-draft')||{};
 const [text,setText]=useState<string>(saved.text||''),[voice,setVoice]=useState<string>(saved.voice||'af_heart'),[speed,setSpeed]=useState<number>(saved.speed||1);
 const [models,setModels]=useState<string[]>([]),[model,setModel]=useState(''),[voices,setVoices]=useState<string[]>([]),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[subtitle,setSubtitle]=useState(false);
 const input=useRef<HTMLInputElement>(null);
 useEffect(()=>{void fetch('/api/speech').then(r=>r.json()).then(value=>{setReady(!!value.available);setModels(value.models||[]);setModel(value.models?.[0]||'');setVoices(value.voices||[]);if(!value.voices?.includes(voice))setVoice(value.voices?.[0]||'af_heart');if(!value.available)setStatus('Local speech support needs setup in ComfyUI.')}).catch(()=>setStatus('Could not reach local speech. Check Admin.'))},[]);
 useEffect(()=>{const seed=()=>setText(current=>current.trim()?current:'A little kindness can brighten the day.');addEventListener('osh-tour-speech-prompt',seed);return()=>removeEventListener('osh-tour-speech-prompt',seed)},[]);
 useEffect(()=>{SC.set('osh-speech-draft',{text,voice,speed})},[text,voice,speed]);
 useEffect(()=>{const accept=(event:Event)=>{if(busy)return;setText(String((event as CustomEvent).detail||'').slice(0,6000));setSubtitle(false);setStatus('')};addEventListener('osh-speech-text',accept);return()=>removeEventListener('osh-speech-text',accept)},[busy]);
 function accept(content:string,isSrt:boolean){const value=isSrt?captionText(parseCaptionSrt(content)):content;if(!value.trim())throw Error('This file has no text.');if(value.length>6000)throw Error('Use up to 6000 characters at a time.');setText(value);setSubtitle(isSrt);setStatus('')}
 async function importFile(file:File){try{if(!/\.(txt|srt)$/i.test(file.name)||file.size>2_000_000)throw Error('Choose a text or SRT file under 2 MB.');accept(await file.text(),/\.srt$/i.test(file.name))}catch(error){setStatus((error as Error).message)}}
 async function projectFile(url:string){try{const file=(SC.get('osh-project-files')||[]).find((file:{url:string;kind:string})=>file.url===url&&file.kind==='captions');if(!file)throw Error('Drop an SRT from this project.');const response=await fetch(file.url);if(!response.ok)throw Error('Could not open subtitles.');accept(await response.text(),true)}catch(error){setStatus((error as Error).message)}}
 async function generate(){if(busy||!ready||!text.trim())return;setBusy(true);setStatus('Generating speech locally…');try{const result=await OSH.speech(text,model,voice,speed);SC.set('osh-project-files',[...(SC.get('osh-project-files')||[]),{url:result.audio,label:'Speech',kind:'audio',origin:'generated'}]);dispatchEvent(new Event('osh-project-media'));revealGeneratedFile(result.audio);dispatchEvent(new CustomEvent('osh-speech-generated',{detail:{url:result.audio}}));setStatus('')}catch(error){setStatus((error as Error).message)}finally{setBusy(false)}}
 return <div className="speech-window" onDragOver={event=>{if(!busy&&(event.dataTransfer.types.includes('Files')||event.dataTransfer.types.includes('application/x-studio-file-captions'))){event.preventDefault();event.dataTransfer.dropEffect='copy'}}} onDrop={event=>{event.preventDefault();event.stopPropagation();if(busy)return;if(event.dataTransfer.files[0])void importFile(event.dataTransfer.files[0]);else void projectFile(event.dataTransfer.getData('application/x-studio-file'))}}>
  <div className="speech-header"><MediaModelPicker media="Speech" models={models} value={model} disabled={busy} onChange={setModel}/>
  <label className="speech-voice">Voice<select aria-label="Speech voice" value={voice} disabled={busy||!ready} onChange={event=>setVoice(event.target.value)}>{(voices.length?voices:[voice]).map(value=><option key={value} value={value}>{({af_heart:'Heart · American',af_bella:'Bella · American',am_adam:'Adam · American',am_michael:'Michael · American',bf_emma:'Emma · British',bm_george:'George · British'} as Record<string,string>)[value]||value}</option>)}</select></label></div>
  <div className="speech-input"><label htmlFor="speechText">Text</label><PromptInput references={null}><textarea id="speechText" value={text} maxLength={6000} disabled={busy} placeholder="Write what to say, or drop text/subtitles here from Project files." onChange={event=>{setText(event.target.value);setSubtitle(false)}}/></PromptInput></div>
  <input ref={input} type="file" accept=".txt,.srt" hidden onChange={event=>{const file=event.target.files?.[0];if(file)void importFile(file);event.target.value=''}}/>
  <details className="speech-advanced"><summary>Advanced</summary><div className="speech-import"><button disabled={busy} onClick={()=>input.current?.click()}>Import text / SRT</button><span>{text.length} / 6000</span></div>{subtitle&&<small>Subtitle text is read as continuous speech; cue timing is not applied.</small>}<label>Speed<NumberInput value={speed} min={.5} max={2} step={.05} disabled={busy} onChange={event=>setSpeed(Number(event.target.value))}/></label></details>
  {status&&<p role="status">{status}</p>}
  <div className="speech-actions"><GenerateButton id="speechGenerate" disabled={!ready||busy||!text.trim()} onClick={()=>void generate()}>{busy?'Generating speech…':'Generate speech'}</GenerateButton></div>
 </div>;
}
