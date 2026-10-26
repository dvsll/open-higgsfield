import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,readFile,rm,readdir } from 'node:fs/promises';
import { join,resolve } from 'node:path';
import { RuntimeSetup,localComfyUrl,setupAccess,COMFY_RELEASE,COMFY_COMMIT } from '../../shared/runtime/setup.ts';
import { downloadModels,validModel } from '../../shared/runtime/model-download.ts';
import { JobActivity,phaseForProgress } from '../../shared/runtime/job-activity.ts';
const outputs=resolve('outputs');await mkdir(outputs,{recursive:true});const root=await mkdtemp(join(outputs,'setup-test-'));
const originalFetch=globalThis.fetch;
try{
 for(const bad of ['https://127.0.0.1:8188','http://example.com','http://169.254.169.254','http://127.0.0.1:8188/path','http://user:pass@localhost:8188','file:///etc/passwd'])assert.throws(()=>localComfyUrl(bad));
 assert.equal(localComfyUrl('http://127.0.0.1:8188/'),'http://127.0.0.1:8188');
 const request=(host,address,origin,site)=>({headers:{host,origin,'sec-fetch-site':site},socket:{remoteAddress:address}});
 assert.ok(setupAccess(request('127.0.0.1:8292','127.0.0.1','http://127.0.0.1:8292','same-origin')));
 const proxied=request('127.0.0.1:8292','127.0.0.1');proxied.headers['x-forwarded-for']='203.0.113.5';assert.ok(!setupAccess(proxied));
 assert.ok(!setupAccess(request('127.0.0.1:8292','10.0.0.1')));assert.ok(!setupAccess(request('public.test','127.0.0.1')));assert.ok(!setupAccess(request('127.0.0.1:8292','127.0.0.1','https://evil.test','cross-site')));
 const header=Buffer.from(JSON.stringify({weight:{dtype:'F32',shape:[1],data_offsets:[0,4]}})),prefix=Buffer.alloc(8);prefix.writeBigUInt64LE(BigInt(header.length));const bytes=Buffer.concat([prefix,header,Buffer.alloc(4)]);
 const model={file:'checkpoints/test.safetensors',size_gb:0,used_by:'shot_ltxv',license:'fixture',url:'https://example.test/model'};
 let requests=0,progress=[];await downloadModels(root,[model],{fetcher:async()=>{requests++;return new Response(bytes,{headers:{'content-length':String(bytes.length)}})},onProgress:p=>progress.push(p)});
 assert.ok(await validModel(join(root,model.file)));assert.equal(progress.at(-1).received,bytes.length);await downloadModels(root,[model],{fetcher:async()=>{throw new Error('must reuse')}});assert.equal(requests,1);
 const resumed={...model,file:'checkpoints/resume.safetensors'};await writeFile(join(root,resumed.file)+'.part',bytes.subarray(0,10));await downloadModels(root,[resumed],{fetcher:async(url,init)=>{assert.equal(init.headers.Range,'bytes=10-');return new Response(bytes.subarray(10),{status:206,headers:{'content-length':String(bytes.length-10),'content-range':`bytes 10-${bytes.length-1}/${bytes.length}`}})}});assert.ok(await validModel(join(root,resumed.file)));
 const complete={...model,file:'checkpoints/complete.safetensors'};await writeFile(join(root,complete.file)+'.part',bytes);await downloadModels(root,[complete],{fetcher:async()=>{throw new Error('complete partial file should not request a range')}});assert.ok(await validModel(join(root,complete.file)));
 const twoHeader=Buffer.from(JSON.stringify({one:{data_offsets:[0,4]},two:{data_offsets:[4,8]}})),twoPrefix=Buffer.alloc(8);twoPrefix.writeBigUInt64LE(BigInt(twoHeader.length));await writeFile(join(root,'truncated.safetensors'),Buffer.concat([twoPrefix,twoHeader,Buffer.alloc(4)]));assert.equal(await validModel(join(root,'truncated.safetensors')),false,'all tensors must fit, not just the first');
 const bad={...model,file:'checkpoints/bad.safetensors'};await assert.rejects(downloadModels(root,[bad],{fetcher:async()=>new Response('not a model')}),/valid safetensors/);
 const existing={...model,file:'checkpoints/existing.safetensors'};await writeFile(join(root,existing.file),'keep');await assert.rejects(downloadModels(root,[existing]),/not been overwritten/);assert.equal(await readFile(join(root,existing.file),'utf8'),'keep');
 const abort=new AbortController();abort.abort();await assert.rejects(downloadModels(root,[{...model,file:'cancel.safetensors'}],{signal:abort.signal}),/abort/i);
 const tracker=new JobActivity(),id='a'.repeat(32);tracker.begin(id);tracker.update(id,'preparing','Loading');const started=tracker.get(id).phaseStartedAt;tracker.update(id,'preparing','Encoding prompt');assert.equal(tracker.get(id).phaseStartedAt,started);tracker.update(id,'generating','Step 1',{step:1,steps:8});assert.equal(tracker.get(id).phase,'generating');tracker.update(id,'complete','Ready');tracker.update(id,'queued','stale');assert.equal(tracker.get(id).phase,'complete');assert.throws(()=>tracker.begin(id));assert.throws(()=>tracker.begin('../bad'));
 assert.equal(phaseForProgress({currentNodeClass:'CheckpointLoaderSimple'}),'preparing');assert.equal(phaseForProgress({currentNodeClass:'SamplerCustom',step:1,steps:8}),'generating');assert.equal(phaseForProgress({currentNodeClass:'SaveWEBM'}),'encoding');assert.equal(phaseForProgress({currentNodeClass:'KSamplerSelect'}),'preparing');assert.equal(phaseForProgress({}),'running');
 const attachRoot=join(root,'attach');await mkdir(join(attachRoot,'shared/runtime'),{recursive:true});await writeFile(join(attachRoot,'shared/runtime/models.json'),JSON.stringify({models:[model]}));const attachEnv={},attached=new RuntimeSetup(attachRoot,attachEnv,async()=>{throw new Error('running connector should be reused')},()=>{});attached.reachable=async()=>true;attached.proxyReady=async()=>true;attached.command=async()=>{throw new Error('connect must not install or spawn anything when both services run')};attached.connect({url:'http://127.0.0.1:8188',modelsDir:root});for(let i=0;i<100&&attached.task.busy;i++)await new Promise(r=>setTimeout(r,10));assert.equal(attached.task.phase,'ready',attached.task.message);assert.equal(attached.config.modelsDir,root);assert.equal(attachEnv.COMFYUI_URL,'http://127.0.0.1:8188');attached.download({packs:['shot_ltxv']});for(let i=0;i<100&&attached.task.busy;i++)await new Promise(r=>setTimeout(r,10));assert.equal(attached.task.phase,'ready','already present model pack is reused');
 // Exercise the real install orchestrator with deterministic process/network seams; no GPU packages or actual models are downloaded.
 const installRoot=join(root,'install');await mkdir(installRoot);const env={};const setup=new RuntimeSetup(installRoot,env,async()=>{},()=>{}),commands=[];
 setup.python=async()=>({exe:'python-fixture',prefix:[]});setup.command=async(exe,args)=>{commands.push([exe,...args]);if(args[0]==='clone'){await mkdir(args.at(-1),{recursive:true});await writeFile(join(args.at(-1),'main.py'),'fixture')}return args.includes('rev-parse')?COMFY_COMMIT:''};setup.connector=async()=>join(installRoot,'proxy');setup.startManaged=async()=>{};setup.proxyReady=async()=>true;
 globalThis.fetch=async()=>{throw new Error('Installer must use the pinned Git release, not an unreviewed latest-release lookup')};
 setup.install({gpu:'nvidia'});for(let i=0;i<100&&setup.task.busy;i++)await new Promise(r=>setTimeout(r,10));assert.equal(setup.task.phase,'ready',setup.task.message);assert.ok(commands.some(args=>args.includes('https://github.com/Comfy-Org/ComfyUI.git')&&args.includes(COMFY_RELEASE)));assert.ok(commands.some(args=>args.includes('https://download.pytorch.org/whl/cu130')));assert.equal(setup.config.release,COMFY_RELEASE);assert.equal(setup.config.mode,'managed');assert.ok(setup.config.url.startsWith('http://127.0.0.1:'));assert.ok(setup.config.proxy.startsWith('http://127.0.0.1:'));assert.throws(()=>setup.install({gpu:'arbitrary'}));
 const failRoot=join(root,'failure');await mkdir(failRoot);const previousEnv={COMFYUI_URL:'http://127.0.0.1:8188',COMFY_BASE_URL:'http://127.0.0.1:8189'},failed=new RuntimeSetup(failRoot,previousEnv,async()=>{},()=>{});failed.python=async()=>({exe:'python-fixture',prefix:[]});failed.command=async(exe,args)=>{if(args[0]==='clone')throw new Error('fixture network failure');return''};failed.install({gpu:'nvidia'});for(let i=0;i<100&&failed.task.busy;i++)await new Promise(r=>setTimeout(r,10));assert.equal(failed.task.phase,'error');assert.equal(previousEnv.COMFYUI_URL,'http://127.0.0.1:8188');assert.equal(failed.config,null);assert.equal((await readdir(join(failRoot,'.runtime'))).filter(name=>name.startsWith('comfy-install-')).length,0,'failed staging clone is cleaned without touching an existing runtime');
 console.log('PASS: setup origin/loopback guards, installer orchestration, official sources, separate configs, atomic/resumable downloads, reuse, invalid files, cancellation and phase tracking.');
}finally{globalThis.fetch=originalFetch;assert.ok(resolve(root).startsWith(outputs+'\\')||resolve(root).startsWith(outputs+'/'));await rm(root,{recursive:true,force:true})}

