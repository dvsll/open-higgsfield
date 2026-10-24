// @ts-nocheck -- existing canvas/media controller; React views are strictly typed.
import {Glyph,Crumb,RenderStatus,Chips} from './react/controls';

import '../../shared/lib/kit.js';
import '../../shared/styleboard/looks.js';
import { SC } from './scene';
import { updateGenerateArrow } from './generate-arrow';
import { mountEditHistory } from './edit-history';
import { mountOnboardingTour } from './onboarding-tour';
import { guidesPlaced, ownsTour, workflowForSetup } from './onboarding-progress';
let onboardingUI;
let editHistory;

import {createElement as h} from 'react';
import {renderView} from './react/render';
import {Takes,Stash,Trash,Results} from './react/media-lists';
import {SequenceTrack,Ruler} from './react/timeline';
import { videoFrames, paintFilmstrip } from './video-frames';
import {captureViewerFrame,keyframeAtFrame} from './frame-keyframe';
import {mountPromptAssistant,shouldRewriteBeforeGeneration} from './prompt-assistant';
import { drawAudioTrack } from './audio-track';
import { drawTimelineAttributes } from './timeline-attributes';
import './viewer.css';
import './timeline-readability.css';
import { mountWorkspaceDock } from './workspace-dock';
import { SHELL } from './shell';
import { OSH } from '../../shared/runtime/client';
import { localGeneration, mountModels, estimateContext } from './models';
import { insertionIndex, movedIndex } from './timeline-interaction';
const {$,$$}=K,W=640,H=360;
let lastPrompt='kp';addEventListener('focusin',e=>{if(['kp','motion','shotPromptInput'].includes(e.target.id))lastPrompt=e.target.id});
// ---------- data ----------
const LOOKS=SC.LOOKS;
let look=LOOKS[0],str=.8;
const SP=SC.SP;
const SH=[{n:'First scene',d:4,spec:SP({mia:false,bolt:false,scene:''}),m:''}];
SH.forEach(s=>{s.r=false;s.keys=[]});
// Restore state (survives the round trip to Edit Anything).
const saved=SC.get('osh-director');if(saved&&saved.SH){SH.length=0;saved.SH.forEach(x=>SH.push(x));}
let expandedVideo=false,expandedAudio=false;
let onboarding=SC.get('osh-onboarding');
if(onboarding&&!ownsTour('director',onboarding.entry))onboarding=null;
const touring=()=>onboarding&&!onboarding.dismissed&&!onboarding.suspended&&onboarding.step!=='done'&&['video','image','director'].includes(onboarding.entry||'video');
function advanceTour(step){if(!onboarding||onboarding.dismissed)return;onboarding.step=step;SC.set('osh-onboarding',onboarding);renderTour()}
function renderTour(){onboardingUI?.render()}
let STASH=saved?.STASH||[],TRASH=saved?.TRASH||[],HISTORY=saved?.HISTORY||[];const workshop=SC.get('osh-workspace')||{};
let keyframeBatch=[1,2,4].includes(workshop.keyframeCount)?workshop.keyframeCount:4;
let workspaceMode=workshop.mode||'video',imageDraft=workshop.image||{prompt:'',url:null},cinema=SH.length>1;
function saveWorkshop(){SC.set('osh-workspace',{mode:workspaceMode,image:imageDraft,keyframeCount:keyframeBatch});editHistory?.record()}
function syncWorkspace(){document.body.dataset.workflow=workspaceMode;document.body.classList.toggle('single-scene',!cinema);document.querySelectorAll('[data-workflow]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workflow===workspaceMode)));$('#imageHero').src=imageDraft.url||'';$('#imageHero').hidden=!imageDraft.url;$('#imageWelcome').hidden=!!imageDraft.url;$('#nextImage').hidden=!imageDraft.url;$('#nextVideo').hidden=!SH[cur]?.r||touring();}
// Stable identities keep takes attached when shots move, including through stash/trash.
function shotId(s: {id?: string}): string {return s.id??=crypto.randomUUID()}
const storedShots=[...SH,...STASH.map(it=>it.shot),...TRASH.map(it=>it.shot)];
storedShots.forEach(s=>{shotId(s);s.keys.forEach(k=>{if(!k.anchor&&k.t===0)k.anchor='start';else if(!k.anchor&&k.t>=s.d)k.anchor='end'})});
// Old history only stored a sequence index. Match the current video first;
// unresolved entries stay unavailable rather than risking another shot's take.
HISTORY.forEach(h=>{if(h.kind==='shot'&&!h.shotId){const s=storedShots.find(s=>s.video===h.url);if(s)h.shotId=shotId(s)}});
function save(){SC.set('osh-director',{SH,cur,G,STASH,TRASH,HISTORY});editHistory?.record()}
// Generation history: every keyframe/shot the GPU made, newest first. Click to reuse.
function pushHist(e){HISTORY.unshift({...e,at:Date.now()});HISTORY=HISTORY.slice(0,80);histUI();save()}
function ago(t){const m=Math.round((Date.now()-t)/60000);return m<1?'just now':m<60?m+' min ago':Math.round(m/60)+' h ago'}
function histUI(){const el=$('#hist');if(el)renderView(el,h(Takes,{items:HISTORY,ago,onUse:useTake}))}
function useTake(h){if(h.kind==='shot'){const i=SH.findIndex(s=>s.id===h.shotId);if(i<0)return toast('Restore the original shot to the sequence to use this take');const s=SH[i];s.video=h.url;s.audio=h.audio;s.audioMuted=false;if(h.duration){s.d=h.duration;s.keys.forEach(k=>k.t=Math.min(k.t,s.d))}s.r=true;cur=i;open=open==null?null:i;selKey=null;G=start(cur);timeline();head();save();toast(`Using this take for ${s.n}`)}
   else{if(workspaceMode==='image'){imageDraft={...imageDraft,url:h.url};saveWorkshop();syncWorkspace();return}const[i,lt]=keyTarget();addKey(i,lt,{spec:(SH[i].keys[0]||SH[i]).spec,u:.5,img:h.url})}}
addEventListener('osh-project-file-open',e=>{const h=HISTORY.find(h=>h.url===e.detail.url);if(h)useTake(h)});
function viewerSeek(t){setPlaying(false);G=start(cur)+Math.max(0,Math.min(SH[cur].d-.001,t));head()}
function updateViewer(){if(!$('#viewerTime'))return;const s=SH[cur];$('#viewerTime').max=String(s.d);for(const id of ['previousFrame','nextFrame','viewerTime','editViewer'])$('#'+id).disabled=!s.video}
let capturingFrame=false;
function frameCaptureState(){
 const video=$('#vid'),button=$('#captureKeyframe');if(!button)return;
 const [i]=clipSelected&&!playing?[cur]:at(G),s=SH[i];
 const ready=workspaceMode==='video'&&s?.r&&s.video&&video.style.display!=='none'&&video.src.endsWith(s.video)&&!video.seeking&&video.readyState>=2;
 const existing=ready&&keyframeAtFrame(s.keys,video.currentTime,s.fps||24);
 button.disabled=capturingFrame||!ready||!!existing;
 button.textContent=capturingFrame?'Saving frame…':existing?'Keyframe here':'Make keyframe';
 button.title=existing?'This video frame already has a keyframe':'Save the displayed video frame as a keyframe';
}
let selectedTrack="video";let clipSelected=true;let cur=saved?.cur||0,selKey=null,G=saved?.G||0,playing=false,pxs=1,results=[],dragV=null;
const tot=()=>Math.max(SH.reduce((a,s)=>a+s.d,0),...SH.filter(s=>s.audio&&s.audioLinked===false).map(s=>(s.audioStart||0)+(s.audioDuration||s.d))),start=i=>SH.slice(0,i).reduce((a,s)=>a+s.d,0);
function at(g){let a=0;for(let i=0;i<SH.length;i++){if(g<a+SH[i].d||i===SH.length-1)return[i,Math.min(SH[i].d,g-a)];a+=SH[i].d}}
function keyTarget(){const i=open??cur;return[i,Math.round(Math.min(SH[i].d,Math.max(0,G-start(i)))*10)/10]}
// ---------- drawing ----------
const frame=(g)=>SC.blank(g),mute=SC.mute;
const off=document.createElement('canvas'),og=K.canvas(off,W,H);
// A shot plays by easing between its keyframes; different keyframe images cross-dissolve.
// Real keyframe images (from the local runtime) are drawn instead of the placeholder spec.
const IMG={};function img(url){if(!url)return null;let im=IMG[url];if(!im){im=IMG[url]=new Image();im.onload=()=>{clearTimeout(img.t);img.t=setTimeout(()=>{timeline();res()},50)};im.src=url}return im.complete&&im.naturalWidth?im:null}
function cover(g,im,z=1){const W=g.canvas.width,H=g.canvas.height,r=Math.max(W/im.naturalWidth,H/im.naturalHeight)*z,w=im.naturalWidth*r,h=im.naturalHeight*r;g.drawImage(im,(W-w)/2,(H-h)/2,w,h)}
function drawKey(g,k,t,u){const im=img(k.img);if(im)cover(g,im,1+(u||0)*.04);else frame(g,k.spec,t,u??k.u)}
function shotFrame(g,s,lt,t){const k=[...s.keys].sort((a,b)=>a.t-b.t);if(!k.length){g.fillStyle='#111';g.fillRect(0,0,g.canvas.width,g.canvas.height);return}
 let a=k[0],b=k[0];if(lt>=k[k.length-1].t)a=b=k[k.length-1];else if(lt>k[0].t)for(let i=0;i<k.length-1;i++)if(lt<=k[i+1].t){a=k[i];b=k[i+1];break}
 const v=a===b?0:(lt-a.t)/((b.t-a.t)||1),e=v*v*(3-2*v);
 if(!a.img&&!b.img&&SC.same(a.spec,b.spec))frame(g,a.spec,t,a.u+(b.u-a.u)*e);else{drawKey(g,a,t,a.img?v:a.u);if(e>0){drawKey(og,b,t,b.img?v:b.u);g.globalAlpha=e;g.drawImage(off,0,0,g.canvas.width,g.canvas.height);g.globalAlpha=1}}}
// ---------- sequence timeline ----------
// After Effects-style: in the sequence every shot is just a video clip. Open one (double-click / "Open")
// and the timeline becomes that shot alone: it loops by itself and shows only its keyframes.
let open=null;
function selectClip(i){selectedTrack="video";clipSelected=true;cur=i;selKey=null;$$('#trk>.clip').forEach((el,j)=>{el.classList.toggle('on',j===i);el.setAttribute('aria-selected',String(j===i));el.tabIndex=j===i?0:-1});head();save()}
addEventListener('pointerdown',e=>{if(e.target.closest('.clip,.k,button,a,input,textarea,select,summary,aside,header,dialog,[contenteditable]'))return;clipSelected=false;selKey=null;$$('#trk>.clip,.k,.audio-clip').forEach(el=>{el.classList.remove('on');if(el.hasAttribute('aria-selected'))el.setAttribute('aria-selected','false')});$('#play').title='Play sequence / pause (space)';head()});
let suppressClipClickUntil=0,cancelShotDrag=null;
function clearDragFeedback(){document.body.classList.remove('shot-drag');$$('.dragging,.dropzone,.drop').forEach(el=>el.classList.remove('dragging','dropzone','drop'));$('#trk').querySelector('.insert-line')?.remove();$('.shot-ghost')?.remove()}
function endShotDrag(){dragShot=null;clearDragFeedback()}
function insertionCue(clientX){const trk=$('#trk'),r=trk.getBoundingClientRect(),idx=insertionIndex(SH.map(s=>s.d),(clientX-r.left)/pxs);let line=trk.querySelector('.insert-line');if(!line){line=document.createElement('div');line.className='insert-line';trk.append(line)}line.style.left=(start(idx)*pxs)+'px';line.dataset.hint=idx===SH.length?'Insert at end':`Insert before ${SH[idx].n}`;trk.classList.add('dropzone');return idx}
function insertDraggedShot(idx){if(dragShot.from==='stash'){const it=STASH.splice(dragShot.i,1)[0];SH.splice(idx,0,it.shot);cur=idx;toast(`${it.shot.n} back in the sequence`)}else{const [shot]=SH.splice(dragShot.i,1);idx=movedIndex(dragShot.i,idx);SH.splice(idx,0,shot);cur=idx}endShotDrag();G=Math.min(G,tot()-.01);timeline();head();save()}
function shotPointerDrag(el,from,i){el.draggable=false;el.onpointerdown=ev=>{
 if(ev.button!==0||ev.target.closest('button,.grip'))return;const x=ev.clientX,y=ev.clientY;let moved=false,ghost=null;el.setPointerCapture(ev.pointerId);
 el.onpointermove=m=>{if(!moved&&Math.hypot(m.clientX-x,m.clientY-y)<5)return;
  if(!moved){moved=true;dragShot={from,i};document.body.classList.add('shot-drag');el.classList.add('dragging');if(from==='seq')selectClip(i);const shot=from==='seq'?SH[i]:STASH[i].shot;ghost=document.createElement('div');ghost.className='shot-ghost';ghost.textContent=`${shot.n} · ${shot.d}s`;document.body.append(ghost)}
  ghost.style.left=(m.clientX+14)+'px';ghost.style.top=(m.clientY+14)+'px';const hit=document.elementFromPoint(m.clientX,m.clientY),overTrack=open==null&&hit?.closest('#trk'),overStash=from==='seq'&&hit?.closest('#stash');
  $('#stash').classList.toggle('drop',!!overStash);if(overTrack)insertionCue(m.clientX);else{$('#trk').classList.remove('dropzone');$('#trk').querySelector('.insert-line')?.remove()}
 };
 const stop=m=>{el.onpointermove=null;el.onpointerup=null;el.onpointercancel=null;cancelShotDrag=null;if(el.hasPointerCapture(ev.pointerId))el.releasePointerCapture(ev.pointerId);if(!moved)return;suppressClipClickUntil=performance.now()+150;const hit=document.elementFromPoint(m.clientX,m.clientY);
  if(m.type!=='pointercancel'&&open==null&&hit?.closest('#trk'))insertDraggedShot(insertionIndex(SH.map(s=>s.d),(m.clientX-$('#trk').getBoundingClientRect().left)/pxs));
  else if(m.type!=='pointercancel'&&from==='seq'&&hit?.closest('#stash')){endShotDrag();removeShot(i,'stash')}else endShotDrag();
 };el.onpointerup=stop;el.onpointercancel=stop;cancelShotDrag=()=>stop({type:'pointercancel',clientX:x,clientY:y});
}}
addEventListener('keydown',e=>{if(e.key==='Escape'&&cancelShotDrag){e.preventDefault();cancelShotDrag()}});
function openShot(i){clipSelected=true;open=i;cur=i;selKey=null;G=start(i);timeline();head()}
function closeShot(){const i=open;open=null;selKey=null;if(i!=null)G=start(i);timeline();head()}
addEventListener('osh-model-control',e=>{if(e.detail==='timeline'){openShot(cur);$('#addKeyBtn').focus();$('#tl').scrollIntoView({block:'nearest'})}});
function trackAttributes(){const indices=open==null?SH:[SH[open]],offset=open??0;$('#ruler').style.width=(indices.reduce((n,s)=>n+s.d,0)*pxs)+'px';drawTimelineAttributes({selected:cur,shots:indices,pixels:pxs,offset,start:start(offset),size:{width:+$('#videoWidth')?.value||768,height:+$('#videoHeight')?.value||448},select:(i,audio)=>{cur=i;selKey=null;clipSelected=true;selectedTrack=audio?'audio':'video';head()},change:()=>{SH.forEach(s=>s.keys.forEach(k=>k.t=k.anchor==='end'?s.d:Math.min(k.t,s.d)));G=Math.min(G,tot()-.01);timeline();head();save()},generate:()=>$('#gen').click(),settings:()=>$('#showVideoAttributes').click(),audio:()=>{if(SH[cur].audio)$('#editAudio').click();else{$('#audioPrompt').scrollIntoView({block:'center'});focusPromptField('audioPrompt')}}})}
function timeline(){if(!$('#tl').clientWidth)return;stashUI();const trk=$('#trk'),W0=$('#tl').clientWidth-parseFloat(getComputedStyle($('#tl')).gridTemplateColumns)-24;$('#addKeyBtn').style.display=open==null?'none':'';trk.classList.toggle('scene',open!=null);
 trk.ondragover=trk.ondragleave=trk.ondrop=null;
 trk.setAttribute('role',open==null?'listbox':'group');trk.setAttribute('aria-label',open==null?'Sequence clips':'Shot keyframes');
 if(open!=null&&!SH[open])open=null;
 if(open==null){ // ---- sequence: shots act as videos
  const T=tot();pxs=(W0-50)/T;$('#tot').textContent=`${SH.length} shots · ${+T.toFixed(3)}s`;renderView($('#crumb'),h(Crumb));
  $('#hintT').textContent='click to select · double-click to open · drag to reorder · scrub the ruler';
  renderView($('#ruler'),h(Ruler,{duration:T,pixels:pxs}));
  renderView(trk,h(SequenceTrack,{clips:SH.map((s,i)=>({id:shotId(s),name:s.n,duration:s.d,generated:s.r,selected:i===cur&&clipSelected,width:s.d*pxs-3,height:80,bind:c=>{
   strip(c,s);
   c.querySelector('.tw').onclick=ev=>{ev.stopPropagation();openShot(i)};
   c.querySelector('[data-a=stash]').onclick=ev=>{ev.stopPropagation();removeShot(i,'stash')};
   c.querySelector('[data-a=del]').onclick=ev=>{ev.stopPropagation();removeShot(i,'trash')};
   shotPointerDrag(c,'seq',i);
   c.onclick=ev=>{if(performance.now()<suppressClipClickUntil||ev.target.closest('.grip,.tw,.act'))return;selectClip(i)};
   c.onkeydown=ev=>{if(ev.target!==c)return;if(ev.key==='Enter'){ev.preventDefault();openShot(i)}else if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'){ev.preventDefault();selectClip(Math.max(0,Math.min(SH.length-1,i+(ev.key==='ArrowLeft'?-1:1))));$$('#trk>.clip')[cur].focus()}};
   c.ondblclick=ev=>{if(ev.target.closest('.grip,.tw,.act'))return;openShot(i)};
   trim(c,s);dropTarget(c,i);
  }})),onAdd:()=>{SH.push({n:'New',d:3,spec:SP({scene:SH[cur].spec.scene}),m:'',r:false,keys:[]});openShot(SH.length-1);toast('Write a prompt and generate, or add optional keyframes')}}));
  trk.ondragover=ev=>{if(!dragShot)return;ev.preventDefault();ev.dataTransfer.dropEffect='move';insertionCue(ev.clientX)};
  trk.ondragleave=ev=>{if(!trk.contains(ev.relatedTarget)){trk.classList.remove('dropzone');trk.querySelector('.insert-line')?.remove()}};
  trk.ondrop=ev=>{if(!dragShot)return;ev.preventDefault();const r=trk.getBoundingClientRect();insertDraggedShot(insertionIndex(SH.map(s=>s.d),(ev.clientX-r.left)/pxs))};
  drawAudioTrack($('#audioTrack'),SH,pxs,i=>{selectClip(i);selectedTrack='audio';timeline();head();focusPromptField('audioPrompt')},clipSelected&&(selectedTrack==='audio'||SH[cur].audioLinked!==false)?cur:-1);trackAttributes();return}
 // ---- one shot opened
 const i=open,s=SH[i];pxs=(W0-6)/s.d;$('#tot').textContent=`${+s.d.toFixed(3)}s · ${s.keys.length} keyframe${s.keys.length===1?'':'s'}`;
 renderView($('#crumb'),h(Crumb,{index:i,name:s.n,onBack:closeShot}));
 $('#hintT').textContent='drag keys to retime · double-click a key to edit it · double-click the track or Esc to go back';
 renderView($('#ruler'),h(Ruler,{duration:s.d,pixels:pxs,half:true}));
 const w=s.d*pxs-3,px=t=>Math.max(44,Math.min(w-44,t*pxs));
 const keys=s.keys.map((k,index)=>{if(k.anchor==='end')k.t=s.d;else if(k.anchor==='start')k.t=0;return{id:k.id??(k.id=crypto.randomUUID()),bind:e=>{
  drawKey(e.firstChild.getContext('2d'),k,2,0);const position=()=>{e.className='k'+(k===selKey?' on':'')+(k.anchor?' anchor '+k.anchor:'');e.style.left=(k.anchor==='start'?0:k.anchor==='end'?w-80:px(k.t))+'px';e.lastChild.textContent=k.anchor==='start'?'START →':k.anchor==='end'?'→ END':'';e.title=(k.anchor?`${k.anchor} frame`:`Keyframe at ${k.t.toFixed(1)}s`)+(k.img?'':' · no image, not used for generation')+' · drag to retime';e.setAttribute('role','button');e.setAttribute('aria-label',e.title)};position();
  e.ondblclick=ev=>{ev.stopPropagation();selKey=k;editKey()};
  e.tabIndex=0;e.onkeydown=ev=>{if(!['Home','End'].includes(ev.key))return;ev.preventDefault();ev.stopPropagation();selKey=k;k.anchor=ev.key==='Home'?'start':'end';k.t=k.anchor==='start'?0:s.d;for(const other of s.keys)if(other!==k&&other.anchor===k.anchor){delete other.anchor;other.t=k.anchor==='start'?Math.min(.2,s.d/2):Math.max(0,s.d-.2)}s.r=false;timeline();head();save();checkTourPlacement();const focusIndex=s.keys.indexOf(k);document.querySelectorAll('#trk .k')[focusIndex]?.focus()};
  e.onpointerdown=ev=>{ev.stopPropagation();selKey=k;e.setPointerCapture(ev.pointerId);$$('.k').forEach(q=>q.classList.toggle('on',q===e));const xs=ev.clientX,t0=k.t;let mv=false;
   e.onpointermove=m=>{if(Math.abs(m.clientX-xs)<3&&!mv)return;mv=true;const raw=t0+(m.clientX-xs)/pxs,edge=Math.min(.15,18/pxs);k.anchor=raw<=edge?'start':raw>=s.d-edge?'end':undefined;k.t=k.anchor==='start'?0:k.anchor==='end'?s.d:Math.round(Math.min(s.d,Math.max(0,raw))*10)/10;position()};
   e.onpointerup=()=>{e.onpointermove=null;if(mv){if(k.anchor)for(const other of s.keys)if(other!==k&&other.anchor===k.anchor){delete other.anchor;other.t=k.anchor==='start'?Math.min(.2,s.d/2):Math.max(0,s.d-.2)}s.r=false;timeline()}head();save();if(mv)checkTourPlacement()};e.onpointercancel=()=>{e.onpointermove=null;timeline();head();save()}};
 }}});
 renderView(trk,h(SequenceTrack,{clips:[{id:shotId(s),name:s.n,duration:s.d,generated:s.r,selected:clipSelected,width:w,height:96,opened:true,keys,bind:c=>{
  strip(c,s);c.querySelector('.tw').onclick=ev=>{ev.stopPropagation();closeShot()};
  c.onclick=ev=>{if(ev.target.closest('.k,.grip,.tw'))return;selKey=null;$$('.k').forEach(k=>k.classList.remove('on'));head()};
  c.ondblclick=ev=>{if(ev.target.closest('.k,.grip,.tw'))return;closeShot()};trim(c,s);dropTarget(c,i);
 }}]}));drawAudioTrack($('#audioTrack'),[s],pxs,()=>{selectedTrack='audio';clipSelected=true;timeline();head();focusPromptField('audioPrompt')},clipSelected?0:-1,start(open));trackAttributes()}
// ---------- stash (visible parking tray) and trash (discreet, restorable) ----------
let dragShot=null;
function removeShot(i,where){if(SH[i].audio&&SH[i].audioLinked===false)return toast('Link or remove the separate audio before removing its scene');if(SH.length<=1)return toast('Keep at least one shot in the sequence');const selected=SH[cur],opened=open==null?null:SH[open];const [sh]=SH.splice(i,1);(where==='stash'?STASH:TRASH).unshift({shot:sh,from:i,at:Date.now()});
 open=opened&&opened!==sh?SH.indexOf(opened):null;cur=SH.includes(selected)?SH.indexOf(selected):Math.min(i,SH.length-1);selKey=null;G=Math.min(G,tot()-.01);timeline();head();save();
 toast(where==='stash'?`${sh.n} moved to the stash`:`${sh.n} deleted — restore it from 🗑 in the timeline header`)}
function restore(list,j){const opened=open==null?null:SH[open],it=list.splice(j,1)[0],idx=Math.min(it.from,SH.length);SH.splice(idx,0,it.shot);cur=idx;if(opened){open=SH.indexOf(opened);cur=open}timeline();head();save();toast(`${it.shot.n} restored`)}
function thumb(cv,sh){const g=cv.getContext('2d',{willReadFrequently:true});shotFrame(og,sh,Math.min(1,sh.d/2),2);if(!sh.r)mute(og);g.drawImage(off,0,0,cv.width,cv.height)}
function stashUI(){const el=$('#stash');renderView(el,h(Stash,{items:STASH,bind:(d,j)=>{thumb(d.querySelector('canvas'),STASH[j].shot);shotPointerDrag(d,'stash',j)},onRestore:j=>restore(STASH,j)}));
 el.ondragover=ev=>{if(dragShot?.from!=='seq')return;ev.preventDefault();ev.dataTransfer.dropEffect='move';el.classList.add('drop')};el.ondragleave=ev=>{if(!el.contains(ev.relatedTarget))el.classList.remove('drop')};
 el.ondrop=ev=>{if(dragShot?.from!=='seq')return;ev.preventDefault();const i=dragShot.i;endShotDrag();removeShot(i,'stash')};
 const tb=$('#trashBtn');tb.textContent=TRASH.length?`🗑 ${TRASH.length}`:'';tb.style.display=TRASH.length?'':'none';if(!TRASH.length)$('#trashpop').style.display='none';else if($('#trashpop').style.display==='block')trashUI()}
function trashUI(){renderView($('#trashpop'),h(Trash,{items:TRASH,bind:(canvas,index)=>thumb(canvas,TRASH[index].shot),onRestore:j=>restore(TRASH,j),onEmpty:()=>{if(confirm(`Permanently remove ${TRASH.length} deleted shot(s)? This can't be undone.`)){TRASH=[];save();stashUI();trashUI()}}}))}

$('#trashBtn').onclick=e=>{e.stopPropagation();const p=$('#trashpop');const on=p.style.display!=='block';p.style.display=on?'block':'none';if(on)trashUI()};
addEventListener('click',e=>{if(!e.target.closest('#trashpop,#trashBtn'))$('#trashpop').style.display='none'});
function strip(c,s){const cv=c.querySelector('.strip'),sg=cv.getContext('2d'),h=cv.height,tw=h*16/9;for(let x=0;x<cv.width;x+=tw){shotFrame(og,s,Math.min(s.d,(x+tw/2)/pxs),2);if(!s.r)mute(og);sg.drawImage(off,x,0,tw,h)}if(s.video){const url=s.video;videoFrames(url).then(frames=>{if(cv.isConnected&&s.video===url)paintFilmstrip(cv,frames)}).catch(()=>{})}}
function trim(c,s){const gr=c.querySelector('.grip');gr.onpointerdown=ev=>{ev.preventDefault();ev.stopPropagation();gr.setPointerCapture(ev.pointerId);const x0=ev.clientX,d0=s.d,p0=pxs;
  gr.onpointermove=m=>{s.d=Math.max(1,Math.min(8,Math.round(d0+(m.clientX-x0)/p0)));c.style.width=(s.d*p0-3)+'px'};
  gr.onpointerup=()=>{gr.onpointermove=null;s.keys.forEach(k=>k.t=Math.min(k.t,s.d));if(s.d!==d0)s.r=false;G=Math.min(G,tot()-.01);timeline();head()}}}
function dropTarget(el,i){const s=SH[i];el.ondragover=ev=>{if(!dragV)return;ev.preventDefault();el.classList.add('drop')};el.ondragleave=()=>el.classList.remove('drop');
 el.ondrop=ev=>{ev.preventDefault();el.classList.remove('drop');if(!dragV)return;const r=el.getBoundingClientRect();addKey(i,Math.round(Math.min(s.d,Math.max(0,(ev.clientX-r.left)/pxs))*10)/10,dragV,'drop')}}
for(const kind of ['video','audio']){const toggle=$('#'+kind+'TrackToggle');renderView(toggle,[h(Glyph,{key:'icon',path:'m9 5 7 7-7 7'}),h('span',{key:'label'},kind==='video'?'Video properties':'Audio properties')]);toggle.onclick=()=>{if(kind==='video')expandedVideo=!expandedVideo;else expandedAudio=!expandedAudio;const expanded=kind==='video'?expandedVideo:expandedAudio;$('#'+kind+'TrackToggle').setAttribute('aria-expanded',String(expanded));$('#'+kind+'TrackToggle').title=(expanded?'Collapse ':'Expand ')+kind+' properties';$('#'+kind+'TrackAttributes').hidden=!expanded;timeline()}};
$('#tl').addEventListener('pointerdown',e=>{if(e.target.closest('.clip,.k,.audio-clip,button,input,textarea,select,label,#ruler'))return;const rect=$('#ruler').getBoundingClientRect(),t=Math.max(0,(e.clientX-rect.left)/pxs);G=open==null?Math.min(tot()-.01,t):start(open)+Math.min(SH[open].d-.01,t);clipSelected=false;selKey=null;head()});
$('#ruler').onpointerdown=e=>{const seek=ev=>{const r=$('#ruler').getBoundingClientRect(),x=Math.max(0,(ev.clientX-r.left)/pxs);
  if(open!=null){G=start(open)+Math.min(SH[open].d-.01,x)}else{G=Math.min(tot()-.01,x)}head()};seek(e);$('#ruler').setPointerCapture(e.pointerId);$('#ruler').onpointermove=seek};
$('#ruler').onpointerup=()=>$('#ruler').onpointermove=null;
addEventListener('keydown',e=>{if(!e.defaultPrevented&&e.key==='Escape'&&open!=null&&!/TEXTAREA|INPUT/.test(e.target.tagName))closeShot()});
function media(){if(workspaceMode==='image')return{type:'keyframe',label:'Image workshop',img:imageDraft.url,spec:SP({}),u:.5};const s=SH[cur];if(selKey&&s.keys.includes(selKey))return{type:'keyframe',label:`Shot ${cur+1} · keyframe @ ${selKey.t.toFixed(1)}s`,spec:selKey.spec,u:selKey.u,img:selKey.img,ref:{shot:cur,key:s.keys.indexOf(selKey)}};
 return{type:'shot',label:`Shot ${cur+1} · ${s.n} · ${+s.d.toFixed(3)}s`,spec:(s.keys[0]||s).spec,u:.3,video:s.r?s.video:undefined,audio:s.audio,audioPrompt:s.audioPrompt,audioLinked:s.audioLinked,duration:s.d,ref:{shot:cur,shotId:shotId(s)}}}
function head(){const s=SH[cur];if(expandedVideo||expandedAudio)trackAttributes();$('#trk').classList.toggle('has-selection',clipSelected);updateViewer();document.getElementById("play").title=clipSelected?"Play selected scene / pause (space)":"Play sequence / pause (space)";cinema=SH.length>1;document.body.classList.toggle("single-scene",!cinema);document.body.classList.toggle('has-guides',s.keys.some(k=>k.img));SHELL.select(media());$('#sNum').textContent=`Shot ${cur+1} — `;if(document.activeElement!==$('#sName'))$('#sName').textContent=s.n;$('#sMeta').textContent=`${+s.d.toFixed(3)}s · ${s.keys.length} keyframe${s.keys.length===1?'':'s'}`;
 if(s.renderWidth)$('#videoWidth').value=String(s.renderWidth);if(s.renderHeight)$('#videoHeight').value=String(s.renderHeight);
 if($('#videoSeed')&&document.activeElement!==$('#videoSeed'))$('#videoSeed').value=String(s.seed??7);
 const fps=s.fps||24,frames=s.renderFrames||Math.max(9,Math.min(121,Math.round(s.d*fps/8)*8+1));
 if($('#videoFrames')){$('#videoFrames').value=String(frames);$('#videoFPS').value=String(fps);$('#videoDuration').textContent=`${frames} frames / ${fps} FPS = ${(frames/fps).toFixed(3)} seconds`}
 estimateContext(frames/fps,0,frames);
 if(document.activeElement!==$('#audioPrompt'))$('#audioPrompt').value=s.audioPrompt||'';$('#audioMute').checked=!!s.audioMuted;
 const audioSelected=clipSelected&&selectedTrack==='audio',independent=audioSelected&&s.audioLinked===false;$('#audioLink').disabled=!audioSelected||!s.audio;$('#audioLink').textContent=s.audioLinked===false?'Link to video':'Unlink audio';$('#generateAudio').hidden=!s.video||!!s.audio;$('#generateAudio').disabled=!s.audioPrompt?.trim();$('#editAudio').hidden=!s.video||!s.audio;$('#audioSelectionControls').hidden=!audioSelected||!s.audio;$('#audioMute').disabled=!independent;$('#audioStart').disabled=!independent;$('#audioStart').value=String(s.audioLinked===false?s.audioStart??start(cur):start(cur));$('#audioPrompt').readOnly=false;$('#audioEditHint').textContent=s.audio?'New video takes use this prompt. Change existing sound in Edit.':'Optional · generated with your video.';
 [...$('#audioTrack').children].forEach((el,i)=>el.classList.toggle('on',clipSelected&&(audioSelected||s.audioLinked!==false)&&i===(open==null?cur:0)));
 [...$$('#trk>.clip')].forEach((el,i)=>{const selected=clipSelected&&i===(open==null?cur:0)&&(!audioSelected||s.audioLinked!==false);el.classList.toggle('on',selected);el.setAttribute('aria-selected',String(selected))});
 const attributes=$('#selectedVideoAttributes');if(attributes){attributes.textContent=s.video?'Reading selected video…':`${s.n} · ${+s.d.toFixed(3)}s · not generated`;if(s.video){const url=s.video;videoFrames(url).then(info=>{if(SH[cur]===s&&s.video===url)attributes.textContent=`Current take · ${info.width} × ${info.height} px · ${info.duration.toFixed(2)}s`}).catch(()=>{if(SH[cur]===s)attributes.textContent=`${s.n} · video unavailable`})}}
 if(document.activeElement!==$('#shotPromptInput'))$('#shotPromptInput').value=s.prompt||'';
 renderView($('#sState'),h(RenderStatus,{generated:s.r}));if(document.activeElement!==$('#motion'))$('#motion').value=s.m;dispatchEvent(new Event('osh-prompt-values'))}
function checkTourPlacement(){const shot=SH.find(s=>s.id===onboarding?.shotId);if(touring()&&onboarding.step==='position'&&shot&&guidesPlaced(shot.keys))advanceTour('regenerate')}
addEventListener('osh-tour-keyframe-view',()=>{const index=SH.findIndex(s=>s.id===onboarding?.shotId);if(index>=0)openShot(index)});
function addKey(i,t,v,source='click'){const s=SH[i],guided=touring()&&onboarding.step==='add'&&s.id===onboarding.shotId;if(guided){if(s.keys.some(k=>k.img===v.img))return toast('Choose a different image for the other frame');if(source==='click')t=s.d*(s.keys.filter(k=>k.img).length+1)/3;v={...v,spec:s.spec}}const k={t,u:v.u,spec:v.spec,img:v.img};if(source==='drop'){const edge=Math.min(.15,18/pxs);k.anchor=t<=edge?'start':t>=s.d-edge?'end':undefined;if(k.anchor){k.t=k.anchor==='start'?0:s.d;for(const other of s.keys)if(other.anchor===k.anchor){delete other.anchor;other.t=k.anchor==='start'?Math.min(.2,s.d/2):Math.max(0,s.d-.2)}}}open=i;s.keys.push(k);selKey=k;cur=i;s.r=false;G=start(i)+Math.min(k.t,s.d-.01);playing=false;setPlaying(false);timeline();head();save();if(guided&&s.keys.filter(k=>k.img).length>=2){advanceTour('position');checkTourPlacement()}toast(`Keyframe added to shot ${i+1} at ${k.t.toFixed(1)}s`)}
addEventListener('osh-video-timing',e=>{if(playing)setPlaying(false);const s=SH[cur];s.renderFrames=e.detail.frames;s.fps=e.detail.fps;s.d=s.renderFrames/s.fps;s.keys.forEach(k=>{k.t=k.anchor==='end'?s.d:Math.min(k.t,s.d)});G=Math.max(0,Math.min(G,tot()-.01));timeline();head();save()});
function delKey(){if(!selKey&&!clipSelected)return;if(selectedTrack==='audio'){const s=SH[cur];if(s.audioLinked!==false)return toast('Unlink audio to remove it separately');delete s.audio;timeline();head();save();return}if(!selKey&&open==null)return removeShot(cur,'trash');if(!selKey)return toast('Select a keyframe first');SH.forEach(s=>{const j=s.keys.indexOf(selKey);if(j>=0){s.keys.splice(j,1);s.r=false}});selKey=null;timeline();head()}
$('#delKey').onclick=delKey;
// Rename the current shot: click the title (or ✎ / F2), Enter to save, Esc to cancel.
const nm=$('#sName');let nm0='';
nm.onfocus=()=>{nm0=SH[cur].n;const r=document.createRange();r.selectNodeContents(nm);getSelection().removeAllRanges();getSelection().addRange(r)};
nm.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();nm.blur()}if(e.key==='Escape'){nm.textContent=nm0;nm.blur()}e.stopPropagation()};
nm.onblur=()=>{const v=nm.textContent.trim().slice(0,40)||nm0;nm.textContent=v;if(v!==SH[cur].n){SH[cur].n=v;timeline();save()}};
$('#sTitle .pen').onclick=()=>nm.focus();
addEventListener('keydown',e=>{if(e.key==='F2'&&!/TEXTAREA|INPUT/.test(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();nm.focus()}});
$('#addKeyBtn').onclick=()=>{if(open==null)return toast('Open a shot first (double-click it)');const s=SH[open],t=Math.round((G-start(open))*10)/10,near=[...s.keys].sort((a,b)=>Math.abs(a.t-t)-Math.abs(b.t-t))[0];addKey(open,t,{spec:near?near.spec:s.spec,u:.5,img:near?.img})};
function editKey(){if(!selKey)return toast('Select a keyframe first');head();SHELL.open('edit')}
$('#editKey').onclick=editKey;
addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,button,summary,[contenteditable=true]'))return;if(e.key==='Backspace'||e.key==='Delete')delKey();if(e.code==='Space'){e.preventDefault();$('#play').click()}});
$('#motion').oninput=e=>{SH[cur].m=e.target.value;if(SH[cur].r){SH[cur].r=false;timeline()}head();save()};
$('#shotPromptInput').oninput=e=>{SH[cur].prompt=e.target.value;if(SH[cur].r){SH[cur].r=false;timeline()}head();save()};
// Starts paused. Play runs to the end (of the sequence, or of the opened shot) and stops; pressing play at the end restarts.
const span=()=>clipSelected&&selectedTrack==="audio"&&SH[cur].audioLinked===false?[SH[cur].audioStart??start(cur),(SH[cur].audioStart??start(cur))+(SH[cur].audioDuration||SH[cur].d)]:clipSelected?[start(cur),start(cur)+SH[cur].d]:open!=null?[start(open),start(open)+SH[open].d]:[0,tot()];
function setPlaying(v){playing=v;renderView($('#play'),h(Glyph,{path:v?'M8 5v14M16 5v14':'M8 5l11 7-11 7z'}));$('#play').setAttribute('aria-label',v?'Pause':'Play');$('#play').setAttribute('aria-pressed',String(v))}
$('#play').onclick=()=>{if(!playing){const[a,b]=span();if(G>=b-.06||G<a)G=a}setPlaying(!playing)};setPlaying(false);
// ---------- generate video from keyframes ----------
// ---------- prompts for the real models ----------
const EL_P={mia:'Mia, a 10-year-old girl in a yellow raincoat',bolt:'Bolt, a small boxy grey robot with round eyes',yard:'a junkyard full of scrap piles',street:'an empty lamplit street',room:"Mia's bedroom with a desk and a lamp"};
const framing=sc=>sc<1?'wide shot':sc<2?'medium shot':'close-up';
function specWords(sp){const w=[];if(sp.mia)w.push(EL_P.mia);if(sp.bolt)w.push(EL_P.bolt);w.push(EL_P[sp.scene]||'');if(sp.night)w.push('at night');if(sp.dawn)w.push('at dawn, first light');if(sp.eyes)w.push("Bolt's eyes glowing cyan");return w.filter(Boolean).join(', ')}
const lookWords=()=>look.prompt||look.n;
const keyPrompt=(sp,what)=>`${framing(sp.scale)}, ${what?what+'. ':''}${specWords(sp)}. ${lookWords()}. cinematic film still, 35mm`;
const shotPrompt=(s,reviewed=false)=>reviewed?[s.visualPrompt||s.prompt,s.m].filter(Boolean).join('. '):`${((s.promptOverrides?.visual||s.rewriteSource===s.prompt?.trim())&&s.visualPrompt)||s.prompt||''}. ${s.m||'subtle camera movement'}. ${specWords((s.keys[0]||s).spec)}. ${lookWords()}. cinematic, smooth natural motion`;
$('#audioPrompt').oninput=e=>{SH[cur].audioPrompt=e.target.value;$('#generateAudio').disabled=!e.target.value.trim();save();dispatchEvent(new Event('osh-audio-prompt'))};$('#audioMute').onchange=e=>{SH[cur].audioMuted=e.target.checked;timeline();save()};
$('#audioLink').onclick=()=>{const s=SH[cur];if(selectedTrack!=='audio'||!clipSelected)return;if(s.audioLinked===false){s.audioLinked=true;s.audioStart=start(cur)}else{s.audioLinked=false;s.audioStart=start(cur);s.audioDuration=s.audioDuration||s.d}G=Math.min(G,tot()-.01);timeline();head();save();dispatchEvent(new Event('osh-audio-prompt'))};
$('#audioStart').onchange=e=>{const s=SH[cur];if(selectedTrack!=='audio'||s.audioLinked!==false||!e.target.reportValidity())return;s.audioStart=+e.target.value;timeline();save()};
async function renderAudio(s){if(!s.audioPrompt?.trim())throw new Error('Describe the sound in Audio prompt first');const linked=s.audioLinked!==false,duration=linked?s.d:s.audioDuration||s.d;if(duration>47)throw new Error('Audio currently supports clips up to 47 seconds');const result=await OSH.audio(s.audioPrompt,duration,Math.floor(Math.random()*1e9),linked?s.video:undefined);s.audio=result.audio;s.audioDuration=duration;s.audioMuted=false;if(result.video){s.video=result.video;s.r=true;pushHist({kind:'shot',url:s.video,audio:s.audio,label:s.n+' · with audio',shotId:shotId(s),duration:s.d})}save();timeline();head();return result}
$('#editAudio').onclick=()=>{const s=SH[cur];if(!s.video||!s.audio)return;SC.set('osh-handoff',{type:'shot',label:s.n,ref:{shot:cur,shotId:shotId(s)},duration:s.d,video:s.video,audio:s.audio,audioLinked:s.audioLinked,audioPrompt:s.audioPrompt||'',editTarget:'audio',from:'director'});location.href='/studio/edit?from=director'};
$('#generateAudio').onclick=async()=>{const s=SH[cur];if(!s.video||s.audio||$('#ov').style.display==='flex'||$('#kgo').disabled)return;s.audioLinked=true;const button=$('#generateAudio');button.disabled=true;try{await busy('Generating audio locally',()=>renderAudio(s));toast('Audio ready')}catch(e){toast('Audio failed: '+e.message)}finally{head()}};
// Busy overlay with elapsed time (real jobs have no known duration).
async function busy(msg,job){const ov=$('#ov');ov.style.display='flex';$('#pb').style.width='100%';const t0=performance.now();let activity=null;
 const progress=e=>{activity=e.detail.phase==='complete'?null:e.detail};addEventListener('osh-generation-progress',progress);
 const tick=setInterval(()=>{if(activity){$('#ovt').textContent=activity.message+' · '+Math.max(0,Math.round((Date.now()-activity.phaseStartedAt)/1000))+'s '+(activity.phase==='generating'?'generating':'in this stage');$('#pb').style.width=activity.percent==null?'100%':activity.percent+'%'}else $('#ovt').textContent=`${typeof msg==='function'?msg():msg} · ${((performance.now()-t0)/1000).toFixed(0)}s`},200);
 try{return await job()}finally{clearInterval(tick);removeEventListener('osh-generation-progress',progress);ov.style.display='none'}}

async function realShot(i,label){const s=SH[i];let step='';
 const reviewed=$('#promptAdvanced').open;
 return busy(()=>`${label}${step}`,async()=>{
  if(shouldRewriteBeforeGeneration(reviewed,s)){step=' · preparing prompt';await promptAssistant.prepare(s);if(!SH.includes(s))throw new Error('The scene changed while preparing its prompt.');if(s.prompt?.trim()&&s.rewriteSource!==s.prompt.trim())throw new Error('Your prompt changed while preparing details. Press Generate again to use the latest version.');}
  const guides=s.keys.filter(k=>k.img);step=guides.length?` · ${guides.length} keyframes → LTX-Video`:' · text → LTX-Video';const r=await localGeneration.shot(guides.map(k=>({image:k.img,t:k.anchor==='end'?s.d:k.anchor==='start'?0:k.t})),shotPrompt(s,reviewed),s.d,s.seed??7,{frames:s.renderFrames||Math.max(9,Math.min(121,Math.round(s.d*(s.fps||24)/8)*8+1)),fps:s.fps||24,...(s.renderWidth||s.renderHeight?{width:s.renderWidth||+$('#videoWidth').value,height:s.renderHeight||+$('#videoHeight').value}:{})});s.video=r.url;if(s.audioLinked!==false){delete s.audio;delete s.audioDuration}s.d=r.duration||s.d;s.fps=r.fps||s.fps||24;s.renderFrames=r.frames;s.keys.forEach(k=>k.t=k.anchor==="end"?s.d:Math.min(k.t,s.d));s.r=true;pushHist({kind:'shot',url:r.url,label:`${s.n} · ${r.frames} frames`,shotId:shotId(s),duration:s.d});if(s.audioLinked!==false&&s.audioPrompt?.trim()){step=' · generating audio';try{await renderAudio(s)}catch(e){r.audioError=e.message;toast('Video ready; audio failed: '+e.message)}}if(touring()&&s.id===onboarding.shotId){if(onboarding.step==='image-video'&&guides.length){advanceTour('done')}else if(onboarding.step==='prompt'&&!guides.length){onboarding.firstVideo=s.video;advanceTour('keyframes')}else if(onboarding.step==='regenerate'&&guides.length>=2)advanceTour('done')}return r})}
async function fake(msgs,ms){const ov=$('#ov');ov.style.display='flex';const t0=performance.now();await new Promise(res=>{(function tick(){const p=Math.min(1,(performance.now()-t0)/ms);$('#pb').style.width=p*100+'%';$('#ovt').textContent=msgs[Math.min(msgs.length-1,p*msgs.length|0)];p<1?requestAnimationFrame(tick):res()})()});ov.style.display='none'}
const promptAssistant=mountPromptAssistant(()=>SH[cur],()=>{head();save()},shot=>SH.includes(shot));
function focusPromptField(id){if(id!=='shotPromptInput')dispatchEvent(new Event('osh-open-prompt-advanced'));$('#'+id)?.scrollIntoView({block:'nearest'});$('#'+id)?.focus()}
$('#gen').onclick=async()=>{if($('#ov').style.display==='flex'||$('#kgo').disabled)return;const s=SH[cur];
 if(!$('#videoFrames').reportValidity()||!$('#videoFPS').reportValidity())return;
 if(OSH.online){try{const r=await realShot(cur,`Generating shot ${cur+1}`);timeline();head();toast(r.audioError?`Video ready; audio failed: ${r.audioError}`:`Shot ${cur+1} generated${s.audio?" with audio":""}`)}catch(e){toast('Generation failed: '+e.message)}return}
 toast('Start ComfyUI on port 8188, then refresh local models')};
$('#genAll').onclick=async()=>{const todo=SH.filter(s=>!s.r);if(!todo.length)return toast('Nothing to generate');
 if(OSH.online){try{for(const s of todo){const i=SH.indexOf(s);await realShot(i,`Shot ${i+1} of ${SH.length}`);timeline();head()}toast('All shots generated')}catch(e){toast('Generation failed: '+e.message)}return}
 toast('Start ComfyUI on port 8188, then refresh local models')};
// ---------- keyframe generator ----------
const ELS=[['mia','👧 Mia',1],['bolt','🤖 Bolt',1],['yard','🏚 Junkyard',0],['street','🏙 Street',0],['room','🛏 Mia\'s room',1]],PLACES=['yard','street','room'];
const FR=[['wide','Wide',.6],['medium','Medium',1.3],['close','Close',2.4]];let frm='medium';
renderView($('#els'),h(Chips,{items:ELS.map(([key,name,selected])=>({key,name,selected}))}));
renderView($('#frm'),h(Chips,{items:FR.map(([key,name])=>({key,name,selected:key===frm}))}));
$('#els').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;if(PLACES.includes(c.dataset.k))$$('#els .chip').forEach(x=>{if(PLACES.includes(x.dataset.k))x.classList.toggle('on',x===c)});else c.classList.toggle('on')};
$('#frm').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;frm=c.dataset.k;$$('#frm .chip').forEach(x=>x.classList.toggle('on',x===c))};
function specFromUI(){const on=k=>$(`#els [data-k=${k}]`).classList.contains('on'),p=$('#kp').value.toLowerCase();
 return SP({mia:on('mia'),bolt:on('bolt'),scene:on('street')?'street':on('room')?'room':'yard',scale:FR.find(f=>f[0]===frm)[2],night:/night|dark|midnight/.test(p),dawn:/dawn|first light|morning|sunrise/.test(p),eyes:/glow|eyes|wake|light/.test(p),carry:/carr|holds|holding/.test(p)})}
