import {createElement} from 'react';
import {renderView} from './react/render';
import {FrameControls} from './react/frame-controls';
import { projectKey } from './projects';
export type GenerationKind = 'keyframe'|'video';
export type FrameSize = {width:number;height:number};
export function videoTiming(){const frames=document.getElementById('videoFrames') as HTMLInputElement,fps=document.getElementById('videoFPS') as HTMLInputElement;if(!frames.reportValidity()||!fps.reportValidity())throw new Error('Choose valid frames and FPS');return {frames:+frames.value,fps:+fps.value}}
export function frameSize(kind:GenerationKind,report=true):FrameSize {
  const width=document.getElementById(`${kind}Width`) as HTMLInputElement;
  const height=document.getElementById(`${kind}Height`) as HTMLInputElement;
  if(!(report?width.reportValidity():width.checkValidity())||!(report?height.reportValidity():height.checkValidity()))throw new Error('Choose valid frame dimensions');
  if(kind==='video'&&Math.ceil(+width.value/32)*32*Math.ceil(+height.value/32)*32>768*768)throw new Error('Video frame is too large for this local workflow (max 768×768 pixels after padding).');
  return {width:+width.value,height:+height.value};
}
export function mountFrameSizes(change:()=>void):void {
  let saved:Partial<Record<GenerationKind,FrameSize>>={};try{saved=JSON.parse(localStorage.getItem(projectKey('osh-frame-sizes'))||'{}')}catch{}
  for(const kind of ['keyframe','video'] as const){
    const persist=()=>{try{saved[kind]=frameSize(kind,false);localStorage.setItem(projectKey('osh-frame-sizes'),JSON.stringify(saved));if(kind==='video')dispatchEvent(new CustomEvent('osh-video-size',{detail:saved[kind]}));change()}catch{/* Keep invalid input visible until corrected. */}};
    const panel=document.createElement('details');panel.className='frame-properties';panel.open=kind==='video';if(kind==='video')panel.id='videoAttributes';
    renderView(panel,createElement(FrameControls,{kind,size:saved[kind]||{width:768,height:448},onChange:persist}));
    if(kind==='video')document.querySelector('aside.r')!.prepend(panel);else document.getElementById(`${kind}ModelDetails`)!.closest('.modelbar')!.after(panel);
  }
  change();
}
