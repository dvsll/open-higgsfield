// React SSR/semantic contracts, NOT browser acceptance. No model or owner DB.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseFragment} from 'parse5';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {WorkspaceStore} from '../src/workspace-store.ts';
import {AdApplication,previewBlob} from '../src/ad-application.ts';
import {memoryDriver} from '../src/projects.ts';
import {createCreativeEngine} from '../../shared/runtime/creative-engine.ts';
import {inputFixture,png} from './creative-fixtures.mjs';
import {heroSha} from '../../shared/runtime/hero-ad.ts';
const dir='outputs/react-adstudio-review';await mkdir(dir,{recursive:true});
const server=await createServer({configFile:false,cacheDir:dir+'/vite-cache',server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'});
try{
 const {AdStudio,GenerationActions,SourceFigure,takeLabel}=await server.ssrLoadModule('/adstudio/src/react/app.tsx'),store=await new WorkspaceStore(memoryDriver()).initialize(),app=new AdApplication(store);
 const css=await readFile('adstudio/src/react/app.css','utf8');
 const snapshot=async(name,html)=>writeFile(dir+'/'+name+'.html','<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Static React review · '+name+'</title><style>'+css+'</style><p style="padding:12px;background:#302319">STATIC React SSR fixture. No browser interaction, image inference or owner project change. Image effects do not run in SSR.</p>'+html);
 const first=renderToStaticMarkup(createElement(AdStudio,{app}));assert.match(first,/Develop my advertisement/);assert.match(first,/What’s in your photograph/);assert.ok(!first.includes('Prepare direction from these inputs'));assert.ok(!first.includes('id="hero-prompt"'));assert.ok(!first.includes('value="qwen-fp8"'),'No primary model selector');assert.match(first,/Saved on this browser/);await snapshot('01-product',first);
 const disabled=renderToStaticMarkup(createElement(GenerationActions,{reviewed:true,available:false,blocked:false,interrupted:false,generate:()=>assert.fail('SSR never generates'),exportRequest:()=>{}}));
 const buttons=parseFragment(disabled).childNodes.filter(n=>n.tagName==='button');assert.ok(buttons[0].attrs.some(a=>a.name==='disabled'));assert.ok(!buttons[1].attrs.some(a=>a.name==='disabled'));assert.match(disabled,/Export reviewed request/);
 assert.equal(renderToStaticMarkup(createElement(GenerationActions,{reviewed:false,available:true,blocked:false,interrupted:false,generate:()=>{},exportRequest:()=>{}})),'','Unreviewed request has no Generate action');
 const input=inputFixture(),root=dir+'/fixture';await mkdir(root,{recursive:true});await writeFile(root+'/aaaaaaaaaaaaaaaa.png',png);const engine=createCreativeEngine(root,{status:async()=>({available:false,model:'MOCK',reason:'MOCK missing model'}),generate:async()=>assert.fail('No actual model')});const plan=await engine.plan({image:'/outputs/aaaaaaaaaaaaaaaa.png',input});
 await store.projects.saveBrand(input.brand);const p=store.active();p.brandId=input.brand.id;p.creative={version:1,activeId:plan.id,plans:[{id:plan.id,created:1,sourceId:input.source.id,brandId:input.brand.id,summary:'CPU fixture',provider:'deterministic',basisHero:JSON.stringify(p.hero.settings)}]};await store.projects.save(p);
 const direction=renderToStaticMarkup(createElement(AdStudio,{app,initialPlan:plan}));assert.match(direction,/Source-led suggestion · no AI planning/);assert.match(direction,/Confirm this direction/);assert.match(direction,/I checked these details/);assert.match(direction,/See other directions/);assert.ok(!direction.includes('Generate photograph'),'Source and direction have not been reviewed');await snapshot('02-direction',direction);
 const q=store.active();q.hero.takes=[{id:'fixture-take',assetId:'mock-output',url:'/outputs/aaaaaaaaaaaaaaaa.png',created:1,settings:q.hero.settings,sha256:heroSha(png),sourceSha256:heroSha(png),seconds:1,method:'MOCK image test only',model:'qwen-fp8'}];q.hero.activeId='fixture-take';q.creative.activeId=undefined;await store.projects.save(q);
 const result=renderToStaticMarkup(createElement(AdStudio,{app}));assert.match(result,/AI photograph · Qwen/);assert.match(result,/Export advertisement · PNG/);assert.match(result,/Compare original/);assert.match(result,/I compared this photograph/);assert.match(result,/Download photograph only/);await snapshot('03-result',result);
 const missing=renderToStaticMarkup(createElement(SourceFigure,{label:'Original product photograph',error:'The saved image is missing.'}));assert.match(missing,/saved image is missing/);assert.ok(!missing.includes('<img'));
 assert.equal(takeLabel({model:undefined,settings:{method:'finish'}}),'Photographic finish · no new AI');assert.equal(takeLabel({model:'qwen-fp8'}),'AI photograph · Qwen');
 await assert.rejects(()=>previewBlob({asset:async()=>undefined},'missing'),/missing/);const original=new Blob(['UNCHANGED ORIGINAL']),normalized=new Blob([png]);assert.equal(await(await previewBlob({asset:async()=>({original,normalized})},'id',heroSha(png))).arrayBuffer().then(b=>heroSha(Buffer.from(b))),heroSha(png));await assert.rejects(()=>previewBlob({asset:async()=>({original,normalized})},'id',heroSha(png),true),/checksum/);
 assert.match(css,/@media\(max-width:720px\)/);assert.match(css,/object-fit:contain/);assert.match(css,/prefers-reduced-motion/);assert.ok(!/border-radius:\s*[1-9]/.test(css));
 const index=await readFile('adstudio/index.html','utf8'),tools=await readFile('adstudio/tools.html','utf8');assert.match(index,/src\/react\/entry.tsx/);assert.ok(!index.includes('src/main.ts'));assert.match(tools,/src\/main.ts/);assert.match(tools,/Back to your advertisement/);for(const id of ['brand','hero','static','create','compose'])assert.ok(tools.includes('id="'+id+'-workspace"'));
 await writeFile(dir+'/index.html','<!doctype html><meta charset="utf-8"><title>React layout review</title><style>'+css+'</style><main class="boot"><h1>Static React review</h1><p>SSR snapshots, not browser acceptance. No generation or owner storage changes. Live app: http://127.0.0.1:8301/adstudio/#hero</p>'+['01-product','02-direction','03-result'].map(n=>'<a href="'+n+'.html">'+n+' →</a>').join('')+'</main>');
 console.log('PASS real React SSR semantics: minimal entry, fallback honesty, explicit facts/review, unavailable-model disabled Generate, reviewed export, original/generated/ad distinction, missing/corrupt media, responsive/style contracts, preserved specialist tools. Static snapshots at '+dir+'. Browser acceptance NOT RUN.');
}finally{await server.close();}
