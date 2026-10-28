import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
/** A projected surface material, not inferred multiview/PBR reconstruction. */
export function surfaceUV(source:THREE.BufferGeometry){
 const geometry=source.index?source.toNonIndexed():source.clone(),position=geometry.getAttribute('position');geometry.computeBoundingBox();const box=geometry.boundingBox!,size=box.getSize(new THREE.Vector3()),uv=new Float32Array(position.count*2),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3();
 for(let i=0;i<position.count;i+=3){a.fromBufferAttribute(position,i);b.fromBufferAttribute(position,i+1);c.fromBufferAttribute(position,i+2);normal.crossVectors(b.sub(a),c.sub(a));const axis=Math.abs(normal.y)>=Math.max(Math.abs(normal.x),Math.abs(normal.z))?'y':Math.abs(normal.x)>Math.abs(normal.z)?'x':'z';for(let j=i;j<i+3;j++){a.fromBufferAttribute(position,j).sub(box.min);uv[j*2]=axis==='x'?a.z/Math.max(size.z,.001):a.x/Math.max(size.x,.001);uv[j*2+1]=axis==='y'?a.z/Math.max(size.z,.001):a.y/Math.max(size.y,.001)}}
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));return geometry;
}
export async function textureMesh(root:THREE.Object3D,image:string){
 const texture=await new THREE.TextureLoader().loadAsync(image);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;root.traverse(node=>{if(node instanceof THREE.Mesh){const geometry=surfaceUV(node.geometry);node.geometry.dispose();node.geometry=geometry;for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();node.material=new THREE.MeshStandardMaterial({map:texture,roughness:.8,metalness:0})}});
}
export async function saveMaterialMesh(root:THREE.Object3D){
 const glb=await new GLTFExporter().parseAsync(root,{binary:true});if(!(glb instanceof ArrayBuffer))throw Error('Could not export textured mesh.');const bytes=new Uint8Array(glb);let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));const response=await fetch('/api/geometry-material',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({glb:btoa(binary)})}),result=await response.json();if(!response.ok)throw Error(result.error||'Could not save textured mesh.');return result.url as string;
}
