import {useEffect,useState} from 'react';
import {SC} from '../scene';
import {cameraMove} from '../camera-motion';
import {NumberInput} from './number-input';
export function CameraPrompt(){
 const saved=SC.get('osh-3d-camera')||{},[prompt,setPrompt]=useState<string>(saved.prompt||''),[duration,setDuration]=useState<number>(saved.duration||4),[status,setStatus]=useState('');
 useEffect(()=>{const done=()=>setStatus('Movement preview complete.');addEventListener('osh-camera-motion-ended',done);return()=>removeEventListener('osh-camera-motion-ended',done)},[]);
 const save=(text:string,seconds:number)=>SC.set('osh-3d-camera',{prompt:text,duration:seconds});
 return <div className="camera-prompt"><label htmlFor="cameraMovementPrompt">Camera movement</label><textarea id="cameraMovementPrompt" value={prompt} maxLength={500} placeholder="Slowly orbit right around the selected object…" onChange={event=>{setPrompt(event.target.value);save(event.target.value,duration)}}/><div className="camera-prompt-actions"><label>Seconds<NumberInput aria-label="Camera movement duration" min={.5} max={60} step={.5} value={duration} onChange={event=>{setDuration(+event.target.value);save(prompt,+event.target.value)}}/></label><button type="button" onClick={()=>{try{const move=cameraMove(prompt,duration);dispatchEvent(new CustomEvent('osh-camera-motion',{detail:{action:'play',move}}));dispatchEvent(new CustomEvent('osh-reveal-window',{detail:'stage'}));setStatus('Previewing in 3D viewport.')}catch(error){setStatus((error as Error).message)}}}>Preview movement</button><button type="button" onClick={()=>{dispatchEvent(new CustomEvent('osh-camera-motion',{detail:{action:'stop'}}));setStatus('')}}>Stop</button><button type="button" onClick={()=>{dispatchEvent(new CustomEvent('osh-camera-motion',{detail:{action:'reset'}}));setStatus('')}}>Reset camera</button></div><small>Local viewport motion · orbit, dolly, pan, crane or tilt</small>{status&&<p role="status">{status}</p>}</div>
}
