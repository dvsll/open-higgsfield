const waves=new Map<string,Promise<number[]>>();
function waveform(url:string):Promise<number[]>{
 const cached=waves.get(url);if(cached)return cached;
 const task=(async()=>{const response=await fetch(url);if(!response.ok)throw new Error('Audio unavailable');const context=new AudioContext();try{const audio=await context.decodeAudioData(await response.arrayBuffer()),data=audio.getChannelData(0),bins=160,step=Math.max(1,Math.floor(data.length/bins));return Array.from({length:bins},(_,i)=>{let peak=0;for(let j=i*step;j<Math.min(data.length,(i+1)*step);j+=8)peak=Math.max(peak,Math.abs(data[j]));return peak})}finally{await context.close()}})();waves.set(url,task);if(waves.size>24)waves.delete(waves.keys().next().value!);return task;
}
export function drawAudioTrack(root:HTMLElement,shots:{d:number;audio?:string;audioMuted?:boolean;audioLinked?:boolean;audioStart?:number;audioDuration?:number}[],pixels:number,select:(index:number)=>void,selected=-1,origin=0):void{
 root.replaceChildren();
 let time=origin;
 for(const [index,shot] of shots.entries()){
  const linked=shot.audioLinked!==false,duration=linked?shot.d:shot.audioDuration||shot.d,position=linked?time:shot.audioStart??time;time+=shot.d;
  const clip=document.createElement('button');clip.className='audio-clip'+(shot.audio?' ready':'')+(shot.audioMuted?' muted':'')+(index===selected?' on':'');clip.style.position='absolute';clip.style.left=Math.max(0,(position-origin)*pixels)+'px';clip.style.width=Math.max(1,duration*pixels-3)+'px';clip.setAttribute('aria-label',shot.audio?`Audio for scene ${index+1} · ${linked?'linked':'unlinked'}${shot.audioMuted?' · muted':''}`:`Scene ${index+1}: add an audio prompt`);clip.onclick=()=>select(index);
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.floor(duration*pixels-3));canvas.height=46;clip.append(canvas);const label=document.createElement('span');label.textContent=shot.audio?(shot.audioMuted?'Muted':linked?'Audio · linked':'Audio · unlinked'):'+ Audio';clip.append(label);root.append(clip);
  if(shot.audio){const url=shot.audio;waveform(url).then(peaks=>{if(!canvas.isConnected||shot.audio!==url)return;const g=canvas.getContext('2d')!;g.fillStyle='#7ebbb0';for(let x=0;x<canvas.width;x+=3){const height=Math.max(1,peaks[Math.min(peaks.length-1,Math.floor(x/canvas.width*peaks.length))]*40);g.fillRect(x,23-height/2,2,height)}}).catch(()=>{label.textContent='Audio unavailable'})}
 }
}