const {ComfyDiagnostics,loadingLog,LogCursor,nodeProgressMessage,loopbackDiagnosticsUrl}=await import('../../shared/runtime/comfy-diagnostics.ts');
assert.equal(loadingLog('Authorization: Bearer secret downloading token'),null);
assert.equal(loadingLog('prompt: private text loading model'),null);
assert.equal(loadingLog('Requested to load Qwen3'), 'Requested to load Qwen3');
assert.equal(loadingLog('loading model C:\\Users\\private\\model.safetensors'),'loading model model.safetensors');
assert.equal(loopbackDiagnosticsUrl('http://example.com:8188'),null);assert.equal(loopbackDiagnosticsUrl('http://user:pass@127.0.0.1:8188'),null);
const cursor=new LogCursor();assert.deepEqual(cursor.read({entries:[{t:'1',m:'Requested to load old'}]},true),[]);assert.deepEqual(cursor.read({entries:[{t:'1',m:'Requested to load old'},{t:'2',m:'Requested to load LTXV\n'}]}),['Requested to load LTXV']);assert.deepEqual(cursor.read({entries:[{t:'2',m:'Requested to load LTXV\n'}]}),[]);
assert.match(nodeProgressMessage({class_type:'UNETLoader',inputs:{unet_name:'folder/ltx.safetensors'}}),/Loading model · ltx.safetensors/);
assert.equal(nodeProgressMessage({class_type:'CLIPTextEncode'}),'Encoding your prompt');
const diagnosticTracker=new JobActivity(),diagnosticId='b'.repeat(32);diagnosticTracker.begin(diagnosticId);diagnosticTracker.note(diagnosticId,{at:1,source:'comfy-server',message:'Requested to load LTXV'});const snapshot=diagnosticTracker.get(diagnosticId);snapshot.diagnostics[0].message='mutated';assert.equal(diagnosticTracker.get(diagnosticId).diagnostics[0].message,'Requested to load LTXV');assert.equal(diagnosticTracker.get(diagnosticId).phase,'queued','global server logs do not claim per-job progress');diagnosticTracker.update(diagnosticId,'complete','Ready');diagnosticTracker.note(diagnosticId,{at:2,source:'sdk',message:'Requested to load stale'});assert.equal(diagnosticTracker.get(diagnosticId).diagnostics.length,1);
const {createServer:createHttpServer}=await import('node:http');let reads=0,missing=false;
const logServer=createHttpServer((req,res)=>{assert.equal(req.url,'/internal/logs/raw');res.setHeader('Content-Type','application/json');if(missing){res.statusCode=404;res.end('{}');return}reads++;res.end(JSON.stringify({entries:[{t:'old',m:'Requested to load old'},...(reads>1?[{t:'fresh',m:'Requested to load LTXV'}]:[])]}))});
await new Promise(resolve=>logServer.listen(0,'127.0.0.1',resolve));
try{
 const url='http://127.0.0.1:'+logServer.address().port,monitor=new ComfyDiagnostics(),observed=[];
 const stop=await monitor.watch(url,entry=>observed.push(entry));assert.equal(observed.length,0);
 for(let i=0;i<30&&!observed.length;i++)await new Promise(resolve=>setTimeout(resolve,50));
 stop();assert.equal(observed.length,1);assert.equal(observed[0].message,'Requested to load LTXV');assert.equal(observed[0].source,'comfy-server');
 missing=true;const fallback=new ComfyDiagnostics(),managed=[];const close=await fallback.watch(url,entry=>managed.push(entry));fallback.capture(url,'Requested to lo');fallback.capture(url,'ad Qwen3\n');close();fallback.capture(url,'Requested to load after cleanup\n');assert.equal(managed.length,1);assert.equal(managed[0].source,'managed-server');
}finally{logServer.closeAllConnections();await new Promise(resolve=>logServer.close(resolve))}