$('#kgo').onclick=async()=>{const base=touring()?SP({mia:false,bolt:false,scene:''}):specFromUI();$('#kgo').disabled=true;$('#kgo').textContent='Generating…';
 if(OSH.online){const p=$('#kp').value,prompt=workspaceMode==='image'||touring()?p:keyPrompt(base,p),batch=Array.from({length:workspaceMode==='image'?1:keyframeBatch}).map(()=>({spec:base,u:.5,p,pending:true}));results=batch.concat(results).slice(0,12);res();
  try{for(const [j,v] of batch.entries()){const r=await localGeneration.keyframe(prompt,Math.floor(Math.random()*1e6));v.img=r.url;v.pending=false;if(touring()&&['keyframes','add'].includes(onboarding.step)){onboarding.images.push(r.url);SC.set('osh-onboarding',onboarding);if(onboarding.images.length>=2)advanceTour('add')}if(workspaceMode==='image'){imageDraft={prompt:p,url:r.url,spec:base};saveWorkshop();syncWorkspace()}pushHist({kind:'keyframe',url:r.url,label:p});if(touring()&&onboarding.step==='image')advanceTour('image-review');$('#kgo').textContent=`Image ${j+1}/${batch.length} ready`;res()}}
  catch(e){toast('Keyframe generation failed: '+e.message);results=results.filter(v=>!v.pending);res()}
  $('#kgo').disabled=false;$('#kgo').textContent=workspaceMode==='image'?'Generate image':'Generate '+keyframeBatch+' keyframe'+(keyframeBatch===1?'':'s');return}$('#kgo').disabled=false;$('#kgo').textContent=workspaceMode==='image'?'Generate image':'Generate '+keyframeBatch+' keyframe'+(keyframeBatch===1?'':'s');toast('Start ComfyUI on port 8188, then refresh local models');return};
