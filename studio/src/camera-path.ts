import * as THREE from 'three';
import {cameraEase,type CameraMove} from './camera-motion';
/** Playback and the editor trajectory sample the same camera transform. */
export function cameraPose(move:CameraMove,position:THREE.Vector3,target:THREE.Vector3,pivot:THREE.Vector3,progress:number){
 const t=cameraEase(progress)*move.amount*move.direction,next=position.clone(),aim=target.clone(),offset=position.clone().sub(pivot),distance=Math.max(.1,offset.length()),right=target.clone().sub(position).cross(new THREE.Vector3(0,1,0)).normalize();
 if(move.kind==='orbit'){offset.applyAxisAngle(new THREE.Vector3(0,1,0),-t*Math.PI/2);next.copy(pivot).add(offset);aim.copy(pivot)}
 if(move.kind==='dolly')next.addScaledVector(target.clone().sub(position).normalize(),t*distance*.45);
 if(move.kind==='pan'){next.addScaledVector(right,t*distance*.4);aim.addScaledVector(right,t*distance*.4)}
 if(move.kind==='crane'){next.y+=t*distance*.35;aim.y+=t*distance*.35}
 if(move.kind==='tilt')aim.y+=t*distance*.4;
 return {position:next,target:aim};
}
