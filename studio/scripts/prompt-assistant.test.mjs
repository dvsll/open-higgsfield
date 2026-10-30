import assert from 'node:assert/strict';
import {modelDevice,setModelDevice} from '../src/model-device.ts';
import {applyPromptDetails,manualPromptFields,shouldRewriteBeforeGeneration} from '../src/prompt-assistant.ts';
import {rewriteInput,validatePromptDetails,preserveRequestedSilence,validateReviewDetails,PromptRewriter,promptDevice,parsePromptDetails} from '../../shared/runtime/prompt-rewriter.ts';
assert.equal(shouldRewriteBeforeGeneration(true,{}),false);assert.equal(shouldRewriteBeforeGeneration(false,{}),true);assert.equal(shouldRewriteBeforeGeneration(false,{promptAutofill:false}),false);
assert.deepEqual(validateReviewDetails({motion:' Locked camera ',audio:''}),{motion:'Locked camera',audio:''});for(const invalid of [null,[],{secret:'x'},{motion:4},{audio:'x'.repeat(2001)}])assert.throws(()=>validateReviewDetails(invalid));
const details={visual:'A robot and a yellow flower.',motion:'Slow push in.',audio:'Water droplets.'};
const fresh={prompt:'Robot waters a flower.'};
applyPromptDetails(fresh,fresh.prompt,details);
assert.equal(fresh.visualPrompt,details.visual);assert.equal(fresh.m,details.motion);assert.equal(fresh.audioPrompt,details.audio);
assert.equal(fresh.rewriteSource,fresh.prompt);assert.deepEqual(manualPromptFields(fresh),{visual:false,motion:false,audio:false});
// Existing authored fields and an explicit blank/silent override must survive a rewrite.
const authored={m:'Hold the camera still.',audioPrompt:'',promptOverrides:{motion:true,audio:true}};
applyPromptDetails(authored,'new prompt',details);assert.equal(authored.m,'Hold the camera still.');assert.equal(authored.audioPrompt,'');assert.equal(authored.visualPrompt,details.visual);
const legacy={m:'Original motion.',audioPrompt:'Original ambience.'};applyPromptDetails(legacy,'new',details);assert.equal(legacy.m,'Original motion.');assert.equal(legacy.audioPrompt,'Original ambience.');
fresh.promptOverrides.audio=true;fresh.audioPrompt='Manual sound entered while rewriting.';applyPromptDetails(fresh,'changed',{...details,audio:'New inferred sound'});assert.match(fresh.audioPrompt,/Manual sound/);
fresh.promptOverrides={};applyPromptDetails(fresh,'reset',details);assert.equal(fresh.audioPrompt,details.audio);
assert.equal(rewriteInput('  a scene  '),'a scene');for(const invalid of [null,'',' '.repeat(4),'x'.repeat(4001),{}])assert.throws(()=>rewriteInput(invalid));
assert.deepEqual(validatePromptDetails({...details,audio:''}),{...details,audio:''});
assert.equal(preserveRequestedSilence(details,'A completely silent video.').audio,'');assert.equal(preserveRequestedSilence(details,'Water droplets, no music.').audio,details.audio);assert.equal(preserveRequestedSilence({...details,audio:'None'},'A flower.').audio,'');
for(const invalid of [null,{}, {...details,visual:''},{...details,audio:4},{...details,motion:'x'.repeat(2001)}])assert.throws(()=>validatePromptDetails(invalid));
const missing=new PromptRewriter({status:async()=>({available:false,model:'ComfyUI',reason:'ComfyUI unavailable'}),generate:async()=>{throw Error('must not run')}});assert.equal((await missing.status()).available,false);await assert.rejects(()=>missing.rewrite('a scene'),/unavailable/);
assert.equal(promptDevice(undefined),'default');assert.equal(promptDevice('cpu'),'cpu');assert.throws(()=>promptDevice('cuda:0'));
assert.deepEqual(parsePromptDetails('```json\n'+JSON.stringify(details)+'\n```'),details);assert.throws(()=>parsePromptDetails('{"visual":"broken"}'));assert.throws(()=>parsePromptDetails('not JSON'));
let received,device;const native=new PromptRewriter({status:async()=>({available:true,model:'Qwen3 · ComfyUI',reason:''}),generate:async(content,placement)=>{received=content;device=placement;return JSON.stringify(details)}});
const polished=await native.rewrite('a scene',{motion:'Locked camera',audio:''},'default');assert.equal(device,'default');assert.match(received,/Locked camera/);assert.match(received,/no_think/);await assert.rejects(()=>native.rewrite('a scene',undefined,'cpu'),/not supported/);assert.equal(polished.audio,'');assert.equal(polished.model,'Qwen3 · ComfyUI');assert.equal((await native.status()).busy,false);
let release;const blocked=new PromptRewriter({status:async()=>({available:true,model:'native',reason:''}),generate:()=>new Promise(resolve=>release=resolve)});const pending=blocked.rewrite('a scene');await new Promise(resolve=>setImmediate(resolve));await assert.rejects(()=>blocked.rewrite('another'),/another request/);release(JSON.stringify(details));await pending;assert.equal((await blocked.status()).busy,false);
console.log('PASS: automatic details, legacy/manual/silent overrides, reset, bounded input, response validation and honest missing-runtime errors. No model inference.');

const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};assert.equal(modelDevice('video'),'default');setModelDevice('video','cpu');assert.equal(modelDevice('video'),'cpu');assert.equal(modelDevice('image'),'default');storage.set('osh-model-compute','invalid');assert.equal(modelDevice('video'),'default');delete globalThis.localStorage;

let imageContent,imageSystem;
const imageRewriter=new PromptRewriter({status:async()=>({available:true,model:'Qwen3 test',reason:''}),generate:async(content,device,system)=>{imageContent=content;imageSystem=system;return JSON.stringify({visual:'The same robot tilts its watering can toward the flower, with water falling onto it. Preserve the reference appearance and scene.',motion:'',audio:''})}});
const imageDetails=await imageRewriter.rewriteImage('make the robot watter the flower',true);
assert.match(imageContent,/make the robot watter the flower/);
assert.match(imageContent,/Reference images attached: yes/);
assert.match(imageSystem,/still image/);
assert.match(imageSystem,/never invent their visual details/);
assert.match(imageDetails.visual,/tilts its watering can/);
assert.equal(imageDetails.model,'Qwen3 test');
await assert.rejects(()=>missing.rewriteImage('a robot',true),/unavailable/);
assert.equal((await missing.status()).busy,false);
let cameraRaw='{"kind":"pan","direction":-1,"amount":0.5}';let cameraCalls=0;
const cameraAI=new PromptRewriter({status:async()=>({available:true,model:'test local model',reason:''}),generate:async(content,device,system)=>{cameraCalls++;assert.ok(system.includes('Interpret camera direction'));return cameraRaw}});
assert.deepEqual(await cameraAI.camera('Slide gently toward the left',4),{kind:'pan',direction:-1,amount:.5,duration:4,model:'test local model'});
for(const invalid of ['{"kind":"fly","direction":1,"amount":1}','{"kind":"pan","direction":0,"amount":1}','{"kind":"pan","direction":1,"amount":100}','not JSON','{"error":"Use one move at a time"}']){cameraRaw=invalid;await assert.rejects(cameraAI.camera('move',4));}
await assert.rejects(cameraAI.camera('move',0));assert.equal(cameraCalls,6);
