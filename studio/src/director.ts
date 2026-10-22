// @ts-nocheck  (ported from inline JS; type it as we go)
import '../../shared/lib/kit.js';
import '../../shared/styleboard/looks.js';
import { SC } from './scene';
import { mountProjects } from './projects';
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
let STASH=saved?.STASH||[],TRASH=saved?.TRASH||[],HISTORY=saved?.HISTORY||[];const workshop=SC.get('osh-workspace')||{};
let workspaceMode=workshop.mode||'video',imageDraft=workshop.image||{prompt:'',url:null},cinema=SH.length>1;
function saveWorkshop(){SC.set('osh-workspace',{mode:workspaceMode,image:imageDraft})}
function syncWorkspace(){document.body.dataset.workflow=workspaceMode;document.body.classList.toggle('single-scene',!cinema);document.querySelectorAll('[data-workflow]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.workflow===workspaceMode)));$('#imageHero').src=imageDraft.url||'';$('#imageHero').hidden=!imageDraft.url;$('#imageWelcome').hidden=!!imageDraft.url;$('#nextImage').hidden=!imageDraft.url;$('#nextVideo').hidden=!SH[cur]?.r;}
// Stable identities keep takes attached when shots move, including through stash/trash.
function shotId(s: {id?: string}): string {return s.id??=crypto.randomUUID()}
const storedShots=[...SH,...STASH.map(it=>it.shot),...TRASH.map(it=>it.shot)];
storedShots.forEach(s=>{shotId(s);s.keys.forEach(k=>{if(!k.anchor&&k.t===0)k.anchor='start';else if(!k.anchor&&k.t>=s.d)k.anchor='end'})});
// Old history only stored a sequence index. Match the current video first;
// unresolved entries stay unavailable rather than risking another shot's take.
HISTORY.forEach(h=>{if(h.kind==='shot'&&!h.shotId){const s=storedShots.find(s=>s.video===h.url);if(s)h.shotId=shotId(s)}});
function save(){SC.set('osh-director',{SH,cur,G,STASH,TRASH,HISTORY})}
// Generation history: every keyframe/shot the GPU made, newest first. Click to reuse.
function pushHist(e){HISTORY.unshift({...e,at:Date.now()});HISTORY=HISTORY.slice(0,80);histUI();save()}
function ago(t){const m=Math.round((Date.now()-t)/60000);return m<1?'just now':m<60?m+' min ago':Math.round(m/60)+' h ago'}
function histUI(){const el=$('#hist');if(!el)return;el.innerHTML=`<div class="hh">Generation history <span>${HISTORY.length?HISTORY.length+' · click a keyframe to add it to the selected shot, a shot to use it as that shot\'s take':''}</span></div><div class="hs"></div>`;
 const hs=el.querySelector('.hs');if(!HISTORY.length){hs.innerHTML='<span class="none">Everything you generate shows up here.</span>';return}
 HISTORY.forEach(h=>{const b=document.createElement('button');b.className='hc';b.title=h.label;
  b.innerHTML=(h.kind==='shot'?`<video src="${h.url}#t=0.5" muted preload="metadata"></video>`:`<img src="${h.url}" loading="lazy">`)+`<div><span class="kind">${h.kind}</span><small>${h.label}</small><small>${ago(h.at)}</small></div>`;
  if(h.kind==='shot'){const v=b.querySelector('video');b.onmouseenter=()=>v.play().catch(()=>{});b.onmouseleave=()=>{v.pause();v.currentTime=.5}}
  b.onclick=()=>{if(h.kind==='shot'){const i=SH.findIndex(s=>s.id===h.shotId);if(i<0)return toast('Restore the original shot to the sequence to use this take');const s=SH[i];s.video=h.url;if(h.duration){s.d=h.duration;s.keys.forEach(k=>k.t=Math.min(k.t,s.d))}s.r=true;cur=i;open=open==null?null:i;selKey=null;G=start(cur);timeline();head();save();toast(`Using this take for ${s.n}`)}
   else{if(workspaceMode==='image'){imageDraft={...imageDraft,url:h.url};saveWorkshop();syncWorkspace();return}const[i,lt]=keyTarget();addKey(i,lt,{spec:(SH[i].keys[0]||SH[i]).spec,u:.5,img:h.url})}};hs.append(b)})}
let cur=saved?.cur||0,selKey=null,G=saved?.G||0,playing=false,pxs=1,results=[],dragV=null;
const tot=()=>SH.reduce((a,s)=>a+s.d,0),start=i=>SH.slice(0,i).reduce((a,s)=>a+s.d,0);
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
function selectClip(i){cur=i;selKey=null;$$('#trk>.clip').forEach((el,j)=>{el.classList.toggle('on',j===i);el.setAttribute('aria-selected',String(j===i));el.tabIndex=j===i?0:-1});head();save()}
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
function openShot(i){open=i;cur=i;selKey=null;G=start(i);timeline();head()}
function closeShot(){const i=open;open=null;selKey=null;if(i!=null)G=start(i);timeline();head()}
addEventListener('osh-model-control',e=>{if(e.detail==='timeline'){openShot(cur);$('#addKeyBtn').focus();$('#tl').scrollIntoView({block:'nearest'})}});
function timeline(){stashUI();const trk=$('#trk'),W0=$('#tl').clientWidth;$('#addKeyBtn').style.display=open==null?'none':'';trk.innerHTML='';trk.classList.toggle('scene',open!=null);
 trk.ondragover=trk.ondragleave=trk.ondrop=null;
 trk.setAttribute('role',open==null?'listbox':'group');trk.setAttribute('aria-label',open==null?'Sequence clips':'Shot keyframes');
 if(open!=null&&!SH[open])open=null;
 if(open==null){ // ---- sequence: shots act as videos
  const T=tot();pxs=(W0-50)/T;$('#tot').textContent=`${SH.length} shots · ${T}s`;$('#crumb').innerHTML='<b>Sequence</b>';
  $('#hintT').textContent='click to select · double-click to open · drag to reorder · scrub the ruler';
  $('#ruler').innerHTML=[...Array(Math.floor(T)+1)].map((_,k)=>`<span style="left:${k*pxs}px">${k}s</span>`).join('');
  SH.forEach((s,i)=>{const c=document.createElement('div');c.className='clip'+(i===cur?' on':'');c.style.width=(s.d*pxs-3)+'px';
   c.setAttribute('role','option');c.setAttribute('aria-label',`Shot ${i+1}: ${s.n}`);c.setAttribute('aria-selected',String(i===cur));c.tabIndex=i===cur?0:-1;
   c.innerHTML=`<canvas class="strip" width="${Math.max(10,s.d*pxs|0)}" height="80"></canvas><span class="lbl"><i class="${s.r?'ok':''}"></i>${i+1} · ${s.n} · ${s.d}s<span class="act"><button class="tw" title="Open this shot">Open ▸</button><button data-a="stash" title="Move to stash">⇣</button><button data-a="del" title="Delete (goes to trash)">✕</button></span></span><div class="grip" title="Drag to trim"></div>`;
   strip(c,s);
   c.querySelector('.tw').onclick=ev=>{ev.stopPropagation();openShot(i)};
   c.querySelector('[data-a=stash]').onclick=ev=>{ev.stopPropagation();removeShot(i,'stash')};
   c.querySelector('[data-a=del]').onclick=ev=>{ev.stopPropagation();removeShot(i,'trash')};
   shotPointerDrag(c,'seq',i);
   c.onclick=ev=>{if(performance.now()<suppressClipClickUntil||ev.target.closest('.grip,.tw,.act'))return;selectClip(i)};
   c.onkeydown=ev=>{if(ev.target!==c)return;if(ev.key==='Enter'){ev.preventDefault();openShot(i)}else if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'){ev.preventDefault();selectClip(Math.max(0,Math.min(SH.length-1,i+(ev.key==='ArrowLeft'?-1:1))));$$('#trk>.clip')[cur].focus()}};
   c.ondblclick=ev=>{if(ev.target.closest('.grip,.tw,.act'))return;openShot(i)};
   trim(c,s);dropTarget(c,i);trk.append(c)});
  const a=document.createElement('button');a.className='addclip';a.textContent='＋';a.title='Add shot';
  a.onclick=()=>{SH.push({n:'New',d:3,spec:SP({scene:SH[cur].spec.scene}),m:'',r:false,keys:[]});openShot(SH.length-1);toast('Write a prompt and generate, or add optional keyframes')};trk.append(a);
  trk.ondragover=ev=>{if(!dragShot)return;ev.preventDefault();ev.dataTransfer.dropEffect='move';insertionCue(ev.clientX)};
  trk.ondragleave=ev=>{if(!trk.contains(ev.relatedTarget)){trk.classList.remove('dropzone');trk.querySelector('.insert-line')?.remove()}};
  trk.ondrop=ev=>{if(!dragShot)return;ev.preventDefault();const r=trk.getBoundingClientRect();insertDraggedShot(insertionIndex(SH.map(s=>s.d),(ev.clientX-r.left)/pxs))};
  return}
 // ---- one shot opened
 const i=open,s=SH[i];pxs=(W0-6)/s.d;$('#tot').textContent=`${s.d}s · ${s.keys.length} keyframe${s.keys.length===1?'':'s'}`;
 $('#crumb').innerHTML=`<a id="toSeq">Sequence</a> › <b>Shot ${i+1} · ${s.n}</b>`;$('#toSeq').onclick=closeShot;
 $('#hintT').textContent='drag keys to retime · double-click a key to edit it · double-click the track or Esc to go back';
 $('#ruler').innerHTML=[...Array(Math.floor(s.d*2)+1)].map((_,k)=>`<span style="left:${k/2*pxs}px">${k%2?'·':(k/2)+'s'}</span>`).join('');
 const c=document.createElement('div');c.className='clip on';c.style.width=(s.d*pxs-3)+'px';
 c.innerHTML=`<canvas class="strip" width="${Math.max(10,s.d*pxs|0)}" height="96"></canvas><span class="lbl"><button class="tw" title="Back to the sequence">◂ Sequence</button><i class="${s.r?'ok':''}"></i>${i+1} · ${s.n}${s.r?' · generated':' · keyframes only'}</span><div class="grip" title="Drag to trim"></div>`;
 strip(c,s);c.querySelector('.tw').onclick=ev=>{ev.stopPropagation();closeShot()};
 const w=s.d*pxs-3,px=t=>Math.max(44,Math.min(w-44,t*pxs));
 s.keys.forEach(k=>{if(k.anchor==='end')k.t=s.d;else if(k.anchor==='start')k.t=0;
  const e=document.createElement('div');e.innerHTML='<canvas width="160" height="96"></canvas><span class="anchor-label"></span>';drawKey(e.firstChild.getContext('2d'),k,2,0);
  const position=()=>{e.className='k'+(k===selKey?' on':'')+(k.anchor?' anchor '+k.anchor:'');e.style.left=(k.anchor==='start'?0:k.anchor==='end'?w-80:px(k.t))+'px';e.lastChild.textContent=k.anchor==='start'?'START →':k.anchor==='end'?'→ END':'';e.title=(k.anchor?`${k.anchor} frame`:`Keyframe at ${k.t.toFixed(1)}s`)+(k.img?'':' · no image, not used for generation')+' · drag to retime';e.setAttribute('role','button');e.setAttribute('aria-label',e.title)};position();
  e.ondblclick=ev=>{ev.stopPropagation();selKey=k;editKey()};
  e.onpointerdown=ev=>{ev.stopPropagation();selKey=k;e.setPointerCapture(ev.pointerId);$$('.k').forEach(q=>q.classList.toggle('on',q===e));const xs=ev.clientX,t0=k.t;let mv=false;
   e.onpointermove=m=>{if(Math.abs(m.clientX-xs)<3&&!mv)return;mv=true;const raw=t0+(m.clientX-xs)/pxs,edge=Math.min(.15,18/pxs);k.anchor=raw<=edge?'start':raw>=s.d-edge?'end':undefined;k.t=k.anchor==='start'?0:k.anchor==='end'?s.d:Math.round(Math.min(s.d,Math.max(0,raw))*10)/10;position()};
   e.onpointerup=()=>{e.onpointermove=null;if(mv){if(k.anchor)for(const other of s.keys)if(other!==k&&other.anchor===k.anchor){delete other.anchor;other.t=k.anchor==='start'?Math.min(.2,s.d/2):Math.max(0,s.d-.2)}s.r=false;timeline()}head();save()};e.onpointercancel=()=>{e.onpointermove=null;timeline();head();save()}};c.append(e)}); c.onclick=ev=>{if(ev.target.closest('.k,.grip,.tw'))return;selKey=null;$$('.k').forEach(k=>k.classList.remove('on'));head()};
 c.ondblclick=ev=>{if(ev.target.closest('.k,.grip,.tw'))return;closeShot()};
 trim(c,s);dropTarget(c,i);trk.append(c)}
// ---------- stash (visible parking tray) and trash (discreet, restorable) ----------
let dragShot=null;
function removeShot(i,where){if(SH.length<=1)return toast('Keep at least one shot in the sequence');const selected=SH[cur],opened=open==null?null:SH[open];const [sh]=SH.splice(i,1);(where==='stash'?STASH:TRASH).unshift({shot:sh,from:i,at:Date.now()});
 open=opened&&opened!==sh?SH.indexOf(opened):null;cur=SH.includes(selected)?SH.indexOf(selected):Math.min(i,SH.length-1);selKey=null;G=Math.min(G,tot()-.01);timeline();head();save();
 toast(where==='stash'?`${sh.n} moved to the stash`:`${sh.n} deleted — restore it from 🗑 in the timeline header`)}
function restore(list,j){const opened=open==null?null:SH[open],it=list.splice(j,1)[0],idx=Math.min(it.from,SH.length);SH.splice(idx,0,it.shot);cur=idx;if(opened){open=SH.indexOf(opened);cur=open}timeline();head();save();toast(`${it.shot.n} restored`)}
function thumb(cv,sh){const g=cv.getContext('2d',{willReadFrequently:true});shotFrame(og,sh,Math.min(1,sh.d/2),2);if(!sh.r)mute(og);g.drawImage(off,0,0,cv.width,cv.height)}
function stashUI(){const el=$('#stash');el.innerHTML=`<span class="sl">Stash${STASH.length?' · '+STASH.length:''}</span><div class="items"></div>`;const items=el.querySelector('.items');
 if(!STASH.length)items.innerHTML='<span class="none">Park shots here with ⇣ on a clip. Drag them back into the sequence any time.</span>';
 STASH.forEach((it,j)=>{const d=document.createElement('div');d.className='it';d.draggable=true;d.title='Drag into the sequence, or click ↩';d.innerHTML=`<canvas width="192" height="80"></canvas><span>${it.shot.n} · ${it.shot.d}s</span><button title="Back to the sequence">↩</button>`;
  thumb(d.querySelector('canvas'),it.shot);d.querySelector('button').onclick=()=>restore(STASH,j);
  shotPointerDrag(d,'stash',j);items.append(d)});
 el.ondragover=ev=>{if(dragShot?.from!=='seq')return;ev.preventDefault();ev.dataTransfer.dropEffect='move';el.classList.add('drop')};el.ondragleave=ev=>{if(!el.contains(ev.relatedTarget))el.classList.remove('drop')};
 el.ondrop=ev=>{if(dragShot?.from!=='seq')return;ev.preventDefault();const i=dragShot.i;endShotDrag();removeShot(i,'stash')};
 const tb=$('#trashBtn');tb.textContent=TRASH.length?`🗑 ${TRASH.length}`:'';tb.style.display=TRASH.length?'':'none';if(!TRASH.length)$('#trashpop').style.display='none';else if($('#trashpop').style.display==='block')trashUI()}
function trashUI(){const p=$('#trashpop');p.innerHTML='';TRASH.forEach((it,j)=>{const r=document.createElement('div');r.className='tr';const ago=Math.max(1,Math.round((Date.now()-it.at)/60000));
  r.innerHTML=`<canvas width="96" height="54"></canvas><div>${it.shot.n} · ${it.shot.d}s<small>deleted ${ago} min ago</small></div><button>Restore</button>`;thumb(r.querySelector('canvas'),it.shot);r.querySelector('button').onclick=()=>restore(TRASH,j);p.append(r)});
 const f=document.createElement('div');f.className='foot';f.innerHTML='<span>Deleted shots stay here.</span><button>Empty trash</button>';
 f.querySelector('button').onclick=()=>{if(confirm(`Permanently remove ${TRASH.length} deleted shot(s)? This can't be undone.`)){TRASH=[];save();stashUI()}};p.append(f)}
$('#trashBtn').onclick=e=>{e.stopPropagation();const p=$('#trashpop');const on=p.style.display!=='block';p.style.display=on?'block':'none';if(on)trashUI()};
addEventListener('click',e=>{if(!e.target.closest('#trashpop,#trashBtn'))$('#trashpop').style.display='none'});
function strip(c,s){const cv=c.querySelector('.strip'),sg=cv.getContext('2d'),h=cv.height,tw=h*16/9;for(let x=0;x<cv.width;x+=tw){shotFrame(og,s,Math.min(s.d,(x+tw/2)/pxs),2);if(!s.r)mute(og);sg.drawImage(off,x,0,tw,h)}}
function trim(c,s){const gr=c.querySelector('.grip');gr.onpointerdown=ev=>{ev.preventDefault();ev.stopPropagation();gr.setPointerCapture(ev.pointerId);const x0=ev.clientX,d0=s.d,p0=pxs;
  gr.onpointermove=m=>{s.d=Math.max(1,Math.min(8,Math.round(d0+(m.clientX-x0)/p0)));c.style.width=(s.d*p0-3)+'px'};
  gr.onpointerup=()=>{gr.onpointermove=null;s.keys.forEach(k=>k.t=Math.min(k.t,s.d));if(s.d!==d0)s.r=false;G=Math.min(G,tot()-.01);timeline();head()}}}
function dropTarget(el,i){const s=SH[i];el.ondragover=ev=>{if(!dragV)return;ev.preventDefault();el.classList.add('drop')};el.ondragleave=()=>el.classList.remove('drop');
 el.ondrop=ev=>{ev.preventDefault();el.classList.remove('drop');if(!dragV)return;const r=el.getBoundingClientRect();addKey(i,Math.round(Math.min(s.d,Math.max(0,(ev.clientX-r.left)/pxs))*10)/10,dragV)}}
$('#ruler').onpointerdown=e=>{const seek=ev=>{const r=$('#ruler').getBoundingClientRect(),x=Math.max(0,(ev.clientX-r.left)/pxs);
  if(open!=null){G=start(open)+Math.min(SH[open].d-.01,x)}else{G=Math.min(tot()-.01,x)}head()};seek(e);$('#ruler').setPointerCapture(e.pointerId);$('#ruler').onpointermove=seek};
$('#ruler').onpointerup=()=>$('#ruler').onpointermove=null;
addEventListener('keydown',e=>{if(!e.defaultPrevented&&e.key==='Escape'&&open!=null&&!/TEXTAREA|INPUT/.test(e.target.tagName))closeShot()});
function media(){if(workspaceMode==='image')return{type:'keyframe',label:'Image workshop',img:imageDraft.url,spec:SP({}),u:.5};const s=SH[cur];if(selKey&&s.keys.includes(selKey))return{type:'keyframe',label:`Shot ${cur+1} · keyframe @ ${selKey.t.toFixed(1)}s`,spec:selKey.spec,u:selKey.u,img:selKey.img,ref:{shot:cur,key:s.keys.indexOf(selKey)}};
 return{type:'shot',label:`Shot ${cur+1} · ${s.n} · ${s.d}s`,spec:(s.keys[0]||s).spec,u:.3,video:s.r?s.video:undefined,duration:s.d,ref:{shot:cur,shotId:shotId(s)}}}
function head(){const s=SH[cur];cinema=SH.length>1;document.body.classList.toggle("single-scene",!cinema);document.body.classList.toggle('has-guides',s.keys.some(k=>k.img));SHELL.select(media());$('#sNum').textContent=`Shot ${cur+1} — `;if(document.activeElement!==$('#sName'))$('#sName').textContent=s.n;$('#sMeta').textContent=`${s.d}s · ${s.keys.length} keyframe${s.keys.length===1?'':'s'}`;
 estimateContext(s.d,0);
 if(document.activeElement!==$('#shotPromptInput'))$('#shotPromptInput').value=s.prompt||'';
 $('#sState').innerHTML=s.r?'<span style="color:var(--ok)">● generated</span>':'<span style="color:var(--dim)">○ keyframes only</span>';if(document.activeElement!==$('#motion'))$('#motion').value=s.m;dispatchEvent(new Event('osh-prompt-values'))}
function addKey(i,t,v){const s=SH[i],k={t,u:v.u,spec:v.spec,img:v.img};open=i;s.keys.push(k);selKey=k;cur=i;s.r=false;G=start(i)+Math.min(t,s.d-.01);playing=false;$('#play').textContent='▶';timeline();head();toast(`Keyframe added to shot ${i+1} at ${t.toFixed(1)}s`)}
function delKey(){if(!selKey&&open==null)return removeShot(cur,'trash');if(!selKey)return toast('Select a keyframe first');SH.forEach(s=>{const j=s.keys.indexOf(selKey);if(j>=0){s.keys.splice(j,1);s.r=false}});selKey=null;timeline();head()}
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
addEventListener('keydown',e=>{if(/TEXTAREA|INPUT/.test(e.target.tagName))return;if(e.key==='Backspace'||e.key==='Delete')delKey();if(e.code==='Space'){e.preventDefault();$('#play').click()}});
$('#motion').oninput=e=>{SH[cur].m=e.target.value;if(SH[cur].r){SH[cur].r=false;timeline()}head();save()};
$('#shotPromptInput').oninput=e=>{SH[cur].prompt=e.target.value;if(SH[cur].r){SH[cur].r=false;timeline()}head();save()};
// Starts paused. Play runs to the end (of the sequence, or of the opened shot) and stops; pressing play at the end restarts.
const span=()=>open!=null?[start(open),start(open)+SH[open].d]:[0,tot()];
function setPlaying(v){playing=v;$('#play').textContent=v?'❚❚':'▶'}
$('#play').onclick=()=>{if(!playing){const[a,b]=span();if(G>=b-.06||G<a)G=a}setPlaying(!playing)};setPlaying(false);
// ---------- generate video from keyframes ----------
// ---------- prompts for the real models ----------
const EL_P={mia:'Mia, a 10-year-old girl in a yellow raincoat',bolt:'Bolt, a small boxy grey robot with round eyes',yard:'a junkyard full of scrap piles',street:'an empty lamplit street',room:"Mia's bedroom with a desk and a lamp"};
const framing=sc=>sc<1?'wide shot':sc<2?'medium shot':'close-up';
function specWords(sp){const w=[];if(sp.mia)w.push(EL_P.mia);if(sp.bolt)w.push(EL_P.bolt);w.push(EL_P[sp.scene]||'');if(sp.night)w.push('at night');if(sp.dawn)w.push('at dawn, first light');if(sp.eyes)w.push("Bolt's eyes glowing cyan");return w.filter(Boolean).join(', ')}
const lookWords=()=>look.prompt||look.n;
const keyPrompt=(sp,what)=>`${framing(sp.scale)}, ${what?what+'. ':''}${specWords(sp)}. ${lookWords()}. cinematic film still, 35mm`;
const shotPrompt=s=>`${s.prompt?s.prompt+'. ':''}${s.m||'subtle camera movement'}. ${specWords((s.keys[0]||s).spec)}. ${lookWords()}. cinematic, smooth natural motion`;
// Busy overlay with elapsed time (real jobs have no known duration).
async function busy(msg,job){const ov=$('#ov');ov.style.display='flex';$('#pb').style.width='100%';const t0=performance.now();const tick=setInterval(()=>$('#ovt').textContent=`${typeof msg==='function'?msg():msg} · ${((performance.now()-t0)/1000).toFixed(0)}s`,200);
 try{return await job()}finally{clearInterval(tick);ov.style.display='none'}}
async function realShot(i,label){const s=SH[i];let step='';
 return busy(()=>`${label}${step}`,async()=>{
  const guides=s.keys.filter(k=>k.img);step=guides.length?` · ${guides.length} keyframes → LTX-Video`:' · text → LTX-Video';const r=await localGeneration.shot(guides.map(k=>({image:k.img,t:k.anchor==='end'?s.d:k.anchor==='start'?0:k.t})),shotPrompt(s),s.d,s.seed??7);s.video=r.url;s.r=true;pushHist({kind:'shot',url:r.url,label:`${s.n} · ${r.frames} frames`,shotId:shotId(s),duration:s.d});return r})}
async function fake(msgs,ms){const ov=$('#ov');ov.style.display='flex';const t0=performance.now();await new Promise(res=>{(function tick(){const p=Math.min(1,(performance.now()-t0)/ms);$('#pb').style.width=p*100+'%';$('#ovt').textContent=msgs[Math.min(msgs.length-1,p*msgs.length|0)];p<1?requestAnimationFrame(tick):res()})()});ov.style.display='none'}
$('#gen').onclick=async()=>{const s=SH[cur];
 if(OSH.online){try{const r=await realShot(cur,`Generating shot ${cur+1}`);timeline();head();toast(`Shot ${cur+1} generated in ${r.seconds}s (${r.frames} frames)`)}catch(e){toast('Generation failed: '+e.message)}return}
 toast('Start ComfyUI on port 8188, then refresh local models')};
$('#genAll').onclick=async()=>{const todo=SH.filter(s=>!s.r);if(!todo.length)return toast('Nothing to generate');
 if(OSH.online){try{for(const s of todo){const i=SH.indexOf(s);await realShot(i,`Shot ${i+1} of ${SH.length}`);timeline();head()}toast('All shots generated')}catch(e){toast('Generation failed: '+e.message)}return}
 toast('Start ComfyUI on port 8188, then refresh local models')};
// ---------- keyframe generator ----------
const ELS=[['mia','👧 Mia',1],['bolt','🤖 Bolt',1],['yard','🏚 Junkyard',0],['street','🏙 Street',0],['room','🛏 Mia\'s room',1]],PLACES=['yard','street','room'];
const FR=[['wide','Wide',.6],['medium','Medium',1.3],['close','Close',2.4]];let frm='medium';
$('#els').innerHTML=ELS.map(([k,n,on])=>`<button class="chip ${on?'on':''}" data-k="${k}">${n}</button>`).join('');
$('#frm').innerHTML=FR.map(([k,n])=>`<button class="chip ${k===frm?'on':''}" data-k="${k}">${n}</button>`).join('');
$('#els').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;if(PLACES.includes(c.dataset.k))$$('#els .chip').forEach(x=>{if(PLACES.includes(x.dataset.k))x.classList.toggle('on',x===c)});else c.classList.toggle('on')};
$('#frm').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;frm=c.dataset.k;$$('#frm .chip').forEach(x=>x.classList.toggle('on',x===c))};
function specFromUI(){const on=k=>$(`#els [data-k=${k}]`).classList.contains('on'),p=$('#kp').value.toLowerCase();
 return SP({mia:on('mia'),bolt:on('bolt'),scene:on('street')?'street':on('room')?'room':'yard',scale:FR.find(f=>f[0]===frm)[2],night:/night|dark|midnight/.test(p),dawn:/dawn|first light|morning|sunrise/.test(p),eyes:/glow|eyes|wake|light/.test(p),carry:/carr|holds|holding/.test(p)})}
$('#kgo').onclick=async()=>{const base=specFromUI();$('#kgo').disabled=true;$('#kgo').textContent='Generating…';
 if(OSH.online){const p=$('#kp').value,prompt=workspaceMode==='image'?p:keyPrompt(base,p),batch=(workspaceMode==='image'?[0]:[0,1,2,3]).map(()=>({spec:base,u:.5,p,pending:true}));results=batch.concat(results).slice(0,12);res();
  try{for(const [j,v] of batch.entries()){const r=await localGeneration.keyframe(prompt,Math.floor(Math.random()*1e6));v.img=r.url;v.pending=false;if(workspaceMode==='image'){imageDraft={prompt:p,url:r.url,spec:base};saveWorkshop();syncWorkspace()}pushHist({kind:'keyframe',url:r.url,label:p});$('#kgo').textContent=`Generating… ${j+1}/4 (${r.seconds}s)`;res()}}
  catch(e){toast('Keyframe generation failed: '+e.message);results=results.filter(v=>!v.pending);res()}
  $('#kgo').disabled=false;$('#kgo').textContent=workspaceMode==='image'?'Generate image':'Generate 4 keyframes';return}$('#kgo').disabled=false;$('#kgo').textContent=workspaceMode==='image'?'Generate image':'Generate 4 keyframes';toast('Start ComfyUI on port 8188, then refresh local models');return;await K.sleep(900);
 results=[0,1,2,3].map(i=>({spec:{...base,scale:base.scale*(1+(i-1.5)*.08),dx:(i-1.5)*.06},u:[.2,.5,.8,.4][i],p:$('#kp').value})).concat(results).slice(0,12);
 $('#kgo').disabled=false;$('#kgo').textContent='Generate 4 keyframes';res()};
function res(){if(!results.length)return;$('#res').innerHTML='<div class="gen"></div>';results.forEach(v=>{const d=document.createElement('div');if(v.pending){d.className='v busy';d.textContent='generating…';$('#res .gen').append(d);return}d.className='v';d.draggable=true;d.title=v.p;d.innerHTML='<canvas width="256" height="144"></canvas><span>＋ add to selected shot</span>';
 drawKey(d.firstChild.getContext('2d'),v,2,0);d.ondragstart=e=>{dragV=v;e.dataTransfer.setData('text/plain','keyframe');e.dataTransfer.effectAllowed='copy'};d.ondragend=()=>dragV=null;
 d.onclick=()=>{if(workspaceMode==='image'){imageDraft={...imageDraft,url:v.img};saveWorkshop();syncWorkspace();return}const[i,lt]=keyTarget();addKey(i,lt,v)};$('#res .gen').append(d)})}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.style.opacity=0,1700);setTimeout(()=>d.remove(),2100)}
