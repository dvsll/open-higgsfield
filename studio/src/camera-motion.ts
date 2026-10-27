export type CameraMove={kind:'orbit'|'dolly'|'pan'|'crane'|'tilt';direction:1|-1;duration:number;amount:number};
/** Deliberately limited local camera instructions; unknown directions never silently pick a path. */
export function cameraMove(prompt:string,duration=4):CameraMove{
 const text=prompt.trim().toLowerCase();
 if(!Number.isFinite(duration)||duration<.5||duration>60)throw Error('Choose a duration from 0.5 to 60 seconds.');
 if(/\b(not|never|without)\b/.test(text))throw Error('Describe one camera movement directly.');
 const actions=[/\b(orbit|circle)\b/.test(text),/\b(dolly|push|pull|zoom)\b/.test(text),/\b(pan|truck|slide)\b/.test(text),/\b(crane|rise|descend)\b/.test(text),/\btilt\b/.test(text)];
 if(actions.filter(Boolean).length!==1)throw Error('Use one movement: orbit left/right, dolly in/out, pan left/right, crane up/down or tilt up/down.');
 const kind=(['orbit','dolly','pan','crane','tilt'] as const)[actions.indexOf(true)];
 const positive=kind==='dolly'?/\b(in|forward|closer|push)\b/:kind==='crane'||kind==='tilt'?/\b(up|rise)\b/:/\b(right|clockwise)\b/;
 const negative=kind==='dolly'?/\b(out|back|backward|away|pull)\b/:kind==='crane'||kind==='tilt'?/\b(down|descend)\b/:/\b(left|counterclockwise)\b/;
 if(positive.test(text)===negative.test(text))throw Error('Specify a direction for the camera movement.');
 return {kind,direction:positive.test(text)?1:-1,duration,amount:/\b(subtle|gentle|slight)\b/.test(text)?.5:1};
}
export const cameraEase=(progress:number)=>{const t=Math.max(0,Math.min(1,progress));return t*t*(3-2*t)};
