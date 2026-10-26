import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {OSH} from '../../../shared/runtime/client';
import type {ModelChoice} from '../../../shared/runtime/model-catalog';
import {geometryBase} from '../../../shared/lib/geometry';
import {SC} from '../scene';
import {NumberInput} from './number-input';
import '../geometry-workspace.css';

function MeshViewer({url}:{url:string}){
 const host=useRef<HTMLDivElement>(null),[error,setError]=useState('');
 useEffect(()=>{
  if(!host.current||!url)return;const element=host.current;let disposed=false,world:THREE.Group|undefined;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#111317');const camera=new THREE.PerspectiveCamera(40,1,.01,100);camera.position.set(3,2,3);
  let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:true})}catch{setError('3D preview needs WebGL. The mesh is still available to download.');return}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;element.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','3D mesh preview. Drag to orbit; scroll to zoom.');
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;
  scene.add(new THREE.HemisphereLight(0xffffff,0x414653,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,5,2);scene.add(light);
  const grid=new THREE.GridHelper(4,20,0x3d4652,0x222830);grid.position.y=-1;scene.add(grid);
  const draw=()=>{if(!disposed&&element.clientWidth&&element.clientHeight)renderer.render(scene,camera)};
  const resize=()=>{const w=element.clientWidth,h=element.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();draw()};
  const observer=new ResizeObserver(resize);observer.observe(element);controls.addEventListener('change',draw);resize();setError('');
  const abort=new AbortController();void fetch(url,{signal:abort.signal}).then(response=>{if(!response.ok)throw Error('Could not load the saved mesh.');return response.arrayBuffer()}).then(bytes=>new GLTFLoader().parseAsync(bytes,'')).then(gltf=>{
   world=gltf.scene;if(disposed){disposeMesh(world);return}const box=new THREE.Box3().setFromObject(world),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),scale=2/Math.max(size.x,size.y,size.z,.001);world.position.sub(center);world.scale.setScalar(scale);world.position.multiplyScalar(scale);scene.add(world);controls.target.set(0,0,0);controls.update();draw();
  }).catch(reason=>{if(!disposed)setError((reason as Error).message)});
  return()=>{disposed=true;abort.abort();observer.disconnect();controls.removeEventListener('change',draw);controls.dispose();if(world)disposeMesh(world);grid.geometry.dispose();(grid.material as THREE.Material).dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()};
 },[url]);
 return <div className="geometry-viewer" ref={host}>{error&&<p role="status">{error}</p>}</div>;
}
function disposeMesh(group:THREE.Object3D){group.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();const materials:THREE.Material[]=Array.isArray(object.material)?object.material:[object.material];for(const material of materials){for(const value of Object.values(material))if(value instanceof THREE.Texture)value.dispose();material.dispose()}}})}

export function GeometryWorkspace(){
 const saved=SC.get('osh-geometry')||{},[image,setImage]=useState<string>(saved.image||''),[url,setUrl]=useState<string>(saved.url||''),[model,setModel]=useState<string>(saved.model||geometryBase),[models,setModels]=useState<ModelChoice[]>([]),[checked,setChecked]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[seed,setSeed]=useState(7),[steps,setSteps]=useState(20),file=useRef<HTMLInputElement>(null);
 useEffect(()=>{const refresh=()=>{void OSH.models().then(value=>{setModels(value.geometry||[]);setChecked(true)}).catch(error=>{setChecked(true);setMessage((error as Error).message)})};const choose=(event:Event)=>{const detail=(event as CustomEvent<string|{id:string;image?:string}>).detail,id=typeof detail==='string'?detail:detail?.id;if(typeof id==='string'){setModel(id);if(typeof detail==='object'&&typeof detail.image==='string'&&/^\/outputs\/[a-f0-9]{16}\.png$/.test(detail.image))setImage(detail.image);refresh()}};refresh();addEventListener('osh-model-refresh',refresh);addEventListener('osh-select-3d-model',choose);return()=>{removeEventListener('osh-model-refresh',refresh);removeEventListener('osh-select-3d-model',choose)}},[]);
 useEffect(()=>{SC.set('osh-geometry',{image,url,model})},[image,url,model]);
 async function upload(input:File){setBusy(true);try{if(!['image/png','image/jpeg','image/webp'].includes(input.type)||input.size>20*1024*1024)throw Error('Choose a PNG, JPEG or WebP reference image.');const bitmap=await createImageBitmap(input);try{const canvas=document.createElement('canvas'),scale=Math.min(1,1024/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);setImage((await OSH.upload(canvas.toDataURL('image/png'))).url)}finally{bitmap.close()}setMessage('')}catch(error){setMessage((error as Error).message)}finally{setBusy(false)}}
 async function generate(){if(busy||!image)return;setBusy(true);setMessage('Generating mesh geometry…');try{const result=await OSH.geometry({image,model,seed,steps,resolution:128});setUrl(result.url);setMessage('')}catch(error){setMessage((error as Error).message)}finally{setBusy(false)}}
 return <section className="geometry-workspace"><div className="geometry-tools"><label>Model<select aria-label="3D model" disabled={busy} value={model} onChange={event=>setModel(event.target.value)}>{models.map(choice=><option value={choice.id} key={choice.id}>{choice.parentId?'↳ ':''}{choice.label}</option>)}</select></label><button disabled={busy} onClick={()=>file.current?.click()}>{image?'Change reference':'Add reference image'}</button><input ref={file} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>{if(event.target.files?.[0])void upload(event.target.files[0]);event.target.value=''}}/>{image&&<img src={image} alt="3D generation reference"/>}<label>Seed<NumberInput aria-label="3D seed" min={0} max={2147483647} step={1} value={seed} disabled={busy} onChange={event=>setSeed(+event.target.value)}/></label><label>Steps<NumberInput aria-label="3D sampling steps" min={1} max={50} step={1} value={steps} disabled={busy} onChange={event=>setSteps(+event.target.value)}/></label><button disabled={busy||!image||!models.some(choice=>choice.id===model)} onClick={()=>void generate()}>{busy?'Generating…':'Generate geometry'}</button>{url&&<a href={url} download="shape.glb">Download GLB</a>}</div>{url?<MeshViewer url={url}/>:<div className="geometry-empty">{!checked?'Checking 3D model…':models.length?(image?'No mesh generated yet.':'Add a reference image to generate a mesh.'):'Install the Hunyuan3D mini model and Studio geometry nodes in Admin.'}</div>}<p className="geometry-status" role="status">{message}</p></section>;
}
