import assert from 'node:assert/strict';
import {installedModels,modelTags} from '../../shared/runtime/model-inventory.ts';
const calls=[];const rows=await installedModels('http://127.0.0.1:8188',async url=>{calls.push(url);return Response.json(url.endsWith('/models')?['loras','checkpoints','../bad']:url.endsWith('loras')?['mine\\adapter.safetensors']:['fine-tune.safetensors'])});
assert.deepEqual(rows,[{category:'checkpoints',file:'fine-tune.safetensors'},{category:'loras',file:'mine/adapter.safetensors'}]);assert.equal(calls.length,3);
await assert.rejects(installedModels('http://127.0.0.1:8188',async()=>new Response('',{status:503})),/unavailable/);
console.log('PASS: installed inventory includes fine-tunes and adapters, normalized paths, invalid category guard and honest errors.');

const manifest={packs:[{id:'v',capability:'video'}],models:[{file:'checkpoints/video.safetensors',used_by:'v'}]};
assert.deepEqual(modelTags({category:'checkpoints',file:'video.safetensors'},manifest).media,['Video']);
assert.deepEqual(modelTags({category:'loras',file:'unknown.safetensors'},manifest).media,['Unknown']);
assert.deepEqual(modelTags({category:'loras',file:'unknown.safetensors'},manifest).uses,['LoRAs / adapters']);
