import {guideDropPosition} from '../src/guide-drop.ts';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {windowLesson, ownsTour, canResumeWorkflow, readProfile, firstVisit, workflowForSetup, guidesPlaced} from '../src/onboarding-progress.ts';
const profile=readProfile({experience:'seasoned',workflows:{video:'completed',image:'skipped',edit:'nonsense',alien:'completed'}});
assert.equal(profile.experience,'seasoned');assert.equal(firstVisit(profile,'director'),true);assert.equal(firstVisit(profile,'video'),false);assert.equal(firstVisit(profile,'image'),false);assert.equal(firstVisit(readProfile(null),'video'),false);
assert.deepEqual(Object.keys(profile.workflows),['video','image']);assert.equal(workflowForSetup('Director'),'director');assert.equal(workflowForSetup('My images','image'),'image');assert.equal(workflowForSetup('Rendering'),'rendering');assert.equal(workflowForSetup('3D'),'3d');
assert.equal(canResumeWorkflow({entry:'director',shotId:''},'director'),false);
assert.equal(canResumeWorkflow({entry:'director',shotId:'shot'},'director'),true);
assert.equal(canResumeWorkflow({entry:'edit',shotId:''},'edit'),true);
assert.equal(canResumeWorkflow({entry:'image',shotId:'shot'},'director'),false);
assert.equal(canResumeWorkflow({entry:'image',shotId:'shot',dismissed:true},'image'),false);
assert.equal(ownsTour('edit','director'),false);assert.equal(ownsTour('director','edit'),false);assert.equal(ownsTour('edit','edit'),true);assert.equal(ownsTour('director','image'),true);
assert.deepEqual(windowLesson('keyframes',new Set(['timeline']),false),{window:'prompts',stage:'menu'});
assert.deepEqual(windowLesson('keyframes',new Set(['timeline']),true),{window:'prompts',stage:'item'});
assert.equal(windowLesson('keyframes',new Set(['prompts']),false),null);
assert.deepEqual(windowLesson('add',new Set(['keyframes']),false),{window:'files',stage:'menu'});
assert.equal(windowLesson('done',new Set(),false),null);
assert.equal(windowLesson('edit-settings',new Set(),false),null);
assert.equal(guidesPlaced([{img:'a',anchor:'start'},{anchor:'end'}]),false);assert.equal(guidesPlaced([{img:'a',anchor:'start'},{img:'b',anchor:'end'}]),true);
// Exercise the actual Director attachment functions with CPU-only state and no renderer/network.
const source=readFileSync(new URL('../src/director.ts',import.meta.url),'utf8');
const functions=['checkTourPlacement','addKey'].map(name=>source.match(new RegExp('^function '+name+'\\([^\\n]+','m'))?.[0]).join('\n');
const shot={id:'shot',n:'Fixture',d:4,keys:[],spec:{},r:true};
const context={addEventListener(){},guideDropPosition,SH:[shot],onboarding:{shotId:'shot',step:'add'},touring:()=>true,guidesPlaced,toast:()=>{},timeline:()=>{},head:()=>{},save:()=>{},setPlaying:()=>{},start:()=>0,open:null,selKey:null,cur:0,G:0,playing:false,pxs:100,dragV:null,advanceTour:step=>{context.onboarding.step=step}};
const drop=source.slice(source.indexOf('function dropTarget('),source.indexOf("for(const kind of ['video','audio'])"));
const api=Function('ctx','with(ctx){'+functions+'\n'+drop+';return {addKey,checkTourPlacement,dropTarget}}')(context);
api.addKey(0,0,{img:'a',spec:{},u:.5});api.addKey(0,0,{img:'a',spec:{},u:.5});assert.equal(shot.keys.length,1);api.addKey(0,0,{img:'b',spec:{},u:.5});assert.equal(context.onboarding.step,'position');assert(shot.keys.every(k=>!k.anchor));assert(shot.keys.every(k=>k.t>0&&k.t<4));
shot.keys[0].anchor='start';api.checkTourPlacement();assert.equal(context.onboarding.step,'position');shot.keys[1].anchor='end';api.checkTourPlacement();assert.equal(context.onboarding.step,'regenerate');
context.onboarding.step='add';shot.keys=[];context.dragV={img:'a',u:.5,spec:{}};const el={dataset:{},style:{removeProperty(){},setProperty(){}},contains:()=>false,classList:{remove(){},add(){}},getBoundingClientRect:()=>({left:10,width:400})};api.dropTarget(el,0);el.ondrop({preventDefault(){},clientX:10});context.dragV={img:'b',u:.5,spec:{}};el.ondrop({preventDefault(){},clientX:410});assert.equal(shot.keys[0].anchor,'start');assert.equal(shot.keys[1].anchor,'end');assert.equal(context.onboarding.step,'regenerate');
console.log('PASS: shared experience, first-visit suppression, setup mapping, actual click/drop attachment, START/END milestones; no GPU or generation calls.');

