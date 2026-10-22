// Shared left sidebar for every studio workflow:
//   selected media (+ open in another workflow) · Stylemaxxer (style, fit meter, Stylemaxx) · Elements wall.
// Project-level state (selected style, user styles) lives in localStorage 'osh-project' so it follows you between apps.
import { SC } from './scene';
import { elementLibrary } from './element-maker';

declare const STYLEBOARD: { looks: Style[] };

export type MediaType = 'shot' | 'keyframe' | 'frame';
export type Media = { type: MediaType; label: string; spec?: unknown; u?: number; img?: string; video?:string;duration?:number;ref?: { shot: number; key?: number;shotId?:string } };
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
  ['director', 'Director', 'director.html', ['shot', 'keyframe']],
  ['edit', 'Edit Anything', 'edit.html', ['keyframe', 'frame','shot']],
];
const TYPES: Record<MediaType, string> = { shot: 'Shot', keyframe: 'Keyframe', frame: 'Frame' };
const ELEMENTS: Element[] = [
  { id: 'mia', ic: '👧', n: 'Mia', d: 'girl, 10, yellow raincoat', kind: 'cast' },
  { id: 'bolt', ic: '🤖', n: 'Bolt', d: 'small boxy robot', kind: 'cast' },
  { id: 'yard', ic: '🏚', n: 'Junkyard', d: 'dusk, scrap piles', kind: 'place' },
  { id: 'street', ic: '🏙', n: 'Street', d: 'empty, lamplit', kind: 'place' },
  { id: 'room', ic: '🛏', n: "Mia's room", d: 'desk, lamp, window', kind: 'place' },
];
const storedElements=SC.get('osh-elements');
if(Array.isArray(storedElements))for(const element of storedElements){
 if(!element||typeof element.n!=='string'||typeof element.d!=='string'||typeof element.id!=='string'||!['cast','place','object'].includes(element.kind))continue;
 const item={...element,refs:Array.isArray(element.refs)?element.refs.filter((url:unknown)=>typeof url==='string'&&/^\/outputs\/[a-f0-9]{16}\.png$/.test(url)).slice(0,4):[]};
 const index=ELEMENTS.findIndex(e=>e.id===item.id);if(index<0)ELEMENTS.push(item);else ELEMENTS[index]=item;
}

