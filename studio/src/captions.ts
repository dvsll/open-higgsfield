import {createElement} from 'react';
import {renderView} from './react/render';
import {CaptionsWindow} from './react/captions';
import type {LayerState} from './sequence-layer-state';
import {applyCaptions,type CaptionSource} from './caption-state';
export type {CaptionSource} from './caption-state';
export function selectCaptionSource(source:CaptionSource){dispatchEvent(new CustomEvent('osh-caption-source',{detail:source}))}
export function mountCaptions(options:{initial:()=>CaptionSource|null;resolve:(source:CaptionSource)=>CaptionSource|null;state:()=>LayerState;change:(state:LayerState)=>void}):HTMLElement{
 const root=document.createElement('div');root.id='studioCaptions';root.className='captions-window';document.body.append(root);
 renderView(root,createElement(CaptionsWindow,{initial:options.initial(),onApply:(source,segments)=>{const current=options.resolve(source);if(!current)throw Error('The original audio changed or was removed. Select it and generate a fresh transcript.');options.change(applyCaptions(options.state(),current,segments));dispatchEvent(new CustomEvent('osh-reveal-window',{detail:'timeline'}))}}));
 addEventListener('osh-project-file-selected',((event:CustomEvent)=>{const file=event.detail;if(file.kind==='audio'||file.kind==='video')selectCaptionSource({id:'file:'+file.url,url:file.url,label:file.label,start:0,origin:'library'})}) as EventListener);
 return root;
}
