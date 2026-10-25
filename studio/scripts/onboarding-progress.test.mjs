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
assert.deepEqual(windowLesson('keyframes',new Set(['timeline']),false),{window:'keyframes',stage:'menu'});
assert.deepEqual(windowLesson('keyframes',new Set(['timeline']),true),{window:'keyframes',stage:'item'});
assert.equal(windowLesson('keyframes',new Set(['keyframes']),false),null);
assert.deepEqual(windowLesson('add',new Set(['keyframes']),false),{window:'files',stage:'menu'});
assert.equal(windowLesson('done',new Set(),false),null);
assert.equal(windowLesson('edit-settings',new Set(),false),null);
assert.equal(guidesPlaced([{img:'a',anchor:'start'},{anchor:'end'}]),false);assert.equal(guidesPlaced([{img:'a',anchor:'start'},{img:'b',anchor:'end'}]),true);
// Exercise the actual Director attachment functions with CPU-only state and no renderer/network.
const source=readFileSync(new URL('../src/director.ts',import.meta.url),'utf8');
const functions=['checkTourPlacement','addKey'].map(name=>source.match(new RegExp('^function '+name+'\\([^\\n]+','m'))?.[0]).join('\n');
const shot={id:'shot',n:'Fixture',d:4,keys:[],spec:{},r:true};
const context={SH:[shot],onboarding:{shotId:'shot',step:'add'},touring:()=>true,guidesPlaced,toast:()=>{},timeline:()=>{},head:()=>{},save:()=>{},setPlaying:()=>{},start:()=>0,open:null,selKey:null,cur:0,G:0,playing:false,pxs:100,dragV:null,advanceTour:step=>{context.onboarding.step=step}};
const drop=source.slice(source.indexOf('function dropTarget('),source.indexOf("for(const kind of ['video','audio'])"));
const api=Function('ctx','with(ctx){'+functions+'\n'+drop+';return {addKey,checkTourPlacement,dropTarget}}')(context);
api.addKey(0,0,{img:'a',spec:{},u:.5});api.addKey(0,0,{img:'a',spec:{},u:.5});assert.equal(shot.keys.length,1);api.addKey(0,0,{img:'b',spec:{},u:.5});assert.equal(context.onboarding.step,'position');assert(shot.keys.every(k=>!k.anchor));assert(shot.keys.every(k=>k.t>0&&k.t<4));
shot.keys[0].anchor='start';api.checkTourPlacement();assert.equal(context.onboarding.step,'position');shot.keys[1].anchor='end';api.checkTourPlacement();assert.equal(context.onboarding.step,'regenerate');
context.onboarding.step='add';shot.keys=[];context.dragV={img:'a',u:.5,spec:{}};const el={classList:{remove(){},add(){}},getBoundingClientRect:()=>({left:10})};api.dropTarget(el,0);el.ondrop({preventDefault(){},clientX:10});context.dragV={img:'b',u:.5,spec:{}};el.ondrop({preventDefault(){},clientX:410});assert.equal(shot.keys[0].anchor,'start');assert.equal(shot.keys[1].anchor,'end');assert.equal(context.onboarding.step,'regenerate');
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
assert.equal(workflowTourStep({entry:'image',step:'image-review'},'video'),'image-video');
assert.equal(windowLesson('switch-image',new Set(),false),null);
assert.deepEqual(windowLesson('add',new Set(['timeline']),false),{window:'files',stage:'menu'});
assert.equal(windowLesson('add',new Set(['files','timeline']),false),null);
// Existing Project files images can be dropped as guides, but external/unknown URLs cannot.
context.SC={get:()=>[{url:'/outputs/1111111111111111.png',kind:'image'}]};context.dragV=null;context.onboarding.step='add';shot.keys=[];
api.dropTarget(el,0);el.ondrop({preventDefault(){},clientX:110,dataTransfer:{getData:()=>'/outputs/1111111111111111.png'}});assert.equal(shot.keys.length,1);assert.equal(shot.keys[0].img,'/outputs/1111111111111111.png');
el.ondrop({preventDefault(){},clientX:210,dataTransfer:{getData:()=>'/outputs/2222222222222222.png'}});assert.equal(shot.keys.length,1);

// Run the real image-generation controller against a deterministic CPU stub.
const imageCode=source.slice(source.indexOf("$('#kgo').onclick=async()=>"),source.indexOf('\nfunction res()'));
const button={disabled:false,textContent:''},promptInput={value:'Prepared guide prompt'};
let generated=0,guideRenders=0;
const imageContext={$:selector=>selector==='#kgo'?button:promptInput,SP:value=>value,touring:()=>true,specFromUI:()=>({}),OSH:{online:true},workspaceMode:'image',keyframeBatch:4,results:[],imageDraft:{},onboarding:{entry:'video',step:'keyframes',images:[]},localGeneration:{keyframe:async()=>({url:'/outputs/'+String(++generated).repeat(16)+'.png'})},res:()=>{},SC:{set:()=>{}},advanceTour:step=>{imageContext.onboarding.step=step},renderTour:()=>guideRenders++,saveWorkshop:()=>{},syncWorkspace:()=>{},pushHist:()=>{},toast:()=>{}};
const generateGuide=Function('ctx','with(ctx){'+imageCode+";return $('#kgo').onclick}")(imageContext);
await generateGuide();assert.equal(imageContext.onboarding.step,'keyframes');assert.equal(guideRenders,1);assert.equal(button.disabled,false);
await generateGuide();assert.equal(imageContext.onboarding.step,'return-video');assert.equal(imageContext.onboarding.images.length,2);assert.equal(imageContext.imageDraft.url,'/outputs/2222222222222222.png');
imageContext.onboarding={entry:'image',step:'image',images:[]};await generateGuide();assert.equal(imageContext.onboarding.step,'image-review');

// The Image invitation waits for the actual decoded clip, not generation completion or a timer.
const reviewLine=source.split('\n').find(line=>line.includes("onboarding.step==='watch-video'&&s.id"));
const review=new Function('touring','onboarding','s','vid','advanceTour',reviewLine);
const waiting={step:'watch-video',shotId:'scene',firstVideo:'/outputs/clip.webm'};
const viewed={id:'scene',video:waiting.firstVideo};
let next='';
review(()=>true,waiting,viewed,{readyState:1,duration:4,currentTime:4},step=>next=step);assert.equal(next,'');
review(()=>true,waiting,viewed,{readyState:4,duration:4,currentTime:1},step=>next=step);assert.equal(next,'');
review(()=>true,waiting,{...viewed,video:'other'},{readyState:4,duration:4,currentTime:4},step=>next=step);assert.equal(next,'');
review(()=>true,waiting,viewed,{readyState:4,duration:4,currentTime:3.99},step=>next=step);assert.equal(next,'switch-image');assert.equal(waiting.videoReviewed,true);
