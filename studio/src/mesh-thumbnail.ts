import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
const cache=new Map<string,Promise<string>>();let queue:Promise<unknown>=Promise.resolve();
/** Serialize offscreen snapshots so a large library never opens one WebGL context per row. */
export function meshThumbnail(url:string):Promise<string>{
 if(!/^\/outputs\/[a-f0-9]{16}\.(glb|obj)$/.test(url))return Promise.reject(Error('Invalid mesh source.'));
 const existing=cache.get(url);if(existing)return existing;
 const result=queue.then(()=>renderThumbnail(url));queue=result.catch(()=>{});cache.set(url,result);if(cache.size>48)cache.delete(cache.keys().next().value!);void result.catch(()=>cache.delete(url));return result;
}
async function renderThumbnail(url:string){
 const response=await fetch(url);if(!response.ok)throw Error('Mesh unavailable.');
 const object=url.endsWith('.glb')?(await new GLTFLoader().parseAsync(await response.arrayBuffer(),'')).scene:new OBJLoader().parse(await response.text());
 let renderer:THREE.WebGLRenderer|undefined;
 try{
  const box=new THREE.Box3().setFromObject(object);if(box.isEmpty())throw Error('Empty mesh.');const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),factor=2/Math.max(size.x,size.y,size.z,.001);object.scale.multiplyScalar(factor);object.position.addScaledVector(center,-factor);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#171b21');scene.add(object,new THREE.HemisphereLight(0xffffff,0x475163,2.6));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,5,4);scene.add(light);
  const camera=new THREE.PerspectiveCamera(35,160/96,.01,100);camera.position.set(3,2.2,3);camera.lookAt(0,0,0);
  renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(240,144);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');
 }finally{object.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();for(const material of (Array.isArray(node.material)?node.material:[node.material])){for(const value of Object.values(material))if(value instanceof THREE.Texture)value.dispose();material.dispose()}}});renderer?.dispose();renderer?.forceContextLoss()}
}
