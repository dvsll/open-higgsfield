import assert from 'node:assert/strict';
import {projectFiles}from'../src/project-files-index.ts';
const image='/outputs/'+ 'a'.repeat(16)+'.png',video='/outputs/'+'b'.repeat(16)+'.webm',audio='/outputs/'+'c'.repeat(16)+'.flac';
const current={SH:[{n:'Scene',video,audio,keys:[{img:image}]}],HISTORY:[{url:image,label:'Image'},{url:'https://remote.test/private.png'},{url:'/outputs/../config.json'}]};
assert.equal(projectFiles(current,{}).length,3);assert.deepEqual(new Set(projectFiles(current,{}).map(f=>f.kind)),new Set(['image','audio','video']));assert.equal(projectFiles({SH:[],HISTORY:[]},{}).length,0);assert.equal(projectFiles({}, {image:{url:image}})[0].url,image);assert.equal(projectFiles({}, {},[{n:'Actor',refs:[image]}])[0].url,image);assert.equal(projectFiles({}, {},[],{styles:[{n:'Look',refs:[image]}]})[0].url,image);assert.equal(projectFiles({TRASH:[{shot:{video}}]},{}).length,0);
console.log('PASS: project file indexing deduplicates, excludes remote/unsafe paths and trash, includes project image/audio/video references without reading other projects.');

assert.equal(projectFiles({}, {}, [], {}, [{url:image,label:'Older generated image',kind:'image'}]).length,1,'saved project assets survive the bounded take history');

assert.equal(projectFiles(null,null,[],{},[{url:'/outputs/1111111111111111.wav',label:'Voice',kind:'audio'}])[0].kind,'audio');

const {readFileOrganization,removeFileFolder}=await import('../src/project-file-folders.ts');
const organization=readFileOrganization({folders:[{id:'refs',name:' References '},{id:'refs',name:'Duplicate'},{id:'bad',name:' '}],assignments:{[image]:'refs',[video]:'missing'}});
assert.deepEqual(organization.folders,[{id:'refs',name:'References'}]);assert.equal(organization.assignments[image],'refs');assert.equal(organization.assignments[video],undefined);
assert.deepEqual(removeFileFolder(organization,'refs'),{folders:[],assignments:{}});assert.equal(projectFiles(current,{}).length,3,'folder removal never deletes media');
assert.deepEqual(readFileOrganization(null).folders,[]);

const {importType,externalFiles}=await import('../src/file-import-policy.ts');
assert.equal(importType({name:'Frame.JPEG',size:1024}),'image/jpeg');assert.equal(importType({name:'video.webm',size:1024}),'video/webm');assert.equal(importType({name:'sound.wav',size:1024}),'audio/wav');
assert.throws(()=>importType({name:'empty.png',size:0}),/empty/);assert.throws(()=>importType({name:'bad.svg',size:100}),/Use PNG/);assert.throws(()=>importType({name:'big.mp4',size:101*1024*1024}),/100 MB/);assert.throws(()=>importType({name:'big.jpg',size:21*1024*1024}),/20 MB/);
assert.equal(externalFiles({types:['Files']}),true);assert.equal(externalFiles({types:['text/uri-list']}),false);assert.equal(externalFiles({types:['Files','application/x-studio-file']}),false);assert.equal(externalFiles(null),false);

