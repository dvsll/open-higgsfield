import {useEffect,useState} from 'react';
import './onboarding-video.css';
type Clip={label:string;duration:number;time:number;video?:string};
export function OnboardingVideo(){
 const [clip,setClip]=useState<Clip>({label:'Video',duration:4,time:0});
 useEffect(()=>{const update=(event:Event)=>setClip((event as CustomEvent<Clip>).detail);window.addEventListener('osh-tour-clip',update);window.dispatchEvent(new Event('osh-tour-clip-request'));return()=>window.removeEventListener('osh-tour-clip',update)},[]);
 return <div className="onboarding-video-strip">
  <div className="onboarding-video-ruler"><span>0s</span><span>{clip.duration.toFixed(1)}s</span></div>
  <div className="onboarding-video-clip">{clip.video&&<video src={clip.video} muted preload="metadata"/>}<span>{clip.video?clip.label:'Your generated video will appear here'}</span></div>
  <input aria-label="Seek video" type="range" min="0" max={clip.duration} step="0.01" value={Math.min(clip.time,clip.duration)} disabled={!clip.video} onChange={event=>window.dispatchEvent(new CustomEvent('osh-tour-clip-seek',{detail:Number(event.target.value)}))}/>
 </div>;
}
