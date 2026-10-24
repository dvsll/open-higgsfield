import {createElement} from 'react';
import {renderView} from './react/render';
import {AudioLane} from './react/audio';
const waves=new Map<string,Promise<number[]>>();
export function waveform(url:string):Promise<number[]>{
 const cached=waves.get(url);if(cached)return cached;
 const task=(async()=>{const response=await fetch(url);if(!response.ok)throw new Error('Audio unavailable');const context=new AudioContext();try{const audio=await context.decodeAudioData(await response.arrayBuffer()),data=audio.getChannelData(0),bins=160,step=Math.max(1,Math.floor(data.length/bins));return Array.from({length:bins},(_,i)=>{let peak=0;for(let j=i*step;j<Math.min(data.length,(i+1)*step);j+=8)peak=Math.max(peak,Math.abs(data[j]));return peak})}finally{await context.close()}})();waves.set(url,task);if(waves.size>24)waves.delete(waves.keys().next().value!);return task;
}
export function drawAudioTrack(root:HTMLElement,shots:{d:number;audio?:string;audioMuted?:boolean;audioLinked?:boolean;audioStart?:number;audioDuration?:number}[],pixels:number,select:(index:number)=>void,selected=-1,origin=0):void{
 renderView(root,createElement(AudioLane,{shots,pixels,select,selected,origin,waveform}));
}