const css = `
#shared{display:flex;flex-direction:column;gap:12px}
#shared .apps{display:flex;border:1px solid var(--line);padding:3px;gap:2px}
#shared .apps a{flex:1;text-align:center;padding:6px 4px;color:var(--dim);text-decoration:none;font-size:12px;font-weight:500;cursor:pointer}
#shared .apps a.on{background:#26262a;color:var(--txt)}#shared .apps a:not(.on):hover{color:var(--txt)}
#shared .media{border:1px solid var(--line);padding:8px;display:flex;flex-direction:column;gap:8px;background:var(--card)}
#shared .media canvas{width:100%;aspect-ratio:16/9;display:block;background:#000}
#shared .media .mt{display:flex;align-items:center;gap:6px;font-size:12px}#shared .media .mt b{font-weight:500}
#shared .media .ty{font-size:10px;text-transform:uppercase;letter-spacing:.08em;border:1px solid #3a4462;color:#aab6d8;padding:1px 7px}
#shared .media .none{color:var(--faint);font-size:12px;padding:10px 4px;text-align:center}
#shared .openin{display:flex;flex-direction:column;gap:4px}
#shared .openin button{display:flex;align-items:center;justify-content:space-between;gap:6px;border:1px solid var(--line);background:none;padding:6px 9px;cursor:pointer;color:var(--txt);font-size:12px}
#shared .openin button:hover:not(:disabled){border-color:var(--acc)}#shared .openin button:disabled{opacity:.4;cursor:default}
#shared .openin small{color:var(--faint)}
#shared .sec{font-size:11px;font-weight:500;color:var(--dim);text-transform:uppercase;letter-spacing:.09em;display:flex;align-items:center;gap:8px}
#shared .sec span{margin-left:auto;text-transform:none;letter-spacing:0;color:var(--faint)}
#shared .style{display:block;width:100%;padding:0;border:1px solid var(--line);background:var(--card);cursor:pointer;text-align:left;color:var(--txt)}
#shared .style:hover{border-color:var(--acc)}
#shared .style canvas{width:100%;aspect-ratio:3/1;display:block}
#shared .style div{display:flex;justify-content:space-between;padding:6px 8px;font-size:12px}#shared .style small{color:var(--faint)}
#shared .fit{display:flex;flex-direction:column;gap:5px}
#shared .fit .row{display:flex;justify-content:space-between;font-size:11px;color:var(--dim)}#shared .fit b{font-weight:500;color:var(--txt)}
#shared .meter{position:relative;height:6px;background:linear-gradient(90deg,#4a2a2a,#4a442a,#2a4a35)}
#shared .meter i{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--txt);transition:left .4s}
#shared .maxx{width:100%;padding:9px;border:1px solid var(--acc);background:var(--acc);color:#111;font-weight:600;cursor:pointer}
#shared .maxx:disabled{opacity:.35;cursor:default}#shared .maxx.run{background:none;color:var(--txt)}
#shared .wall{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
#shared .el{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;aspect-ratio:1;background:var(--card);border:1px solid transparent;cursor:pointer;color:var(--txt);font-size:11px;padding:4px}
#shared .el:hover{border-color:var(--line)}#shared .el.on{border-color:var(--acc)}
#shared .el .av{font-size:22px;line-height:1}#shared .el span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.shm{position:fixed;inset:0;background:rgba(5,5,7,.72);display:flex;align-items:center;justify-content:center;z-index:100}
.shm .box{width:min(720px,94vw);max-height:88vh;overflow:auto;background:var(--col);border:1px solid var(--line);padding:18px;display:flex;flex-direction:column;gap:14px}
.shm h3{margin:0;font-size:15px;font-weight:600;display:flex;align-items:center}.shm h3 button{margin-left:auto}
.shm .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.shm .card{border:1px solid var(--line);background:var(--card);cursor:pointer;padding:0;color:var(--txt);text-align:left;position:relative}
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
  opts = o;
  const st = state();
  style = allStyles().find((l) => l.id === (st.style || st.look)) || STYLEBOARD.looks[0];
  str = st.str ?? 0.8;
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
  const root = $('#shared');
  root.innerHTML = `<div class="sec">Selected media</div><div class="media"></div>
    <div class="apps">${APPS.map(([id, n, href]) => `<a data-app="${id}" href="${href}" class="${id === o.app ? 'on' : ''}">${n}</a>`).join('')}</div>
    <div class="sec">Stylization</div>
    <button class="style" title="Change style"><canvas width="480" height="160"></canvas><div><span class="sn"></span><small>change ▸</small></div></button>
    <div class="fit"><div class="row"><span>Palette match · selected media</span><b class="fv">—</b></div><div class="meter"><i style="left:0"></i></div></div>
    <button class="maxx" title="Try three prompt-based variations and keep the closest palette. This does not train or apply a LoRA.">Try style variations</button>
    <div class="sec">Elements <span>${o.elementHint || ''}</span></div><div class="wall"></div>`;
  ($('.style', root) as HTMLButtonElement).onclick = () => selector();
  ($('.maxx', root) as HTMLButtonElement).onclick = () => maxx();
  elementLibrary($('.wall',root),ELEMENTS,e=>o.onElement?.(e),()=>o.mediaPool?.()||[]);
  drawSelected(); drawMedia();
  o.onLook?.(style, str, false);
  return { look: style, str };
}

function drawSelected() {
  const root = $('#shared');
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
  const root = $('#shared'), fv = $('.fv', root), bar = $('.meter i', root), btn = $('.maxx', root) as HTMLButtonElement;
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
  const btn = $('#shared .maxx') as HTMLButtonElement;
  btn.disabled = true; btn.classList.add('run');
  try { await opts.onStylemaxx(style, media, (m) => (btn.textContent = m)); }
  finally { btn.classList.remove('run'); btn.textContent = 'Try style variations'; btn.disabled = false; updateFit(); }
}

// ---------- modals: style selector + style maker ----------
function modal(title: string): { box: HTMLElement; close: () => void } {
  const m = document.createElement('div'); m.className = 'shm';
  m.innerHTML = `<div class="box"><h3>${title}<button class="btn" data-x>✕</button></h3></div>`;
  const close = () => { m.remove(); removeEventListener('keydown', esc); };
  const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  m.onclick = (e) => { if (e.target === m || (e.target as HTMLElement).closest('[data-x]')) close(); };
  addEventListener('keydown', esc); document.body.append(m);
  return { box: $('.box', m), close };
}
function selector() {
  const { box, close } = modal('Styles');
  const grid = document.createElement('div'); grid.className = 'grid'; box.append(grid);
  for (const st of allStyles()) {
    const c = document.createElement('button'); c.className = 'card' + (st.id === style.id ? ' on' : '');
    c.innerHTML = `<canvas width="320" height="200"></canvas><div>${st.n}</div>${st.user ? '<button class="ed" title="Edit style">✎</button>' : ''}`;
    drawStyle($('canvas', c) as HTMLCanvasElement, st);
    c.onclick = (e) => { if ((e.target as HTMLElement).closest('.ed')) { close(); maker(st); return; } setStyle(st); close(); };
    grid.append(c);
  }
  const add = document.createElement('button'); add.className = 'add'; add.innerHTML = '<span style="font-size:22px">＋</span>add style';
  add.onclick = () => { close(); maker(); }; grid.append(add);
}
function maker(edit?: Style) {
  const { box, close } = modal(edit ? 'Edit style' : 'Style maker');
  const draft: Style = edit ? structuredClone(edit) : { id: 'u' + Date.now().toString(36), n: '', prompt: '', sw: ['#2a2a2e', '#55555c', '#8b8b93', '#c9c9cf'], refs: [], user: true };
  box.insertAdjacentHTML('beforeend', `
    <input class="title" placeholder="Style title" value="${(draft.n || '').replace(/"/g, '&quot;')}">
    <canvas class="prev" width="720" height="240"></canvas>
    <div class="sec" style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.09em">Media to use as reference</div>
    <div class="refs"></div>
    <textarea rows="2" placeholder="Describe the look (added to every prompt), e.g. 'grainy 16mm, teal shadows, warm skin'">${draft.prompt || ''}</textarea>
    <div class="note">Colours are taken from the reference media; the description steers generation.</div>
    <div class="acts">${edit ? '<button class="btn" data-del>Delete style</button>' : ''}<button class="btn" data-x>Cancel</button><button class="btn solid" data-save>Save style</button></div>`);
  const title = $('input.title', box) as HTMLInputElement, prompt = $('textarea', box) as HTMLTextAreaElement, prev = $('.prev', box) as HTMLCanvasElement, refs = $('.refs', box);
  const recolor = async () => {
    if (draft.refs?.length) {
      const px = (await Promise.all(draft.refs.map((u) => loadImg(u).then((im) => pixels(im, 24, 14))))).flat();
      draft.sw = palette(px);
      draft.sky = [draft.sw[1], draft.sw[3]];
    }
    prev.getContext('2d')!.clearRect(0, 0, prev.width, prev.height); drawStyle(prev, draft);
  };
  const drawRefs = () => {
    refs.innerHTML = '';
    draft.refs!.forEach((u, i) => { const d = document.createElement('div'); d.className = 'ref'; d.innerHTML = `<img src="${u}"><button title="Remove">✕</button>`; ($('button', d) as HTMLButtonElement).onclick = () => { draft.refs!.splice(i, 1); drawRefs(); recolor(); }; refs.append(d); });
    const add = document.createElement('button'); add.className = 'add'; add.style.minHeight = '0'; add.style.aspectRatio = '16/10'; add.innerHTML = '＋<small>add more</small>';
    add.onclick = () => pick(); refs.append(add);
  };
  const pick = () => {
    const pool = opts.mediaPool?.() || [];
    let el = $('.pool', box);
    if (el) { el.remove(); return; }
    el = document.createElement('div'); el.className = 'pool';
    if (!pool.length) el.innerHTML = '<span class="note">No generated media yet. Generate some keyframes first.</span>';
    pool.forEach((p) => { const b = document.createElement('button'); b.title = p.label; b.className = draft.refs!.includes(p.url) ? 'on' : ''; b.innerHTML = `<img src="${p.url}">`;
      b.onclick = () => { const i = draft.refs!.indexOf(p.url); if (i >= 0) draft.refs!.splice(i, 1); else draft.refs!.push(p.url); b.classList.toggle('on'); drawRefs(); recolor(); }; el.append(b); });
    refs.after(el);
  };
  drawRefs(); recolor(); title.focus();
  ($('[data-save]', box) as HTMLButtonElement).onclick = () => {
    draft.n = title.value.trim() || 'Untitled style'; draft.prompt = prompt.value.trim();
    const list = userStyles().filter((x) => x.id !== draft.id); list.push(draft);
    save({ styles: list }); close();
    style = { ...draft, id: '' }; setStyle(draft);   // force refresh even when editing the selected style
  };
  const del = $('[data-del]', box) as HTMLButtonElement | null;
  if (del) del.onclick = () => { if (!confirm(`Delete style "${draft.n}"?`)) return; save({ styles: userStyles().filter((x) => x.id !== draft.id) }); close(); if (style.id === draft.id) { style = { ...style, id: '' }; setStyle(STYLEBOARD.looks[0]); } };
}

// ---------- selected media: what's selected in this app, and which workflows can open it ----------
function select(m: Media | null) {
  const key = m ? JSON.stringify([m.type, m.label, m.spec, m.u, m.img,m.video]) : '';
  if (key === mediaKey) return;
  mediaKey = key; media = m; drawMedia();
}
function drawMedia() {
  const box = $('#shared .media'); if (!box) return;
  updateFit();
  if (!media) { box.innerHTML = '<div class="none">Select a shot, keyframe or frame to open it in another workflow.</div>'; return; }
  box.innerHTML = `<canvas width="320" height="180"></canvas><div class="mt"><span class="ty">${TYPES[media.type]}</span><b>${media.label}</b></div><div class="openin"></div>`;
  const cv = $('canvas', box) as HTMLCanvasElement, g = cv.getContext('2d')!;
  if (media.img) loadImg(media.img).then((im) => { const r = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight); g.drawImage(im, (cv.width - im.naturalWidth * r) / 2, (cv.height - im.naturalHeight * r) / 2, im.naturalWidth * r, im.naturalHeight * r); });
  else SC.blank(g);
  const list = $('.openin', box);
  for (const [id, n, , types] of APPS) {
    const b = document.createElement('button'), ok = types.includes(media.type)&&!(id==='edit'&&media.type==='shot'&&!media.video), here = id === opts.app;
    b.innerHTML = `<span>${here ? '● ' : ''}${n}</span><small>${here ? 'open here' : ok ? 'open in →' : `can't edit a ${media.type}`}</small>`;
    b.disabled = here || !ok; b.onclick = () => open(id); list.append(b);
  }
}
/** Hand the selected media to another workflow. */
function open(app: string) {
  const a = APPS.find((x) => x[0] === app);
  if (!a || !media || !a[3].includes(media.type)) return;
  opts.beforeOpen?.(app, media);
  SC.set('osh-handoff', { ...media, from: opts.app });
  location.href = a[2] + '?from=' + opts.app;
}
/** Highlight elements in use (chips on in the generator, regions selected in Edit). */
function mark(ids: string[]) { document.querySelectorAll<HTMLElement>('#shared .el').forEach((b) => b.classList.toggle('on', ids.includes(b.dataset.id!))); }

export const SHELL = { mount, mark, select, open, ELEMENTS, APPS, styleFit };
