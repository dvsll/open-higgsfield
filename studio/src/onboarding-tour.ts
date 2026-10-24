import {createElement} from 'react';
import {renderView,unmountView} from './react/render';
import {TourChoice,TourPopover} from './react/onboarding';
import './onboarding-tour.css';
import './onboarding-focus.css';
import './onboarding-guidance.css';
import { SC } from './scene';
import {lockTourInteraction} from './onboarding-interaction';
import { workflowTourStep, canResumeWorkflow, firstVisit, profileKey, readProfile, windowLesson, workflowForSetup, type Experience, type Workflow } from './onboarding-progress';
export type TourState = { step:string; shotId:string; images:string[]; dismissed?:boolean; suspended?:boolean; experience?:Experience; entry?:Workflow; firstVideo?:string|null };
type Options = { get:()=>TourState|null; set:(state:TourState)=>void; save:()=>void; choose:(entry:Workflow)=>void; begin:(entry:Workflow)=>TourState; current:()=>Workflow };
type Tip = { title:string; text:string; target?:string; secondary?:string; next?:string; diagram?:'add'|'position' };
const names:Record<Workflow,string>={video:'Video',image:'Image',director:'Director',rendering:'Rendering',edit:'Edit', '3d':'3D'};
export function mountOnboardingTour(options:Options) {
 let raw:unknown;try{raw=JSON.parse(localStorage.getItem(profileKey)||'null')}catch{}
 const profile=readProfile(raw);
 const saveProfile=()=>{try{localStorage.setItem(profileKey,JSON.stringify(profile))}catch{}};
 const suspended:Partial<Record<Workflow,TourState>>=SC.get('osh-workflow-tours')||{};
 const persist=()=>{const state=options.get();options.save();if(state?.entry){suspended[state.entry]=JSON.parse(JSON.stringify(state));SC.set('osh-workflow-tours',suspended)}};
 const popup=document.createElement('section');popup.className='tour-popover';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Studio walkthrough');popup.setAttribute('aria-live','polite');popup.hidden=true;
 const shade=document.createElementNS('http://www.w3.org/2000/svg','svg');shade.classList.add('tour-shade');shade.setAttribute('aria-hidden','true');shade.style.display='none';
 const shadePath=document.createElementNS(shade.namespaceURI,'path');shadePath.setAttribute('fill-rule','evenodd');shade.append(shadePath);
 const rings=[0,1].map(()=>{const ring=document.createElement('div');ring.className='tour-target';ring.hidden=true;return ring});document.body.append(shade,...rings,popup);
 let chooser:HTMLDialogElement|null=null,localStep=0,lastStage='',lastWindowLesson='',targets:string[]=[],switching=false,disposed=false;
 const restrictedOptions=new Map<HTMLOptionElement,boolean>();
 function workflowChoices(){
  for(const [option,disabled] of restrictedOptions)option.disabled=disabled;restrictedOptions.clear();
  const state=options.get();if(!state||state.dismissed||state.suspended)return;
  const expected=state.step==='switch-image'?'Image':state.step==='return-video'?'Video':null;
  if(expected)document.querySelectorAll<HTMLOptionElement>('[aria-label="Workspace setup"] option').forEach(option=>{if(option.value!==expected){restrictedOptions.set(option,option.disabled);option.disabled=true}});
 }
 const targetElement=(selector:string)=>selector.split(',').map(s=>document.querySelector<HTMLElement>(s.trim())).find(e=>e&&e.getClientRects().length);
 const interaction=lockTourInteraction({roots:()=>{
  if(popup.hidden||disposed)return null;
  const dialog=document.querySelector<HTMLDialogElement>('dialog[open]');
  if(dialog)return [dialog];
  if(document.getElementById('ov')?.style.display==='flex')return [document.getElementById('ov')!];
  const allowed=targets.map(targetElement).filter((e):e is HTMLElement=>!!e);
  for(const input of [...allowed]){
   const menu=document.getElementById(input.getAttribute('aria-controls')||'');
   if(menu&&!menu.hidden&&input.getAttribute('aria-expanded')==='true')allowed.push(menu);
  }
  return [...allowed,popup];
 },blocked:()=>nudgeFocus(new PointerEvent('pointerdown',{clientX:-1,clientY:-1}))});
 // Background presses redirect attention without disrupting panel dragging or text editing.
 function nudgeFocus(event:PointerEvent){
  if(disposed||event.button!==0)return;
  const clicked=event.target as Node|null;
  let focus:HTMLElement[]=[];
  if(chooser?.open){
   const b=chooser.getBoundingClientRect();
   if(event.clientX>=b.left&&event.clientX<=b.right&&event.clientY>=b.top&&event.clientY<=b.bottom)return;
   focus=[chooser];
  }else{
   if(popup.hidden||popup.style.visibility==='hidden'||shade.style.display==='none'||popup.contains(clicked))return;
   const activeRings=rings.filter(r=>!r.hidden);
   if(activeRings.some(r=>{const b=r.getBoundingClientRect();return event.clientX>=b.left&&event.clientX<=b.right&&event.clientY>=b.top&&event.clientY<=b.bottom}))return;
   focus=targets.map(selector=>document.querySelector<HTMLElement>(selector)?.closest<HTMLElement>('.studio-window')).filter((e):e is HTMLElement=>!!e);
   focus.push(...activeRings);if(!focus.length)focus=[popup];
  }
  for(const element of new Set(focus)){
   element.getAnimations().filter(a=>a.id==='tour-attention').forEach(a=>a.cancel());
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   element.animate(reduced?[
    {outline:'2px solid #f3d58a',outlineOffset:'-2px'},
    {outline:'2px solid transparent',outlineOffset:'-2px'}
   ]:[
    {outline:'2px solid transparent',outlineOffset:'-2px'},
    {outline:'2px solid #f3d58a',outlineOffset:'-2px',offset:.2},
    {outline:'2px solid #f3d58a',outlineOffset:'-2px',offset:.65},
    {outline:'2px solid transparent',outlineOffset:'-2px'}
   ],{duration:reduced?700:550,easing:'ease-out',id:'tour-attention'});
  }
 }
 document.addEventListener('pointerdown',nudgeFocus,true);
 addEventListener('pagehide',()=>document.removeEventListener('pointerdown',nudgeFocus,true));
 function end(skipped=false){const state=options.get();if(state){state.dismissed=true;const entry=state.entry||options.current();profile.workflows[entry]=skipped?'skipped':'completed';saveProfile();persist()}chooser?.close();render()}
 function pause(){const state=options.get();if(state?.entry&&!state.dismissed){state.suspended=true;persist()}}
 function start(entry:Workflow,force=false,changeSetup=true){
  if(switching)return;switching=true;
  try{pause();const previous=suspended[entry];const shouldStart=force||firstVisit(profile,entry)||profile.workflows[entry]==='started'&&previous&&!previous.dismissed;
   if(shouldStart){const state=!force&&canResumeWorkflow(previous,entry)?{...previous!,suspended:false}:options.begin(entry);state.entry=entry;state.experience=profile.experience;state.dismissed=false;state.suspended=false;options.set(state);profile.workflows[entry]='started';saveProfile();persist();lastStage=''}
   if(changeSetup)options.choose(entry);
  }finally{switching=false;render()}
 }
 function selection(){
  if(chooser?.open)return;const state=options.get();if(!state)return;
  chooser=document.createElement('dialog');chooser.className='tour-choice';chooser.setAttribute('aria-label','Personalize your Studio walkthrough');
  const currentDialog=chooser;
  renderView(chooser,createElement(TourChoice,{experience:state.experience,onChoose:key=>{
   if(!state.experience){state.experience=key as Experience;profile.experience=state.experience;saveProfile();persist();chooser?.close();selection()}
   else{profile.experience=state.experience;saveProfile();chooser?.close();start(key as Workflow,true)}
  },onBack:()=>{state.experience=undefined;persist();chooser?.close();selection()},onSkip:()=>end(true)}));
  chooser.addEventListener('cancel',e=>{e.preventDefault();end(true)});
  chooser.addEventListener('close',()=>{unmountView(currentDialog);currentDialog.remove();if(chooser===currentDialog)chooser=null});document.body.append(chooser);chooser.showModal();
 }
 function prepare(step:string){
  if(['add','position'].includes(step))dispatchEvent(new Event('osh-tour-keyframe-view'));
  requestAnimationFrame(()=>{const selector=step==='add'?'.project-files':step==='position'?'#trk':step==='keyframes'?'#kp':null;const element=selector&&document.querySelector(selector);element?.scrollIntoView({block:'nearest'})});
 }
 function tip(state:TourState):Tip{
  const beginner=state.experience==='beginner',pro=state.experience==='professional';
  const visible=new Set(Array.from(document.querySelectorAll<HTMLElement>('.window-board .studio-window:not([hidden])')).map(panel=>panel.dataset.window!));
  const lesson=windowLesson(state.step,visible,!!document.querySelector('.window-menu[open]'));
  const lessonKey=lesson?lesson.window+':'+lesson.stage:'';
  if(!lesson&&lastWindowLesson)prepare(state.step);lastWindowLesson=lessonKey;
  if(lesson){
   const titles:Record<string,string>={keyframes:'Image prompts',files:'Project files',timeline:'Sequence',prompts:'Prompts',viewer:'Viewer',properties:'Properties',takes:'Takes',stage:'3D viewport'};
   const title=titles[lesson.window];
   return lesson.stage==='menu'?{title:'Add a window to your workspace',text:beginner?`Tools live in dockable windows. Open Windows in the top bar, then add ${title}. You can move windows and resize their splits to make the workspace yours.`:`Open Windows in the top bar to add ${title} yourself. Your window layout is saved.`,target:'.window-menu > summary'}:{title:`Choose ${title}`,text:`Select ${title} in this list to add the window. The walkthrough will continue once you have added it.`,target:`.window-menu button[data-window="${lesson.window}"]`};
  }
  const tips:Record<string,Tip>={
   prompt:localStep===0?{title:'Describe your first scene',text:beginner?'Your shot prompt describes what the camera sees. We prepared a tiny copper robot watering a flower. Keep it or make it yours.':pro?'Edit the prepared shot prompt. Motion and audio are optional.':'Use the prepared scene or write your own. Motion and audio have separate prompt boxes.',target:'#shotPromptInput',next:'Next: generate'}:{title:'Bring it to life',text:beginner?'Press the highlighted Generate video button. No keyframes are required. We’ll continue when your video is ready.':'Press Generate video. The walkthrough continues when the video is ready.',target:'#gen'},
   'switch-image':{title:'Try the Image workflow',text:beginner?'Your first video is ready. Now let’s guide its next take with pictures. Open the workspace selector at the top and choose Image. Your video stays in this project.':'Choose Image in the workspace selector to create two guides for this scene. Your video and timeline are preserved.',target:'[aria-label="Workspace setup"]'},
   keyframes:localStep===0?{title:'Pictures can guide your video',text:beginner?'The Image workflow is where you workshop still pictures. The prepared prompt matches your scene. We’ll make two different images, then bring them back as keyframes.':'Review the prepared image prompt, then generate two guides for START and END.',target:'#kp',next:'Next: generate guides'}:{title:new Set(state.images).size?'Create a second guide':'Create your first guide',text:new Set(state.images).size?'One guide is saved. Press Generate image again for a different result. Both images will be available in Project files when you return to Video.':'Press Generate image. After it finishes, generate once more for a second guide. Images stay in this project across workflows.',target:'#kgo'},
   'return-video':{title:'Bring your images back to Video',text:'Both guides are saved in Project files. Choose Video in the workspace selector. Next, you’ll add them to the scene and place them at START and END.',target:'[aria-label="Workspace setup"]'},
   add:{title:'Bring images onto the timeline',text:beginner?'Your Image results are here in Project files. Drag two different image thumbnails onto this scene. Or select an image and press Add as keyframe. Next you’ll move the guides to the edges.':'Drag two different images from Project files onto the scene, or select each and use Add as keyframe. Next: START and END.',target:'.project-files',secondary:'#trk',diagram:'add'},
   position:{title:'Drag to START and END',text:beginner?'Drag one image keyframe all the way left until it becomes START. Drag the other all the way right until it becomes END. Interior keyframes can sit anywhere in between. Keyboard: focus a keyframe and press Home or End.':'Drag one keyframe to each timeline edge: left → START, right → END. Interior guides remain movable.',target:'#trk',diagram:'position'},
   regenerate:{title:'See your direction take effect',text:beginner?'START and END are attached. Press Generate video again to see how those images shape the next take.':'Press Generate video to make a new take with both guides.',target:'#gen'},
   image:localStep===0?{title:'Start with one image',text:beginner?'Describe a subject, setting and visual style. We prepared a matching robot-and-flower prompt. Keep it or make it yours.':'Edit the prepared image prompt.',target:'#kp',next:'Next: generate image'}:{title:'Generate your first image',text:'Press the highlighted Generate image button. We’ll continue when your picture is ready.',target:'#kgo'},
   'image-review':{title:'Make this image a video keyframe',text:beginner?'Your picture can become the START keyframe of a video. Press Turn into a video to bring it into the Video workflow. Then you’ll generate motion from it.':'Press Turn into a video to switch workflows with this image attached as START. Your original image stays saved.',target:'#animateImage'},
   'image-video':{title:'Animate your image',text:beginner?'Your image is attached as START. Press the highlighted Generate video button to animate it.':'Press Generate video to animate your starting image.',target:'#gen'},
   '3d':{title:'Explore the 3D preview',text:'This setup is a workspace preview. 3D generation is not connected yet. Image and Video can generate locally today.',target:'.stage-placeholder',next:'Explore other workflows'},
   'render-settings':{title:'Set the next render’s size and timing',text:beginner?'Width, height, frame count and frame rate describe the next generated take. They do not resize an existing video. Numbers can be typed or dragged.':'Set dimensions, frames and FPS for the next generation. Existing media stays unchanged.',target:'#videoAttributes',next:'Next: review takes'},
   'render-takes':{title:'Keep your original takes',text:'Takes holds previous generated results. Reuse a take here, or open it in Edit for trim, speed, reverse and resizing.',target:'#hist',next:'Explore other workflows'},
   'edit-settings':{title:'Edit a take without losing the original',text:beginner?'For a generated video, adjust trim, speed, reverse or resize in Video properties. Image edits in this page are still previews.':'Video edits support trim, speed, reverse and resize. Image editing is a preview.',target:'.video-properties, #selp, main',next:'Next: compare and apply'},
   'edit-review':{title:'Compare before you apply',text:'Compare the original, keep Undo available, and apply a finished edit back to its shot. Render edits is the real action; this guide does not run it for you.',target:'.video-edit-toolbar, #acts',next:'Explore other workflows'},
  };return tips[state.step]||tips.prompt;
 }
 function render(){
  workflowChoices();
  const state=options.get();popup.hidden=!state||!!state.dismissed||!!state.suspended;shade.style.display='none';rings.forEach(r=>r.hidden=true);if(popup.hidden){chooser?.close();interaction.sync();return}
  if(profile.experience)state!.experience=profile.experience;
  if(!state!.experience||!state!.entry){popup.hidden=true;selection();return}
  persist();if(!profile.experience){profile.experience=state!.experience;saveProfile()}
  if(!profile.workflows[state!.entry!]){profile.workflows[state!.entry!]='started';saveProfile()}
  if(lastStage!==state!.step){lastStage=state!.step;localStep=0;prepare(state!.step)}
  const done=state!.step==='done';
  if(done){profile.workflows[state!.entry!]='completed';if(state!.entry==='image')profile.workflows.video='completed';else if(['video','director'].includes(state!.entry!)&&new Set(state!.images).size>=2)profile.workflows.image='completed';saveProfile();targets=[]}
  const current=done?undefined:tip(state!);if(current)targets=[current.target,current.secondary].filter(Boolean) as string[];
  renderView(popup,createElement(TourPopover,{experience:state!.experience!,entry:state!.entry!,done,tip:current,onSkip:()=>end(!done),onFinish:()=>end(),onWorkflow:entry=>start(entry),onNext:()=>{
   if(['prompt','image','keyframes'].includes(state!.step)&&localStep===0){localStep=1;document.querySelector(state!.step==='prompt'?'#gen':'#kgo')?.scrollIntoView({block:'nearest'});render();return}
   state!.step=state!.step==='render-settings'?'render-takes':state!.step==='edit-settings'?'edit-review':'done';persist();render();
  }}));
  interaction.sync();
 }
 function clipped(selector:string){const element=selector.split(',').map(s=>document.querySelector<HTMLElement>(s.trim())).find(e=>e&&e.getBoundingClientRect().width&&e.getBoundingClientRect().height);if(!element)return null;let r=element.getBoundingClientRect();if(!r.width||!r.height)return null;let left=Math.max(4,r.left),top=Math.max(4,r.top),right=Math.min(innerWidth-4,r.right),bottom=Math.min(innerHeight-4,r.bottom);
  for(let p=element.parentElement;p;p=p.parentElement){const style=getComputedStyle(p);if(style.display==='none'||style.visibility==='hidden')return null;const b=p.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(style.overflowX)){left=Math.max(left,b.left);right=Math.min(right,b.right)}if(/auto|scroll|hidden|clip/.test(style.overflowY)){top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom)}}
  return right-left>12&&bottom-top>12?{left,top,right,bottom,width:right-left,height:bottom-top}:null;
 }
 let lastTick=0,lastTarget='',revealBudget=3,lastReveal=0;function position(now:number){if(disposed)return;requestAnimationFrame(position);if(now-lastTick<100)return;lastTick=now;interaction.sync();if(popup.hidden)return;
  const modal=!!document.querySelector('dialog[open]')||document.getElementById('ov')?.style.display==='flex'||!!document.querySelector<HTMLButtonElement>('#kgo')?.disabled;popup.style.visibility=modal?'hidden':'visible';if(modal){shade.style.display='none';rings.forEach(r=>r.hidden=true);return}
  if(lastTarget!==targets[0]){lastTarget=targets[0];revealBudget=3}const primary=targets[0]&&document.querySelector<HTMLElement>(targets[0]);const visible=targets[0]&&clipped(targets[0]);if(primary&&revealBudget>0&&now-lastReveal>400){const actual=primary.getBoundingClientRect();if(actual.width&&actual.height&&(!visible||primary.matches('button,input,textarea')&&visible.height<actual.height-4)){primary.scrollIntoView({block:'center',inline:'nearest'});lastReveal=now;revealBudget--}}
  const rects=targets.map(clipped).filter((r):r is NonNullable<typeof r>=>!!r);popup.style.width=Math.min(340,innerWidth-24)+'px';const width=popup.getBoundingClientRect().width,h=Math.min(popup.getBoundingClientRect().height,innerHeight-24);const r=rects[0];
  let x=(innerWidth-width)/2,y=(innerHeight-h)/2;if(r){const candidates=[[r.right+14,r.top],[r.left-width-14,r.top],[r.left,r.bottom+14],[r.left,r.top-h-14],[12,12],[innerWidth-width-12,innerHeight-h-12]];const fits=candidates.map(([x,y])=>[Math.max(12,Math.min(innerWidth-width-12,x)),Math.max(12,Math.min(innerHeight-h-12,y))]);const overlap=([x,y]:number[])=>rects.reduce((sum,b)=>sum+Math.max(0,Math.min(x+width,b.right)-Math.max(x,b.left))*Math.max(0,Math.min(y+h,b.bottom)-Math.max(y,b.top)),0);fits.sort((a,b)=>overlap(a)-overlap(b));[x,y]=fits[0]}
  popup.style.left=x+'px';popup.style.top=y+'px';shade.style.display='block';shade.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);shadePath.setAttribute('d',`M0 0H${innerWidth}V${innerHeight}H0Z`+rects.map(b=>`M${b.left-3} ${b.top-3}h${b.width+6}v${b.height+6}h-${b.width+6}Z`).join(''));
  rings.forEach((ring,i)=>{const b=rects[i];ring.hidden=!b;if(b)Object.assign(ring.style,{left:b.left-3+'px',top:b.top-3+'px',width:b.width+6+'px',height:b.height+6+'px'})});
 }
 document.addEventListener('osh-workspace-selected',((event:CustomEvent<{name:string;mode:string}>)=>{if(switching||chooser?.open)return;if(['Audio','Overlays'].includes(event.detail.name)){pause();render();return}const state=options.get();if(state&&!state.dismissed&&(!state.experience||!state.entry))return;const entry=workflowForSetup(event.detail.name,event.detail.mode);const bridge=workflowTourStep(state,entry);if(bridge&&state){state.step=bridge;persist();render();return}if(state?.entry===entry&&!state.dismissed&&!state.suspended)return;if(profile.experience)start(entry,false,false)}) as EventListener);
 const refreshWindows=()=>{if(!chooser?.open)render()};
 document.addEventListener('osh-window-layout-changed',refreshWindows);
 document.addEventListener('toggle',event=>{if((event.target as HTMLElement)?.matches('.window-menu'))refreshWindows()},true);
 addEventListener('pagehide',()=>{disposed=true;interaction.dispose();for(const [option,disabled] of restrictedOptions)option.disabled=disabled});
 let initial=options.get();if(initial?.step==='keyframes'&&options.current()!=='image')initial.step='switch-image';if(initial?.entry&&initial.entry!=='edit'&&!initial.shotId){const fresh=options.begin(initial.entry);fresh.experience=profile.experience;options.set(fresh);persist();initial=fresh}if(initial?.experience&&!profile.experience){profile.experience=initial.experience;saveProfile()}
 if(['Audio','Overlays'].includes(document.querySelector<HTMLSelectElement>('[aria-label="Workspace setup"]')?.value||'')){if(initial&&!initial.dismissed)initial.suspended=true;render()}else if(initial&&!initial.dismissed&&!initial.suspended){if(initial.entry)profile.workflows[initial.entry]??='started';saveProfile();render()}else if(firstVisit(profile,options.current())||profile.workflows[options.current()]==='started'&&suspended[options.current()]&&!suspended[options.current()]!.dismissed)start(options.current(),false,false);else render();
 requestAnimationFrame(position);return {render,visit:(entry:Workflow)=>start(entry)};
}
