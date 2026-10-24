import {captionSegments,type CaptionSegment} from '../../shared/lib/captions.ts';
import type {LayerState} from './sequence-layer-state.ts';
export type CaptionSource={id:string;url:string;label:string;start:number;duration?:number;origin:'timeline'|'library'};
export function applyCaptions(state:LayerState,source:CaptionSource,segments:CaptionSegment[]):LayerState{
 const accepted=captionSegments(segments,source.duration||600);
 const retained=state.overlays.filter(item=>item.captionSource!==source.id);
 if(retained.length+accepted.length>600)throw Error('Too many overlay clips. Remove some overlays before adding these captions.');
 return {...state,overlays:[...retained,...accepted.map(segment=>({id:crypto.randomUUID(),name:'Caption · '+segment.text.slice(0,50),kind:'text' as const,start:source.start+segment.start,duration:segment.end-segment.start,text:segment.text,position:'bottom-center',size:5,captionSource:source.id}))]};
}
