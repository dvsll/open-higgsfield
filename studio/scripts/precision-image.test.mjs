import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Resvg} from '@resvg/resvg-js';
import {createServer} from 'vite';
const server=await createServer({configFile:false,cacheDir:'node_modules/.vite-precision-tests',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false},appType:'custom'});
const {precisionSources,segmentationSource}=await server.ssrLoadModule('/shared/runtime/precision-image.ts');
const {alphaReadiness,alphaDimensions,alphaGraph,prepareAlphaSource}=await server.ssrLoadModule('/shared/runtime/alpha-gen.ts');
await server.close();
const png=(width,height,fill)=>new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${fill}"/></svg>`).render().asPng();
test('precision edit validates owned sources, matching dimensions and nonempty mask',async()=>{
 const root=await mkdtemp(join(tmpdir(),'studio-precision-'));
 try{
  await writeFile(join(root,'1111111111111111.png'),png(64,64,'red'));
  await writeFile(join(root,'2222222222222222.png'),png(64,64,'white'));
  await writeFile(join(root,'3333333333333333.png'),png(32,32,'white'));
  await writeFile(join(root,'4444444444444444.png'),png(64,64,'black'));
  const body={image:'/outputs/1111111111111111.png',mask:'/outputs/2222222222222222.png',prompt:'A flower'};
  assert.equal((await precisionSources(root,body)).image.width,64);
  assert.equal((await segmentationSource(root,{image:body.image,prompt:'cup'})).prompt,'cup');
  assert.equal((await segmentationSource(root,{image:body.image,list:true})).prompt,'object:16');
  await assert.rejects(segmentationSource(root,{image:body.image,list:'yes'}),/Invalid/);
  assert.deepEqual((await segmentationSource(root,{image:body.image,point:{x:12.5,y:16.5}})).point,{x:12,y:16});
  await assert.rejects(segmentationSource(root,{image:body.image,point:{x:64,y:0}}),/inside/);
  await assert.rejects(segmentationSource(root,{image:body.image,prompt:''}),/Name/);
  await assert.rejects(segmentationSource(root,{image:'../../private.png',prompt:'cup'}),/API-owned/);
  await assert.rejects(precisionSources(root,{...body,image:'../../private.png'}),/API-owned/);
  await assert.rejects(precisionSources(root,{...body,mask:'/outputs/3333333333333333.png'}),/matching/);
  await assert.rejects(precisionSources(root,{...body,mask:'/outputs/4444444444444444.png'}),/Select an area/);
  await assert.rejects(precisionSources(root,{...body,prompt:''}),/Describe/);
 }finally{await rm(root,{recursive:true,force:true})}
});
// Opt-in verification of a real generated output; no inference is started by this test.
if(process.env.PRECISION_RESULT)test('real masked result preserves every pixel outside the rectangle',async()=>{
 const decode=async path=>{const data=(await readFile(path)).toString('base64');return new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><image href="data:image/png;base64,${data}" width="256" height="256"/></svg>`).render().pixels};
 const source=await decode('outputs/83d0435ea46f7e0d.png'),result=await decode(process.env.PRECISION_RESULT);let outside=0,inside=0;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;if(source.subarray(i,i+4).some((v,k)=>v!==result[i+k])){if(x>=90&&x<165&&y>=90&&y<165)inside++;else outside++}}
 assert.equal(outside,0);assert.ok(inside>0);console.log({outsideChangedPixels:outside,insideChangedPixels:inside});
});

test('Alpha Gen keeps native Comfy nodes, exact masks, source framing and gated readiness',async()=>{
 const graph=JSON.parse(await readFile('shared/workflows/cutout_ltx25.json','utf8'));
 const shape=alphaDimensions(1920,1080,100,24);assert.equal(shape.paddedHeight,1088);assert.equal(shape.modelFrames,105);assert.equal(shape.frames,100);
 assert.throws(()=>alphaDimensions(1921,1080,97,24),/1920/);assert.throws(()=>alphaDimensions(768,448,122,24),/121/);
 const missing=alphaReadiness({},graph);assert.equal(missing.available,false);assert.ok(missing.missingNodes.includes('LTXAddVideoICLoRAGuide'));assert.equal(missing.missingModels.length,5);
 const nodes=Object.fromEntries(Object.values(graph).map(node=>[node.class_type,{input:{required:{}}}]));
 nodes.UNETLoader.input.required.unet_name=[['nested/ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors']];
 nodes.CLIPLoader.input.required.clip_name=[['gemma4-12b-with-proj-ltx-2.5-bf16.safetensors']];nodes.VAELoader.input.required.vae_name=[['ltx-2.5-video-vae-bf16.safetensors','ltx-2.5-audio-vae-bf16.safetensors']];nodes.LTXICLoRALoaderModelOnly.input.required.lora_name=[['ltx-2.5-22b-ic-lora-alpha-gen-0.9.safetensors']];
 const ready=alphaReadiness(nodes,graph);assert.equal(ready.available,true);const built=alphaGraph(graph,shape,ready.models);assert.match(built['1'].inputs.unet_name,/nested/);assert.equal(built['7'].inputs.text,'');assert.equal(built['10'].inputs.strength_model,1);assert.equal(built['9'].inputs.length,105);assert.equal(built['27'].inputs.length,100);assert.equal(built['26'].inputs.height,1080);assert.equal(built['24'].class_type,'InvertMask');assert.deepEqual(built['25'].inputs.image,['6',0]);assert.equal(built['28'].inputs.codec,'vp9');assert.equal(graph['9'].inputs.length,97);
 await assert.rejects(prepareAlphaSource('outputs','https://example.com/private.mp4',{}),/Project files/);
});
