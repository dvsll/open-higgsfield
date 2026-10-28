export type TourRect={left:number;top:number;right:number;bottom:number};
/** Keep the card below app chrome and clear of highlighted controls/open menus. */
export function tourPlacement(width:number,height:number,viewportWidth:number,viewportHeight:number,targets:TourRect[],obstacles:TourRect[]=[],top=12){
 const left=12,right=Math.max(left,viewportWidth-width-12),bottom=Math.max(top,viewportHeight-height-12),blocked=[...targets,...obstacles];
 const candidates=blocked.flatMap(r=>[[r.left,r.bottom+14],[r.right+14,r.top],[r.left-width-14,r.top],[r.left,r.top-height-14]]);
 candidates.push([right,top],[left,top],[right,bottom],[left,bottom]);
 const clamp=([x,y]:number[])=>({x:Math.max(left,Math.min(right,x)),y:Math.max(top,Math.min(bottom,y))});
 const overlap=({x,y}:{x:number;y:number})=>blocked.reduce((sum,r)=>sum+Math.max(0,Math.min(x+width,r.right+8)-Math.max(x,r.left-8))*Math.max(0,Math.min(y+height,r.bottom+8)-Math.max(y,r.top-8)),0);
 return candidates.map(clamp).sort((a,b)=>overlap(a)-overlap(b))[0];
}
