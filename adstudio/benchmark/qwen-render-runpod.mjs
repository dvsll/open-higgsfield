// Exactly two approved prompts, through the existing SDK/proxy SSH tunnel.
import {Comfy} from '@comfyorg/sdk';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {qwenGraph,inspectQwen,prompts} from './qwen-hero.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),root=resolve('outputs/qwen-hero-benchmark'),session=join(root,'session');
if(!process.argv.includes('--approved')){console.log('DRY RUN: no generation/private upload');process.exit();}
const lease=JSON.parse(await readFile(join(session,'lease.json'),'utf8')),pins=JSON.parse(await readFile('adstudio/benchmark/qwen-hero-pins.json','utf8')),input=JSON.parse(await readFile(join(root,'input.json'),'utf8')),health=JSON.parse(await readFile(join(session,'health.json'),'utf8'));
if(lease.cap!==2||lease.gpuRate!==.59||lease.deadline-lease.created>7200||!health.ready||health.podId!==lease.podId||health.comfyCommit!==pins.runtime.remoteComfyCommit||!health.stats.devices?.[0]?.name?.includes('A40'))throw Error('Approved hardware/lease/runtime gate failed');
const models=pins.files.filter(f=>!f.file.includes('_bf16'));for(const f of models)if(!health.models.some(m=>m.file===f.file&&m.bytes===f.bytes&&m.sha256===f.sha256))throw Error('Verified remote model hash missing');
for(const [file,hash]of [[input.original,input.originalSha256],[input.originalPath,input.originalSha256],[input.guide,input.guideSha256]])if(sha(await readFile(file))!==hash)throw Error('Original/reference changed');
const guard=async()=>{const r=JSON.parse(await readFile(join(session,'watchdog-ready.json'),'utf8'));if(r.podId!==lease.podId||r.state!=='armed'||Date.now()/1000-r.checked>40||lease.deadline-Date.now()/1000<900)throw Error('Watchdog/deadline gate failed before private upload');};
process.env.COMFY_BASE_URL='http://127.0.0.1:28189';delete process.env.COMFY_API_KEY;
const client=new Comfy();
for(const kind of ['lighting','cinematic']){
 await guard();if(!input.cases.some(c=>c.id===kind&&c.prompt===prompts[kind]&&c.seed===42))throw Error('Prepared prompt differs');
 const folder=join(session,'candidates',kind);await mkdir(folder,{recursive:true});try{await stat(join(folder,'render.json'));throw Error('Already attempted this candidate; no automatic duplicate');}catch(e){if(e.code!=='ENOENT')throw e;}
 const graph=await qwenGraph(kind,'fp8'),nodes=await(await fetch('http://127.0.0.1:28188/object_info')).json(),validation=inspectQwen(graph,nodes);if(!validation.ready)throw Error(JSON.stringify(validation));
 const queue=await(await fetch('http://127.0.0.1:28188/queue')).json();if(queue.queue_running?.length||queue.queue_pending?.length)throw Error('Unexpected remote queue');
 const record={version:1,status:'submitting',ownerApproved:false,case:kind,prompt:prompts[kind],seed:42,precision:'fp8mixed',graph,graphSha256:sha(JSON.stringify(graph)),pins,input,podId:lease.podId,started:new Date().toISOString(),modelHashes:health.models};
 const save=()=>writeFile(join(folder,'render.json'),JSON.stringify(record,null,2));await save();
 const workflow=client.workflows.fromJson(graph);workflow.setInput('4','image',client.assets.fromFile(input.guide));const started=Date.now();let job;
 try{
  await guard();job=await client.submit(workflow);record.jobId=job.id;record.status='running';await save();console.log('REAL QWEN JOB:',kind,job.id);
  await job.wait(Math.min(40*60*1000,(lease.deadline-Date.now()/1000-600)*1000));await job.result();
  const output=job.getOutputs('15')[0];if(!output)throw Error('No raw SaveImage output');await output.toFile(join(folder,'raw.png'));
  const bytes=await readFile(join(folder,'raw.png'));if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid model PNG');record.width=bytes.readUInt32BE(16);record.height=bytes.readUInt32BE(20);record.rawSha256=sha(bytes);record.status='complete';record.metrics=job.metrics||null;
  const h=await fetch('http://127.0.0.1:28188/history/'+encodeURIComponent(job.id));if(h.ok)await writeFile(join(folder,'comfy-history.json'),JSON.stringify(await h.json(),null,2));console.log('RAW PNG COLLECTED:',kind,record.width,record.height,record.rawSha256);
 }catch(e){record.status='failed-or-interrupted';record.error=String(e);if(job)await job.cancel(AbortSignal.timeout(5000)).catch(()=>{});throw e;}
 finally{record.seconds=(Date.now()-started)/1000;record.finished=new Date().toISOString();await save();}
}
console.log('Exactly two raw candidates collected. STOP; no more generation authorized.');
