import {createElement} from 'react';
import {renderView} from './react/render';
import {PrecisionEditor} from './react/precision-editor';
import {CloseButton} from './react/close-button';
import type {Media} from './shell';
import {OSH} from '../../shared/runtime/client';
import './precision-editor.css';
import './video-editor.css';
import './edit-workflow.css';

export function mountEditWorkflow(current:()=>Media|null,apply:()=>void,resolve?:(file:{url:string;label:string;kind:string})=>Media|null){
 const host=document.createElement('div');host.id='studioEditViewer';host.className='embedded-edit precision-viewer';
 const viewer=document.createElement('div');viewer.className='embedded-edit-view';
 const actions=document.createElement('div');actions.id='studioEditActions';actions.className='embedded-edit-actions';host.append(actions,viewer);
 const controls=document.createElement('div');controls.id='studioEditControls';controls.className='precision-inspector';
 const versions=document.createElement('div');versions.id='studioEditVersions';versions.className='precision-versions';
 document.body.append(host,controls,versions);
 let selected:Media|null=null,pending:Media|null=null,busy=false;
 const active=()=>document.querySelector<HTMLSelectElement>('[aria-label="Workspace setup"]')?.value==='Image';
 const onBusy=(value:boolean)=>{busy=value;host.dataset.editBusy=String(value)};
 function show(hand:Media|null){
  if(busy)return;selected=hand;renderView(viewer,null);renderView(controls,null);renderView(versions,null);renderView(actions,null);
  host.hidden=!hand?.img;document.body.classList.toggle('editing-selected-image',!!hand?.img);
  if(!hand?.img){renderView(controls,createElement('div',null,createElement('p',{role:'status'},'Select an image to edit.'),createElement('button',{onClick:()=>open()},'Edit selected image')));return}
  renderView(viewer,createElement(PrecisionEditor,{key:hand.img,hand,inspector:controls,history:versions,actions,onApply:apply,onBusy}));
  const dismiss=document.createElement('div');renderView(dismiss,createElement(CloseButton,{label:'Finish editing image',onClick:()=>show(null)}));actions.append(dismiss);

 }
 const sceneMedia=()=>{const hand=current();return hand?{...hand,from:'director'}:null};
 const open=(hand?:Media)=>{if(busy)return;pending=hand||sceneMedia();if(!pending?.img){show(null);dispatchEvent(new CustomEvent('osh-reveal-window',{detail:'edit-controls'}));return}if(!active())document.dispatchEvent(new CustomEvent('osh-workspace-select',{detail:'Image'}));show(pending);pending=null};
 document.addEventListener('osh-edit-entering',()=>{if(!pending)pending=sceneMedia()});
 addEventListener('osh-image-selection-restore',event=>{const value=(event as CustomEvent).detail;if(value?.source&&selected?.img!==value.source)queueMicrotask(()=>{if(selected?.img!==value.source)open({type:'keyframe',img:value.source,label:'Image selection'})})});
 addEventListener('osh-open-edit',((event:CustomEvent<Media>)=>open(event.detail)) as EventListener);
 addEventListener('osh-project-file-selected',((event:CustomEvent)=>{const file=event.detail;if(!['image','video','audio','mesh'].includes(file.kind))return;const hand:Media=resolve?.(file)||{type:file.kind==='video'?'shot':'keyframe',label:file.label,...(file.kind==='image'?{img:file.url}:{video:file.url})};if(active()&&!host.hidden)show(hand.img?hand:null);else pending=hand}) as EventListener);
 document.addEventListener('pointerdown',event=>{if((event.target as Element)?.closest('#trk'))pending=null},true);
 document.addEventListener('osh-workspace-selected',((event:CustomEvent<{name:string}>)=>{
  if(event.detail.name==='Image'){if(!selected)show(null)}else{show(null)}
  host.querySelectorAll<HTMLMediaElement>('video,audio').forEach(media=>media.pause());
 }) as EventListener);
 show(null);
 return {selected:()=>selected,busy:()=>busy,open};
}
