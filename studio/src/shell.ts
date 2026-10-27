import {createElement} from 'react';
import {StyleSelector,StyleMaker} from './react/styles';
import {renderView,unmountView} from './react/render';
import {SharedSurface,SelectedMedia} from './react/shared-panels';
import {waveform} from './audio-track';
// Shared left sidebar for every studio workflow:
//   selected media (+ open in another workflow) · Stylemaxxer (style, fit meter, Stylemaxx) · Elements wall.
// Project-level state (selected style, user styles) lives in localStorage 'osh-project' so it follows you between apps.
import { SC } from './scene';
import { elementLibrary } from './element-maker';
import { mountRuntimeSetup } from './runtime-setup';
import { mountConnection } from './connection';
import { mountNumberControls } from './number-controls';

declare const STYLEBOARD: { looks: Style[] };

export type MediaType = 'shot' | 'keyframe' | 'frame';
export type Media = { type: MediaType; label: string; spec?: unknown; u?: number; img?: string; video?:string;audio?:string;audioPrompt?:string;editTarget?:'audio';audioLinked?:boolean;duration?:number;ref?: { shot: number; key?: number;shotId?:string } };
export type Style = { id: string; n: string; prompt: string; sw: string[]; sky?: [string, string]; refs?: string[]; tint?: string; user?: boolean };
export type Element = { id: string; ic: string; n: string; d: string; kind: 'cast' | 'place' | 'object'; refs?:string[];user?:boolean };
export type PoolItem = { url: string; label: string };
type Opts = {
  app: 'director' | 'edit';
  elementHint?: string;
  beforeOpen?: (app: string, m: Media) => void;
  onLook?: (style: Style, str: number, commit: boolean) => void;
  onElement?: (e: Element) => void;
  /** Media the style maker can use as references (generated keyframes, frames…). */
  mediaPool?: () => PoolItem[];
  /** Stylemaxx: regenerate the selected media toward the style. Resolves when done. */
  onStylemaxx?: (style: Style, media: Media, progress: (msg: string) => void) => Promise<void>;
};

const APPS: [string, string, string, MediaType[]][] = [
  ['director', 'Director', '/studio/director', ['shot', 'keyframe']],
  ['edit', 'Edit Anything', '/studio/edit', ['keyframe', 'frame','shot']],
];
const TYPES: Record<MediaType, string> = { shot: 'Shot', keyframe: 'Keyframe', frame: 'Frame' };
const ELEMENTS: Element[] = [];
// Earlier libraries persisted untouched starter cards alongside user-created assets.
const starterDescriptions:Record<string,string>={mia:'girl, 10, yellow raincoat',bolt:'small boxy robot',yard:'dusk, scrap piles',street:'empty, lamplit',room:'desk, lamp, window'};
const storedElements=SC.get('osh-elements');
if(Array.isArray(storedElements))for(const element of storedElements){
 if(!element||typeof element.n!=='string'||typeof element.d!=='string'||typeof element.id!=='string'||!['cast','place','object'].includes(element.kind))continue;
 const item={...element,refs:Array.isArray(element.refs)?element.refs.filter((url:unknown)=>typeof url==='string'&&/^\/outputs\/[a-f0-9]{16}\.png$/.test(url)).slice(0,4):[]};
 if(!item.user&&!item.refs.length&&starterDescriptions[item.id]===item.d)continue;
 const index=ELEMENTS.findIndex(e=>e.id===item.id);if(index<0)ELEMENTS.push(item);else ELEMENTS[index]=item;
}

