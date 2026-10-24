import {StagePlaceholder} from './react/controls';
import {WorkspaceName} from './react/workspace-name';
import {WorkspaceToolbar,WindowsMenu} from './react/workspace-toolbar';
import {createElement} from 'react';
import {renderView,unmountView} from './react/render';
import {DockTree,WindowChrome} from './react/docking';
import './workspace-dock.css';
import './sequence-transport.css';
import { mountProjectFiles } from './project-files';
import { SHELL } from './shell';
import { panel, split, ids, remove, dock, valid, boundsOf, type Edge, type LayoutNode } from './window-layout';

type Setup = { tree: LayoutNode | null; mode: string };
type Store = { version: 2; active: string; layouts: Record<string, Setup>; notes: Record<string, { title: string; text: string }> };
const KEY = 'osh-window-workspace-v2';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const icon = (path: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;

export type CustomWorkspace={storageKey:string;active:string;presets:Record<string,Setup>;panels:{id:string;title:string;content:HTMLElement}[]};
export function mountWorkspaceDock(resize: () => void, workflow: (mode: string) => void,custom?:CustomWorkspace): void {
 const storageKey=custom?.storageKey||KEY;
 const app = document.querySelector<HTMLElement>('.app')!, main = app.querySelector('main')!;
 const wide = innerWidth >= 1150;
 const creation = split('x', panel('prompts'), panel('viewer'), .5);
 const bottom=Math.max(190,Math.min(300,innerHeight*.27)),topRatio=Math.max(.5,Math.min(.8,1-bottom/Math.max(300,innerHeight-110)));
 const videoTop=wide?split('x',split('y',panel('assets'),panel('files'),.5),creation,.19):creation;
 const presets: Record<string, Setup> = custom?.presets||{
  Video: { tree: split('y', videoTop, panel('timeline'), topRatio), mode: 'video' },
  Director:{tree:split('y',split('x',panel('viewer'),panel('keyframes'),.72),panel('timeline'),.62),mode:'video'},
  Image: { tree: split('y', split('x', panel('viewer'), panel('keyframes'), .72), panel('takes'), .7), mode: 'image' },
  '3D': { tree: split('x', panel('stage'), panel('elements'), .75), mode: 'video' },
  Rendering: { tree: split('y', split('x', panel('viewer'), panel('properties'), .75), panel('takes'), .7), mode: 'video' }
 };
 const fallback=presets[custom?.active||'Video']||Object.values(presets)[0];
 let store: Store = { version: 2, active: custom?.active||(document.body.dataset.workflow === 'image' ? 'Image' : 'Video'), layouts: {}, notes: {} };
 let restored=false;
 try { const value = JSON.parse(localStorage.getItem(storageKey) || 'null'); if (value?.version === 2 && value.layouts && value.notes && typeof value.active === 'string') {store = value;restored=true;} } catch {}
 // Keep existing notes and named setups, translating regions into actual split trees. Floating legacy panels become docked siblings.
 if (!custom && !restored) try {
  const old = JSON.parse(localStorage.getItem('osh-window-workspace-v1') || 'null');
  if (old?.notes) store.notes = old.notes;
  for (const [name, layout] of Object.entries(old?.layouts || {})) {
   if (presets[name]) continue;
   const entries = Object.entries(layout as Record<string, { zone: string }>).filter(([, state]) => state.zone !== 'closed');
   const group = (names: string[]) => names.reduce<LayoutNode | null>((tree, id) => tree ? split('y', tree, panel(id)) : panel(id), null);
   const bottom = group(entries.filter(([, state]) => state.zone === 'bottom').map(([id]) => id));
   const top = entries.filter(([, state]) => state.zone !== 'bottom').map(([id]) => id).reduce<LayoutNode | null>((tree, id) => tree ? split('x', tree, panel(id)) : panel(id), null);
   store.layouts[name] = { tree: top && bottom ? split('y', top, bottom, .68) : top || bottom, mode: old.modes?.[name] || 'video' };
  }
 } catch {}
 let active = store.active;
 let setup = clone(store.layouts[active] || presets[active] || fallback);
 try{if(!custom&&!localStorage.getItem('osh-video-layout-reference-v2')){store.layouts.Video=clone(fallback);if(active==='Video')setup=clone(fallback);localStorage.setItem('osh-video-layout-reference-v2','1')}}catch{}
 const panels = new Map<string, HTMLElement>();
 const registrations=new Map<string,{title:string;content:HTMLElement}>();
 const toolbar = document.createElement('nav'); toolbar.className = 'workspace-toolbar'; toolbar.setAttribute('aria-label', 'Workspace layout');
 renderView(toolbar,createElement(WorkspaceToolbar));
 const picker=toolbar.querySelector('select')!,windows=toolbar.querySelector('details')!,menu=windows.querySelector('div')!,saveButton=toolbar.querySelector<HTMLButtonElement>('[data-save-setup]')!,reset=toolbar.querySelector<HTMLButtonElement>('[data-reset-setup]')!;
 function renderMenu(){renderView(menu,createElement(WindowsMenu,{panels:[...registrations].map(([id,p])=>({id,title:p.title})),visible:ids(setup.tree),onToggle:id=>{ids(setup.tree).includes(id)?closeWindow(id):openWindow(id);windows.open=false},onNew:async()=>{const title=await ask('Window name','Notes');if(!title)return;const id='note-'+Date.now();store.notes[id]={title,text:''};note(id,title,'');openWindow(id);windows.open=false}}))}
 const board = document.createElement('div'); board.className = 'window-board';
 const layout=document.createElement('div');layout.className='dock-layout';board.append(layout);
 const parking = document.createElement('div'); parking.hidden = true;
 const overlay = document.createElement('div'); overlay.className = 'docking-overlay'; overlay.hidden = true;
 const shade = document.createElement('div'); shade.className = 'dock-preview';
 const guides = document.createElement('div'); guides.className = 'dock-guides';
 for (const [edge, label] of [['top', 'Above'], ['left', 'Left'], ['right', 'Right'], ['bottom', 'Below']] as const) { const item = document.createElement('span'); item.dataset.edge = edge; item.textContent = label; guides.append(item); }
 const label = document.createElement('div'); label.className = 'dock-preview-label'; overlay.append(shade, guides, label);
 const persist = () => { store.active = active; store.layouts[active] = clone(setup); try { localStorage.setItem(storageKey, JSON.stringify(store)); } catch {} };
 let pending = false;
 const refresh = () => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; resize(); }); };
 function render(): void {
  board.dataset.defaultLayout=String(active==='Video'&&JSON.stringify(setup.tree)===JSON.stringify(fallback.tree));
  const visible = new Set(ids(setup.tree));
  for(const [id,{title,content}] of registrations)renderView(panels.get(id)!,createElement(WindowChrome,{id,title,content,visible:[...visible],panels,onDrag:startDrag,onDock:(moving,target,edge)=>{setup.tree=dock(setup.tree,moving,target,edge);render();persist()},onClose:()=>closeWindow(id)}));
  for (const [id, element] of panels) { element.hidden = !visible.has(id); element.classList.remove('is-dragging-window'); element.removeAttribute('style'); parking.append(element); menu.querySelector(`[data-window="${id}"]`)?.setAttribute('aria-pressed', String(visible.has(id))); }
  renderView(layout,createElement(DockTree,{node:setup.tree,panels,parking,onRatio:persist}));
  board.append(overlay); renderMenu();refresh();document.dispatchEvent(new Event('osh-window-layout-changed'));
 }
 function openWindow(id: string): void { if (ids(setup.tree).includes(id)) return; setup.tree = setup.tree ? split('x', setup.tree, panel(id), .7) : panel(id); render(); persist(); }
 function closeWindow(id: string): void { setup.tree = remove(setup.tree, id); render(); persist(); }
 let cancelDrag: (()=>void)|null=null;
 function startDrag(id: string, event: PointerEvent): void {
  if (event.button !== 0) return; event.preventDefault();cancelDrag?.();
  const element = panels.get(id)!, initial = clone(setup.tree), start = { x: event.clientX, y: event.clientY }, rect = element.getBoundingClientRect();
  let moving = false, candidate: { target: string; edge: Edge } | null = null, ghost: HTMLElement | null = null;
  const targets = [...panels.entries()].filter(([other, el]) => other !== id && !el.hidden && ids(initial).includes(other)).map(([target, el]) => ({ target, rect: el.getBoundingClientRect() }));
  function update(x: number, y: number): void {
   candidate = null;
   // Target rectangles remain stable during the drag, so the preview cannot jump away beneath the pointer.
   const target = targets.find(item => x >= item.rect.left && x <= item.rect.right && y >= item.rect.top && y <= item.rect.bottom);
   if (!target) { overlay.hidden = true; return; }
   const r = target.rect, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
   const bounds = board.getBoundingClientRect();overlay.hidden=false;Object.assign(guides.style,{left:cx-bounds.left+'px',top:cy-bounds.top+'px'});
   let edge: Edge;
   const guide = [...guides.children].find(item => { const b = item.getBoundingClientRect(); return !overlay.hidden && x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; }) as HTMLElement | undefined;
   if (guide) edge = guide.dataset.edge as Edge;
   else { const dx = (x - cx) / r.width, dy = (y - cy) / r.height; edge = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 'left' : 'right' : dy < 0 ? 'top' : 'bottom'; }
   candidate = { target: target.target, edge }; overlay.hidden = false;
   const area = boundsOf(dock(initial,id,target.target,edge),id,{x:4,y:4,width:board.clientWidth-8,height:board.clientHeight-8})!;
   Object.assign(shade.style, { left: area.x + 'px', top: area.y + 'px', width: area.width + 'px', height: area.height + 'px' });
   Object.assign(guides.style, { left: cx - bounds.left + 'px', top: cy - bounds.top + 'px' });
   for (const item of guides.children) item.classList.toggle('selected', (item as HTMLElement).dataset.edge === edge);
   label.textContent = `Release to dock ${edge === 'top' ? 'above' : edge === 'bottom' ? 'below' : 'to the ' + edge + ' of'} ${panels.get(target.target)!.getAttribute('aria-label')!.replace(' window', '')}`;
   label.style.left = Math.max(4, Math.min(bounds.width - 280, area.x + 8)) + 'px'; label.style.top = Math.max(4, area.y + 8) + 'px';
  }
  const move = (e: PointerEvent) => {
   if (!moving && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 5) return;
   if (!moving) { moving = true; element.classList.add('is-dragging-window'); ghost = document.createElement('div'); ghost.className = 'window-drag-label'; ghost.textContent = element.getAttribute('aria-label')!.replace(' window', ''); document.body.append(ghost); document.body.classList.add('docking-active'); }
   if (ghost) { ghost.style.left = e.clientX + 14 + 'px'; ghost.style.top = e.clientY + 16 + 'px'; } update(e.clientX, e.clientY);
  };
  const finish = (cancelled: boolean) => {
   document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', cancel); document.removeEventListener('keydown', escape); window.removeEventListener('blur', cancel);window.removeEventListener('resize',cancel);cancelDrag=null;
   ghost?.remove(); element.classList.remove('is-dragging-window'); overlay.hidden = true; document.body.classList.remove('docking-active');
   if (moving && !cancelled && candidate) setup.tree = dock(initial, id, candidate.target, candidate.edge);
   else setup.tree = initial;
   if (moving) { render(); persist(); }
  };
  const up = (e: PointerEvent) => { if (moving) update(e.clientX, e.clientY); finish(false); };
  const cancel = () => finish(true); const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); finish(true); } };
  document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', cancel); document.addEventListener('keydown', escape); window.addEventListener('blur', cancel);window.addEventListener('resize',cancel);cancelDrag=cancel;
 }
 function add(id: string, title: string, content: HTMLElement): void {
  const element = document.createElement('section'); element.className = 'studio-window'; element.dataset.window = id; element.setAttribute('aria-label', title + ' window');
  registrations.set(id,{title,content});panels.set(id,element);
  renderView(element,createElement(WindowChrome,{id,title,content,visible:ids(setup.tree),panels,onDrag:startDrag,onDock:(moving,target,edge)=>{setup.tree=dock(setup.tree,moving,target,edge);render();persist()},onClose:()=>closeWindow(id)}));
  renderMenu();
 }
 if(custom){for(const item of custom.panels)add(item.id,item.title,item.content)}else{
 const assets = app.querySelector<HTMLElement>('aside.l')!, keys = app.querySelector<HTMLElement>('aside.r')!, viewer = main.querySelector<HTMLElement>('.viewer')!, image = main.querySelector<HTMLElement>('.image-stage')!, composer = main.querySelector<HTMLElement>('.composer')!, properties = document.getElementById('videoAttributes') as HTMLDetailsElement;
 properties.open = true; const viewContent = document.createElement('div'); viewContent.className = 'viewer-content'; viewContent.append(image, viewer);
 add('edit-history','Edit history',document.getElementById('studioEditHistory')!);add('files','Project files',mountProjectFiles());add('stash','Stash',document.getElementById('stash')!);
 add('stylization', 'Stylization', document.getElementById('studioStylization')!); add('elements', 'Elements', document.getElementById('studioElements')!); add('assets', 'Selected media', assets); add('viewer', 'Viewer', viewContent); add('prompts', 'Prompts', composer); add('keyframes', 'Image & keyframes', keys); add('properties', 'Size & timing', properties); add('timeline', 'Sequence', main.querySelector<HTMLElement>('.tlw')!); add('takes', 'Takes', main.querySelector<HTMLElement>('.hist')!);
 const sequenceBar = panels.get('timeline')!.querySelector('.window-titlebar')!;
 const sequenceTransport=document.createElement('div');sequenceTransport.className='sequence-transport';sequenceTransport.setAttribute('role','group');sequenceTransport.setAttribute('aria-label','Sequence playback position');
 for(const id of ['previousFrame','nextFrame','viewerTime']){const control=panels.get('viewer')!.querySelector<HTMLElement>('#'+id)!;sequenceTransport.append(id==='viewerTime'?control.closest('label')!:control)}
 sequenceBar.insertBefore(sequenceTransport,sequenceBar.children[1]);
 for (const id of ['trashBtn', 'addKeyBtn']) { const control = document.getElementById(id); if (control) sequenceBar.insertBefore(control, sequenceBar.children[1]); }
 const stage = document.createElement('div'); stage.className = 'stage-placeholder'; renderView(stage,createElement(StagePlaceholder)); add('stage', '3D viewport', stage);
 document.getElementById('showVideoAttributes')?.addEventListener('click', () => { openWindow('properties'); properties.open = true; });
 }
 for (const [id, value] of Object.entries(store.notes)) if (value && typeof value.title === 'string' && typeof value.text === 'string') note(id, value.title, value.text);
 function note(id: string, title: string, text: string): void { const field = document.createElement('textarea'); field.className = 'workspace-note'; field.placeholder = 'Ideas, shot notes, checklist…'; field.value = text; field.setAttribute('aria-label', title); field.oninput = () => { store.notes[id].text = field.value; persist(); }; add(id, title, field); }
 function ask(label:string,value:string):Promise<string|null>{return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='workspace-name-dialog';renderView(dialog,createElement(WorkspaceName,{label,value,onSave:name=>dialog.close(name),onCancel:()=>dialog.close()}));document.body.append(dialog);dialog.onclose=()=>{resolve(dialog.returnValue||null);unmountView(dialog);dialog.remove()};dialog.showModal()})}
 function choices(): void { picker.replaceChildren(); for (const name of new Set([...Object.keys(presets), ...Object.keys(store.layouts)])) picker.add(new Option(name, name)); if(!custom)picker.add(new Option('Edit ↗','__edit'));picker.value = active; }
 let switching = false;
 function select(name: string): void {
  if(name==='__edit'){SHELL.open('edit');picker.value=active;return}
  if(switching)return;const next=clone(store.layouts[name]||presets[name]||fallback);
  if(next.tree&&!valid(next.tree,new Set(panels.keys())))next.tree=clone(fallback.tree);
  switching=true;try{workflow(next.mode)}finally{switching=false}
  // A running generation can decline a creation-mode change. Keep its current layout and mode together.
  if(document.body.dataset.workflow!==next.mode){choices();return}
  active=name;setup=next;choices();render();persist();document.dispatchEvent(new CustomEvent('osh-workspace-selected',{detail:{name,mode:setup.mode}}));
 }
 addEventListener('osh-reveal-window',((event:CustomEvent)=>{if(panels.has(event.detail))openWindow(event.detail)}) as EventListener);
 document.addEventListener('osh-workspace-select',((event:CustomEvent)=>{if(presets[event.detail])select(event.detail)}) as EventListener);
 picker.onchange = () => select(picker.value); saveButton.onclick = async () => { const name = await ask('Save this window setup as', presets[active] ? 'My workspace' : active); if (!name) return; active = name; persist(); choices(); }; reset.onclick = () => { setup = clone(presets[active] || fallback); workflow(setup.mode); render(); persist(); };
 const top = document.createElement('div'); top.className = 'workspace-context'; if(!custom)while (main.firstChild) top.append(main.firstChild);
 app.replaceChildren(toolbar, top, board, parking); app.classList.add('window-workspace');
 top.querySelectorAll<HTMLButtonElement>('[data-workflow]').forEach(button => button.addEventListener('click', () => select(button.dataset.workflow === 'image' ? 'Image' : 'Video')));
 document.addEventListener('osh-workflow-changed', ((event: CustomEvent) => { if (!switching && setup.mode !== event.detail) select(event.detail === 'image' ? 'Image' : 'Video'); }) as EventListener);
 const observer = new ResizeObserver(refresh); observer.observe(board); for (const element of panels.values()) observer.observe(element);
 addEventListener('resize', refresh); if (setup.tree && !valid(setup.tree, new Set(panels.keys()))) setup = clone(fallback); choices(); render(); persist();
}
