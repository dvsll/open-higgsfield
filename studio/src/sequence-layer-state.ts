export type Layer={id:string;name:string;kind:'text'|'watermark'|'music'|'sfx';start:number;duration:number;text?:string;url?:string;position?:string;size?:number;muted?:boolean;captionSource?:string};
export type LayerState={overlays:Layer[];audio:Layer[]};
export function independentSoundtracks(shots:{id:string;n:string;d:number;audio?:string;audioLinked?:boolean;audioStart?:number;audioDuration?:number;audioMuted?:boolean}[]):Layer[]{
 let time=0;return shots.flatMap(shot=>{const start=time;time+=shot.d;return shot.audio&&shot.audioLinked===false?[{id:'legacy:'+shot.id,name:shot.n+' soundtrack',kind:'sfx' as const,start:shot.audioStart??start,duration:shot.audioDuration||shot.d,url:shot.audio,muted:shot.audioMuted}]:[]});
}
export function validLayers(value:any):LayerState{
 const list=(items:any,overlay:boolean):Layer[]=>{
  if(!Array.isArray(items))return [];const seen=new Set<string>();
  return items.filter(item=>{
   if(!item||typeof item.id!=='string'||seen.has(item.id)||typeof item.name!=='string'||!Number.isFinite(item.start)||item.start<0||item.start>(overlay?3600:600)||!Number.isFinite(item.duration)||item.duration<=0||item.duration>600||!(overlay?['text','watermark']:['music','sfx']).includes(item.kind))return false;
   if(item.text!==undefined&&(typeof item.text!=='string'||item.text.length>1500))return false;
   if(item.url&&(typeof item.url!=='string'||!/^\/outputs\/[a-f0-9]{16}\.(png|flac|wav|mp3|m4a|ogg|webm|mp4)$/.test(item.url)))return false;
   seen.add(item.id);return true;
  }).slice(0,overlay?600:100).map(item=>({...item,name:item.name.slice(0,80),size:Math.max(2,Math.min(12,Number(item.size)||5)),position:['top-left','top-center','top-right','center','bottom-left','bottom-center','bottom-right'].includes(item.position)?item.position:'bottom-center'}));
 };
 return {overlays:list(value?.overlays,true),audio:list(value?.audio,false)};
}
export function layerRows(items:Layer[]):Map<string,number>{
 const ends:number[]=[],rows=new Map<string,number>();
 for(const item of [...items].sort((a,b)=>a.start-b.start)){let row=ends.findIndex(end=>end<=item.start);if(row<0)row=ends.length;ends[row]=item.start+item.duration;rows.set(item.id,row)}return rows;
}
