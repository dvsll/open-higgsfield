import {SC} from './scene';
import type {ProjectFile} from './project-files-index';
export function mountSequenceFileDrop(onDrop:(file:ProjectFile,lane:'video'|'audio'|'overlays',x:number)=>Promise<void>|void){
 const timeline=document.getElementById('tl')!;
 const lanes={video:['trk','videoTrackToggle'],audio:['audioTrack','audioTrackToggle'],overlays:['overlayTrack','overlayTrackToggle']};
 const clear=()=>Object.values(lanes).flat().forEach(id=>document.getElementById(id)?.classList.remove('file-drop-compatible'));
 const kind=(event:DragEvent)=>['video','audio','image'].find(value=>event.dataTransfer?.types.includes('application/x-studio-file-'+value));
 const lane=(event:DragEvent)=>{const target=event.target as Element;return (Object.keys(lanes) as (keyof typeof lanes)[]).find(name=>lanes[name].some(id=>target.closest('#'+id)))};
 timeline.addEventListener('dragover',event=>{
  const type=kind(event);if(!type)return;clear();
  const compatible=type==='image'?['overlays',...(timeline.querySelector('#trk .clip')?['video']:[])]:[type];
  for(const name of compatible)for(const id of lanes[name as keyof typeof lanes])document.getElementById(id)?.classList.add('file-drop-compatible');
  const target=lane(event);if(target&&compatible.includes(target)){event.preventDefault();event.dataTransfer!.dropEffect='copy'}else event.dataTransfer!.dropEffect='none';
 },true);
 timeline.addEventListener('dragleave',event=>{if(!timeline.contains(event.relatedTarget as Node))clear()});
 timeline.addEventListener('drop',event=>{
  clear();const type=kind(event),target=lane(event);if(!type)return;
  if(type==='image'&&target==='video')return; // Existing scene guide positioning owns this drop.
  event.preventDefault();event.stopPropagation();if(!target||!(type===target||type==='image'&&target==='overlays'))return;
  const url=event.dataTransfer?.getData('application/x-studio-file');const file=(SC.get('osh-project-files')||[]).find((item:ProjectFile)=>item.url===url&&item.kind===type);if(!file)return;
  void onDrop(file,target,event.clientX);
 },true);
 addEventListener('dragend',clear);addEventListener('blur',clear);
}
