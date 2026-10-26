import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {trainingBase,trainingInput,trainingGraph} from '../../shared/lib/training.ts';
import {saveTrainingRun,trainingRuns} from '../../shared/runtime/training.ts';
const input=trainingInput({projectId:'fixture',name:'Copper study',model:trainingBase,images:[{url:'/outputs/1111111111111111.png',caption:'a copper robot'},{url:'/outputs/2222222222222222.png',caption:'the robot in a garden'}],steps:2,rank:2,learningRate:.0001,size:256,seed:7}),id='a'.repeat(32),graph=trainingGraph(input,id);
assert.equal(graph['7'].class_type,'TrainLoraNode');assert.equal(graph['7'].inputs.offloading,true);assert.equal(graph['7'].inputs.steps,2);assert.deepEqual(graph['5'].inputs.images,['105',0]);assert.deepEqual(JSON.parse(graph['5'].inputs.captions),input.images.map(image=>image.caption));assert.deepEqual(graph['6'].inputs.texts,['5',1]);assert.equal(graph['8'].inputs.run_id,id);assert.equal(graph['100'].class_type,'LoadImage');assert.equal(graph['103'].class_type,'LoadImage');
for(const patch of [{model:'other.safetensors'},{images:[]},{images:[input.images[0],input.images[0]]},{images:[{url:'/etc/passwd',caption:'bad'}]},{size:257},{steps:501},{rank:0},{learningRate:NaN}])assert.throws(()=>trainingInput({...input,...patch}));assert.throws(()=>trainingGraph(input,'../bad'));
const folder=await mkdtemp(join(tmpdir(),'studio-training-'));try{const run={...input,id,status:'running',createdAt:Date.now()};await saveTrainingRun(folder,run);assert.equal((await trainingRuns(folder))[0].status,'running');await saveTrainingRun(folder,{...run,status:'complete',loraFile:'studio/'+id+'.safetensors'});assert.equal((await trainingRuns(folder))[0].status,'complete');assert.equal((await trainingRuns(folder)).length,1)}finally{await rm(folder,{recursive:true,force:true})}
console.log('PASS: real native training graph, paired images/captions, bounded settings/path rejection and atomic run persistence. No GPU job.');
