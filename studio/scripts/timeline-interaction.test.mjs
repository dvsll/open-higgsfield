import assert from 'node:assert/strict';
import { insertionIndex, movedIndex } from '../src/timeline-interaction.ts';
const durations = [4, 3, 4];
assert.equal(insertionIndex(durations, -1), 0);
assert.equal(insertionIndex(durations, 1), 0);
assert.equal(insertionIndex(durations, 3), 1);
assert.equal(insertionIndex(durations, 5), 1);
assert.equal(insertionIndex(durations, 6), 2);
assert.equal(insertionIndex(durations, 50), 3);
assert.equal(movedIndex(0, 3), 2);
assert.equal(movedIndex(2, 0), 0);
assert.equal(movedIndex(1, 1), 1);
assert.equal(movedIndex(1, 2), 1);
console.log('PASS: clip midpoint insertion and forward/backward/no-op reorder boundaries.');
import {keyframeAtFrame} from '../src/frame-keyframe.ts';
const preciseGuide={t:1/24};
if(keyframeAtFrame([preciseGuide],2/24,24))throw new Error('Adjacent video frames must remain distinct');
if(keyframeAtFrame([preciseGuide],.041667,24)!==preciseGuide)throw new Error('Decoded frame precision must not create duplicate guides');
if(keyframeAtFrame([{t:0}],1/60,60))throw new Error('60 fps stepping must remain distinct');

import {linkedClipIds,moveLinkedClips} from '../src/video-continuation.ts';
const a={id:'a'},b={id:'b',continuation:{shotId:'a'}},c={id:'c',continuation:{shotId:'b'}},d={id:'d'},e={id:'e'};
assert.deepEqual([...linkedClipIds([a,b,c,d,e],'b')].sort(),['a','b','c']);
const moved=moveLinkedClips([a,b,c,d,e],1,5);assert.deepEqual(moved.shots.map(s=>s.id),['d','e','a','b','c']);assert.equal(moved.index,3);
assert.deepEqual(moveLinkedClips([d,a,b,c,e],0,3).shots.map(s=>s.id),['d','a','b','c','e']);
assert.deepEqual(moveLinkedClips([a,b,c,d],1,2).shots.map(s=>s.id),['a','b','c','d']);
assert.deepEqual([...linkedClipIds([b,c,d],'c')].sort(),['b','c']);
assert.deepEqual([...linkedClipIds([a,{id:'b'},c],'a')],['a']);
// Exercise actual controller transaction: no inference, original preserved, uploaded START and adjacency.
const {readFileSync}=await import('node:fs');
const director=readFileSync(new URL('../src/director.ts',import.meta.url),'utf8');
const controller=director.slice(director.indexOf('async function continueVideo(input)'),director.indexOf("$('#continueVideo').onclick"));
const original={id:'source',video:'/outputs/0123456789abcdef.webm',n:'Source',d:4,prompt:'Next action',spec:{},keys:[],r:true};
const ctx={SH:[original,{id:'other'}],continuingVideo:false,generationBusy:false,localStorage:{getItem:()=> 'project'},currentShot:()=>original,head(){},dispatchEvent(){},CustomEvent:class{},chooseGuideModel:async()=>{},captureVideoEnd:async()=>({image:'data:image/png;base64,fixture',duration:4}),OSH:{upload:async()=>({url:'/outputs/abcdef0123456789.png'})},newScene:()=>({id:'next',keys:[],r:false}),shotId:shot=>shot.id,linkedClipIds,setPlaying(){},pushHist(){},timeline(){},save(){},focusPromptField(){},toast(){},start:()=>4};
const continueActual=Function('ctx','with(ctx){'+controller+';return continueVideo}')(ctx);
await continueActual(null);assert.equal(ctx.SH[0],original);assert.equal(original.r,true);assert.equal(original.keys.length,0);assert.equal(ctx.SH[1].continuation.shotId,'source');assert.equal(ctx.SH[1].keys[0].anchor,'start');assert.equal(ctx.SH[1].keys[0].t,0);assert.equal(ctx.SH[1].keys[0].img,'/outputs/abcdef0123456789.png');assert.equal(ctx.SH[1].r,false);assert.equal(ctx.continuingVideo,false);
console.log('PASS: captured START reference, adjacent linked draft, preserved source, connected reorder and unlink.');

import {captureVideoEnd} from '../src/frame-keyframe.ts';
let decoded,drawnAt=-1;
class DecodedVideo extends EventTarget{
 duration=4;videoWidth=768;videoHeight=448;readyState=2;seeking=false;src='';time=0;
 set currentTime(value){this.time=value;queueMicrotask(()=>this.dispatchEvent(new Event('seeked')))}get currentTime(){return this.time}
 load(){if(this.src)queueMicrotask(()=>this.dispatchEvent(new Event('loadeddata')))}removeAttribute(){this.src=''}
}
const previousDocument=globalThis.document;
globalThis.document={createElement:tag=>tag==='video'?(decoded=new DecodedVideo()):{getContext:()=>({drawImage:video=>{drawnAt=video.currentTime}}),toDataURL:()=> 'data:image/png;base64,end'}};
try{const captured=await captureVideoEnd('/outputs/0123456789abcdef.webm');assert.equal(captured.duration,4);assert.equal(captured.image,'data:image/png;base64,end');assert.ok(drawnAt>3.998&&drawnAt<4);assert.equal(decoded.src,'');await assert.rejects(()=>captureVideoEnd('https://example.com/video.mp4'),/project video/)}finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument}
console.log('PASS: final decoded frame seeking, original geometry, owned-source validation and media cleanup.');

const {draggedClipStart}=await import('../src/timeline-interaction.ts');
assert.equal(draggedClipStart(0,199,100,2,[{start:0,duration:2}]),2);
assert.equal(draggedClipStart(0,199,100,2,[{start:0,duration:2}],false),1.99);
assert.equal(draggedClipStart(4,-301,100,1,[{start:0,duration:2}]),1);
assert.equal(draggedClipStart(1,-500,100,2,[]),0);
assert.equal(draggedClipStart(599,500,100,1,[],false),600);
console.log('PASS: draggable clip placement snaps either edge, preserves free placement with Alt and clamps bounds.');
