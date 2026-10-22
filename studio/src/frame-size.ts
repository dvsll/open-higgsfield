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
    const row=document.createElement('div');row.className='frame-controls';
    const presets=document.createElement('select');presets.setAttribute('aria-label',`${kind==='video'?'Video':'Image'} frame preset`);
    const sizes=kind==='video'?[[768,448,'Default'],[512,288,'Landscape 16:9'],[288,512,'Portrait 9:16'],[384,384,'Square'],[1024,576,'HD landscape']]:[[768,448,'Default'],[768,432,'Landscape 16:9'],[432,768,'Portrait 9:16'],[512,512,'Square'],[1024,1024,'Large square']];
    presets.add(new Option('Custom','custom'));for(const [w,h,label] of sizes)presets.add(new Option(`${label} · ${w}×${h}`,`${w}x${h}`));
    row.append(presets);
    for(const axis of ['width','height'] as const){const label=document.createElement('label');label.textContent=axis==='width'?'W':'H';const input=document.createElement('input');input.type='number';input.id=`${kind}${axis==='width'?'Width':'Height'}`;input.min='256';input.max=kind==='video'?'1024':'1536';input.step='1';input.required=true;input.value=String(saved[kind]?.[axis]||(axis==='width'?768:448));input.setAttribute('aria-label',`${kind==='video'?'Video':'Image'} ${axis} in pixels`);label.append(input);row.append(label);input.oninput=()=>{presets.value='custom';persist()};}
    const persist=()=>{try{saved[kind]=frameSize(kind,false);localStorage.setItem(projectKey('osh-frame-sizes'),JSON.stringify(saved));change()}catch{/* Keep invalid input visible until corrected. */}};
    presets.onchange=()=>{if(presets.value==='custom')return;const [w,h]=presets.value.split('x');(row.querySelectorAll('input')[0] as HTMLInputElement).value=w;(row.querySelectorAll('input')[1] as HTMLInputElement).value=h;persist()};
    const panel=document.createElement('details');panel.className='frame-properties';panel.open=kind==='video';const summary=document.createElement('summary');summary.textContent=kind==='video'?'Video attributes':'Image properties';panel.append(summary);
    if(kind==='video'){panel.id='videoAttributes';const info=document.createElement('p');info.id='selectedVideoAttributes';info.className='selected-video-attributes';info.textContent='Select a clip to see its video size.';const heading=document.createElement('p');heading.className='attributes-caption';heading.textContent='Generate at';panel.append(info,heading)}
    panel.append(row);
    if(kind==='video'){
      const timing=document.createElement('div');timing.className='frame-controls video-timing';timing.innerHTML='<label>Frames<input id="videoFrames" aria-label="Video frames" type="number" min="9" max="121" step="8" value="97" required></label><label>FPS<input id="videoFPS" aria-label="Video FPS" type="number" min="1" max="120" step="0.01" value="24" required></label><output id="videoDuration"></output><small>LTX: 9, 17, 25…121 frames (8n+1). Local workflow limit: 121.</small>';
      timing.oninput=()=>{const frames=timing.querySelector<HTMLInputElement>('#videoFrames')!,fps=timing.querySelector<HTMLInputElement>('#videoFPS')!;if(frames.checkValidity()&&fps.checkValidity())dispatchEvent(new CustomEvent('osh-video-timing',{detail:{frames:+frames.value,fps:+fps.value}}))};panel.append(timing);
    }
    if(kind==='video')document.querySelector('aside.r')!.prepend(panel);else document.getElementById(`${kind}ModelDetails`)!.closest('.modelbar')!.after(panel);
    presets.value=sizes.some(([w,h])=>`${w}x${h}`===`${saved[kind]?.width||768}x${saved[kind]?.height||448}`)?`${saved[kind]?.width||768}x${saved[kind]?.height||448}`:'custom';
  }
  change();
}