// Exercise the actual drag/import service with browser adapters and no network or models.
const {createServer}=await import('vite');
const original={innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight,window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch,requestAnimationFrame:globalThis.requestAnimationFrame,dispatchEvent:globalThis.dispatchEvent};
const state=new Map(),views=[],requests=[];
globalThis.__fileDropTest={storage:{get:key=>state.get(key),set:(key,value)=>state.set(key,value)},render:(_host,view)=>views.push(view.props)};
const server=await createServer({configFile:false,cacheDir:'outputs/.file-drop-test-cache',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom',plugins:[{name:'file-drop-adapters',enforce:'pre',load(id){const path=id.replaceAll('\\','/');if(path.endsWith('/studio/src/scene.ts'))return 'export const SC=globalThis.__fileDropTest.storage';if(path.endsWith('/studio/src/react/render.tsx'))return 'export const renderView=globalThis.__fileDropTest.render;export const unmountView=()=>{}'}}]});
try{
 globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.window=new EventTarget();globalThis.document={body:{append(){}},querySelector:()=>null,createElement:()=>({remove(){}})};
 globalThis.requestAnimationFrame=callback=>{callback();return 1};globalThis.dispatchEvent=event=>window.dispatchEvent(event);
 globalThis.fetch=async(url,options)=>{requests.push({url,type:options.headers['Content-Type']});return {ok:true,json:async()=>({url:'/outputs/3333333333333333.wav',kind:'audio'})}};
 const {mountProjectFileDrop}=await server.ssrLoadModule('/studio/src/project-file-drop.ts');mountProjectFileDrop();
 function drag(type,types,files=[],extra={}){const event=new Event(type,{cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{types,files,dropEffect:''}});for(const [key,value]of Object.entries(extra))Object.defineProperty(event,key,{value});window.dispatchEvent(event);return event}
 assert.equal(drag('dragenter',['application/x-studio-file']).defaultPrevented,false);assert.equal(views.at(-1).active,false);
 assert.equal(drag('dragenter',['Files']).defaultPrevented,true);assert.equal(views.at(-1).active,true);
 drag('dragenter',['Files']);drag('dragleave',['Files'],[],{clientX:100,clientY:100});assert.equal(views.at(-1).active,true,'nested element changes do not dismiss the overlay');
 window.dispatchEvent(Object.assign(new Event('keydown'),{key:'Escape'}));assert.equal(views.at(-1).active,false);
 drag('dragenter',['Files']);const drop=drag('drop',['Files'],[new File(['bad'],'bad.txt'),new File(['wave'],'voice.wav')]);assert.equal(drop.defaultPrevented,true);
 for(let i=0;i<10&&views.at(-1).busy;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(views.at(-1).active,false);assert.equal(views.at(-1).busy,false);assert.match(views.at(-1).message,/1 file added/);assert.equal(views.at(-1).errors.length,1);
 assert.equal(requests.length,1);assert.equal(requests[0].url,'/api/media');assert.equal(state.get('osh-project-files')[0].label,'voice.wav');
 globalThis.document.querySelector=selector=>selector==='.tour-popover'?{hidden:false}:null;drag('dragenter',['Files']);assert.equal(views.at(-1).active,false);drag('drop',['Files'],[new File(['wave'],'voice.wav')]);assert.equal(requests.length,1,'focused onboarding blocks external imports');
 window.dispatchEvent(new Event('pagehide'));
}finally{await server.close();delete globalThis.__fileDropTest;for(const [key,value]of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}
const uploaded=projectFiles({SH:[{video,r:true}]},{},[],{},[{url:video,label:'Uploaded clip',kind:'video',origin:'uploaded'}]);
assert.equal(uploaded[0].origin,'uploaded','explicit import provenance survives timeline references');
assert.equal(projectFiles({HISTORY:[{url:image}]},{})[0].origin,'generated');
assert.equal(projectFiles({}, {},[],{},[{url:audio,label:'Legacy audio',kind:'audio'}])[0].origin,undefined,'unknown legacy origins are not guessed');

// Native drag routing validates project ownership and highlights compatible tracks.
const track=new EventTarget(),classes=new Map();
const laneIds=['trk','videoTrackToggle','audioTrack','audioTrackToggle','overlayTrack','overlayTrackToggle'];
for(const id of laneIds)classes.set(id,new Set());
const dropped=[];
globalThis.__sequenceDropTest={get:()=>[{url:video,kind:'video',label:'Clip'},{url:image,kind:'image',label:'Picture'}]};
const dropServer=await createServer({configFile:false,cacheDir:'outputs/.sequence-drop-test-cache',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,watch:null,hmr:false},appType:'custom',plugins:[{name:'sequence-drop-storage',enforce:'pre',load(id){if(id.replaceAll('\\','/').endsWith('/studio/src/scene.ts'))return 'export const SC=globalThis.__sequenceDropTest'}}]});
const originalDrop={document:globalThis.document,addEventListener:globalThis.addEventListener};
try{
 track.querySelector=()=>({});track.contains=()=>false;
 globalThis.document={getElementById:id=>id==='tl'?track:{classList:{add:name=>classes.get(id).add(name),remove:name=>classes.get(id).delete(name)}}};globalThis.addEventListener=()=>{};
 const {mountSequenceFileDrop}=await dropServer.ssrLoadModule('/studio/src/sequence-file-drop.ts');mountSequenceFileDrop((...args)=>dropped.push(args));
 const drag=(action,kind,id,url=video)=>{const event=new Event(action,{cancelable:true});Object.defineProperties(event,{target:{value:{closest:selector=>selector==='#'+id}},clientX:{value:100},dataTransfer:{value:{types:['application/x-studio-file-'+kind],getData:()=>url}}});track.dispatchEvent(event);return event};
 assert.equal(drag('dragover','video','trk').defaultPrevented,true);assert.equal(classes.get('trk').has('file-drop-compatible'),true);assert.equal(classes.get('audioTrack').size,0);
 drag('drop','video','trk');assert.equal(dropped.length,1);assert.equal(dropped[0][1],'video');assert.equal(classes.get('trk').size,0);
 drag('drop','video','audioTrack');drag('drop','video','trk','/outputs/ffffffffffffffff.webm');assert.equal(dropped.length,1,'wrong lane and non-project media rejected');
 drag('dragover','image','overlayTrack');assert.equal(classes.get('overlayTrack').size,1);assert.equal(classes.get('trk').size,1,'images may also become scene guides');
 drag('drop','image','overlayTrack',image);assert.equal(dropped[1][1],'overlays');assert.equal(drag('drop','image','trk',image).defaultPrevented,false,'legacy guide handler retains ownership');
}finally{await dropServer.close();Object.assign(globalThis,originalDrop);delete globalThis.__sequenceDropTest}