function res(){renderView($('#res'),h(Results,{items:results,bind:(d,index)=>{const v=results[index];drawKey(d.firstChild.getContext('2d'),v,2,0);d.ondragstart=e=>{dragV=v;e.dataTransfer.setData('text/plain','keyframe');e.dataTransfer.effectAllowed='copy'};d.ondragend=()=>dragV=null;d.onclick=()=>{if(workspaceMode==='image'){imageDraft={...imageDraft,url:v.img};saveWorkshop();syncWorkspace();return}const[i,lt]=keyTarget();addKey(i,lt,v)}}}))}

function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.style.opacity=0,1700);setTimeout(()=>d.remove(),2100)}
// ---------- loop: one playhead across the whole sequence ----------
const audioPlayers=new Map();
const g=K.canvas($('#cv'),W,H);let last=performance.now();
addEventListener('resize',()=>timeline());
K.loop(t=>{const now=performance.now(),dt=(now-last)/1000;last=now;if(playing){const[a,b]=span();if(G<a)G=a;G+=dt;if(G>=b-.01){G=b-.01;setPlaying(false)}}
 const[i,lt]=clipSelected&&!playing?[cur,Math.max(0,Math.min(SH[cur].d-.001,G-start(cur)))]:at(G),s=SH[i];
 const vid=$('#vid');if(s.r&&s.video){if(!vid.src.endsWith(s.video)){vid.src=s.video;vid.currentTime=lt}vid.style.display='block';
  if(playing){if(vid.paused)vid.play().catch(()=>{});if(Math.abs(vid.currentTime-lt)>.35)vid.currentTime=lt}else{vid.pause();if(Math.abs(vid.currentTime-lt)>.001)vid.currentTime=lt}}
 else{if(vid.style.display!=='none'){vid.pause();vid.style.display='none'}}
 frameCaptureState();
 for(const [index,shot] of SH.entries()){const id=shotId(shot),begin=shot.audioLinked===false?shot.audioStart??start(index):start(index),duration=shot.audioLinked===false?shot.audioDuration||shot.d:shot.d,local=G-begin;let player=audioPlayers.get(id);if(!player&&shot.audio){player=new Audio();player.preload='auto';audioPlayers.set(id,player)}if(!player)continue;if(playing&&workspaceMode==='video'&&shot.audio&&!shot.audioMuted&&local>=0&&local<duration){if(!player.src.endsWith(shot.audio)){player.src=shot.audio;player.currentTime=local}if(Math.abs(player.currentTime-local)>.2)player.currentTime=local;if(player.paused)player.play().catch(()=>{})}else player.pause()}for(const[id,player]of audioPlayers)if(!SH.some(shot=>shot.id===id)){player.pause();audioPlayers.delete(id)}
 shotFrame(g,s,lt,t);if(!s.r)mute(g);
 const em=workspaceMode==='video'&&!s.r;$('#empty').style.display=em?'block':'none';$('#tag').style.visibility=$('#tc').style.visibility=em?'hidden':'visible';$('#gen').classList.toggle('nudge',em);if($("#nextVideo"))$("#nextVideo").hidden=workspaceMode!=='video'||!SH[cur].r||touring();updateGenerateArrow(em&&!touring()&&$('#ov').style.display!=='flex');if(lt<.2&&i>0&&playing&&open==null){g.fillStyle=`rgba(0,0,0,${1-lt/.2})`;g.fillRect(0,0,W,H)}
 $('#tag').textContent=s.r?`Shot ${i+1} · generated${s.video?' · LTX-Video':''}`:`Shot ${i+1} · keyframe preview — generate for real motion`;$('#tc').textContent=clipSelected||open!=null?`${lt.toFixed(1)} / ${+s.d.toFixed(3)}s`:`${G.toFixed(1)} / ${+tot().toFixed(3)}s`;
 if($('#viewerTime')&&document.activeElement!==$('#viewerTime'))$('#viewerTime').value=Math.min(SH[cur].d,Math.max(0,G-start(cur))).toFixed(3);
 $('#gph').style.left=((open!=null?G-start(open):G)*pxs+$('#ruler').offsetLeft)+'px';$('#gph').setAttribute('aria-label',`Playhead ${G.toFixed(1)} seconds`);SHELL.select(media())});