// ---------- loop: one playhead across the whole sequence ----------
const g=K.canvas($('#cv'),W,H);let last=performance.now();
addEventListener('resize',()=>timeline());
K.loop(t=>{const now=performance.now(),dt=(now-last)/1000;last=now;if(playing){const[a,b]=span();if(G<a)G=a;G+=dt;if(G>=b-.01){G=b-.01;setPlaying(false)}}
 const[i,lt]=at(G),s=SH[i];
 const vid=$('#vid');if(s.r&&s.video){if(!vid.src.endsWith(s.video)){vid.src=s.video;vid.currentTime=lt}vid.style.display='block';
  if(playing){if(vid.paused)vid.play().catch(()=>{});if(Math.abs(vid.currentTime-lt)>.35)vid.currentTime=lt}else{vid.pause();if(Math.abs(vid.currentTime-lt)>.05)vid.currentTime=lt}}
 else{if(vid.style.display!=='none'){vid.pause();vid.style.display='none'}}
 shotFrame(g,s,lt,t);if(!s.r)mute(g);
 const em=workspaceMode==='video'&&!s.r;$('#empty').style.display=em?'block':'none';$('#tag').style.visibility=$('#tc').style.visibility=em?'hidden':'visible';$('#gen').classList.toggle('nudge',em);const arrow=$('#generateArrow'),button=$('#gen').getBoundingClientRect(),message=$('#empty .msg').getBoundingClientRect();if($("#nextVideo"))$("#nextVideo").hidden=workspaceMode!=='video'||!SH[cur].r;const showArrow=em&&$('#ov').style.display!=='flex'&&message.bottom>58&&button.top<innerHeight&&button.top>message.bottom;arrow.style.display=showArrow?'block':'none';if(showArrow){const x=message.left+message.width*.72,y=message.bottom+14,ex=button.left+button.width*.65,ey=button.top-12;$('#generateArrowCurve').setAttribute('d',`M ${x} ${y} C ${x+75} ${y+8}, ${ex+15} ${y+25}, ${ex} ${ey}`)}if(lt<.2&&i>0&&playing&&open==null){g.fillStyle=`rgba(0,0,0,${1-lt/.2})`;g.fillRect(0,0,W,H)}
 $('#tag').textContent=s.r?`Shot ${i+1} · generated${s.video?' · LTX-Video':''}`:`Shot ${i+1} · keyframe preview — generate for real motion`;$('#tc').textContent=`${G.toFixed(1)} / ${tot()}s`;
 $('#gph').style.left=((open!=null?G-start(open):G)*pxs)+'px';$('#gph').setAttribute('aria-label',`Playhead ${G.toFixed(1)} seconds`);SHELL.select(media())});
