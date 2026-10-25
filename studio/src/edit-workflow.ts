import {createElement} from 'react';
import {renderView} from './react/render';
import {PrecisionEditor} from './react/precision-editor';
import {VideoEditor,type VideoHandoff} from './react/video-editor';
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
 const active=()=>document.querySelector<HTMLSelectElement>('[aria-label="Workspace setup"]')?.value==='Edit';
 const onBusy=(value:boolean)=>{busy=value;host.dataset.editBusy=String(value)};
 function show(hand:Media|null){
  if(busy)return;selected=hand;renderView(viewer,null);
  if(hand?.video)renderView(viewer,createElement(VideoEditor,{key:hand.video,hand:hand as VideoHandoff,right:controls,actions,versionsHost:versions,onApply:apply,onBusy,onFrame:async image=>{const result=await OSH.upload(image);show({type:'keyframe',img:result.url,label:'Captured video frame'})}}));
  else renderView(viewer,createElement(PrecisionEditor,{key:hand?.img||'empty',hand:hand||{},inspector:controls,history:versions,actions,onApply:apply,onBusy}));
 }
 const sceneMedia=()=>{const hand=current();return hand?{...hand,from:'director'}:null};
 const open=(hand?:Media)=>{if(busy)return;pending=hand||pending||sceneMedia();document.dispatchEvent(new CustomEvent('osh-workspace-select',{detail:'Edit'}))};
 document.addEventListener('osh-edit-entering',()=>{if(!pending)pending=sceneMedia()});
 addEventListener('osh-open-edit',((event:CustomEvent<Media>)=>open(event.detail)) as EventListener);
 addEventListener('osh-project-file-selected',((event:CustomEvent)=>{const file=event.detail;if(!['image','video'].includes(file.kind))return;const hand:Media=resolve?.(file)||{type:file.kind==='video'?'shot':'keyframe',label:file.label,...(file.kind==='image'?{img:file.url}:{video:file.url})};if(active())show(hand);else pending=hand}) as EventListener);
 document.addEventListener('pointerdown',event=>{if((event.target as Element)?.closest('#trk'))pending=null},true);
 document.addEventListener('osh-workspace-selected',((event:CustomEvent<{name:string}>)=>{
  if(event.detail.name==='Edit'){const next=pending||sceneMedia();if(pending||next?.img!==selected?.img||next?.video!==selected?.video)show(next);pending=null}
  else host.querySelectorAll<HTMLMediaElement>('video,audio').forEach(media=>media.pause());
 }) as EventListener);
 show(null);
 return {selected:()=>selected,busy:()=>busy,open};
}