const css = `
.shared-section{display:flex;flex-direction:column;gap:12px}
.shared-section .apps{display:flex;border:1px solid var(--line);padding:3px;gap:2px}
.shared-section .apps a{flex:1;text-align:center;padding:6px 4px;color:var(--dim);text-decoration:none;font-size:12px;font-weight:500;cursor:pointer}
.shared-section .apps a.on{background:#26262a;color:var(--txt)}.shared-section .apps a:not(.on):hover{color:var(--txt)}
.shared-section .media{border:1px solid var(--line);padding:8px;display:flex;flex-direction:column;gap:8px;background:var(--card)}
.shared-section .media canvas{width:100%;aspect-ratio:16/9;display:block;background:#000}
.shared-section .media .mt{display:flex;align-items:center;gap:6px;font-size:12px}.shared-section .media .mt b{font-weight:500}
.shared-section .media .ty{font-size:10px;text-transform:uppercase;letter-spacing:.08em;border:1px solid #3a4462;color:#aab6d8;padding:1px 7px}
.shared-section .media .none{color:var(--faint);font-size:12px;padding:10px 4px;text-align:center}
.shared-section .openin{display:flex;flex-direction:column;gap:4px}
.shared-section .openin button{display:flex;align-items:center;justify-content:space-between;gap:6px;border:1px solid var(--line);background:none;padding:6px 9px;cursor:pointer;color:var(--txt);font-size:12px}
.shared-section .openin button:hover:not(:disabled){border-color:var(--acc)}.shared-section .openin button:disabled{opacity:.4;cursor:default}
.shared-section .openin small{color:var(--faint)}
.shared-section .sec{font-size:11px;font-weight:500;color:var(--dim);text-transform:uppercase;letter-spacing:.09em;display:flex;align-items:center;gap:8px}
.shared-section .sec span{margin-left:auto;text-transform:none;letter-spacing:0;color:var(--faint)}
.shared-section .style{display:block;width:100%;padding:0;border:1px solid var(--line);background:var(--card);cursor:pointer;text-align:left;color:var(--txt)}
.shared-section .style:hover{border-color:var(--acc)}
.shared-section .style canvas{width:100%;aspect-ratio:3/1;display:block}
.shared-section .style div{display:flex;justify-content:space-between;padding:6px 8px;font-size:12px}.shared-section .style small{color:var(--faint)}
.shared-section .fit{display:flex;flex-direction:column;gap:5px}
.shared-section .fit .row{display:flex;justify-content:space-between;font-size:11px;color:var(--dim)}.shared-section .fit b{font-weight:500;color:var(--txt)}
.shared-section .meter{position:relative;height:6px;background:linear-gradient(90deg,#4a2a2a,#4a442a,#2a4a35)}
.shared-section .meter i{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--txt);transition:left .4s}
.shared-section .maxx{width:100%;padding:9px;border:1px solid var(--acc);background:var(--acc);color:#111;font-weight:600;cursor:pointer}
.shared-section .maxx:disabled{opacity:.35;cursor:default}.shared-section .maxx.run{background:none;color:var(--txt)}
.shared-section .wall{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.shared-section .el{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;aspect-ratio:1;background:var(--card);border:1px solid transparent;cursor:pointer;color:var(--txt);font-size:11px;padding:4px}
.shared-section .el:hover{border-color:var(--line)}.shared-section .el.on{border-color:var(--acc)}
.shared-section .el .av{font-size:22px;line-height:1}.shared-section .el span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.shm{position:fixed;inset:0;background:rgba(5,5,7,.72);display:flex;align-items:center;justify-content:center;z-index:100}
.shm .box{width:min(720px,94vw);max-height:88vh;overflow:auto;background:var(--col);border:1px solid var(--line);padding:18px;display:flex;flex-direction:column;gap:14px}
.shm h3{margin:0;font-size:15px;font-weight:600;display:flex;align-items:center}.shm h3 button{margin-left:auto}
.shm .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.shm .style-card-select{width:100%;padding:0;border:0;background:none;color:inherit;text-align:inherit;font:inherit;cursor:pointer}.shm .card{border:1px solid var(--line);background:var(--card);cursor:pointer;padding:0;color:var(--txt);text-align:left;position:relative}
.shm .card:hover,.shm .card.on{border-color:var(--acc)}
.shm .card canvas{width:100%;aspect-ratio:16/10;display:block}.shm .card div{padding:6px 8px;font-size:12px}
.shm .card .ed{position:absolute;right:4px;top:4px;background:rgba(0,0,0,.6);border:0;color:#fff;font-size:11px;padding:2px 6px;cursor:pointer}
.shm .add{border:1px dashed var(--line);background:none;color:var(--dim);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:120px}
.shm .add:hover{border-color:var(--acc);color:var(--txt)}
.shm input,.shm textarea{width:100%;background:var(--card);border:1px solid var(--line);color:var(--txt);font:inherit;padding:8px 10px;outline:none}
.shm input.title{font-size:16px;font-weight:600}
.shm .prev{width:100%;aspect-ratio:3/1;display:block;background:#000}
.shm .refs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.shm .ref{position:relative;aspect-ratio:16/10;border:1px solid var(--line);background:#000;overflow:hidden}
.shm .ref img{width:100%;height:100%;object-fit:cover;display:block}
.shm .ref button{position:absolute;right:2px;top:2px;background:rgba(0,0,0,.7);border:0;color:#fff;font-size:11px;cursor:pointer}
.shm .pool{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;border:1px solid var(--line);padding:8px;max-height:220px;overflow:auto}
.shm .pool button{padding:0;border:2px solid transparent;background:#000;cursor:pointer;aspect-ratio:16/10;overflow:hidden}
.shm .pool button.on{border-color:var(--acc)}.shm .pool img{width:100%;height:100%;object-fit:cover;display:block}
.shm .note{color:var(--faint);font-size:12px}
.shm .acts{display:flex;gap:8px;justify-content:flex-end}
.shm .btn{border:1px solid var(--line);background:none;color:var(--txt);padding:7px 14px;cursor:pointer}.shm .btn.solid{background:var(--acc);color:#111;border-color:var(--acc);font-weight:600}`;