// Coming back from Edit Anything with an edited keyframe
const precisionBack=SC.get('osh-precision-return');SC.set('osh-precision-return',null);
if(precisionBack){const ref=precisionBack.ref;const index=ref?.shotId?SH.findIndex(s=>s.id===ref.shotId):ref?.shot;const key=SH[index]?.keys?.[ref?.key];if(key&&key.img===precisionBack.source){key.img=precisionBack.url;SH[index].r=false;cur=index;open=index;selKey=key;G=start(index)+Math.min(key.t,SH[index].d-.001);pushHist({kind:'keyframe',url:precisionBack.url,label:'Precision edit · '+(precisionBack.label||SH[index].n)})}else if(imageDraft.url===precisionBack.source){imageDraft.url=precisionBack.url;saveWorkshop();pushHist({kind:'keyframe',url:precisionBack.url,label:'Precision edit'})}else toast('Original selection changed. The edited image is saved in Edit versions.');}
const videoBack=SC.get('osh-video-edit-return');SC.set('osh-video-edit-return',null);
if(videoBack){const i=SH.findIndex(s=>s.id===videoBack.ref?.shotId);if(i>=0&&SH[i].video===videoBack.original){const s=SH[i];s.video=videoBack.video;if(videoBack.audioEdited){s.audio=videoBack.audio;s.audioPrompt=videoBack.audioPrompt;s.audioMuted=false;s.audioDuration=videoBack.duration}else if(s.audioLinked!==false)s.audio=videoBack.hasAudio?s.video:undefined;s.d=Math.max(.1,Math.min(60,+videoBack.duration||s.d));s.keys.forEach(k=>k.t=Math.min(k.t,s.d));s.r=true;cur=i;G=Math.min(G,tot()-.01);pushHist({kind:'shot',url:s.video,label:s.n+' · edited video',audio:s.audio,shotId:s.id,duration:s.d})}else toast('Original shot changed; edited video is still available in Edit Anything.')}
const back=SC.get('osh-edit-return');SC.set('osh-edit-return',null);
if(back&&SH[back.shot]&&SH[back.shot].keys[back.key]){const k=SH[back.shot].keys[back.key];k.spec=back.spec;SH[back.shot].r=false;cur=back.shot;open=back.shot;selKey=k;G=start(cur)+Math.min(k.t,SH[cur].d-.01);playing=false;setTimeout(()=>toast(`Keyframe updated with ${back.n} edit${back.n===1?'':'s'} from Edit Anything`),300)}
setInterval(save,1000);addEventListener('beforeunload',save);
// Opened from another workflow with a keyframe/shot: select it.
const inc=new URLSearchParams(location.search).get('from')?SC.get('osh-handoff'):null;SC.set('osh-handoff',null);
if(inc&&inc.ref&&SH[inc.ref.shot]){cur=inc.ref.shot;if(inc.type==='keyframe')open=inc.ref.shot;selKey=SH[cur].keys[inc.ref.key]||null;G=start(cur)+(selKey?Math.min(selKey.t,SH[cur].d-.01):0);playing=false}
// Stylemaxx: regenerate the selected keyframe toward the style (style description added to its prompt),
// score each candidate by palette fit, keep the best if it beats the current image.
async function stylemaxx(style,m,progress){
 if(!OSH.online)return toast('Start the local runtime to Stylemaxx');
 const workshopTarget=workspaceMode==='image';
 const s=workshopTarget?{n:'Image workshop',m:imageDraft.prompt}:SH[m.ref?.shot],k=workshopTarget?{img:imageDraft.url,spec:SP({mia:false,bolt:false,scene:''})}:s?.keys[m.ref?.key];if(!k?.img)return toast('Select a generated keyframe first');
 const base=await SHELL.styleFit(k.img,style);let best={url:k.img,fit:base};const N=3;
 for(let j=0;j<N;j++){progress(`Stylemaxxing ${j+1}/${N} · best ${Math.round(best.fit*100)}%`);
  const r=await localGeneration.keyframe(`${keyPrompt(k.spec,s.m)}. ${style.prompt||style.n}`,Math.floor(Math.random()*1e6));const f=await SHELL.styleFit(r.url,style);
  pushHist({kind:'keyframe',url:r.url,label:`${s.n} · stylemaxx ${style.n} · fit ${Math.round(f*100)}%`});if(f>best.fit)best={url:r.url,fit:f}}
 if(best.url!==k.img){k.img=best.url;if(workshopTarget){imageDraft.url=best.url;saveWorkshop();syncWorkspace()}else{s.r=false;timeline();head();save()}toast(`Image restyled: fit ${Math.round(base*100)}% → ${Math.round(best.fit*100)}% (others are in history)`)}
 else toast(`No candidate beat the current keyframe (${Math.round(base*100)}%). Tries are in history.`)}