const {continuesImageTour}=await import('../src/onboarding-progress.ts');
assert.equal(continuesImageTour({entry:'image',step:'image-review'},'video'),true);
assert.equal(continuesImageTour({entry:'image',step:'image-video'},'video'),true);
assert.equal(continuesImageTour({entry:'image',step:'image-review',suspended:true},'video'),false);
assert.equal(continuesImageTour({entry:'image',step:'image-review'},'rendering'),false);

// Interaction lock: preserve pre-existing inert state, support two drag roots, release on exit.
const {lockTourInteraction}=await import('../src/onboarding-interaction.ts');
class ElementStub {
 constructor(children=[]){this.children=children;this.inert=false;this.tabIndex=-1}
 contains(node){return this===node||this.children.some(child=>child.contains(node))}
 querySelectorAll(){return []}
}
const globals={window:globalThis.window,document:globalThis.document,HTMLElement:globalThis.HTMLElement,Node:globalThis.Node};
try{
 globalThis.HTMLElement=globalThis.Node=ElementStub;globalThis.window=new EventTarget();
 const sourceRoot=new ElementStub(),dropRoot=new ElementStub(),outside=new ElementStub(),existing=new ElementStub();existing.inert=true;
 const panel=new ElementStub([sourceRoot,outside]),body=new ElementStub([panel,dropRoot,existing]);
 globalThis.document={body};let allowed=[sourceRoot,dropRoot],nudges=0;
 const lock=lockTourInteraction({roots:()=>allowed,blocked:()=>nudges++});lock.sync();
 assert.equal(panel.inert,false);assert.equal(sourceRoot.inert,false);assert.equal(dropRoot.inert,false);assert.equal(outside.inert,true);
 function fire(type,target){const event=new Event(type,{cancelable:true});Object.defineProperty(event,'target',{value:target});window.dispatchEvent(event);return event.defaultPrevented}
 assert.equal(fire('pointerdown',outside),true);assert.equal(nudges,1);
 assert.equal(fire('click',outside),true);assert.equal(fire('drop',dropRoot),false);assert.equal(fire('dragstart',sourceRoot),false);
 assert.equal(fire('pointerup',outside),false); // A permitted drag must always be able to finish.
 allowed=[outside];lock.sync();assert.equal(sourceRoot.inert,true);assert.equal(outside.inert,false);
 allowed=null;lock.sync();assert.equal(sourceRoot.inert,false);assert.equal(existing.inert,true);
 lock.dispose();assert.equal(fire('click',sourceRoot),false);
}finally{for(const [key,value] of Object.entries(globals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}


const {workflowTourStep}=await import('../src/onboarding-progress.ts');
const videoTour={entry:'video',step:'switch-image'};
assert.equal(workflowTourStep(videoTour,'image'),'keyframes');
assert.equal(workflowTourStep({...videoTour,step:'keyframes'},'image'),'keyframes');
assert.equal(workflowTourStep({...videoTour,step:'return-video'},'video'),'add');
assert.equal(workflowTourStep({...videoTour,step:'position'},'video'),'position');
assert.equal(workflowTourStep({...videoTour,dismissed:true},'image'),null);
assert.equal(workflowTourStep({...videoTour,suspended:true},'image'),null);
assert.equal(workflowTourStep(videoTour,'rendering'),null);
assert.equal(workflowTourStep({entry:'image',step:'image-review'},'video'),'add');
assert.equal(windowLesson('switch-image',new Set(),false),null);
assert.deepEqual(windowLesson('add',new Set(['timeline']),false),{window:'files',stage:'menu'});
assert.equal(windowLesson('add',new Set(['files','timeline']),false),null);
// Existing Project files images can be dropped as guides, but external/unknown URLs cannot.
context.SC={get:()=>[{url:'/outputs/1111111111111111.png',kind:'image'}]};context.dragV=null;context.onboarding.step='add';shot.keys=[];
api.dropTarget(el,0);el.ondrop({preventDefault(){},clientX:110,dataTransfer:{getData:()=>'/outputs/1111111111111111.png'}});assert.equal(shot.keys.length,1);assert.equal(shot.keys[0].img,'/outputs/1111111111111111.png');
el.ondrop({preventDefault(){},clientX:210,dataTransfer:{getData:()=>'/outputs/2222222222222222.png'}});assert.equal(shot.keys.length,1);

// Run the real image-generation controller against a deterministic CPU stub.
const imageCode=source.slice(source.indexOf("$('#kgo').onclick=async()=>"),source.indexOf('\nfunction res()'));
const button={disabled:false,textContent:''},promptInput={value:'Prepared START guide prompt',focus(){}};
let generated=0,guideRenders=0;
const imageContext={selKey:null,librarySelection:null,SH:[],$:selector=>selector==='#kgo'?button:promptInput,SP:value=>value,touring:()=>true,specFromUI:()=>({}),OSH:{online:true},workspaceMode:'image',keyframeBatch:4,results:[],imageDraft:{},onboarding:{entry:'video',step:'keyframes',images:[]},localGeneration:{keyframe:async()=>({url:'/outputs/'+String(++generated).repeat(16)+'.png'})},res:()=>{},SC:{set:()=>{}},advanceTour:step=>{imageContext.onboarding.step=step},renderTour:()=>guideRenders++,saveWorkshop:()=>{},syncWorkspace:()=>{},pushHist:()=>{},toast:()=>{}};
const generateGuide=Function('ctx','with(ctx){'+imageCode+";return $('#kgo').onclick}")(imageContext);
await generateGuide();assert.equal(imageContext.onboarding.step,'keyframes');assert.equal(guideRenders,1);assert.equal(button.disabled,false);
await generateGuide();assert.equal(generated,1,'A repeated START prompt cannot silently create END');promptInput.value='Distinct END guide prompt';await generateGuide();assert.deepEqual(imageContext.onboarding.guidePrompts,['Prepared START guide prompt','Distinct END guide prompt']);assert.equal(imageContext.onboarding.step,'return-video');assert.equal(imageContext.onboarding.images.length,2);assert.equal(imageContext.imageDraft.url,'/outputs/2222222222222222.png');
imageContext.onboarding={entry:'image',step:'image',images:[]};await generateGuide();assert.equal(imageContext.onboarding.step,'image-review');

// The Image invitation waits for the actual decoded clip, not generation completion or a timer.
const reviewLine=source.split('\n').find(line=>line.includes("onboarding.step==='watch-video'&&s.id"));
const review=new Function('touring','onboarding','s','vid','advanceTour',reviewLine);
const waiting={step:'watch-video',shotId:'scene',firstVideo:'/outputs/clip.webm'};
const viewed={id:'scene',video:waiting.firstVideo};
let next='';
review(()=>true,waiting,viewed,{readyState:1,src:'http://localhost/outputs/clip.webm',seeking:false,duration:4,currentTime:4},step=>next=step);assert.equal(next,'');
review(()=>true,waiting,viewed,{readyState:4,src:'http://localhost/outputs/clip.webm',seeking:false,duration:4,currentTime:1},step=>next=step);assert.equal(next,'');
review(()=>true,waiting,{...viewed,video:'other'},{readyState:4,src:'http://localhost/outputs/clip.webm',seeking:false,duration:4,currentTime:4},step=>next=step);assert.equal(next,'');
review(()=>true,waiting,viewed,{readyState:4,src:'http://localhost/outputs/clip.webm',seeking:false,duration:4,currentTime:3.99},step=>next=step);assert.equal(next,'switch-image');assert.equal(waiting.videoReviewed,true);
const pauseSource=source.split('\n').find(line=>line.startsWith('function reviewPausedFirstVideo'));
let pausedStage='';const pausedTour={step:'watch-video',shotId:'scene',firstVideo:'/outputs/clip.webm'};
let pausedVideo={readyState:4,seeking:false,currentTime:0,src:'http://localhost/outputs/clip.webm'};
const pauseReview=new Function('$','touring','onboarding','SH','advanceTour',pauseSource+';reviewPausedFirstVideo()');
const runPause=()=>pauseReview(()=>pausedVideo,()=>true,pausedTour,[{id:'scene',video:'/outputs/clip.webm'}],step=>pausedStage=step);
runPause();assert.equal(pausedStage,'','initial paused state does not interrupt viewing');pausedVideo.currentTime=1;pausedVideo.seeking=true;runPause();assert.equal(pausedStage,'');pausedVideo.seeking=false;runPause();assert.equal(pausedStage,'switch-image');assert.equal(pausedTour.videoReviewed,true);
assert.deepEqual(guideDropPosition(4,400,0),{time:0,anchor:'start',percent:0});assert.equal(guideDropPosition(4,400,380).anchor,'end');assert.equal(guideDropPosition(4,400,200).time,2);assert.equal(guideDropPosition(4,40,20).anchor,null);assert.equal(guideDropPosition(4,400,-100).time,0);assert.equal(guideDropPosition(4,400,900).time,4);
el.ondragover({preventDefault(){},clientX:210,dataTransfer:{types:['application/x-studio-file-image']}});assert.equal(el.dataset.guideDrop,'Keyframe · 2.00s');el.ondragover({preventDefault(){},clientX:15,dataTransfer:{types:['application/x-studio-file-image']}});assert.equal(el.dataset.guideDrop,'START');el.ondragleave({relatedTarget:null});assert.equal(el.dataset.guideDrop,undefined);

waiting.afterReview='add-scenes';next='';review(()=>true,waiting,viewed,{readyState:4,src:'http://localhost/outputs/clip.webm',seeking:false,duration:4,currentTime:4},step=>next=step);assert.equal(next,'add-scenes','Keyframe render review precedes the add-scenes lesson');
const editPrompt=source.split('\n').find(line=>line.startsWith("$('#shotPromptInput').oninput="));
const rendered={prompt:'old',r:true,video:'/outputs/clip.webm'};const promptControl={};new Function('$','currentShot','head','save',editPrompt)(()=>promptControl,()=>rendered,()=>{},()=>{});promptControl.oninput({target:{value:'new direction'}});assert.equal(rendered.r,true);assert.equal(rendered.video,'/outputs/clip.webm');assert.equal(rendered.prompt,'new direction');

// Execute the actual successful shot controller: review every new take from its beginning.
const shotCode=source.slice(source.indexOf('async function realShot('),source.indexOf('\nasync function fake('));
for(const stage of ['regenerate','image-video','watch-video','play-video']){
 const scene={id:'review-scene',n:'Scene',d:4,prompt:'new',r:false,keys:[{img:'start',anchor:'start',t:0},{img:'end',anchor:'end',t:4}],audioLinked:false};
 const ctx={generationDraft:null,SH:[scene],busy:async(_,job)=>job(),$:()=>({open:true}),shouldRewriteBeforeGeneration:()=>false,localGeneration:{shot:async()=>({url:'/outputs/new.webm',frames:97,duration:4,fps:24})},shotPrompt:()=>scene.prompt,start:()=>0,G:3.99,setPlaying:()=>{},pushHist:()=>{},shotId:s=>s.id,touring:()=>true,onboarding:{shotId:scene.id,step:stage,afterReview:'add-scenes'},advanceTour:step=>ctx.onboarding.step=step};
 const render=Function('ctx','with(ctx){'+shotCode+';return realShot}')(ctx);await render(0,'Render');assert.equal(ctx.onboarding.step,'play-video');assert.equal(ctx.onboarding.firstVideo,'/outputs/new.webm');assert.equal(ctx.onboarding.videoReviewed,false);assert.equal(ctx.G,0);assert.equal(ctx.onboarding.afterReview,'add-scenes');
}

// The edge-aligned thumbnail must not jump 44px when leaving START/END.
const placementLine=source.split('\n').find(line=>line.includes('const w=s.d*pxs-3,px='));
const px=new Function('s','pxs',placementLine+';return px')({d:4},100);
assert.equal(px(0),0);assert.equal(px(.2),0);assert.equal(px(.4),0);assert(px(.5)>0&&px(.5)<=10);assert.equal(px(4),317);

assert.deepEqual(windowLesson('play-video',new Set(['prompts']),false),{window:'viewer',stage:'menu'});assert.equal(windowLesson('play-video',new Set(['viewer']),false),null);
const playLine=source.split('\n').find(line=>line.startsWith("$('#play').onclick="));
const playControl={};const playCtx={$:()=>playControl,playing:false,span:()=>[0,4],G:0,setPlaying:value=>playCtx.playing=value,touring:()=>true,onboarding:{step:'play-video'},advanceTour:step=>playCtx.onboarding.step=step,reviewPausedFirstVideo:()=>{}};
Function('ctx','with(ctx){'+playLine+'}')(playCtx);assert.equal(playCtx.onboarding.step,'play-video','Rendering does not dismiss the Play instruction');playControl.onclick();assert.equal(playCtx.playing,true);assert.equal(playCtx.onboarding.step,'watch-video','Pressing Play dismisses guidance and begins review');

// Image-first must also teach a real drag; switching alone cannot attach a keyframe.
assert.equal(workflowTourStep({entry:'image',step:'return-video'},'video'),'add');
context.onboarding={entry:'image',shotId:'shot',step:'add',images:['solo']};shot.keys=[];api.addKey(0,2,{img:'solo',spec:{},u:.5});assert.equal(context.onboarding.step,'position');assert.equal(shot.keys.length,1);assert.equal(shot.keys[0].anchor,undefined);shot.keys[0].anchor='start';api.checkTourPlacement();assert.equal(context.onboarding.step,'image-video');
const animateLine=source.split('\n').find(line=>line.startsWith("$('#animateImage').onclick="));const animateControl={};let autoAttachments=0;
const animateCtx={$:()=>animateControl,touring:()=>true,onboarding:{entry:'image',images:[]},imageDraft:{url:'solo'},advanceTour:step=>animateCtx.onboarding.step=step,setWorkflow:()=>autoAttachments++,ensureScene:()=>autoAttachments++};Function('ctx','with(ctx){'+animateLine+'}')(animateCtx);animateControl.onclick();assert.equal(autoAttachments,0);assert.equal(animateCtx.onboarding.step,'return-video');assert.deepEqual(animateCtx.onboarding.images,['solo']);

// Untargeted generation saves an asset without replacing the current timeline shot.
{
 const scene={id:'existing',n:'Existing',d:4,prompt:'new',video:'/outputs/original.webm',r:true,keys:[],audioLinked:false};let output;
 const ctx={generationDraft:null,currentShot:()=>scene,SH:[scene],busy:async(_,job)=>job(),$:()=>({open:true}),shouldRewriteBeforeGeneration:()=>false,localGeneration:{shot:async()=>({url:'/outputs/library.webm',frames:97,duration:4,fps:24})},shotPrompt:s=>s.prompt,start:()=>0,G:2,setPlaying:()=>{},pushHist:(asset,reveal)=>output={asset,reveal},shotId:s=>s.id,touring:()=>false};
 const render=Function('ctx','with(ctx){'+shotCode+';return realShot}')(ctx);await render(0,'Render',true);assert.equal(scene.video,'/outputs/original.webm');assert.equal(ctx.G,2);assert.equal(output.asset.url,'/outputs/library.webm');assert.equal(output.reveal,true);
}

// Exercise the real dock transition handler and open/close functions without a browser.
const dockSource=readFileSync(new URL('../src/workspace-dock.ts',import.meta.url),'utf8');
const {stripTypeScriptTypes}=await import('node:module');
const transpileModule=source=>({outputText:stripTypeScriptTypes('function fixture(){'+source+'}')+';return fixture();'});
const layout=await import('../src/window-layout.ts');
function declaration(name){const begin=dockSource.indexOf(' function '+name+'(');let braces=0,seen=false;for(let i=dockSource.indexOf('{',begin);i<dockSource.length;i++){if(dockSource[i]==='{'){braces++;seen=true}if(dockSource[i]==='}'&&!--braces&&seen)return dockSource.slice(begin,i+1)}throw Error('Missing '+name)}
const handler=dockSource.slice(dockSource.indexOf(" if(!custom)addEventListener('osh-tour-single-video'"),dockSource.indexOf(' const names=()=>'));
const replace=dockSource.slice(dockSource.indexOf(' const replacePanel='),dockSource.indexOf(' const persist ='));
const harness=transpileModule(`let setup={tree:initial},tutorialSlot=null;const custom=false;let renders=0;const render=()=>renders++,persist=()=>{};let listener;const addEventListener=(name,fn)=>listener=fn;${replace}${declaration('openWindow')}${declaration('closeWindow')}${handler};return {mode:detail=>listener({detail}),close:()=>closeWindow('tour-video'),open:()=>openWindow('timeline'),tree:()=>setup.tree,slot:()=>tutorialSlot};`,{}).outputText;
const initial=layout.split('y',layout.split('x',layout.panel('prompts'),layout.panel('viewer'),.4),layout.panel('timeline'),.75);
const make=()=>new Function('initial','ids','panel','split','remove','clone','dispatchEvent',harness)(structuredClone(initial),layout.ids,layout.panel,layout.split,layout.remove,structuredClone,()=>{});
const guided=make();guided.mode('single');assert.deepEqual(layout.ids(guided.tree()),['prompts','viewer','tour-video']);guided.mode('single');guided.close();assert.deepEqual(layout.ids(guided.tree()),['prompts','viewer']);assert.ok(guided.slot());guided.mode('await-timeline');guided.open();assert.deepEqual(guided.tree(),initial);assert.equal(guided.slot(),null);
const resumed=make();resumed.mode('await-timeline');assert.deepEqual(layout.ids(resumed.tree()),['prompts','viewer']);resumed.open();assert.deepEqual(resumed.tree(),initial);
const skipped=make();skipped.mode('single');skipped.mode('normal');assert.deepEqual(skipped.tree(),initial);
assert.ok(dockSource.includes("filter(([id])=>id!=='tour-video')"));
console.log('PASS: onboarding-only single clip, close/add in original split, resume and skip cleanup.');
