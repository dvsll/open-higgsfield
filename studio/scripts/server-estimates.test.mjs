import assert from 'node:assert/strict';
import { serverEstimate } from '../src/model-estimates.ts';
import { imageModel,videoModel,wan22Model } from '../../shared/runtime/model-catalog.ts';
const hardware={id:'gpu-a',name:'test GPU',vramGB:12};
const base={hardware:'gpu-a',model:videoModel.id,width:768,height:448,frames:97,at:1};
const server={hardware,queued:0,activeModel:videoModel.id,samples:[{...base,cold:false,seconds:10},{...base,cold:false,seconds:12},{...base,cold:true,seconds:19},{...base,hardware:'other GPU',cold:false,seconds:1000}]};
assert.equal(serverEstimate(videoModel,4,768,448,server).seconds,12);
assert.equal(serverEstimate(videoModel,4,768,448,{...server,activeModel:imageModel.id}).load,7);
assert.ok(serverEstimate(videoModel,1,768,448,server).seconds<12);
assert.equal(serverEstimate(videoModel,4,768,448,{...server,samples:[]}).seconds,null);
assert.equal(serverEstimate(imageModel,1,768,448,{...server,samples:[],hardware:{...hardware,name:'NVIDIA RTX 4070 SUPER'}}).seconds,7);
assert.equal(serverEstimate(videoModel,4,384,224,server).seconds,3);
assert.equal(serverEstimate(videoModel,17/12,768,448,server,17).seconds,serverEstimate(videoModel,17/60,768,448,server,17).seconds);
assert.ok(serverEstimate(videoModel,1,768,448,server,17).seconds<serverEstimate(videoModel,1,768,448,server,97).seconds);
console.log('PASS: actual-server matching, warm medians, cold-switch overhead, workload scaling and unknown-hardware fallback.');

// A small-model baseline must never promise a 14B offloaded render in draft-model time.
const local4070={...server,hardware:{...hardware,name:'NVIDIA RTX 4070 SUPER'},samples:[]};
assert.equal(serverEstimate(wan22Model,4,768,448,local4070,65).seconds,null);
assert.equal(serverEstimate(wan22Model,4,768,448,{...local4070,samples:[{...base,model:wan22Model.id,frames:65,cold:true,seconds:900}]},65).seconds,900);
