/** Map scene-relative guides onto the requested render duration after timing changes. */
export function renderGuideTimes<T extends {t:number}>(keys:T[],sceneDuration:number,frames:number,fps:number):T[]{
 const duration=frames/fps;
 if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(sceneDuration)||sceneDuration<=0)throw Error('Choose a valid scene duration, frame count and frame rate.');
 return keys.map(key=>({...key,t:Math.max(0,Math.min(1,key.t/sceneDuration))*duration}));
}