// Exercise real SDK event handling and diagnostics cleanup without submitting a model job.
const {stripTypeScriptTypes}=await import('node:module');
const apiSource=await readFile('shared/runtime/api.ts','utf8'),runSource=apiSource.slice(apiSource.indexOf('async function runWf('),apiSource.indexOf('// One job at a time'));
const {phaseForProgress:phaseFromEvent}=await import('../../shared/runtime/job-activity.ts');
const sdkTracker=new JobActivity(),sdkId='c'.repeat(32);sdkTracker.begin(sdkId);
let stopped=0,completed;
const sdkEvents=[{kind:'progress',currentNode:'1',value:0},{kind:'log',message:'Requested to load Qwen3'},{kind:'progress',currentNode:'2',step:1,steps:8,value:.125}];
const sdkClient={submit:async()=>({events:async function*(){for(const event of sdkEvents)yield event;completed()},wait:()=>new Promise(resolve=>{completed=resolve}),result:async()=>({})})};
const sdkContext={activity:sdkTracker,phaseForProgress:phaseFromEvent,loadingLog,nodeProgressMessage,clientUrls:new WeakMap([[sdkClient,'http://127.0.0.1:8188']]),diagnostics:{watch:async(_url,receive)=>{receive({at:1,source:'comfy-server',message:'Requested to load LTXV'});return()=>stopped++}}};
const runWorkflow=Function('ctx','with(ctx){'+stripTypeScriptTypes(runSource)+';return runWf}')(sdkContext);
await runWorkflow(sdkClient,{json:{'1':{class_type:'CLIPLoader',inputs:{clip_name:'qwen3.safetensors'}},'2':{class_type:'SamplerCustom'}}},sdkId);
assert.equal(stopped,1);assert.equal(sdkTracker.get(sdkId).phase,'generating');assert.equal(sdkTracker.get(sdkId).percent,12.5);assert.equal(sdkTracker.get(sdkId).diagnostics.length,2);
const failingClient={submit:async()=>{throw Error('fixture submit failed')}};await assert.rejects(()=>runWorkflow(failingClient,{json:{}},sdkId),/fixture submit failed/);assert.equal(stopped,2,'failed submission still stops console polling');

