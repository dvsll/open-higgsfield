import {tourPlacement} from './tour-placement';
import {createElement} from 'react';
import {renderView,unmountView} from './react/render';
import {TourChoice,TourPopover} from './react/onboarding';
import './onboarding-tour.css';
import './onboarding-focus.css';
import './onboarding-guidance.css';
import { SC } from './scene';
import {lockTourInteraction} from './onboarding-interaction';
import { audioTourMilestone, geometryTourStep, workflowTourStep, canResumeWorkflow, firstVisit, profileKey, readProfile, windowLesson, workflowForSetup, type Experience, type Workflow } from './onboarding-progress';
export type TourState = { audioUrl?:string; speechUrl?:string; audioEnd?:number; speechLayerId?:string; cameraPreviewed?:boolean; step:string; nextWorkflow?:Workflow; shotId:string; images:string[]; dismissed?:boolean; suspended?:boolean; experience?:Experience; entry?:Workflow; firstVideo?:string|null; afterReview?:'switch-image'|'add-scenes'; guidePrompts?:string[]; videoReviewed?:boolean; timelineIntroduced?:boolean; suppressAutomatic?:boolean };
type Options = { onKeepCreating?:()=>void; get:()=>TourState|null; set:(state:TourState)=>void; save:()=>void; choose:(entry:Workflow)=>void; begin:(entry:Workflow)=>TourState; current:()=>Workflow };
type Tip = { title:string; text:string; target?:string; secondary?:string; next?:string; diagram?:'add'|'position'|'audio'|'audio-position' };
const names:Record<Workflow,string>={audio:'Audio',video:'Video',image:'Image',director:'Director',rendering:'Rendering',edit:'Edit', '3d':'3D'};
export function mountOnboardingTour(options:Options) {
 let raw:unknown;try{raw=JSON.parse(localStorage.getItem(profileKey)||'null')}catch{}
 const profile=readProfile(raw);
 const saveProfile=()=>{try{localStorage.setItem(profileKey,JSON.stringify(profile))}catch{}};
 const suspended:Partial<Record<Workflow,TourState>>=SC.get('osh-workflow-tours')||{};
 const persist=()=>{const state=options.get();options.save();if(state?.entry){suspended[state.entry]=JSON.parse(JSON.stringify(state));SC.set('osh-workflow-tours',suspended)}};
 const popup=document.createElement('section');popup.className='tour-popover';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Studio walkthrough');popup.setAttribute('aria-live','polite');popup.hidden=true;
 const shade=document.createElementNS('http://www.w3.org/2000/svg','svg');shade.classList.add('tour-shade');shade.setAttribute('aria-hidden','true');shade.style.display='none';
 const shadePath=document.createElementNS(shade.namespaceURI,'path');shadePath.setAttribute('fill-rule','evenodd');shade.append(shadePath);
 const rings=[0,1,2].map(()=>{const ring=document.createElement('div');ring.className='tour-target';ring.hidden=true;return ring});document.body.append(shade,...rings,popup);
 let guideCount=-1;
 let chooser:HTMLDialogElement|null=null,localStep=0,lastStage='',lastWindowLesson='',targets:string[]=[],switching=false,disposed=false;
 const restrictedOptions=new Map<HTMLOptionElement,boolean>();
 function workflowChoices(){
  for(const [option,disabled] of restrictedOptions)option.disabled=disabled;restrictedOptions.clear();
  const state=options.get();if(!state||state.dismissed||state.suspended)return;
  const expected=state.step==='switch-image'?'Image':['return-video','image-review'].includes(state.step)?'Video':state.step==='workflow-switch'&&state.nextWorkflow?names[state.nextWorkflow]:null;
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
  if(['audio-add','audio-speech-add'].includes(options.get()?.step||'')){const files=document.querySelector<HTMLElement>('.project-files');if(files)allowed.push(files)}
  if(options.get()?.step==='add'){const files=document.querySelector<HTMLElement>('.project-files');if(files)allowed.push(files)}return [...allowed,popup];
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
   focus=activeRings.length?activeRings:[popup];
  }
  for(const element of new Set(focus)){
   element.getAnimations().filter(a=>a.id==='tour-attention').forEach(a=>a.cancel());
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   element.animate(reduced?[
    {boxShadow:'0 0 0 3px #f3d58a',outline:'2px solid #f3d58a'},
    {boxShadow:'0 0 0 0 transparent',outline:'2px solid transparent'}
   ]:[
    {boxShadow:'0 0 0 0 #e8c36f00',outline:'2px solid transparent',outlineOffset:'0px'},
    {boxShadow:'0 0 0 5px #e8c36f55',outline:'2px solid #f3d58a',outlineOffset:'3px',offset:.5},
    {boxShadow:'0 0 0 0 #e8c36f00',outline:'2px solid transparent',outlineOffset:'0px'}
   ],{duration:reduced?700:650,iterations:reduced?1:2,easing:'ease-in-out',id:'tour-attention'});
  }
 }
 document.addEventListener('pointerdown',nudgeFocus,true);
 addEventListener('pagehide',()=>document.removeEventListener('pointerdown',nudgeFocus,true));
 function end(skipped=false){const state=options.get();if(state){state.dismissed=true;const entry=state.entry||options.current();profile.workflows[entry]=skipped?'skipped':'completed';saveProfile();persist()}chooser?.close();render()}
 function pause(){const state=options.get();if(state?.entry&&!state.dismissed){state.suspended=true;persist()}}
 function start(entry:Workflow,force=false,changeSetup=true){
  if(switching||!force&&options.get()?.suppressAutomatic)return;switching=true;
  try{pause();const previous=suspended[entry];const shouldStart=force||firstVisit(profile,entry)||profile.workflows[entry]==='started'&&previous&&!previous.dismissed;
   if(shouldStart){const state=!force&&canResumeWorkflow(previous,entry)?{...previous!,suspended:false}:options.begin(entry);state.entry=entry;state.experience=profile.experience;state.dismissed=false;state.suspended=false;options.set(state);profile.workflows[entry]='started';saveProfile();persist();lastStage=''}
   if(changeSetup)options.choose(entry);
  }finally{switching=false;render()}
 }
 function selection(){
  if(chooser?.open)return;const state=options.get();if(!state)return;
  chooser=document.createElement('dialog');chooser.className='tour-choice';chooser.setAttribute('aria-label','Choose your Studio workflow');
  const currentDialog=chooser;
  renderView(chooser,createElement(TourChoice,{onChoose:key=>{
   state.experience='seasoned';profile.experience='seasoned';saveProfile();chooser?.close();start(key,true);
  },onSkip:()=>end(true)}));
  chooser.addEventListener('cancel',e=>{e.preventDefault();end(true)});
  chooser.addEventListener('close',()=>{unmountView(currentDialog);currentDialog.remove();if(chooser===currentDialog)chooser=null});document.body.append(chooser);chooser.showModal();
 }
 function prepare(step:string){
  if(step==='audio-prompt')dispatchEvent(new Event('osh-tour-audio-prompt'));
  if(['audio-preview','audio-mix-preview'].includes(step))dispatchEvent(new Event('osh-tour-audio-rewind'));
  if(step==='audio-speech')dispatchEvent(new Event('osh-tour-speech-prompt'));
  if(step==='3d-motion')dispatchEvent(new Event('osh-tour-camera-prompt'));
  if(step==='3d')dispatchEvent(new Event('osh-tour-3d-prompt'));
  if(step==='3d-record')dispatchEvent(new Event('osh-camera-prompt-reveal'));
  if(step==='add')dispatchEvent(new Event('osh-tour-show-guides'));
  if(['prompt','add','position'].includes(step))dispatchEvent(new Event('osh-tour-keyframe-view'));
  requestAnimationFrame(()=>{const selector=step==='add'?'.project-files':step==='position'?'#trk':step==='keyframes'?'#kp':null;const element=selector&&document.querySelector(selector);element?.scrollIntoView({block:'nearest'})});
 }
 function tip(state:TourState):Tip{
  if(['workflow-switch','switch-image','return-video','image-review'].includes(state.step)){const name=names[state.step==='switch-image'?'image':['return-video','image-review'].includes(state.step)?'video':state.nextWorkflow||'video'],open=!!document.getElementById('workspacePickerMenu');return {title:`Switch to ${name}`,text:open?`Choose ${name} in the highlighted row to continue.`:`Open the workspace selector at the top, then choose ${name}. Your media stays in this project.`,target:open?`#workspacePickerMenu [data-workspace-choice="${name}"]`:'[aria-label="Workspace setup"]'}}
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
   'close-first-video':{title:'Make room for the sequence',text:'This window holds just your first video. Close Video timeline with its X. Your video stays in the project.',target:'[data-window="tour-video"] .window-close'},
   'add-timeline':{title:'Add the full timeline',text:document.querySelector('.window-menu[open]')?'Choose Sequence. It will replace Video timeline in the same space.':'Open Windows, then choose Sequence to put the full timeline in that space.',target:document.querySelector('.window-menu[open]')?'.window-menu button[data-window="timeline"]':'.window-menu > summary'},
   'timeline-intro':{title:'From one video to a sequence',text:'Create images to guide how your video starts and ends, learn to join videos, or keep creating on your own.',target:'[data-window="timeline"] .window-body'},
   'play-video':{title:'Play your video',text:'Your video is ready. Press Play in the timeline viewer to watch it.',target:'#play'},
   'switch-image':{title:'Try the Image workflow',text:document.getElementById('workspacePickerMenu')?'Choose Image in the highlighted row. Your video stays in this project.':beginner?'Your first video is ready. Now let’s guide its next take with pictures. Open the workspace selector at the top and choose Image. Your video stays in this project.':'Choose Image in the workspace selector to create two guides for this scene. Your video and timeline are preserved.',target:document.getElementById('workspacePickerMenu')?'#workspacePickerMenu [data-workspace-choice="Image"]':'[aria-label="Workspace setup"]'},
   keyframes:localStep===0?{title:state.images.length?'Describe the END frame':'Describe the START frame',text:state.images.length?'Change the prompt to describe how this scene ends. Keep the subject and setting, and change its pose or action.':'Describe how the scene begins. Generate this START image first; next you’ll write a different prompt for END.',target:'#kp',next:state.images.length?'Next: generate END':'Next: generate START'}:{title:state.images.length?'Generate the END frame':'Generate the START frame',text:state.images.length?'Generate your second image from the new END prompt.':'Generate the opening image. Then we’ll guide you back to the prompt for the ending image.',target:'#kgo'},
   'return-video':{title:'Bring your images back to Video',text:'Both guides are saved in Project files. Choose Video in the workspace selector. Next, you’ll add them to the scene and place them at START and END.',target:'[aria-label="Workspace setup"]'},
   add:state.entry==='image'?{title:'Drag your image onto the scene',text:'Drag the highlighted image from Project files onto the highlighted scene. Then place it at START.',target:'[data-tour-guide="0"]',secondary:'#trk',diagram:'add'}:{title:'Bring images onto the timeline',text:beginner?'Your Image results are here in Project files. Drag two different image thumbnails onto this scene. Or select an image and press Add as keyframe. Next you’ll move the guides to the edges.':'Drag two different images from Project files onto the scene, or select each and use Add as keyframe. Next: START and END.',target:'[data-tour-guide="0"]',secondary:'[data-tour-guide="1"], #trk',diagram:'add'},
   position:state.entry==='image'?{title:'Place your image at START',text:'Drag the image keyframe to the left edge until it reads START. Keyboard: focus the keyframe and press Home.',target:'#trk',diagram:'position'}:{title:'Drag to START and END',text:beginner?'Drag one image keyframe all the way left until it becomes START. Drag the other all the way right until it becomes END. Interior keyframes can sit anywhere in between. Keyboard: focus a keyframe and press Home or End.':'Drag one keyframe to each timeline edge: left → START, right → END. Interior guides remain movable.',target:'#trk',diagram:'position'},
   regenerate:{title:'See your direction take effect',text:beginner?'START and END are attached. Press Generate video again to see how those images shape the next take.':'Press Generate video to make a new take with both guides.',target:'#gen'},
   image:localStep===0?{title:'Start with one image',text:beginner?'Describe a subject, setting and visual style. We prepared a matching robot-and-flower prompt. Keep it or make it yours.':'Edit the prepared image prompt.',target:'#kp',next:'Next: generate image'}:{title:'Generate your first image',text:'Press the highlighted Generate image button. We’ll continue when your picture is ready.',target:'#kgo'},
   'image-review':{title:'Make this image a video keyframe',text:beginner?'Your picture can become the START keyframe of a video. Press Turn into a video to bring it into the Video workflow. Then you’ll generate motion from it.':'Press Turn into a video to switch workflows with this image attached as START. Your original image stays saved.',target:'#animateImage'},
   'image-video':{title:'Animate your image',text:beginner?'Your image is attached as START. Press the highlighted Generate video button to animate it.':'Press Generate video to animate your starting image.',target:'#gen'},
   'audio-prompt':{title:'Describe a sound',text:'We prepared a short bell chime. Keep it or describe a sound, ambience or music. Spoken words belong in Text / subtitles to speech.',target:'#audioComposerPrompt',next:'Next: generate sound'},
   'audio-generate':{title:'Generate your sound',text:'Press Generate audio. We’ll continue when the sound is saved; it may take a moment to load the local model.',target:'#audioComposerGenerate'},
   'audio-file':{title:'Your sound is saved',text:'The highlighted file is your new sound. Project files keeps the original; next you’ll place a clip on the timeline.',target:`.project-file[data-file-url="${state.audioUrl}"]`,next:'Next: place sound'},
   'audio-add':{title:'Place your sound in time',text:'Drag your new sound from Project files onto the highlighted timeline. Drop near 0s to start immediately; farther right adds silence before it.',target:`.project-file[data-file-url="${state.audioUrl}"]`,secondary:'.audio-timeline-content',diagram:'audio'},
   'audio-preview':{title:'Preview your audio',text:'Press Play to hear your timeline. We’ll continue after it finishes.',target:'#audioTimelinePlay'},
   'audio-choice':{title:'Your first sound is ready',text:'Add a spoken line and learn to arrange two clips, or keep creating audio at your own pace.',target:'.audio-timeline'},
   'audio-speech':{title:'Give your project a voice',text:'We prepared a short line. Keep it or write your own. Choose a voice above; subtitle import and speaking speed are in Advanced.',target:'#speechText',next:'Next: generate speech'},
   'audio-speech-generate':{title:'Generate the voice',text:'Press Generate speech. The result will be saved in Project files alongside your sound.',target:'#speechGenerate'},
   'audio-speech-file':{title:'Your voice is saved',text:'This is your new speech file. Next, add it to the same audio timeline.',target:`.project-file[data-file-url="${state.speechUrl}"]`,next:'Next: place voice'},
   'audio-speech-add':{title:'Add the voice to your mix',text:'Drag the speech file from Project files onto the timeline. Clips can share a row when they don’t overlap.',target:`.project-file[data-file-url="${state.speechUrl}"]`,secondary:'.audio-timeline-content',diagram:'audio'},
   'audio-position':{title:'Make one clip follow another',text:'Drag the speech clip horizontally so it starts after the bell ends. You can also move it between rows; overlapping clips play together.',target:'.audio-timeline-content',diagram:'audio-position'},
   'audio-mix-preview':{title:'Preview your mix',text:'Press Play to hear the sound followed by your voice. Your originals stay in Project files; clips can be moved or removed.',target:'#audioTimelinePlay'},
   '3d':localStep===0?{title:'Describe your 3D scene',text:'Describe a subject and its appearance, just like a video prompt. We prepared a copper robot holding a watering can. Keep it or make it yours; you can also attach an image.',target:'#geometryPrompt',next:'Next: generate object'}:{title:'Generate your object',text:'Press Generate object (or Replace object). We’ll continue when the mesh is ready.',target:'#geometryGenerate'},
   '3d-camera':{title:'Find the scene camera',text:'Drag empty space to orbit until the camera is in view. Follow the camera indicator, then click the camera to edit its movement.',target:'.geometry-viewer'},
   '3d-motion':{title:'Describe the camera move',text:'We prepared "Pan right slowly". Keep it or describe another move.',target:'#cameraMovementPrompt',next:'Next: generate camera motion'},
   '3d-motion-generate':{title:'Generate camera motion',text:'Press Generate camera motion. Local AI will turn your words into a camera path. Play only previews the prepared motion.',target:'#generateCameraMotion'},
   '3d-preview':{title:'Preview your video',text:'Press Play to preview your camera move. We’ll continue when the preview finishes.',target:'#sceneCameraPlay'},
   '3d-record':{title:'Record your blockout',text:'A blockout is a rough 3D guide for your shot. Press Create reference video to record the camera move. We’ll continue when it is saved.',target:'.scene-playback'},
   '3d-guide':{title:'Your blockout is ready',text:'Use its shapes and camera move to guide a generated video, or keep working on your 3D scene.',target:'.scene-playback'},
   '3d-video':{title:'Give your blockout its final look',text:'Describe how the finished shot should look, then press Generate video. The blockout guides its shapes and camera move; the model adds the appearance.',target:'#shotPromptInput',secondary:'#gen'},
   'add-scenes':{title:'Build a sequence when you’re ready',text:'You’ve been working inside one scene. Add another scene to arrange multiple shots in a sequence, or keep editing this one.',target:'#growFilm',next:'Keep one scene'},
   'render-settings':{title:'Set the next render’s size and timing',text:beginner?'Width, height, frame count and frame rate describe the next generated take. They do not resize an existing video. Numbers can be typed or dragged.':'Set dimensions, frames and FPS for the next generation. Existing media stays unchanged.',target:'#videoAttributes',next:'Next: review takes'},
   'render-takes':{title:'Review your generated media',text:'Project files keeps your generated media. Select a file to preview it, or open it in Edit for trim, speed, reverse and resizing.',target:'.project-files',next:'Explore other workflows'},
   'edit-settings':{title:'Edit your selected media',text:beginner?'Edit has its own viewer, controls and versions. For videos, adjust trim, speed, reverse or resize. For images, brush or draw a box, then describe the change.':'Use video properties or a masked image edit. The original stays available for comparison.',target:'.video-properties, #studioEditControls',next:'Next: compare and apply'},
   'edit-review':{title:'Compare before you apply',text:'Compare the original and edited take, then apply the finished edit back to its scene. Generation and rendering only run when you press their buttons.',target:'.video-edit-toolbar, #studioEditViewer',next:'Explore other workflows'},
  };return tips[state.step]||tips.prompt;
 }
 function render(){
  const currentState=options.get();
  dispatchEvent(new CustomEvent('osh-tour-camera-locate',{detail:!!currentState&&!currentState.dismissed&&!currentState.suspended&&currentState.step==='3d-camera'}));
  dispatchEvent(new CustomEvent('osh-tour-single-video',{detail:currentState&&!currentState.dismissed&&!currentState.suspended&&currentState.entry==='video'&&['prompt','play-video','watch-video','close-first-video','add-timeline'].includes(currentState.step)?currentState.step==='add-timeline'?'await-timeline':'single':'normal'}));
  workflowChoices();
  const state=options.get();popup.hidden=!state||!!state.dismissed||!!state.suspended||state.step==='watch-video';shade.style.display='none';rings.forEach(r=>r.hidden=true);if(popup.hidden){chooser?.close();interaction.sync();return}
  if(profile.experience)state!.experience=profile.experience;
  if(!state!.experience||!state!.entry){popup.hidden=true;selection();return}
  persist();if(!profile.experience){profile.experience=state!.experience;saveProfile()}
  if(!profile.workflows[state!.entry!]){profile.workflows[state!.entry!]='started';saveProfile()}
  if(lastStage!==state!.step){lastStage=state!.step;localStep=0;prepare(state!.step)}
  if(state!.step==='keyframes'&&guideCount!==state!.images.length){guideCount=state!.images.length;localStep=0}
  const done=state!.step==='done';
  if(done){profile.workflows[state!.entry!]='completed';if(state!.entry==='image')profile.workflows.video='completed';else if(['video','director'].includes(state!.entry!)&&new Set(state!.images).size>=2)profile.workflows.image='completed';saveProfile();targets=[]}
  document.querySelectorAll<HTMLElement>('[data-tour-guide]').forEach(row=>delete row.dataset.tourGuide);if(state!.step==='add'){document.querySelectorAll<HTMLElement>('.project-file[data-file-url]').forEach(row=>{const index=state!.images.indexOf(row.dataset.fileUrl||'');if(index>=0&&index<2){row.dataset.tourGuide=String(index);const group=row.closest('details');if(group)group.open=true}})}
  if(done&&state!.entry==='audio'){end();options.onKeepCreating?.();return}
  const current=done?undefined:tip(state!);if(current)targets=state!.step==='add'?[...state!.images.slice(0,2).map((_,index)=>`[data-tour-guide="${index}"]`),'#trk']:[current.target,current.secondary].filter(Boolean) as string[];
  renderView(popup,createElement(TourPopover,{onAudioChoice:state!.step==='audio-choice'?choice=>{if(choice==='stay'){end();options.onKeepCreating?.();return}state!.step='audio-speech';persist();render()}:undefined,onBlockoutChoice:state!.step==='3d-guide'?choice=>{if(choice==='stay'){end();return}dispatchEvent(new Event('osh-3d-video-reference'))}:undefined,experience:state!.experience!,entry:state!.entry!,done,tip:current,onLater:['switch-image','workflow-switch'].includes(state!.step)?()=>end(true):undefined,onSkip:()=>end(!done),onFinish:()=>end(),onTimelineChoice:state!.step==='timeline-intro'?choice=>{if(choice==='ignore'){end();options.onKeepCreating?.();return}state!.step=choice==='image'?'switch-image':'add-scenes';persist();render()}:undefined,onWorkflow:entry=>{state!.nextWorkflow=entry;state!.step='workflow-switch';persist();render()},onNext:()=>{
   if(['prompt','image','keyframes','3d'].includes(state!.step)&&localStep===0){localStep=1;document.querySelector(state!.step==='3d'?'#geometryGenerate':state!.step==='prompt'?'#gen':'#kgo')?.scrollIntoView({block:'nearest'});render();return}
   state!.step=state!.step==='audio-prompt'?'audio-generate':state!.step==='audio-file'?'audio-add':state!.step==='audio-speech'?'audio-speech-generate':state!.step==='audio-speech-file'?'audio-speech-add':state!.step==='3d-motion'?'3d-motion-generate':state!.step==='timeline-intro'?(state!.afterReview||'switch-image'):state!.step==='render-settings'?'render-takes':state!.step==='edit-settings'?'edit-review':'done';persist();render();
  }}));
  interaction.sync();
 }
 function clipped(selector:string){const element=selector.split(',').map(s=>document.querySelector<HTMLElement>(s.trim())).find(e=>e&&e.getBoundingClientRect().width&&e.getBoundingClientRect().height);if(!element)return null;let r=element.getBoundingClientRect();if(!r.width||!r.height)return null;let left=Math.max(4,r.left),top=Math.max(4,r.top),right=Math.min(innerWidth-4,r.right),bottom=Math.min(innerHeight-4,r.bottom);
  for(let p=element.parentElement;p;p=p.parentElement){const style=getComputedStyle(p);if(style.display==='none'||style.visibility==='hidden')return null;const b=p.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(style.overflowX)){left=Math.max(left,b.left);right=Math.min(right,b.right)}if(/auto|scroll|hidden|clip/.test(style.overflowY)){top=Math.max(top,b.top);bottom=Math.min(bottom,b.bottom)}}
  return right-left>12&&bottom-top>12?{left,top,right,bottom,width:right-left,height:bottom-top}:null;
 }
 const statePreview=()=>options.get()?.step==='3d-preview'?clipped('.geometry-viewer'):null;
 let lastTick=0,lastTarget='',revealBudget=3,lastReveal=0;function position(now:number){if(disposed)return;requestAnimationFrame(position);if(now-lastTick<100)return;lastTick=now;interaction.sync();if(popup.hidden)return;if(options.get()?.step==='add')document.querySelectorAll<HTMLElement>('.project-file[data-file-url]').forEach(row=>{const index=options.get()!.images.indexOf(row.dataset.fileUrl||'');if(index>=0&&index<2){if(row.dataset.tourGuide===undefined){const group=row.closest('details');if(group)group.open=true}row.dataset.tourGuide=String(index)}});
  const modal=!!document.querySelector('dialog[open]')||document.getElementById('ov')?.style.display==='flex'||!!document.querySelector<HTMLButtonElement>('#kgo')?.disabled;popup.style.visibility=modal?'hidden':'visible';if(modal){shade.style.display='none';rings.forEach(r=>r.hidden=true);return}
  if(lastTarget!==targets[0]){lastTarget=targets[0];revealBudget=3}const primary=targets[0]&&document.querySelector<HTMLElement>(targets[0]);const visible=targets[0]&&clipped(targets[0]);if(primary&&revealBudget>0&&now-lastReveal>400){const actual=primary.getBoundingClientRect();if(actual.width&&actual.height&&(!visible||primary.matches('button,input,textarea')&&visible.height<actual.height-4)){primary.scrollIntoView({block:'center',inline:'nearest'});lastReveal=now;revealBudget--}}
  const rects=targets.map(clipped).filter((r):r is NonNullable<typeof r>=>!!r),toolbar=document.querySelector('.workspace-toolbar')?.getBoundingClientRect(),topInset=Math.max(12,Math.min(innerHeight-52,(toolbar?.bottom||0)+12));popup.style.width=Math.min(340,innerWidth-24)+'px';popup.style.maxHeight=Math.max(40,innerHeight-topInset-12)+'px';const bounds=popup.getBoundingClientRect(),obstacles=Array.from(document.querySelectorAll<HTMLElement>('.window-menu[open] > div,#workspacePickerMenu:not([hidden])')).filter(element=>element.getClientRects().length).map(element=>element.getBoundingClientRect());
  const {x,y}=tourPlacement(bounds.width,bounds.height,innerWidth,innerHeight,rects,obstacles,topInset);
  popup.style.left=x+'px';popup.style.top=y+'px';shade.style.display='block';shade.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);const preview=statePreview();const clearRects=preview?[preview]:rects;shadePath.setAttribute('d',`M0 0H${innerWidth}V${innerHeight}H0Z`+clearRects.map(b=>`M${b.left-3} ${b.top-3}h${b.width+6}v${b.height+6}h-${b.width+6}Z`).join(''));
  rings.forEach((ring,i)=>{const b=rects[i];ring.hidden=!b;if(b)Object.assign(ring.style,{left:b.left-3+'px',top:b.top-3+'px',width:b.width+6+'px',height:b.height+6+'px'})});
 }
 const audioProgress=(event:Event)=>{const state=options.get();if(!state||state.entry!=='audio'||state.dismissed||state.suspended)return;const patch=audioTourMilestone(state,event.type,(event as CustomEvent).detail);if(patch){Object.assign(state,patch);persist();render()}
 };
 const audioEvents=['osh-audio-generated','osh-speech-generated','osh-audio-timeline-save','osh-audio-preview-complete'];audioEvents.forEach(name=>addEventListener(name,audioProgress));addEventListener('pagehide',()=>audioEvents.forEach(name=>removeEventListener(name,audioProgress)));
 const geometryProgress=(event:Event)=>{const state=options.get();if(!state||state.entry!=='3d'||state.dismissed||state.suspended)return;const detail=(event as CustomEvent).detail;const next=geometryTourStep(state.step,event.type,detail,state.shotId);if(next){if(event.type==='osh-camera-preview-complete')state.cameraPreviewed=true;if(event.type==='osh-3d-guide-attached')state.shotId=detail.shotId;state.step=next;persist();render()}};
 const geometryEvents=['osh-geometry-generated','osh-scene-video-status','osh-3d-guide-attached','osh-video-generated','osh-camera-prompt-reveal','osh-camera-generated','osh-camera-preview-complete'];geometryEvents.forEach(name=>addEventListener(name,geometryProgress));
 addEventListener('pagehide',()=>geometryEvents.forEach(name=>removeEventListener(name,geometryProgress)));
 document.addEventListener('osh-workspace-selected',((event:CustomEvent<{name:string;mode:string}>)=>{if(switching||chooser?.open)return;if(['Overlays','Training'].includes(event.detail.name)){pause();render();return}const state=options.get();if(state&&!state.dismissed&&(!state.experience||!state.entry))return;const entry=workflowForSetup(event.detail.name,event.detail.mode);if(state?.step==='workflow-switch'&&state.nextWorkflow===entry){start(entry,true,false);return}const bridge=workflowTourStep(state,entry);if(bridge&&state){state.step=bridge;persist();render();return}if(state?.entry===entry&&!state.dismissed&&!state.suspended)return;if(profile.experience)start(entry,false,false)}) as EventListener);
 const refreshWindows=()=>{const state=options.get();const visible=new Set([...document.querySelectorAll<HTMLElement>('.window-board .studio-window:not([hidden])')].map(p=>p.dataset.window));if(state?.entry==='video'&&!state.dismissed&&!state.suspended){if(state.step==='close-first-video'&&!visible.has('tour-video')){state.step='add-timeline';persist()}else if(state.step==='add-timeline'&&visible.has('timeline')){state.timelineIntroduced=true;state.step='timeline-intro';persist();dispatchEvent(new Event('osh-tour-keyframe-view'))}}if(!chooser?.open)render()};
 document.addEventListener('osh-workspace-picker-changed',refreshWindows);
 document.addEventListener('osh-window-layout-changed',refreshWindows);
 document.addEventListener('toggle',event=>{if((event.target as HTMLElement)?.matches('.window-menu'))refreshWindows()},true);
 addEventListener('pagehide',()=>{disposed=true;interaction.dispose();for(const [option,disabled] of restrictedOptions)option.disabled=disabled});
 let initial=options.get();if(initial?.entry==='3d'&&initial.step==='3d-record'&&!initial.cameraPreviewed){initial.step='3d-preview';persist()}if(initial?.step==='watch-video'&&!initial.videoReviewed){initial.step='play-video';persist()}if(initial?.step==='switch-image'&&initial.firstVideo&&!initial.videoReviewed){initial.step='play-video';persist()}if(initial?.step==='keyframes'&&options.current()!=='image')initial.step='switch-image';if(initial?.entry&&initial.entry!=='edit'&&!initial.shotId){const fresh=options.begin(initial.entry);fresh.experience=profile.experience;options.set(fresh);persist();initial=fresh}if(initial?.experience&&!profile.experience){profile.experience=initial.experience;saveProfile()}
 if(['Overlays','Training'].includes(document.querySelector<HTMLSelectElement>('[aria-label="Workspace setup"]')?.value||'')){if(initial&&!initial.dismissed)initial.suspended=true;render()}else if(initial&&!initial.dismissed&&!initial.suspended){if(initial.entry)profile.workflows[initial.entry]??='started';saveProfile();render()}else if(firstVisit(profile,options.current())||profile.workflows[options.current()]==='started'&&suspended[options.current()]&&!suspended[options.current()]!.dismissed)start(options.current(),false,false);else render();
 requestAnimationFrame(position);return {render,visit:(entry:Workflow)=>start(entry)};
}
