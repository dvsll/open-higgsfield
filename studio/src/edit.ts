// @ts-nocheck  (ported from inline JS; type it as we go)
import '../../shared/lib/kit.js';
import '../../shared/styleboard/looks.js';
import {createElement as h} from 'react';
import {renderView,unmountView} from './react/render';
import {ImageLayers,ImageSelection,CanvasAsk} from './react/image-editor';
import { SC } from './scene';
import { SHELL } from './shell';
import { mountVideoEditor } from './video-editor';
import { mountEditOnboarding } from './edit-onboarding';
const incoming=new URLSearchParams(location.search).get('from')?SC.get('osh-handoff'):null;
if(incoming?.video)mountVideoEditor(incoming);else legacyEditor();
mountEditOnboarding();
function legacyEditor(){
const {$,$$}=K,W=640,H=360;
// Source: a keyframe handed over from Director, or a sample frame.
// Media handed over from another workflow (via the shared "Selected media" card), or a sample frame.
const from=new URLSearchParams(location.search).get('from'),hand=from?SC.get('osh-handoff'):null;
let look=SC.LOOKS[0],str=.8;const u=hand?.u??.3;
const base={...(hand?.spec||SC.SP({scene:'street',scale:1.3}))},prior=base.edits||{};delete base.edits;
const REG={mia:{n:'Mia',ic:'👧',sug:['astronaut suit','red raincoat','knight armour','remove']},bolt:{n:'Bolt',ic:'🤖',sug:['gold','rusty','bigger','glowing eyes','tiny crown','remove']},
 sky:{n:'Sky',ic:'🌤',sug:['sunset','night sky with stars','storm clouds','aurora','clear blue']},place:{n:'Place',ic:'🌍',sug:['Mars','snow','beach','flooded street','forest']}};
let layers=Object.entries(prior).map(([r,txt])=>({r,txt,on:true,id:Math.random()})),sel=null,tool='click',cmp='after',wx=.5,box={},busy=null;
$('#src').textContent=hand?'/ '+hand.label:'/ sample frame';
if(hand&&hand.from==='director'&&hand.ref?.key!=null){$('#from').style.display='';$('#backLink').href='/studio/director';
 renderView($('#acts'),[h('button',{key:'cancel',className:'pill',id:'cancel'},'Cancel'),h('button',{key:'apply',className:'pill solid',id:'apply'},'Apply to keyframe →')]);
 $('#cancel').onclick=()=>location.href='/studio/director';
 $('#apply').onclick=()=>{writeBack();location.href='/studio/director'}}
else renderView($('#acts'),h('button',{className:'pill solid','data-toast':'mock: exports the edited frame'},'Export frame'));
function writeBack(){const e=edits();SC.set('osh-edit-return',{shot:hand.ref.shot,key:hand.ref.key,spec:{...base,edits:e},n:Object.keys(e).length})}
const edits=()=>Object.fromEntries(layers.filter(l=>l.on).map(l=>[l.r,l.txt]));
// ---------- layers ----------
function renderLayers(){SHELL.mark([sel,...layers.filter(l=>l.on).map(l=>l.r)].filter(r=>r==='mia'||r==='bolt'));$('#ecount').textContent=layers.length?`${layers.filter(l=>l.on).length}/${layers.length} on`:'';
 renderView($('#layers'),h(ImageLayers,{layers,regions:REG,selected:sel,onSelect:select,onToggle:index=>{layers[index].on=!layers[index].on;renderLayers()},onRemove:index=>{layers.splice(index,1);renderLayers()}}))}
// ---------- selection ----------
function hit(x,y){if(tool==='place')return'place';for(const r of['bolt','mia']){const b=box[r];if(b&&x>b.x-4&&x<b.x+b.w+4&&y>b.y-4&&y<b.y+b.h+4)return r}return y<box.horizon?'sky':'place'}
function select(r,cx,cy){sel=r;clearAsk();renderLayers();const R=REG[r],cur=layers.find(l=>l.r===r);
 renderView($('#selp'),h(ImageSelection,{key:r,region:R,tracked:r==='mia'||r==='bolt',value:cur?.txt||'',onApply:txt=>apply(r,txt)}));
 const v=$('#view').getBoundingClientRect();const b=box[r],px=cx??(b?(b.x+b.w)/W*v.width+8:v.width/2-150),py=cy??(b?b.y/H*v.height:v.height*(r==='sky'?.15:.7));
 const a=document.createElement('div');a.className='ask';a.style.left=Math.max(8,Math.min(v.width-308,px))+'px';a.style.top=Math.max(8,Math.min(v.height-50,py))+'px';
 $('#view').append(a);renderView(a,h(CanvasAsk,{region:R,onApply:txt=>apply(r,txt),onCancel:clear}));
 $('#hint').textContent=`Editing ${R.n.toLowerCase()} — type a change or pick a suggestion on the right.`}
function clearAsk(){const ask=$('.ask');if(ask){unmountView(ask);ask.remove()}}
function clear(){sel=null;clearAsk();renderView($('#selp'),h('div',{className:'empty'},'Nothing selected yet.'));$('#hint').textContent='Click Mia, Bolt, the sky or the ground. Esc cancels.';renderLayers()}
async function apply(r,txt){clearAsk();busy={r,t0:performance.now()};$('#hint').textContent=`Editing ${REG[r].n.toLowerCase()}…`;await K.sleep(800);busy=null;
 const ex=layers.find(l=>l.r===r);if(ex){ex.txt=txt;ex.on=true}else layers.push({r,txt,on:true,id:Math.random()});
 if(cmp==='before')setCmp('after');toast(`${REG[r].n} → ${txt}`);clear()}
$('#cv').onclick=e=>{if(cmp==='before')setCmp('after');const b=$('#cv').getBoundingClientRect(),x=(e.clientX-b.left)/b.width*W,y=(e.clientY-b.top)/b.height*H;select(hit(x,y),e.clientX-b.left+12,e.clientY-b.top+12)};
addEventListener('keydown',e=>{if(e.key==='Escape')clear()});
$('#tool').onclick=e=>{const b=e.target.closest('button');if(!b)return;tool=b.dataset.t;$$('#tool button').forEach(x=>x.classList.toggle('on',x===b));if(tool==='place')select('place')};
// ---------- compare ----------
function setCmp(c){cmp=c;$$('#cmp button').forEach(x=>x.classList.toggle('on',x.dataset.c===c));const w=c==='wipe';['#wipe','#lA','#lB'].forEach(q=>$(q).style.display=w?'':'none');$('#cv').style.clipPath=w?`inset(0 0 0 ${wx*100}%)`:'none';$('#cv').style.visibility=c==='before'?'hidden':''}
$('#cmp').onclick=e=>{const b=e.target.closest('button');if(b)setCmp(b.dataset.c)};
const wp=$('#wipe');wp.onpointerdown=e=>{wp.setPointerCapture(e.pointerId);wp.onpointermove=ev=>{const r=$('#view').getBoundingClientRect();wx=Math.min(1,Math.max(0,(ev.clientX-r.left)/r.width));wp.style.left=wx*100+'%';$('#cv').style.clipPath=`inset(0 0 0 ${wx*100}%)`}};wp.onpointerup=()=>wp.onpointermove=null;wp.style.left='50%';
$$('#keep .chip').forEach(c=>c.onclick=()=>c.classList.toggle('on'));
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.append(d);setTimeout(()=>d.style.opacity=0,1700);setTimeout(()=>d.remove(),2100)}
// ---------- draw ----------
const g=K.canvas($('#cv'),W,H),go=K.canvas($('#orig'),W,H);
K.loop(t=>{SHELL.select({type:hand?.type||'frame',label:hand?hand.label:'Sample frame',spec:{...base,edits:edits()},u,ref:hand?.ref});const tt=2+Math.sin(t*.3)*.5;drawBase(go);drawBase(g);box={horizon:H*.45};
 const r=busy?busy.r:sel;if(r&&cmp!=='before'){g.save();g.strokeStyle='#7aa2ff';g.lineWidth=2;g.setLineDash([6,4]);g.lineDashOffset=-t*24;g.fillStyle=busy?`rgba(122,162,255,${.2+.15*Math.sin(t*10)})`:'rgba(122,162,255,.18)';
  const b=box[r];if(r==='sky'){g.fillRect(0,0,W,box.horizon);g.strokeRect(1,1,W-2,box.horizon-2)}else if(r==='place'){g.fillRect(0,box.horizon,W,H-box.horizon);g.strokeRect(1,box.horizon,W-2,H-box.horizon-1)}else if(b){g.fillRect(b.x,b.y,b.w,b.h);g.strokeRect(b.x,b.y,b.w,b.h)}g.restore()}});
