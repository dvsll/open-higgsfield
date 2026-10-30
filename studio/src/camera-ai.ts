import {SC} from './scene';
import type {CameraMove} from './camera-motion';
export async function interpretedCamera():Promise<CameraMove>{
 const saved=SC.get('osh-3d-camera')||{},prompt=String(saved.prompt||'').trim(),duration=saved.duration||4;
 if(!prompt)throw Error('Describe a camera movement first.');
 if(saved.interpreted?.prompt===prompt&&saved.interpreted?.duration===duration)return saved.interpreted.move;
 const response=await fetch('/api/camera-interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,duration})}),result=await response.json();
 if(!response.ok)throw Error(result.error||'Local AI could not interpret the camera movement.');
 const current=SC.get('osh-3d-camera')||{};if(String(current.prompt||'').trim()!==prompt||current.duration!==duration)throw Error('Camera instructions changed. Generate camera motion again.');
 const move=result as CameraMove;SC.set('osh-3d-camera',{...current,interpreted:{prompt,duration,move,model:result.model}});dispatchEvent(new CustomEvent('osh-camera-path',{detail:move}));return move;
}

export function preparedCamera():CameraMove{
 const saved=SC.get('osh-3d-camera')||{};
 if(saved.interpreted?.prompt!==String(saved.prompt||'').trim()||saved.interpreted?.duration!==saved.duration||!saved.interpreted?.move)throw Error('Press Generate camera motion first.');
 return saved.interpreted.move;
}
