export type Continuation={shotId:string;video:string;frame:string};
type Linked={id?:string;continuation?:Continuation};
/** Connected clips move as a group; the captured start image stays a fixed reference. */
export function linkedClipIds(shots:Linked[],id:string):Set<string>{
 const group=new Set([id]);let changed=true;
 while(changed){changed=false;for(const shot of shots){if(!shot.id||!shot.continuation||!shots.some(parent=>parent.id===shot.continuation!.shotId))continue;if(group.has(shot.id)||group.has(shot.continuation.shotId)){for(const key of [shot.id,shot.continuation.shotId])if(!group.has(key)){group.add(key);changed=true}}}}
 return group;
}
export function moveLinkedClips<T extends Linked>(shots:T[],from:number,boundary:number):{shots:T[];index:number}{
 const selected=shots[from];if(!selected?.id)return {shots,index:from};
 const moving=linkedClipIds(shots,selected.id),group=shots.filter(s=>s.id&&moving.has(s.id));
 const target=shots[Math.max(0,Math.min(shots.length,boundary))];
 if(target?.id&&moving.has(target.id))return {shots,index:from};
 // Do not split a different linked group with an insertion.
 if(target?.id){const peers=linkedClipIds(shots,target.id);while(boundary>0&&shots[boundary-1]?.id&&peers.has(shots[boundary-1].id!))boundary--}
 const remaining=shots.filter(s=>!s.id||!moving.has(s.id));
 const index=shots.slice(0,boundary).filter(s=>!s.id||!moving.has(s.id)).length;
 remaining.splice(index,0,...group);return {shots:remaining,index:remaining.indexOf(selected)};
}