SHELL.mount({app:'director',elementHint:'click to use in keyframe',
 mediaPool:()=>{const seen=new Set(),out=[];for(const h of HISTORY)if(h.kind==='keyframe'&&!seen.has(h.url)){seen.add(h.url);out.push({url:h.url,label:h.label})}
  for(const s of SH)for(const k of s.keys)if(k.img&&!seen.has(k.img)){seen.add(k.img);out.push({url:k.img,label:s.n})}return out},
 onStylemaxx:stylemaxx,
 beforeOpen:()=>save(),
 onLook:(l,s2,commit)=>{look=l;str=s2;$('#lookUse').textContent=l.n;if(commit){SH.forEach(x=>x.r=false);timeline();head();res()}},
 onElement:e=>{const input=$('#'+lastPrompt);input.setRangeText('@'+e.n+' ',input.selectionStart,input.selectionEnd,'end');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}});
function markEls(){SHELL.mark($$('#els .chip.on').map(c=>c.dataset.k))}
$('#els').addEventListener('click',()=>setTimeout(markEls));
mountModels();
const viewer=document.querySelector('.viewer'),composer=document.querySelector('.composer');
const seedInput=$('#videoSeed');seedInput.onchange=()=>{if(seedInput.reportValidity()){SH[cur].seed=+seedInput.value;save()}};
$('#previousFrame').onclick=()=>viewerSeek(Math.max(0,G-start(cur)-1/(SH[cur].fps||24)));$('#nextFrame').onclick=()=>viewerSeek(G-start(cur)+1/(SH[cur].fps||24));$('#viewerTime').onchange=e=>{if(e.target.reportValidity())viewerSeek(+e.target.value)};
$('#editViewer').onclick=()=>{const s=SH[cur];if(!s.video)return;SC.set('osh-handoff',{type:'shot',label:s.n,video:s.video,audio:s.audio,audioPrompt:s.audioPrompt,audioLinked:s.audioLinked,duration:s.d,ref:{shot:cur,shotId:shotId(s)},from:'director'});location.href='/studio/edit?from=director'};
$('#captureKeyframe').onclick=async()=>{
 if(capturingFrame)return;
 const [i]=clipSelected&&!playing?[cur]:at(G),s=SH[i],video=$('#vid'),url=s.video;
 if(workspaceMode!=='video'||!s.r||!url||!video.src.endsWith(url))return;
 setPlaying(false);video.pause();
 const t=Math.min(s.d,Math.max(0,video.currentTime));
 if(keyframeAtFrame(s.keys,t,s.fps||24))return;
 capturingFrame=true;frameCaptureState();
 try{
  const image=captureViewerFrame(video),result=await OSH.upload(image);
  const index=SH.indexOf(s);if(index<0||s.video!==url)throw new Error('The scene changed while saving. Try again on its current video.');
  if(keyframeAtFrame(s.keys,t,s.fps||24))return;
  const key={t,u:.5,spec:s.spec,img:result.url,...(t<.5/(s.fps||24)?{anchor:'start'}:{})};
  s.keys.push(key);cur=index;open=index;selKey=key;clipSelected=true;selectedTrack='video';G=start(index)+Math.min(t,s.d-.001);
  timeline();head();save();toast(`Video frame added as a keyframe at ${t.toFixed(3)}s`);
 }catch(error){toast('Could not save this frame: '+error.message)}finally{capturingFrame=false;frameCaptureState()}
};