const $ = <T extends Element_ = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
type Element_ = globalThis.Element;

// ---------- palettes + fit ----------
const hex2rgb = (h: string): number[] => {
  const x = h.replace('#', ''), f = x.length === 3 ? x.split('').map((c) => c + c).join('') : x;   // #222 and #222222
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const rgb2hex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const imgCache = new Map<string, Promise<HTMLImageElement>>();
function loadImg(url: string): Promise<HTMLImageElement> {
  if (!imgCache.has(url)) imgCache.set(url, new Promise((ok, fail) => { const im = new Image(); im.onload = () => ok(im); im.onerror = fail; im.src = url; }));
  return imgCache.get(url)!;
}
function pixels(im: HTMLImageElement, w = 32, h = 18): number[][] {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true })!; g.drawImage(im, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, out: number[][] = [];
  for (let i = 0; i < d.length; i += 4) out.push([d[i], d[i + 1], d[i + 2]]);
  return out;
}
/** Four dominant colours (tiny k-means), darkest first. */
function palette(px: number[][], k = 4): string[] {
  const s = [...px].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  let cs = Array.from({ length: k }, (_, i) => s[Math.floor(((i + 0.5) / k) * s.length)].slice());
  for (let it = 0; it < 8; it++) {
    const acc = cs.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let bi = 0, bd = Infinity;
      cs.forEach((c, i) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; bi = i; } });
      acc[bi][0] += p[0]; acc[bi][1] += p[1]; acc[bi][2] += p[2]; acc[bi][3]++;
    }
    cs = acc.map((a, i) => (a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : cs[i]));
  }
  return cs.map(rgb2hex);
}
/** Palette fit 0..1: how close the image's pixels sit to the style's colours. */
export async function styleFit(url: string, style: Style): Promise<number> {
  const px = pixels(await loadImg(url)), sw = style.sw.map(hex2rgb);
  let sum = 0;
  for (const p of px) sum += Math.min(...sw.map((c) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2])));
  return Math.max(0, Math.min(1, 1 - (sum / px.length / 441.7) * 2.4));
}

