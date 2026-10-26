export function viewerTetherPath(x:number,y:number,endX:number,endY:number){
 const dx=endX-x,dy=endY-y,distanceSquared=dx*dx+dy*dy;
 // Blend tangents continuously: crossing a diagonal must not flip the curve's axis.
 const horizontal=distanceSquared?dx*dx/distanceSquared:.5;
 const bendX=dx*.5*horizontal,bendY=dy*.5*(1-horizontal);
 return `M${x} ${y} C${x+bendX} ${y+bendY},${endX-bendX} ${endY-bendY},${endX} ${endY}`;
}
