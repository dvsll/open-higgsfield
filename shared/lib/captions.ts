export type CaptionSegment={start:number;end:number;text:string};
export function captionSegments(value:unknown,max=600):CaptionSegment[]{
 if(!Array.isArray(value))throw Error('The transcription did not return caption segments.');
 return value.slice(0,500).filter((s:any)=>Number.isFinite(s?.start)&&Number.isFinite(s?.end)&&s.end>s.start&&s.start>=0&&s.start<max&&typeof s.text==='string'&&s.text.trim()).map((s:any)=>({start:s.start,end:Math.min(max,s.end),text:s.text.trim().slice(0,500)}));
}
export function captionSrt(segments:CaptionSegment[]):string{
 const time=(seconds:number)=>{const ms=Math.round(seconds*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`};
 return segments.map((s,i)=>`${i+1}\n${time(s.start)} --> ${time(s.end)}\n${s.text.replaceAll('-->','→')}`).join('\n\n')+'\n';
}