SH.forEach(s=>{s.renderWidth??=+$('#videoWidth').value;s.renderHeight??=+$('#videoHeight').value});
addEventListener('osh-video-size',e=>{SH[cur].renderWidth=e.detail.width;SH[cur].renderHeight=e.detail.height;trackAttributes();save()});

const batchSlider=$('#keyframeBatch');batchSlider.value=String([1,2,4].indexOf(keyframeBatch));
const updateBatch=()=>{keyframeBatch=[1,2,4][+batchSlider.value];$('#keyframeBatchValue').textContent=String(keyframeBatch);batchSlider.setAttribute('aria-valuetext',`${keyframeBatch} keyframe${keyframeBatch===1?'':'s'}`);if(!$('#kgo').disabled)$('#kgo').textContent=workspaceMode==='image'?'Generate image':`Generate ${keyframeBatch} keyframe${keyframeBatch===1?'':'s'}`;saveWorkshop()};batchSlider.oninput=updateBatch;updateBatch();
const workflowBar=document.querySelector('.workflow-switch');
$('#res').tabIndex=0;
$('#showVideoAttributes').onclick=()=>{const panel=$('#videoAttributes');panel.open=true;viewer.scrollIntoView({block:'start'});$('#videoWidth').focus({preventScroll:true})};
const imageStage=document.querySelector('.image-stage'),videoNext=$('#nextVideo');
function setWorkflow(mode){if(document.getElementById("kgo").disabled||document.getElementById("ov").style.display==="flex")return;if(playing)setPlaying(false);workspaceMode=mode;$('#kp').value=imageDraft.prompt||'';$('#kgo').textContent=mode==='image'?'Generate image':'Generate '+keyframeBatch+' keyframe'+(keyframeBatch===1?'':'s');saveWorkshop();syncWorkspace();head();document.dispatchEvent(new CustomEvent('osh-workflow-changed',{detail:mode}))}
workflowBar.onclick=e=>{const mode=e.target.closest('[data-workflow]')?.dataset.workflow;if(mode)setWorkflow(mode)};
$('#kp').value=imageDraft.prompt||'';$('#kp').addEventListener('input',()=>{imageDraft.prompt=$('#kp').value;saveWorkshop()});
$('#animateImage').onclick=()=>{setWorkflow('video');const spec=SP({mia:false,bolt:false,scene:''});SH[cur].prompt=imageDraft.prompt;SH[cur].spec=spec;const existing=SH[cur].keys.find(k=>k.anchor==='start'||k.t===0);if(existing){existing.img=imageDraft.url;existing.spec=spec;existing.anchor='start';SH[cur].r=false;selKey=existing;open=cur}else{addKey(cur,0,{img:imageDraft.url,spec,u:.5});SH[cur].keys.at(-1).anchor='start'}timeline();head();save();syncWorkspace();if(touring()&&onboarding.entry==='image')advanceTour('image-video');focusPromptField('motion')};
$('#editWorkshopImage').textContent='Download image';$('#editWorkshopImage').onclick=()=>{const link=document.createElement('a');link.href=imageDraft.url;link.download='image.png';link.click()};
$('#growFilm').onclick=()=>{cinema=true;SH.push({n:`Scene ${SH.length+1}`,d:4,spec:SP({mia:false,bolt:false,scene:''}),m:'',keys:[],r:false});cur=SH.length-1;shotId(SH[cur]);open=null;G=start(cur);selKey=null;syncWorkspace();timeline();head();save();$('#shotPromptInput').focus()};
syncWorkspace();$('#kgo').textContent=workspaceMode==='image'?'Generate image':'Generate '+keyframeBatch+' keyframe'+(keyframeBatch===1?'':'s');
if(touring()&&onboarding.images?.length){results=onboarding.images.map(url=>({img:url,spec:SH.find(s=>s.id===onboarding.shotId)?.spec||SP({}),u:.5,p:imageDraft.prompt}));res()}
editHistory=mountEditHistory(
 ()=>JSON.parse(JSON.stringify({SH,STASH,TRASH,imageDraft,keyframeBatch})),
 state=>{const id=SH[cur]?.id;setPlaying(false);SH.splice(0,SH.length,...state.SH);STASH=state.STASH;TRASH=state.TRASH;imageDraft=state.imageDraft;keyframeBatch=state.keyframeBatch;cur=Math.max(0,SH.findIndex(s=>s.id===id));open=null;selKey=null;clipSelected=true;selectedTrack='video';G=start(cur);$('#kp').value=imageDraft.prompt||'';batchSlider.value=String([1,2,4].indexOf(keyframeBatch));updateBatch();saveWorkshop();syncWorkspace();timeline();head();stashUI();trashUI();save()},
 ()=>$('#ov').style.display==='flex'||$('#kgo').disabled||!!cancelShotDrag||!!dragV
);
editHistory.element.id='studioEditHistory';document.body.append(editHistory.element);
mountWorkspaceDock(()=>{timeline();head()},setWorkflow);
onboardingUI=mountOnboardingTour({
 get:()=>onboarding,set:state=>{onboarding=state},save:()=>{if(onboarding&&ownsTour('director',onboarding.entry))SC.set('osh-onboarding',onboarding)},
 current:()=>workflowForSetup(document.querySelector('[aria-label="Workspace setup"]')?.value||'Video',workspaceMode),
 begin:entry=>({step:entry==='image'?(imageDraft.url?'image-review':'image'):entry==='director'?(results.filter(r=>r.img).length>=2?'add':'keyframes'):entry==='3d'?'3d':entry==='rendering'?'render-settings':entry==='edit'?'edit-settings':SH[cur].r?'keyframes':'prompt',shotId:shotId(SH[cur]),images:results.filter(r=>r.img).map(r=>r.img),dismissed:false,entry}),
 choose:entry=>{if(entry==='edit'){SHELL.open('edit');return}setWorkflow(entry==='image'?'image':'video');document.dispatchEvent(new CustomEvent('osh-workspace-select',{detail:({image:'Image',video:'Video','3d':'3D',director:'Director',rendering:'Rendering'})[entry]}))}
});
const requestedTour=sessionStorage.getItem('osh-requested-workflow');if(requestedTour){sessionStorage.removeItem('osh-requested-workflow');onboardingUI.visit(requestedTour)}
timeline();head();markEls();histUI();save();if(!playing)setPlaying(false);

import './projects.css';
