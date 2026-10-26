export function guideDropPosition(duration:number,width:number,x:number,fps=24){
 const pixels=Math.max(1,width),local=Math.max(0,Math.min(pixels,x)),edge=Math.min(28,pixels/4);
 const anchor=local<=edge?'start':local>=pixels-edge?'end':null;
 const time=anchor==='start'?0:anchor==='end'?duration:Math.min(duration,Math.round(local/pixels*duration*fps)/fps);
 return {time,anchor,percent:anchor==='start'?0:anchor==='end'?100:time/duration*100};
}
