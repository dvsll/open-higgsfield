import './onboarding-tour.css';
import './onboarding-focus.css';
import './onboarding-guidance.css';
import { SC } from './scene';
import { canResumeWorkflow, firstVisit, profileKey, readProfile, windowLesson, workflowForSetup, type Experience, type Workflow } from './onboarding-progress';
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
  const heading=document.createElement('h2');heading.textContent=state.experience?'What would you like to create?':'How familiar are you with ComfyUI?';const intro=document.createElement('p');intro.textContent=state.experience?'Choose a starting workspace. Other workflows have their own walkthroughs.':'Choose once. We’ll use this level across your workflow walkthroughs.';
  const grid=document.createElement('div');grid.className='tour-choice-grid';grid.dataset.kind=state.experience?'workflow':'experience';
  const entries=state.experience?[['image','Image','Workshop one image, then bring it into motion.'],['video','Video','Prompt a video, then direct it with keyframes.'],['3d','3D','Explore the preview; generation is not connected yet.'],['audio','Audio · planned','A dedicated sound workspace is planned.']]:[['beginner','ComfyUI beginner','Explain the tools and guide me step by step.'],['seasoned','Seasoned','Show the Studio workflow with a little guidance.'],['professional','Professional','Keep it brief. Show the essential controls.']];
  for(const [index,[key,label,description]] of entries.entries()){
   const button=document.createElement('button');button.type='button';if(!state.experience){const icons=document.createElement('span');icons.className='tour-level-icons';icons.setAttribute('aria-hidden','true');for(let n=0;n<=index;n++){const icon=document.createElementNS(shade.namespaceURI,'svg');icon.setAttribute('viewBox','0 0 16 16');const path=document.createElementNS(shade.namespaceURI,'path');path.setAttribute('d','M4 2 13 8 4 14Z');icon.append(path);icons.append(icon)}button.append(icons)}
   const name=document.createElement('strong');name.textContent=label;const text=document.createElement('span');text.textContent=description;button.append(name,text);button.disabled=key==='audio';button.onclick=()=>{if(!state.experience){state.experience=key as Experience;profile.experience=state.experience;saveProfile();persist();chooser?.close();selection()}else{profile.experience=state.experience;saveProfile();chooser?.close();start(key as Workflow,true)}};grid.append(button);
  }
  const skip=document.createElement('button');skip.className='tour-skip';skip.textContent='Skip walkthrough';skip.onclick=()=>end(true);chooser.append(heading,intro);
  if(state.experience){const back=document.createElement('button');back.className='tour-back';back.textContent='← Experience level';back.onclick=()=>{state.experience=undefined;persist();chooser?.close();selection()};chooser.append(back)}
  chooser.append(grid,skip);chooser.addEventListener('cancel',e=>{e.preventDefault();end(true)});const currentDialog=chooser;chooser.addEventListener('close',()=>{currentDialog.remove();if(chooser===currentDialog)chooser=null});document.body.append(chooser);chooser.showModal();
 }
 function prepare(step:string){
  if(['add','position'].includes(step))dispatchEvent(new Event('osh-tour-keyframe-view'));
  requestAnimationFrame(()=>{const selector=step==='add'?'#res':step==='position'?'#trk':step==='keyframes'?'#kgo':null;const element=selector&&document.querySelector(selector);element?.scrollIntoView({block:'nearest'})});
 }
 function tip(state:TourState):Tip{
  const beginner=state.experience==='beginner',pro=state.experience==='professional';
  const visible=new Set(Array.from(document.querySelectorAll<HTMLElement>('.window-board .studio-window:not([hidden])')).map(panel=>panel.dataset.window!));
  const lesson=windowLesson(state.step,visible,!!document.querySelector('.window-menu[open]'));
  const lessonKey=lesson?lesson.window+':'+lesson.stage:'';
  if(!lesson&&lastWindowLesson)prepare(state.step);lastWindowLesson=lessonKey;
  if(lesson){
   const titles:Record<string,string>={keyframes:'Image & keyframes',timeline:'Sequence',prompts:'Prompts',viewer:'Viewer',properties:'Size & timing',takes:'Takes',stage:'3D viewport'};
   const title=titles[lesson.window];
   return lesson.stage==='menu'?{title:'Add a window to your workspace',text:beginner?`Tools live in dockable windows. Open Windows in the top bar, then add ${title}. You can move windows and resize their splits to make the workspace yours.`:`Open Windows in the top bar to add ${title} yourself. Your window layout is saved.`,target:'.window-menu > summary'}:{title:`Choose ${title}`,text:`Select ${title} in this list to add the window. The walkthrough will continue once you have added it.`,target:`.window-menu button[data-window="${lesson.window}"]`};
  }
  const tips:Record<string,Tip>={
   prompt:localStep===0?{title:'Describe your first scene',text:beginner?'Your shot prompt describes what the camera sees. We prepared a tiny copper robot watering a flower. Keep it or make it yours.':pro?'Edit the prepared shot prompt. Motion and audio are optional.':'Use the prepared scene or write your own. Motion and audio have separate prompt boxes.',target:'#shotPromptInput',next:'Next: generate'}:{title:'Bring it to life',text:beginner?'Press the highlighted Generate video button. No keyframes are required. We’ll continue when your video is ready.':'Press Generate video. The walkthrough continues when the video is ready.',target:'#gen'},
   keyframes:{title:'Create guide images',text:beginner?'A keyframe is an image that guides a moment in your video. The matching image prompt is ready. Use the image generator below; you’ll need two different results.':pro?'Generate at least two guide images from the prepared prompt.':'Use the image generator to create two matching guides for START and END.',target:'#kgo'},
   add:{title:'Drag images into your scene',text:beginner?'Drag each result from the image generator onto the scene in Sequence. Place them anywhere to start; next you’ll move them to the edges. You can also click results to add them.':'Drag two different results onto the scene. Click-to-add also works. Next: move the guides to START and END.',target:'#res',secondary:'#trk',diagram:'add'},
   position:{title:'Drag to START and END',text:beginner?'Drag one image keyframe all the way left until it becomes START. Drag the other all the way right until it becomes END. Interior keyframes can sit anywhere in between. Keyboard: focus a keyframe and press Home or End.':'Drag one keyframe to each timeline edge: left → START, right → END. Interior guides remain movable.',target:'#trk',diagram:'position'},
   regenerate:{title:'See your direction take effect',text:beginner?'START and END are attached. Press Generate video again to see how those images shape the next take.':'Press Generate video to make a new take with both guides.',target:'#gen'},
   image:localStep===0?{title:'Start with one image',text:beginner?'Describe a subject, setting and visual style. We prepared a matching robot-and-flower prompt. Keep it or make it yours.':'Edit the prepared image prompt.',target:'#kp',next:'Next: generate image'}:{title:'Generate your first image',text:'Press the highlighted Generate image button. We’ll continue when your picture is ready.',target:'#kgo'},
   'image-review':{title:'Your image is ready',text:'Keep workshopping it, or press Turn into a video below the image to use it as the starting frame.',target:'#animateImage'},
   'image-video':{title:'Animate your image',text:beginner?'Your image is attached as START. Add a motion prompt, then press the highlighted Generate video button.':'Add motion, then press Generate video to animate your starting image.',target:'#gen'},
   '3d':{title:'Explore the 3D preview',text:'This setup is a workspace preview. 3D generation is not connected yet. Image and Video can generate locally today.',target:'.stage-placeholder',next:'Explore other workflows'},
   'render-settings':{title:'Set the next render’s size and timing',text:beginner?'Width, height, frame count and frame rate describe the next generated take. They do not resize an existing video. Numbers can be typed or dragged.':'Set dimensions, frames and FPS for the next generation. Existing media stays unchanged.',target:'#videoAttributes',next:'Next: review takes'},
   'render-takes':{title:'Keep your original takes',text:'Takes holds previous generated results. Reuse a take here, or open it in Edit for trim, speed, reverse and resizing.',target:'#hist',next:'Explore other workflows'},
   'edit-settings':{title:'Edit a take without losing the original',text:beginner?'For a generated video, adjust trim, speed, reverse or resize in Video properties. Image edits in this page are still previews.':'Video edits support trim, speed, reverse and resize. Image editing is a preview.',target:'.video-properties, #selp, main',next:'Next: compare and apply'},
   'edit-review':{title:'Compare before you apply',text:'Compare the original, keep Undo available, and apply a finished edit back to its shot. Render edits is the real action; this guide does not run it for you.',target:'.video-edit-toolbar, #acts',next:'Explore other workflows'},
  };return tips[state.step]||tips.prompt;
 }
 function diagram(kind:'add'|'position'){
  const figure=document.createElement('figure');figure.className='tour-drag-demo';figure.dataset.kind=kind;figure.setAttribute('role','img');figure.setAttribute('aria-label',kind==='add'?'Drag an image result onto the timeline':'Drag the left keyframe to START and the right keyframe to END');
  const source=document.createElement('span');source.className='demo-source';source.textContent=kind==='add'?'IMAGE':'◆';const track=document.createElement('div');track.className='demo-track';for(const text of ['START','END']){const end=document.createElement('span');end.textContent=text;track.append(end)}const cursor=document.createElement('span');cursor.className='demo-cursor';cursor.textContent='◆';figure.append(source,track,cursor);return figure;
 }
 function teaser(state:TourState){
  const title=document.createElement('h2');title.textContent='More ways to create';const text=document.createElement('p');text.textContent=`Your ${names[state.entry!]} walkthrough is complete. Explore another workflow with the same ${state.experience} guidance.`;popup.append(title,text);
  const grid=document.createElement('div');grid.className='tour-workflow-teasers';const descriptions:Record<Workflow,string>={image:'Workshop one image.',video:'Bring a scene into motion.',director:'Direct with movable keyframes.',rendering:'Inspect size, timing and takes.',edit:'Trim, retime and resize a take.','3d':'Preview · generation not connected.'};
  for(const entry of ['image','video','director','edit','rendering','3d'] as Workflow[]){if(entry===state.entry)continue;const button=document.createElement('button');button.className='tour-workflow-card';const name=document.createElement('strong');name.textContent=names[entry];const desc=document.createElement('span');desc.textContent=descriptions[entry];button.append(name,desc);button.onclick=()=>start(entry);grid.append(button)}
  const audio=document.createElement('p');audio.className='tour-planned';audio.textContent='Coming later: a dedicated Audio workflow.';const finish=document.createElement('button');finish.className='tour-secondary';finish.textContent='Keep creating';finish.onclick=()=>end();popup.append(grid,audio,finish);
 }
 function render(){
  const state=options.get();popup.hidden=!state||!!state.dismissed||!!state.suspended;shade.style.display='none';rings.forEach(r=>r.hidden=true);if(popup.hidden){chooser?.close();return}
  if(profile.experience)state!.experience=profile.experience;
  if(!state!.experience||!state!.entry){popup.hidden=true;selection();return}
  persist();if(!profile.experience){profile.experience=state!.experience;saveProfile()}
  if(!profile.workflows[state!.entry!]){profile.workflows[state!.entry!]='started';saveProfile()}
  if(lastStage!==state!.step){lastStage=state!.step;localStep=0;prepare(state!.step)}
  popup.replaceChildren();const top=document.createElement('div');top.className='tour-popover-top';const progress=document.createElement('span');progress.textContent=`${state!.experience} · ${names[state!.entry!]} walkthrough`;const skip=document.createElement('button');skip.textContent=state!.step==='done'?'Close':'Skip';skip.onclick=()=>end(state!.step!=='done');top.append(progress,skip);popup.append(top);
  if(state!.step==='done'){profile.workflows[state!.entry!]='completed';saveProfile();targets=[];teaser(state!);return}
  const current=tip(state!);targets=[current.target,current.secondary].filter(Boolean) as string[];const title=document.createElement('h2');title.textContent=current.title;const body=document.createElement('p');body.textContent=current.text;popup.append(title,body);if(current.diagram)popup.append(diagram(current.diagram));
  if(current.next){const action=document.createElement('button');action.className='tour-primary';action.textContent=current.next;action.onclick=()=>{if(['prompt','image'].includes(state!.step)&&localStep===0){localStep=1;const target=state!.step==='image'?'#kgo':'#gen';document.querySelector(target)?.scrollIntoView({block:'nearest'});render();return}state!.step=state!.step==='render-settings'?'render-takes':state!.step==='edit-settings'?'edit-review':'done';persist();render()};popup.append(action)}else{const hint=document.createElement('p');hint.className='tour-wait-hint';hint.textContent=current.diagram?'Continue by dragging in the highlighted workspace.':'Use the highlighted control to continue.';popup.append(hint)}
 }
 function clipped(selector:string){const element=selector.split(',').map(s=>document.querySelector<HTMLElement>(s.trim())).find(e=>e&&e.getBoundingClientRect().width&&e.getBoundingClientRect().height);if(!element)return null;let r=element.getBoundingClientRect();if(!r.width||!r.height)return null;let left=Math.max(4,r.left),top=Math.max(4,r.top),right=Math.min(innerWidth-4,r.right),bottom=Math.min(innerHeight-4,r.bottom);
  for(let p=element.parentElement;p;p=p.parentElement){const style=getComputedStyle(p);if(style.display==='none'||style.visibility==='hidden')return null;const b=p.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(style.overflowX)){left=Math.max(left,b.left);right=Math.min(right,b.right)}if(/auto|scroll|hidden|clip/.test(style.overflowY)){top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom)}}
  return right-left>12&&bottom-top>12?{left,top,right,bottom,width:right-left,height:bottom-top}:null;
 }
 let lastTick=0,lastTarget='',revealBudget=3,lastReveal=0;function position(now:number){if(disposed)return;requestAnimationFrame(position);if(now-lastTick<100)return;lastTick=now;if(popup.hidden)return;
  const modal=!!document.querySelector('dialog[open]')||document.getElementById('ov')?.style.display==='flex'||!!document.querySelector<HTMLButtonElement>('#kgo')?.disabled;popup.style.visibility=modal?'hidden':'visible';if(modal){shade.style.display='none';rings.forEach(r=>r.hidden=true);return}
  if(lastTarget!==targets[0]){lastTarget=targets[0];revealBudget=3}const primary=targets[0]&&document.querySelector<HTMLElement>(targets[0]);const visible=targets[0]&&clipped(targets[0]);if(primary&&revealBudget>0&&now-lastReveal>400){const actual=primary.getBoundingClientRect();if(actual.width&&actual.height&&(!visible||primary.matches('button,input,textarea')&&visible.height<actual.height-4)){primary.scrollIntoView({block:'center',inline:'nearest'});lastReveal=now;revealBudget--}}
  const rects=targets.map(clipped).filter((r):r is NonNullable<typeof r>=>!!r);popup.style.width=Math.min(340,innerWidth-24)+'px';const width=popup.getBoundingClientRect().width,h=Math.min(popup.getBoundingClientRect().height,innerHeight-24);const r=rects[0];
  let x=(innerWidth-width)/2,y=(innerHeight-h)/2;if(r){const candidates=[[r.right+14,r.top],[r.left-width-14,r.top],[r.left,r.bottom+14],[r.left,r.top-h-14],[12,12],[innerWidth-width-12,innerHeight-h-12]];const fits=candidates.map(([x,y])=>[Math.max(12,Math.min(innerWidth-width-12,x)),Math.max(12,Math.min(innerHeight-h-12,y))]);const overlap=([x,y]:number[])=>rects.reduce((sum,b)=>sum+Math.max(0,Math.min(x+width,b.right)-Math.max(x,b.left))*Math.max(0,Math.min(y+h,b.bottom)-Math.max(y,b.top)),0);fits.sort((a,b)=>overlap(a)-overlap(b));[x,y]=fits[0]}
  popup.style.left=x+'px';popup.style.top=y+'px';shade.style.display='block';shade.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);shadePath.setAttribute('d',`M0 0H${innerWidth}V${innerHeight}H0Z`+rects.map(b=>`M${b.left-3} ${b.top-3}h${b.width+6}v${b.height+6}h-${b.width+6}Z`).join(''));
  rings.forEach((ring,i)=>{const b=rects[i];ring.hidden=!b;if(b)Object.assign(ring.style,{left:b.left-3+'px',top:b.top-3+'px',width:b.width+6+'px',height:b.height+6+'px'})});
 }
 document.addEventListener('osh-workspace-selected',((event:CustomEvent<{name:string;mode:string}>)=>{if(switching||chooser?.open)return;const state=options.get();if(state&&!state.dismissed&&(!state.experience||!state.entry))return;const entry=workflowForSetup(event.detail.name,event.detail.mode);if(state?.entry===entry&&!state.dismissed&&!state.suspended)return;if(profile.experience)start(entry,false,false)}) as EventListener);
 const refreshWindows=()=>{if(!chooser?.open)render()};
 document.addEventListener('osh-window-layout-changed',refreshWindows);
 document.addEventListener('toggle',event=>{if((event.target as HTMLElement)?.matches('.window-menu'))refreshWindows()},true);
 addEventListener('pagehide',()=>{disposed=true});
 let initial=options.get();if(initial?.entry&&initial.entry!=='edit'&&!initial.shotId){const fresh=options.begin(initial.entry);fresh.experience=profile.experience;options.set(fresh);persist();initial=fresh}if(initial?.experience&&!profile.experience){profile.experience=initial.experience;saveProfile()}
 if(initial&&!initial.dismissed&&!initial.suspended){if(initial.entry)profile.workflows[initial.entry]??='started';saveProfile();render()}else if(firstVisit(profile,options.current())||profile.workflows[options.current()]==='started'&&suspended[options.current()]&&!suspended[options.current()]!.dismissed)start(options.current(),false,false);else render();
 requestAnimationFrame(position);return {render,visit:(entry:Workflow)=>start(entry)};
}
