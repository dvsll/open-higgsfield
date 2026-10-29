import assert from 'node:assert/strict';
import {createServer} from 'vite';

// Exercise workspace handoff and editor lifetimes without media generation.
const saved={document:globalThis.document,addEventListener:globalThis.addEventListener,dispatchEvent:globalThis.dispatchEvent,CustomEvent:globalThis.CustomEvent};
const document=new EventTarget(),window=new EventTarget(),renders=[];
let workspace='Video',scene={type:'shot',video:'/outputs/1111111111111111.webm',ref:{shotId:'scene'}};
document.body={append(){},classList:{toggle(){}}};
document.createElement=()=>({dataset:{},append(){},querySelectorAll:()=>[]});
document.querySelector=()=>({value:workspace});
globalThis.dispatchEvent=window.dispatchEvent.bind(window);globalThis.document=document;globalThis.addEventListener=window.addEventListener.bind(window);
globalThis.CustomEvent=class extends Event{constructor(type,options={}){super(type);this.detail=options.detail}};
globalThis.__editTest={render:(host,view)=>renders.push(view)};
const server=await createServer({configFile:false,cacheDir:'outputs/.edit-workflow-test-cache',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,watch:null,hmr:false},appType:'custom',plugins:[{name:'edit-adapters',enforce:'pre',load(id){const p=id.replaceAll('\\','/');if(p.endsWith('/react/render.tsx'))return 'export const renderView=globalThis.__editTest.render';if(p.endsWith('/react/precision-editor.tsx'))return 'export function PrecisionEditor(){}';if(p.endsWith('/react/video-editor.tsx'))return 'export function VideoEditor(){}';if(p.endsWith('/shared/runtime/client.ts'))return 'export const OSH={upload:async()=>({url:"/outputs/2222222222222222.png"})}';}}]});
const event=(target,name,detail)=>target.dispatchEvent(new CustomEvent(name,{detail}));
document.addEventListener('osh-workspace-select',e=>{document.dispatchEvent(new Event('osh-edit-entering'));workspace=e.detail;event(document,'osh-workspace-selected',{name:workspace})});
try{
 const {mountEditWorkflow}=await server.ssrLoadModule('/studio/src/edit-workflow.ts');
 let applied=0;
 const editor=mountEditWorkflow(()=>scene,()=>applied++,file=>file.url===scene.video?scene:null);
 editor.open();assert.equal(workspace,'Video');assert.equal(editor.selected(),null,'video is rejected by image editor');
 scene={type:'keyframe',img:'/outputs/4444444444444444.png'};editor.open();
 const precision=()=>renders.findLast(view=>view?.type?.name==='PrecisionEditor');
 assert.equal(editor.selected().img,scene.img);assert.equal(precision().props.onApply,undefined);assert.equal(precision().props.actions,undefined,'image editor has no apply/dismiss action bar');
 const busy=precision().props.onBusy;busy(true);
 event(window,'osh-project-file-selected',{kind:'image',url:'/outputs/3333333333333333.png',label:'Image'});
 assert.equal(editor.selected().img,scene.img,'active work cannot unmount editor');busy(false);
 event(window,'osh-project-file-selected',{kind:'image',url:'/outputs/3333333333333333.png',label:'Image'});
 assert.equal(editor.selected().img,'/outputs/3333333333333333.png');
 event(window,'osh-project-file-selected',{kind:'audio',url:'/outputs/6666666666666666.wav'});
 assert.equal(editor.selected(),null,'non-image selection exits painting');
 console.log('PASS: Image editing callbacks, non-image rejection and busy source protection. No inference.');
}finally{await server.close();Object.assign(globalThis,saved);delete globalThis.__editTest}