// Coming back from Edit Anything with an edited keyframe
const videoBack=SC.get('osh-video-edit-return');SC.set('osh-video-edit-return',null);
if(videoBack){const i=SH.findIndex(s=>s.id===videoBack.ref?.shotId);if(i>=0&&SH[i].video===videoBack.original){const s=SH[i];s.video=videoBack.video;s.d=Math.max(.1,Math.min(60,+videoBack.duration||s.d));s.keys.forEach(k=>k.t=Math.min(k.t,s.d));s.r=true;cur=i;G=Math.min(G,tot()-.01);pushHist({kind:'shot',url:s.video,label:s.n+' · edited video',shotId:s.id,duration:s.d})}else toast('Original shot changed; edited video is still available in Edit Anything.')}
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
mountProjects();
const workflowBar=document.createElement('div');workflowBar.className='workflow-switch';workflowBar.innerHTML='<button data-workflow="video">Video</button><button data-workflow="image">Image</button>';
document.querySelector('main').prepend(workflowBar);
const imageStage=document.createElement('section');imageStage.className='image-stage';imageStage.innerHTML='<div id="imageWelcome"><h2>Find the image you have in mind</h2><p>Describe it, generate it, make it yours.</p></div><img id="imageHero" alt="Your generated image" hidden><div id="nextImage" class="next-step" hidden><div><strong>Picture this in motion.</strong><p>Use this image as the first frame of a video.</p></div><button id="animateImage">Turn into a video →</button><button id="editWorkshopImage">Edit image</button></div>';
document.querySelector('.view').before(imageStage);
const videoNext=document.createElement('div');videoNext.id='nextVideo';videoNext.className='next-step';videoNext.hidden=true;videoNext.innerHTML='<div><strong>There’s a story here.</strong><p>Add another scene and start building your film.</p></div><button id="growFilm">Create the next scene →</button>';
document.querySelector('main>.row').after(videoNext);
function setWorkflow(mode){if(document.getElementById("kgo").disabled||document.getElementById("ov").style.display==="flex")return;if(playing)setPlaying(false);workspaceMode=mode;$('#kp').value=imageDraft.prompt||'';$('#kgo').textContent=mode==='image'?'Generate image':'Generate 4 keyframes';saveWorkshop();syncWorkspace();head()}
workflowBar.onclick=e=>{const mode=e.target.closest('[data-workflow]')?.dataset.workflow;if(mode)setWorkflow(mode)};
$('#kp').value=imageDraft.prompt||'';$('#kp').addEventListener('input',()=>{imageDraft.prompt=$('#kp').value;saveWorkshop()});
$('#animateImage').onclick=()=>{setWorkflow('video');const spec=SP({mia:false,bolt:false,scene:''});SH[cur].prompt=imageDraft.prompt;SH[cur].spec=spec;const existing=SH[cur].keys.find(k=>k.anchor==='start'||k.t===0);if(existing){existing.img=imageDraft.url;existing.spec=spec;existing.anchor='start';SH[cur].r=false;selKey=existing;open=cur}else{addKey(cur,0,{img:imageDraft.url,spec,u:.5});SH[cur].keys.at(-1).anchor='start'}timeline();head();save();syncWorkspace();$('#motion').focus()};
$('#editWorkshopImage').textContent='Download image';$('#editWorkshopImage').onclick=()=>{const link=document.createElement('a');link.href=imageDraft.url;link.download='image.png';link.click()};
$('#growFilm').onclick=()=>{cinema=true;SH.push({n:`Scene ${SH.length+1}`,d:4,spec:SP({mia:false,bolt:false,scene:''}),m:'',keys:[],r:false});cur=SH.length-1;shotId(SH[cur]);open=null;G=start(cur);selKey=null;syncWorkspace();timeline();head();save();$('#shotPromptInput').focus()};
syncWorkspace();$('#kgo').textContent=workspaceMode==='image'?'Generate image':'Generate 4 keyframes';
timeline();head();markEls();histUI();save();if(!playing)$('#play').textContent='▶';
