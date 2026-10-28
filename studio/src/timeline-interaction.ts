/** Find a sequence insertion boundary using clip midpoints, not the playhead. */
export function insertionIndex(durations: number[], time: number): number {
  let start = 0;
  for (let i = 0; i < durations.length; i++) {
    if (time < start + durations[i] / 2) return i;
    start += durations[i];
  }
  return durations.length;
}
export function movedIndex(from: number, boundary: number): number {
  return boundary > from ? boundary - 1 : boundary;
}

/** AE-style horizontal placement: preserve duration, optionally snap either edge to nearby clips. */
export function draggedClipStart(start:number,deltaPixels:number,pixels:number,duration:number,peers:{start:number;duration:number}[],snap=true,max=600):number{
 const raw=Math.max(0,Math.min(max,start+deltaPixels/Math.max(1,pixels)));
 if(!snap)return Math.round(raw*1000)/1000;
 const candidates=[0,...peers.flatMap(peer=>[peer.start,peer.start+peer.duration,peer.start-duration,peer.start+peer.duration-duration])].filter(value=>value>=0&&value<=max);
 const nearest=candidates.sort((a,b)=>Math.abs(a-raw)-Math.abs(b-raw))[0];
 return Math.round((nearest!==undefined&&Math.abs(nearest-raw)*pixels<=8?nearest:raw)*1000)/1000;
}