function drawStyle(cv: HTMLCanvasElement, st: Style) {
  const g = cv.getContext('2d')!, W = cv.width, H = cv.height;
  const ref = st.refs?.[0];
  const swatchBand = () => st.sw.forEach((c, j) => { g.fillStyle = c; g.fillRect((j * W) / st.sw.length, H * 0.78, W / st.sw.length + 1, H * 0.22); });
  if (ref) {
    loadImg(ref).then((im) => { const r = Math.max(W / im.naturalWidth, H / im.naturalHeight); g.drawImage(im, (W - im.naturalWidth * r) / 2, (H - im.naturalHeight * r) / 2, im.naturalWidth * r, im.naturalHeight * r); swatchBand(); });
  } else {
    const sky = st.sky || [st.sw[0], st.sw[1]], gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  swatchBand();
}

// ---------- state ----------
let opts: Opts;
let style: Style;
let str = 0.8;
let media: Media | null = null;
let mediaKey = '';
type ProjectState = { style?: string; look?: string; str?: number; styles?: Style[] };
const state = (): ProjectState => SC.get('osh-project') || {};
const userStyles = (): Style[] => state().styles || [];
const allStyles = (): Style[] => [...STYLEBOARD.looks, ...userStyles()];
function save(extra: Partial<ProjectState> = {}) { SC.set('osh-project', { ...state(), style: style.id, str, ...extra }); }

function mount(o: Opts) {
  mountConnection();mountRuntimeSetup();
  mountNumberControls();
  opts = o;
  const st = state();
  style = allStyles().find((l) => l.id === (st.style || st.look)) || STYLEBOARD.looks[0];
  str = st.str ?? 0.8;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
  const root = $('#shared');root.classList.add('shared-section');
  renderView(root,createElement(SharedSurface,{app:o.app,apps:APPS,elementHint:o.elementHint}));
  ($('.style', root) as HTMLButtonElement).onclick = () => selector();
  ($('.maxx', root) as HTMLButtonElement).onclick = () => maxx();
  elementLibrary($('.wall',root),ELEMENTS,e=>o.onElement?.(e),()=>o.mediaPool?.()||[]);
  drawSelected(); drawMedia();
  o.onLook?.(style, str, false);
  return { look: style, str };
}

function drawSelected() {
  const root = $('#studioStylization');
  if(root.hidden)return;
  drawStyle($('.style canvas', root) as HTMLCanvasElement, style);
  $('.sn', root).textContent = style.n;
  updateFit();
}
function setStyle(st: Style) {
  if (st.id === style.id) return;
  style = st; save(); drawSelected(); drawMedia();
  opts.onLook?.(style, str, true);
}

// ---------- fit meter + Stylemaxx ----------
let fitToken = 0;
async function updateFit() {
  const root = $('#studioStylization'), fv = $('.fv', root), bar = $('.meter i', root), btn = $('.maxx', root) as HTMLButtonElement;
  if(root.hidden)return;
  const can = !!(media?.img && media.type !== 'shot' && opts.onStylemaxx);
  if (!btn.classList.contains('run')) { btn.disabled = !can; btn.title = can ? 'Regenerate the selected media to match the selected style' : media?.type === 'shot' ? 'Select a keyframe to Stylemaxx it' : 'Select a generated keyframe first'; }
  if (!media?.img) { fv.textContent = '—'; bar.style.left = '0'; return; }
  const t = ++fitToken, f = await styleFit(media.img, style).catch(() => NaN);
  if (t !== fitToken) return;
  fv.textContent = Number.isNaN(f) ? '—' : Math.round(f * 100) + '%';
  bar.style.left = `calc(${(f || 0) * 100}% - 1px)`;
}
async function maxx() {
  if (!media?.img || !opts.onStylemaxx) return;
  const btn = $('#studioStylization .maxx') as HTMLButtonElement;
  btn.disabled = true; btn.classList.add('run');
  try { await opts.onStylemaxx(style, media, (m) => (btn.textContent = m)); }
  finally { btn.classList.remove('run'); btn.textContent = 'Try style variations'; btn.disabled = false; updateFit(); }
}

// ---------- modals: style selector + style maker ----------
function styleDialog(title:string,render:(close:()=>void)=>import('react').ReactNode){
 const host=document.createElement('div');host.className='shm';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label',title);const previous=document.activeElement as HTMLElement|null;
 const close=()=>{unmountView(host);host.remove();removeEventListener('keydown',escape);if(previous?.isConnected)previous.focus()};
 const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')close()};host.onclick=event=>{if(event.target===host)close()};addEventListener('keydown',escape);document.body.append(host);renderView(host,render(close));
}
function selector(){styleDialog('Styles',close=>createElement(StyleSelector,{styles:allStyles(),selected:style.id,paint:drawStyle,onSelect:next=>{setStyle(next);close()},onEdit:next=>{close();maker(next)},onNew:()=>{close();maker()},onClose:close}))}
async function recolorStyle(refs:string[]):Promise<{sw:string[];sky:[string,string]}> {const px=(await Promise.all(refs.map(url=>loadImg(url).then(image=>pixels(image,24,14))))).flat();const sw=palette(px);return {sw,sky:[sw[1],sw[3]]}}
function maker(edit?:Style){
 const draft:Style=edit?structuredClone(edit):{id:'u'+Date.now().toString(36),n:'',prompt:'',sw:['#2a2a2e','#55555c','#8b8b93','#c9c9cf'],refs:[],user:true};
 styleDialog(edit?'Edit style':'Style maker',close=>createElement(StyleMaker,{initial:draft,pool:opts.mediaPool?.()||[],paint:drawStyle,recolor:recolorStyle,onSave:next=>{const list=userStyles().filter(item=>item.id!==next.id);list.push(next);save({styles:list});close();style={...next,id:''};setStyle(next)},onDelete:edit?()=>{if(!confirm(`Delete style "${draft.n}"?`))return;save({styles:userStyles().filter(item=>item.id!==draft.id)});close();if(style.id===draft.id){style={...style,id:''};setStyle(STYLEBOARD.looks[0])}}:undefined,onClose:close}));
}

// ---------- selected media: what's selected in this app, and which workflows can open it ----------
function select(m: Media | null) {
  const key = m ? JSON.stringify([m.type, m.label, m.spec, m.u, m.img,m.video,m.audio]) : '';
  if (key === mediaKey) return;
  mediaKey = key; media = m; drawMedia();dispatchEvent(new Event('osh-media-selection'));
}
function drawMedia() {
  const box = $('#shared .media'); if (!box) return;
  updateFit();
  renderView(box,createElement(SelectedMedia,{media,app:opts.app,apps:APPS,onOpen:open,paint:paintSelectedMedia}));
}
function paintSelectedMedia(cv:HTMLCanvasElement,selected:Media){
 const g=cv.getContext('2d')!;let cancelled=false;
 if(selected.img){loadImg(selected.img).then(im=>{if(cancelled)return;const r=Math.max(cv.width/im.naturalWidth,cv.height/im.naturalHeight);g.drawImage(im,(cv.width-im.naturalWidth*r)/2,(cv.height-im.naturalHeight*r)/2,im.naturalWidth*r,im.naturalHeight*r)}).catch(()=>{if(!cancelled)SC.blank(g)});return()=>{cancelled=true}}
 if(selected.video){SC.blank(g);const video=document.createElement('video');video.muted=true;video.preload='auto';video.src=selected.video+'#t=0.1';video.onloadeddata=()=>{if(cancelled)return;const scale=Math.min(cv.width/video.videoWidth,cv.height/video.videoHeight);g.fillStyle='#08090b';g.fillRect(0,0,cv.width,cv.height);g.drawImage(video,(cv.width-video.videoWidth*scale)/2,(cv.height-video.videoHeight*scale)/2,video.videoWidth*scale,video.videoHeight*scale);video.removeAttribute('src');video.load()};return()=>{cancelled=true;video.onloadeddata=null;video.removeAttribute('src');video.load()}}
 if(selected.audio){
  const background=()=>{g.fillStyle='#101b18';g.fillRect(0,0,cv.width,cv.height)};background();
  g.fillStyle='#899f98';g.font='12px Inter, sans-serif';g.textAlign='center';g.fillText('Loading waveform…',cv.width/2,cv.height/2);
  void waveform(selected.audio).then(peaks=>{if(cancelled)return;background();g.fillStyle='#83baa7';const step=cv.width/peaks.length;peaks.forEach((peak,index)=>{const height=Math.max(1,peak*(cv.height-28));g.fillRect(index*step,(cv.height-height)/2,Math.max(1,step-1),height)})}).catch(()=>{if(cancelled)return;background();g.fillStyle='#a0b4ac';g.fillText('Waveform unavailable',cv.width/2,cv.height/2)});
  return()=>{cancelled=true};
 }
 SC.blank(g);

}
/** Hand the selected media to another workflow. */
function open(app: string) {
  const a = APPS.find((x) => x[0] === app);
  if (!a || !media || !a[3].includes(media.type)) return;
  opts.beforeOpen?.(app, media);
  SC.set('osh-handoff', { ...media, from: opts.app });
  if(app==='edit'&&opts.app==='director'){dispatchEvent(new CustomEvent('osh-open-edit',{detail:{...media,from:'director'}}));return}
  location.href = a[2] + '?from=' + opts.app;
}
/** Highlight elements in use (chips on in the generator, regions selected in Edit). */
function mark(ids: string[]) { dispatchEvent(new CustomEvent('osh-element-usage',{detail:ids}));document.querySelectorAll<HTMLElement>('#studioElements .el').forEach((b) => b.classList.toggle('on', ids.includes(b.dataset.id!))); }

export const SHELL = { selected:()=>media, mount, mark, select, open, ELEMENTS, APPS, styleFit };
