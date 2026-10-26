import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {trainingBase,trainingInput,trainingGraph} from '../../shared/lib/training.ts';
import {saveTrainingRun,trainingRuns} from '../../shared/runtime/training.ts';
const input=trainingInput({projectId:'fixture',name:'Copper study',model:trainingBase,images:[{url:'/outputs/1111111111111111.png',caption:'a copper robot'},{url:'/outputs/2222222222222222.png',caption:'the robot in a garden'}],steps:2,rank:2,learningRate:.0001,size:256,seed:7}),id='a'.repeat(32),graph=trainingGraph(input,id);
assert.equal(graph['7'].class_type,'TrainLoraNode');assert.equal(graph['7'].inputs.offloading,false);assert.equal(graph['1'].inputs.weight_dtype,'fp8_e4m3fn');assert.equal(graph['7'].inputs.training_dtype,'none');assert.equal(graph['7'].inputs.bypass_mode,true);assert.equal(graph['7'].inputs.steps,2);assert.deepEqual(graph['5'].inputs.images,['105',0]);assert.deepEqual(JSON.parse(graph['5'].inputs.captions),input.images.map(image=>image.caption));assert.deepEqual(graph['6'].inputs.texts,['5',1]);assert.equal(graph['8'].inputs.run_id,id);assert.equal(graph['100'].class_type,'LoadImage');assert.equal(graph['103'].class_type,'LoadImage');
for(const patch of [{model:'other.safetensors'},{images:[]},{images:[input.images[0],input.images[0]]},{images:[{url:'/etc/passwd',caption:'bad'}]},{size:257},{steps:501},{rank:0},{learningRate:NaN}])assert.throws(()=>trainingInput({...input,...patch}));assert.throws(()=>trainingGraph(input,'../bad'));
const folder=await mkdtemp(join(tmpdir(),'studio-training-'));try{const run={...input,id,status:'running',createdAt:Date.now()};await saveTrainingRun(folder,run);assert.equal((await trainingRuns(folder))[0].status,'running');await saveTrainingRun(folder,{...run,status:'complete',loraFile:'studio/'+id+'.safetensors'});assert.equal((await trainingRuns(folder))[0].status,'complete');assert.equal((await trainingRuns(folder)).length,1)}finally{await rm(folder,{recursive:true,force:true})}
console.log('PASS: real native training graph, paired images/captions, bounded settings/path rejection and atomic run persistence. No GPU job.');

const {videoTrainingBase,geometryTrainingBase}=await import('../../shared/lib/training.ts');
const video=trainingInput({...input,model:videoTrainingBase,images:[{url:'/outputs/1111111111111111.webm',caption:'a cube moves'},{url:'/outputs/2222222222222222.mp4',caption:'a cube rotates'}],size:256,frames:17,fps:24}),vg=trainingGraph(video,id);
assert.equal(vg['1'].class_type,'CheckpointLoaderSimple');assert.equal(vg['101'].class_type,'OSHVideoTrainingDataset');assert.equal(vg['101'].inputs.frames,17);assert.equal(vg['104'].inputs.caption,'a cube rotates');assert.equal(vg['105'].class_type,'OSHTrainingConcat');assert.deepEqual(vg['7'].inputs.latents,['105',0]);
for(const patch of [{frames:16},{frames:57},{fps:0},{size:768},{images:input.images}])assert.throws(()=>trainingInput({...video,...patch}));
const geometry=trainingInput({...input,model:geometryTrainingBase,images:[{url:'/outputs/1111111111111111.png',caption:'',mesh:'/outputs/2222222222222222.obj'}]}),gg=trainingGraph(geometry,id);
assert.equal(gg['1'].class_type,'ImageOnlyCheckpointLoader');assert.equal(gg['101'].class_type,'OSH3DTrainingDataset');assert.deepEqual(gg['7'].inputs.positive,['101',1]);assert.throws(()=>trainingInput({...geometry,images:input.images}));
const {trainingObj,geometryGraph}=await import('../../shared/lib/geometry.ts');
assert.equal(trainingObj('mtllib https://example.com/bad\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1/9 2/8 3/7'),'v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3');for(const bad of ['v NaN 0 0\nf 1 2 3','v 0 0 0',null,'v 0 0 0\nf 0 1 2'])assert.throws(()=>trainingObj(bad));
const inference=geometryGraph(geometryTrainingBase,'studio/tune.safetensors');assert.deepEqual(inference['6'].inputs.model,['90',0]);assert.equal(inference['9'].class_type,'OSHSaveGeometry');
console.log('PASS: clip temporal settings/pairing, geometry image-mesh contract, external OBJ resource stripping and adapter inference binding.');