// Existing local installations are launchable without shell commands or reinstalling dependencies.
const {existingComfyLaunch}=await import('../../shared/runtime/comfy-launch.ts');
const launchRoot=await mkdtemp(join(outputs,'launcher-test-'));
try{
 const home=join(launchRoot,'home'),directory=join(home,'AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI');
 await mkdir(join(directory,'.venv/Scripts'),{recursive:true});await writeFile(join(directory,'main.py'),'fixture');
 assert.equal(existingComfyLaunch(launchRoot,{},undefined,home,'win32'),null,'missing interpreter is not launchable');
 await writeFile(join(directory,'.venv/Scripts/python.exe'),'fixture');
 const configs=join(home,'AppData/Roaming/Comfy Desktop/instance-model-paths');await mkdir(configs,{recursive:true});await writeFile(join(configs,'instance.yaml'),'models: fixture');
 const found=existingComfyLaunch(launchRoot,{},undefined,home,'win32');assert.equal(found.directory,directory);assert.equal(found.modelPaths.length,1);assert.ok(found.python.endsWith('python.exe'));
 assert.equal(existingComfyLaunch(launchRoot,{COMFYUI_DIR:'relative/path'},undefined,join(launchRoot,'empty'),'win32'),null);
 const manual=join(launchRoot,'manual');await mkdir(join(manual,'.venv/bin'),{recursive:true});await writeFile(join(manual,'main.py'),'fixture');await writeFile(join(manual,'.venv/bin/python'),'fixture');
 assert.equal(existingComfyLaunch(launchRoot,{COMFYUI_DIR:manual},undefined,home,'linux').directory,manual);
}finally{await rm(launchRoot,{recursive:true,force:true})}
