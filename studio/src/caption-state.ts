import {captionSegments,type CaptionSegment} from '../../shared/lib/captions.ts';
import type {LayerState} from './sequence-layer-state.ts';
export type CaptionSource={id:string;url:string;label:string;start:number;duration?:number;origin:'timeline'|'library'};
export function applyCaptions(state:LayerState,source:CaptionSource,segments:CaptionSegment[]):LayerState{
 const accepted=captionSegments(segments,source.duration||86400);
 if(accepted.some(segment=>source.start+segment.start>3600||segment.end-segment.start>600))throw Error('These captions exceed the timeline range. You can still edit and download the SRT.');
 const retained=state.overlays.filter(item=>item.captionSource!==source.id);
 if(retained.length+accepted.length>600)throw Error('Too many overlay clips. Remove some overlays before adding these captions.');
 return {...state,overlays:[...retained,...accepted.map(segment=>({id:crypto.randomUUID(),name:'Caption · '+segment.text.slice(0,50),kind:'text' as const,start:source.start+segment.start,duration:segment.end-segment.start,text:segment.text,position:'bottom-center',size:5,captionSource:source.id}))]};
}

/** Resolve drops against the current project library, never arbitrary media URLs. */
export function captionFileSource(files:{url:string;kind:string;label:string}[],url:string):CaptionSource|null{
 const file=files.find(item=>item.url===url&&['audio','video'].includes(item.kind));
 return file&&/^\/outputs\/[a-f0-9]{16}\.(flac|wav|mp3|m4a|ogg|webm|mp4)$/.test(url)?{id:'file:'+url,url,label:file.label,start:0,origin:'library'}:null;
}

export function retimeCaption(cue:CaptionSegment,delta:number,mode:'move'|'start'|'end',total:number):CaptionSegment{
 const round=(value:number)=>Math.round(value*100)/100;
 if(mode==='move'){const start=round(Math.max(0,Math.min(total-(cue.end-cue.start),cue.start+delta)));return {...cue,start,end:round(start+cue.end-cue.start)}}
 return mode==='start'?{...cue,start:round(Math.max(0,Math.min(cue.end-.01,cue.start+delta)))}:{...cue,end:round(Math.max(cue.start+.01,Math.min(total,cue.end+delta)))};
}