SHELL.mount({app:'edit',elementHint:'click to edit',useLabel:e=>e.kind==='cast'?'select':'move here',
 beforeOpen:app=>{if(app==='director'&&hand?.from==='director'&&hand.ref?.key!=null&&layers.length)writeBack()},
 onLook:(l,s2)=>{look=l;str=s2},
 onElement:e=>{if(REG[e.id])select(e.id);else toast(`Use @${e.n} in a Director prompt to include this element.`)}});
// Real keyframe image if we have one, otherwise the generic tile. (Edits are listed as layers;
// they render once the image-edit workflow is connected.)
var baseImg=hand?.img?Object.assign(new Image(),{src:hand.img}):null;
function drawBase(g){if(baseImg&&baseImg.complete&&baseImg.naturalWidth){const r=Math.max(W/baseImg.naturalWidth,H/baseImg.naturalHeight),w=baseImg.naturalWidth*r,h=baseImg.naturalHeight*r;g.drawImage(baseImg,(W-w)/2,(H-h)/2,w,h)}else SC.blank(g,hand?'keyframe not generated yet':'no image')}
if(!baseImg)$('#hint').textContent='No image to edit yet: generate this keyframe in the Director first.';
renderLayers();
document.addEventListener('click',e=>{const t=e.target.closest('[data-toast]');if(t)toast(t.dataset.toast)});
}
