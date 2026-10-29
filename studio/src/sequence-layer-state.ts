export type Layer={id:string;name:string;kind:'text'|'watermark'|'music'|'sfx';start:number;duration:number;text?:string;url?:string;position?:string;size?:number;muted?:boolean;captionSource?:string;row?:number};
export type LayerState={overlays:Layer[];audio:Layer[]};
export function independentSoundtracks(shots:{id:string;n:string;d:number;audio?:string;audioLinked?:boolean;audioStart?:number;audioDuration?:number;audioMuted?:boolean;audioRow?:number}[]):Layer[]{
 let time=0;return shots.flatMap(shot=>{const start=time;time+=shot.d;return shot.audio&&shot.audioLinked===false?[{id:'legacy:'+shot.id,name:shot.n+' soundtrack',kind:'sfx' as const,start:shot.audioStart??start,duration:shot.audioDuration||shot.d,url:shot.audio,muted:shot.audioMuted,row:shot.audioRow}]:[]});
}
export function validLayers(value:any):LayerState{
 const list=(items:any,overlay:boolean):Layer[]=>{
  if(!Array.isArray(items))return [];const seen=new Set<string>();
  return items.filter(item=>{
   if(!item||typeof item.id!=='string'||seen.has(item.id)||typeof item.name!=='string'||!Number.isFinite(item.start)||item.start<0||item.start>(overlay?3600:600)||!Number.isFinite(item.duration)||item.duration<=0||item.duration>600||!(overlay?['text','watermark']:['music','sfx']).includes(item.kind))return false;
   if(item.text!==undefined&&(typeof item.text!=='string'||item.text.length>1500))return false;
   if(item.url&&(typeof item.url!=='string'||!/^\/outputs\/[a-f0-9]{16}\.(png|flac|wav|mp3|m4a|ogg|webm|mp4)$/.test(item.url)))return false;
   seen.add(item.id);return true;
  }).slice(0,overlay?600:100).map(item=>({...item,name:item.name.slice(0,80),row:Number.isInteger(item.row)&&item.row>=0?Math.min(99,item.row):undefined,size:Math.max(2,Math.min(12,Number(item.size)||5)),position:['top-left','top-center','top-right','center','bottom-left','bottom-center','bottom-right'].includes(item.position)?item.position:'bottom-center'}));
 };
 return {overlays:list(value?.overlays,true),audio:list(value?.audio,false)};
}
export function layerRows(items:Layer[]):Map<string,number>{
 const rows=new Map<string,number>(),occupied=new Map<number,Layer[]>();
 const place=(item:Layer,row:number)=>{rows.set(item.id,row);occupied.set(row,[...(occupied.get(row)||[]),item])};
 for(const item of items)if(Number.isInteger(item.row)&&item.row!>=0)place(item,Math.min(99,item.row!));
 for(const item of [...items].sort((a,b)=>a.start-b.start)){if(rows.has(item.id))continue;let row=0;while((occupied.get(row)||[]).some(peer=>peer.start<item.start+item.duration&&item.start<peer.start+peer.duration))row++;place(item,row)}return rows;
}
