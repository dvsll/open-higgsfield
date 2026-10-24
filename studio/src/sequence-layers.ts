import {createElement} from 'react';
import {renderView,unmountView} from './react/render';
import {LayerEditor,LayerLane,LayerTools,OverlayPreview} from './react/sequence-layers';
import './sequence-layers.css';
import {selectCaptionSource} from './captions';
import {type Layer,type LayerState} from './sequence-layer-state';
export {validLayers,layerRows} from './sequence-layer-state';
type Options={read:()=>LayerState;change:(state:LayerState)=>void;time:()=>number;duration:()=>number;select:()=>void;legacy:()=>Layer[];selectLegacy:(id:string)=>void};
export function mountSequenceLayers(options:Options){
 const root=document.getElementById('overlayPreview')!,players=new Map<string,HTMLAudioElement>();let previewKey='';
 let audioReady=false;void fetch('/api/models').then(r=>r.json()).then(result=>{audioReady=!!result.audio?.available}).catch(()=>{});
 function edit(kind:'overlays'|'audio',existing?:Layer){
  options.select();if(kind==='audio'&&existing?.url)selectCaptionSource({id:existing.id,url:existing.url,label:existing.name,start:existing.start,duration:existing.duration,origin:'timeline'});const host=document.createElement('div');document.body.append(host);
  const close=()=>{queueMicrotask(()=>{unmountView(host);host.remove()})};
  renderView(host,createElement(LayerEditor,{group:kind,existing,start:options.time(),duration:Math.min(4,Math.max(.1,options.duration()-options.time())),audioReady,onClose:close,onSave:(layer:Layer)=>{const state=options.read(),next={...state,[kind]:[...state[kind].filter(item=>item.id!==layer.id),layer]};options.change(next);close()},onRemove:existing?()=>{const state=options.read();options.change({...state,[kind]:state[kind].filter(item=>item.id!==existing.id)});close()}:undefined}));
 }
 function render(pixels:number,origin:number,duration:number){
  const state=options.read();
  for(const group of ['overlays','audio'] as const){
   const items=group==='audio'?[...options.legacy(),...state.audio]:state.overlays;
   const visible=items.filter(item=>item.start<origin+duration&&item.start+item.duration>origin);
   renderView(document.getElementById(group==='audio'?'audioTrack':'overlayTrack')!,createElement(LayerLane,{group,items:visible,pixels,origin,onAdd:()=>edit(group),onEdit:item=>item.id.startsWith('legacy:')?(selectCaptionSource({id:item.id,url:item.url!,label:item.name,start:item.start,duration:item.duration,origin:'timeline'}),options.selectLegacy(item.id.slice(7))):edit(group,item)}));
   renderView(document.getElementById(group==='audio'?'audioTrackAttributes':'overlayTrackAttributes')!,createElement(LayerTools,{group,onAdd:()=>edit(group)}));
  }
 }
 function play(time:number,playing:boolean,visible:boolean){
  const state=options.read(),active=visible?state.overlays.filter(item=>time>=item.start&&time<item.start+item.duration):[];
  const key=JSON.stringify(active);if(previewKey!==key){previewKey=key;renderView(root,createElement(OverlayPreview,{items:active}))}
  const video=document.getElementById('vid') as HTMLVideoElement,area=root.parentElement!.getBoundingClientRect(),ratio=(video.videoWidth||640)/(video.videoHeight||360),width=Math.min(area.width,area.height*ratio),height=width/ratio;
  Object.assign(root.style,{left:(area.width-width)/2+'px',top:(area.height-height)/2+'px',width:width+'px',height:height+'px'});
  for(const layer of state.audio){let player=players.get(layer.id);const local=time-layer.start,run=playing&&visible&&!layer.muted&&!!layer.url&&local>=0&&local<layer.duration;
   if(!player&&run){player=new Audio(layer.url);players.set(layer.id,player)}if(!player)continue;
   if(run){if(!player.src.endsWith(layer.url!))player.src=layer.url!;if(Math.abs(player.currentTime-local)>.2)player.currentTime=local;if(player.paused)void player.play().catch(()=>{})}else player.pause();
  }
  for(const [id,player]of players)if(!state.audio.some(item=>item.id===id)){player.pause();player.removeAttribute('src');player.load();players.delete(id)}
 }
 return {render,play,busy:()=>!!document.querySelector('.sequence-layer-editor [data-generating=true]')};
}
