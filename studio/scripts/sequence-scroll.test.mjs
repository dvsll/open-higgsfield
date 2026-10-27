import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({configFile:false,cacheDir:'outputs/.sequence-scroll-test-cache',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
try{
 let listener,options,scroll,zoom;globalThis.dispatchEvent=event=>{zoom=event.detail};globalThis.CustomEvent=class{constructor(name,options){this.type=name;this.detail=options.detail}};
 globalThis.document={addEventListener:(name,fn,opts)=>{assert.equal(name,'wheel');listener=fn;options=opts}};
 const {mountSequenceScroll}=await server.ssrLoadModule('/studio/src/sequence-scroll.ts');mountSequenceScroll();
 assert.deepEqual(options,{passive:false,capture:true});
 const body={clientHeight:200,scrollBy:value=>scroll=value};
 // Clip, control and title all route through the same dock ancestor.
 for(const child of ['clip','number input','track toggle','window header']){
  let prevented=false;scroll=null;
  listener({target:{closest:selector=>{assert.match(selector,/timeline/);return {querySelector:()=>body}}},deltaX:0,deltaY:30,deltaMode:0,preventDefault:()=>prevented=true});
  assert.equal(prevented,true,child);assert.deepEqual(scroll,{left:0,top:30,behavior:'instant'});
 }
 const event={target:{closest:()=>({querySelector:()=>body})},deltaX:0,deltaY:2,deltaMode:1,shiftKey:true,preventDefault:()=>{}};
 listener(event);assert.deepEqual(scroll,{left:40,top:0,behavior:'instant'});
 scroll=null;listener({...event,ctrlKey:true});assert.equal(scroll,null);assert.equal(zoom.delta,2,'modified wheel requests timeline zoom');
 listener({...event,target:{closest:()=>null}});assert.equal(scroll,null,'other windows keep native scroll');
 console.log('Sequence scrolling regression checks passed');
}finally{delete globalThis.document;await server.close()}
