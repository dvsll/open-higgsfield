import type {CaptionSource} from './caption-state';
export type ProjectFile = { url: string; label: string; kind: 'video'|'image'|'audio'|'captions'; captionSource?:CaptionSource; userLabel?:string; generatedNumber?:number; origin?:'generated'|'uploaded' };
export function projectFiles(director: any, workshop: any, elements: any[] = [], styles: any = {}, saved: ProjectFile[] = []): ProjectFile[] {
 const found = new Map<string,ProjectFile>();
 const add = (url: unknown,label:string,origin?:ProjectFile['origin']) => { if(typeof url!=='string'||!/^\/outputs\/[a-f0-9]{16}\.(png|webm|mp4|flac|wav|mp3|m4a|ogg|srt)$/.test(url))return;const kind=url.endsWith('.srt')?'captions':url.endsWith('.png')?'image':['flac','wav','mp3','m4a','ogg'].includes(url.split('.').at(-1)!)?'audio':'video';if(!found.has(url))found.set(url,{url,label,kind,...(origin?{origin}:{})});else if(origin)found.get(url)!.origin=origin; };
 for(const shot of [...(director?.SH||[]),...(director?.STASH||[]).map((e:any)=>e.shot)]) {add(shot.video,shot.n||'Video',shot.r?'generated':undefined);add(shot.audio,(shot.n||'Scene')+' audio','generated');for(const [i,key] of (shot.keys||[]).entries())add(key.img,`${shot.n||'Scene'} · frame ${i+1}`)}
 for(const item of director?.HISTORY||[]) {add(item.url,item.label||'Generated media','generated');add(item.audio,(item.label||'Take')+' audio','generated')}
 for(const layer of [...(director?.LAYERS?.audio||[]),...(director?.LAYERS?.overlays||[])])add(layer.url,layer.name||'Sequence layer');
 add(workshop?.imageDraft?.url||workshop?.image?.url,'Workshop image','generated');
 for(const element of elements)for(const [i,url]of (element.refs||[]).entries())add(url,`${element.n||'Element'} · reference ${i+1}`,found.get(url)?.origin||'uploaded');
 for(const style of styles?.styles||styles?.userStyles||[])for(const [i,url]of (style.refs||[]).entries())add(url,`${style.n||'Style'} · reference ${i+1}`,found.get(url)?.origin||'uploaded');
 for(const item of saved)if(item&&typeof item.label==='string'){add(item.url,item.label,item.origin);const foundFile=found.get(item.url);if(foundFile&&item.kind==='captions'&&item.captionSource)foundFile.captionSource=item.captionSource;}
 const labels=new Map([...saved].reverse().filter(Boolean).map(item=>[item.url,item]));
 let next=Math.max(0,...saved.map(item=>Number.isSafeInteger(item?.generatedNumber)&&item.generatedNumber!>0?item.generatedNumber!:0));
 for(const file of found.values()){
  const previous=labels.get(file.url);if(previous?.userLabel?.trim())file.userLabel=previous.userLabel.trim().slice(0,80);
  if(file.origin==='generated'){file.generatedNumber=Number.isSafeInteger(previous?.generatedNumber)&&previous!.generatedNumber!>0?previous!.generatedNumber:++next;file.label=`${file.kind==='captions'?'Captions':file.kind[0].toUpperCase()+file.kind.slice(1)} ${String(file.generatedNumber).padStart(3,'0')}`}
  if(file.userLabel)file.label=file.userLabel;
 }
 return [...found.values()];
}

export function projectDownloadName(file:ProjectFile):string{
 const extension=file.url.split('.').at(-1)!;const label=file.label.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').trim().replace(/[. ]+$/,'')||'Media';
 return label.toLowerCase().endsWith('.'+extension)?label:label+'.'+extension;
}
