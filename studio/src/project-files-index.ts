export type ProjectFile = { url: string; label: string; kind: 'video'|'image'|'audio' };
export function projectFiles(director: any, workshop: any, elements: any[] = [], styles: any = {}, saved: ProjectFile[] = []): ProjectFile[] {
 const found = new Map<string,ProjectFile>();
 const add = (url: unknown,label:string) => { if(typeof url!=='string'||!/^\/outputs\/[a-f0-9]{16}\.(png|webm|mp4|flac)$/.test(url))return;const kind=url.endsWith('.png')?'image':url.endsWith('.flac')?'audio':'video';if(!found.has(url))found.set(url,{url,label,kind}); };
 for(const shot of [...(director?.SH||[]),...(director?.STASH||[]).map((e:any)=>e.shot)]) {add(shot.video,shot.n||'Video');add(shot.audio,(shot.n||'Scene')+' audio');for(const [i,key] of (shot.keys||[]).entries())add(key.img,`${shot.n||'Scene'} · frame ${i+1}`)}
 for(const item of director?.HISTORY||[]) {add(item.url,item.label||'Generated media');add(item.audio,(item.label||'Take')+' audio')}
 for(const layer of [...(director?.LAYERS?.audio||[]),...(director?.LAYERS?.overlays||[])])add(layer.url,layer.name||'Sequence layer');
 add(workshop?.imageDraft?.url||workshop?.image?.url,'Workshop image');
 for(const element of elements)for(const [i,url]of (element.refs||[]).entries())add(url,`${element.n||'Element'} · reference ${i+1}`);
 for(const style of styles?.styles||styles?.userStyles||[])for(const [i,url]of (style.refs||[]).entries())add(url,`${style.n||'Style'} · reference ${i+1}`);
 for(const item of saved)if(item&&typeof item.label==='string')add(item.url,item.label);
 return [...found.values()];
}
