import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/director.ts',import.meta.url),'utf8');
const code=source.slice(source.indexOf('let generationActivity=null'),source.indexOf('\nasync function realShot'));
const elements=Object.fromEntries(['ov','empty','pb','ovt','ovDiagnostics'].map(id=>['#'+id,{style:{display:'none'},textContent:''}]));
const listeners={},timers=new Set();
const body={appendChild:el=>{el.parentElement=body}};
const panels=new Map();
const panel=(left)=>({getClientRects:()=>[{}],getBoundingClientRect:()=>({left,top:10,width:400,height:300})});
panels.set('viewer',panel(500));panels.set('assets',panel(0));
const busy=new Function('$','document','addEventListener','setInterval','clearInterval','renderView','h','GenerationDiagnostics',code+';return busy')(id=>elements[id],{body,querySelector:selector=>panels.get(selector.match(/data-window="([^"]+)"/)[1])},(name,fn)=>listeners[name]=fn,fn=>{timers.add(fn);return fn},fn=>timers.delete(fn),()=>{},()=>{},()=>{});
const emit=phase=>listeners['osh-generation-progress']({detail:{phase,message:'Loading model',phaseStartedAt:Date.now(),percent:25}});
emit('loading');assert.equal(elements['#ov'].parentElement,body,'Progress escapes container-query panels that establish fixed-position containing blocks');assert.equal(elements['#ov'].style.display,'flex');for(const tick of timers)tick();assert.match(elements['#ovt'].textContent,/Loading model/);assert.equal(elements['#pb'].style.width,'25%');
assert.equal(elements['#ov'].style.left,'500px','Visible timeline viewer owns generation progress');
panels.delete('viewer');emit('loading');assert.equal(elements['#ov'].parentElement,body,'Progress escapes container-query panels that establish fixed-position containing blocks');assert.equal(elements['#ov'].style.left,'0px','Selected media is a fallback when the viewer is closed');
emit('complete');assert.equal(elements['#ov'].style.display,'none');emit('loading');emit('error');assert.equal(elements['#ov'].style.display,'none');
await busy('Preparing',async()=>{assert.equal(elements['#empty'].style.display,'none');emit('complete');assert.equal(elements['#ov'].style.display,'flex')});assert.equal(elements['#ov'].style.display,'none');
await assert.rejects(busy('Preparing',async()=>{throw Error('fixture')}));assert.equal(elements['#ov'].style.display,'none');
console.log('PASS: common progress for SDK jobs, real percentages, terminal cleanup and preparing-stage ownership.');

// Execute the real Generate handler: selection must never redirect output off timeline.
const generateCode=source.slice(source.indexOf("$('#gen').onclick=async"),source.indexOf("\n$('#genAll').onclick"));
for(const empty of [true,false]){
 const shots=empty?[]:[{n:'Scene',keys:[]}],draft={n:'Draft',keys:[]};
 const controls={'#gen':{},'#ov':{style:{display:'none'}},'#kgo':{disabled:false},'#promptAdvanced':{open:false},'#videoFrames':{reportValidity:()=>true},'#videoFPS':{reportValidity:()=>true}};
 let rendered=0,submitted=0;
 new Function('$','currentShot','requireGenerationPrompt','focusPromptField','OSH','ensureScene','realShot','timeline','head','toast','cur',generateCode)(
  id=>controls[id],()=>shots[0]||draft,()=>{},()=>{},{online:true},()=>{if(!shots.length)shots.push(draft)},
  async(index,label,libraryOnly=false)=>{submitted++;assert.equal(libraryOnly,false);assert.ok(shots[index]);shots[index].video='/outputs/generated.webm';return {url:shots[index].video}},
  ()=>rendered++,()=>{},()=>{},0
 );
 await controls['#gen'].onclick();
 assert.equal(submitted,1);assert.equal(rendered,1);assert.equal(shots[0].video,'/outputs/generated.webm');
}
console.log('PASS: Generate targets timeline scenes with empty or populated timelines, without a selected clip.');
