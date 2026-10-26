// Real Vite/API, offline Comfy fixture. No UI, models or image inference.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createServer as httpServer} from 'node:http';
import {readFile,rm,unlink} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {comfyApi} from '../../shared/runtime/api.ts';
import {inputFixture,png,dataURL} from './creative-fixtures.mjs';
const outputs=resolve('outputs'),owned=[];let vite,backend;
try{
 const runtime=JSON.parse(await readFile(join(outputs,'runtime-config.json'),'utf8').catch(()=>'{}'));assert.notEqual(runtime.mode,'managed','Test must not start a managed runtime');
 backend=httpServer((req,res)=>{res.writeHead(503,{'Content-Type':'application/json'});res.end('{"test":"offline Comfy fixture"}');});await new Promise(ok=>backend.listen(0,'127.0.0.1',ok));
 const comfy='http://127.0.0.1:'+backend.address().port;
 vite=await createServer({configFile:false,root:process.cwd(),cacheDir:'node_modules/.vite-creative-http-test',plugins:[comfyApi({COMFYUI_URL:comfy})],server:{host:'127.0.0.1',port:0,hmr:false,watch:null},logLevel:'error'});await vite.listen();const base='http://127.0.0.1:'+vite.httpServer.address().port;assert.ok(!base.includes(':8301'));
 const post=async(path,body)=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 const status=await(await fetch(base+'/api/creative/status')).json();assert.equal(status.available,false);assert.equal(status.imageGeneration,false);assert.match(status.reason,/unavailable/);
 const upload=await post('upload',{image:dataURL(png)});assert.equal(upload.status,200);owned.push(join(outputs,upload.body.url.slice(9)));
 const input=inputFixture(),p=await post('creative/plan',{image:upload.body.url,input});assert.equal(p.status,200);assert.equal(p.body.provider.mode,'deterministic');owned.push(join(outputs,'creative-plans',p.body.id));
 const plan=p.body;assert.equal((await fetch(base+'/api/creative/plan/'+plan.id+'?projectId=wrong')).status,409);assert.equal((await fetch(base+'/api/creative/plan/'+plan.id+'?projectId='+input.projectId)).status,200);
 const body={planId:plan.id,current:input,image:upload.body.url,original:dataURL(png),confirmation:{direction:true,facts:true}};
 assert.equal((await post('creative/prepare',{...body,current:{...input,seed:43}})).status,409);assert.equal((await post('creative/prepare',{...body,confirmation:{direction:false,facts:false}})).status,400);
 const prepared=await post('creative/prepare',body);assert.equal(prepared.status,200);assert.equal(prepared.body.payload.settings.imageModel,'qwen-fp8');assert.equal(prepared.body.payload.settings.seed,42);assert.equal(prepared.body.paidApproved,false);assert.equal(prepared.body.privateUploadApproved,false);
 assert.equal((await post('creative/compose',{projectId:input.projectId,planId:plan.id,preparedId:prepared.body.preparedId,fidelityReviewed:false})).status,400);
 assert.equal((await post('creative/plan',{image:upload.body.url,input:{...input,source:{...input.source,sha256:'e'.repeat(64)}}})).status,409);
 assert.equal((await fetch(base+'/api/hero/capabilities')).status,200);assert.equal((await fetch(base+'/api/setup')).status,200,'Director runtime setup route remains present');
 const served=Buffer.from(await(await fetch(base+upload.body.url)).arrayBuffer());assert.deepEqual(served,png);
 console.log('PASS real Vite/HTTP: creative status/plan/read/review/prepare routes, missing model, wrong-project/stale/confirmation/hash failures, raw source served unchanged, existing Hero and Director runtime routes. NO browser or inference.');
}finally{await vite?.close();await new Promise(ok=>backend?backend.close(ok):ok());for(const file of owned){if(!file.startsWith(outputs+sep))throw Error('Unsafe fixture cleanup');if(file.endsWith('.png'))await unlink(file);else if(file.includes(sep+'creative-plans'+sep))await rm(file,{recursive:true,force:true});}}
