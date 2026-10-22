import './workspace-dock.css';
import { panel, split, ids, remove, dock, valid, boundsOf, type Edge, type LayoutNode } from './window-layout';

type Setup = { tree: LayoutNode | null; mode: string };
type Store = { version: 2; active: string; layouts: Record<string, Setup>; notes: Record<string, { title: string; text: string }> };
const KEY = 'osh-window-workspace-v2';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const icon = (path: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;

export function mountWorkspaceDock(resize: () => void, workflow: (mode: string) => void): void {
 const app = document.querySelector<HTMLElement>('.app')!, main = app.querySelector('main')!;
 const wide = innerWidth >= 1150;
 const creation = split('x', panel('prompts'), panel('viewer'), wide ? .4 : .38);
 const presets: Record<string, Setup> = {
  Video: { tree: split('y', wide ? split('x', creation, panel('keyframes'), .79) : creation, panel('timeline'), .62), mode: 'video' },
  Image: { tree: split('y', split('x', panel('viewer'), panel('keyframes'), .72), panel('takes'), .7), mode: 'image' },
  '3D': { tree: split('x', panel('stage'), panel('elements'), .75), mode: 'video' },
  Rendering: { tree: split('y', split('x', panel('viewer'), panel('properties'), .75), panel('takes'), .7), mode: 'video' }
 };
 let store: Store = { version: 2, active: document.body.dataset.workflow === 'image' ? 'Image' : 'Video', layouts: {}, notes: {} };
 let restored=false;
 try { const value = JSON.parse(localStorage.getItem(KEY) || 'null'); if (value?.version === 2 && value.layouts && value.notes && typeof value.active === 'string') {store = value;restored=true;} } catch {}
 // Keep existing notes and named setups, translating regions into actual split trees. Floating legacy panels become docked siblings.
 if (!restored) try {
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
 let setup = clone(store.layouts[active] || presets[active] || presets.Video);
 const panels = new Map<string, HTMLElement>();
 const toolbar = document.createElement('nav'); toolbar.className = 'workspace-toolbar'; toolbar.setAttribute('aria-label', 'Workspace layout');
 const picker = document.createElement('select'); picker.setAttribute('aria-label', 'Workspace setup');
 const windows = document.createElement('details'); windows.className = 'window-menu'; windows.innerHTML = '<summary>Windows</summary><div></div>';
 const menu = windows.querySelector('div')!;
 const saveButton = document.createElement('button'); saveButton.textContent = 'Save setup…';
 const reset = document.createElement('button'); reset.textContent = 'Reset setup';
 const hint = document.createElement('span'); hint.textContent = 'Drag a window title · release on a docking guide';
 toolbar.append(picker, windows, saveButton, reset, hint);
 const board = document.createElement('div'); board.className = 'window-board';
 const parking = document.createElement('div'); parking.hidden = true;
 const overlay = document.createElement('div'); overlay.className = 'docking-overlay'; overlay.hidden = true;
 const shade = document.createElement('div'); shade.className = 'dock-preview';
 const guides = document.createElement('div'); guides.className = 'dock-guides';
 for (const [edge, label] of [['top', 'Above'], ['left', 'Left'], ['right', 'Right'], ['bottom', 'Below']] as const) { const item = document.createElement('span'); item.dataset.edge = edge; item.textContent = label; guides.append(item); }
 const label = document.createElement('div'); label.className = 'dock-preview-label'; overlay.append(shade, guides, label);
 const persist = () => { store.active = active; store.layouts[active] = clone(setup); try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
 let pending = false;
 const refresh = () => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; resize(); }); };
 function separator(node: Extract<LayoutNode, { kind: 'split' }>, container: HTMLElement): HTMLElement {
  const handle = document.createElement('div'); handle.className = 'workspace-split'; handle.tabIndex = 0; handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-label', 'Resize window split'); handle.setAttribute('aria-orientation', node.axis === 'x' ? 'vertical' : 'horizontal');
  const apply = (ratio: number) => { node.ratio = Math.max(.15, Math.min(.85, ratio)); container.style.setProperty('--ratio', String(node.ratio)); handle.setAttribute('aria-valuenow', String(Math.round(node.ratio * 100))); refresh(); };
  handle.onkeydown = e => { if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return; e.preventDefault(); apply(node.ratio + (['ArrowRight', 'ArrowDown'].includes(e.key) ? .03 : -.03)); persist(); };
  handle.onpointerdown = e => {
   if (e.button !== 0) return; e.preventDefault(); handle.setPointerCapture(e.pointerId); const initial = node.ratio, rect = container.getBoundingClientRect();
   handle.onpointermove = move => apply(node.axis === 'x' ? (move.clientX - rect.left) / rect.width : (move.clientY - rect.top) / rect.height);
   handle.onpointerup = () => { handle.onpointermove = null; persist(); };
   handle.onpointercancel = () => { handle.onpointermove = null; apply(initial); };
  };
  return handle;
 }
 function renderNode(node: LayoutNode): HTMLElement {
  if (node.kind === 'panel') return panels.get(node.id)!;
  const container = document.createElement('div'); container.className = 'window-split axis-' + node.axis; container.style.setProperty('--ratio', String(node.ratio));
  container.append(renderNode(node.first), separator(node, container), renderNode(node.second)); return container;
 }
 function render(): void {
  board.dataset.defaultLayout=String(active==='Video'&&JSON.stringify(setup.tree)===JSON.stringify(presets.Video.tree));
  const visible = new Set(ids(setup.tree));
  for (const [id, element] of panels) { element.hidden = !visible.has(id); element.classList.remove('is-dragging-window'); element.removeAttribute('style'); parking.append(element); menu.querySelector(`[data-window="${id}"]`)?.setAttribute('aria-pressed', String(visible.has(id))); }
  board.replaceChildren(); if (setup.tree) board.append(renderNode(setup.tree)); else { const empty = document.createElement('p'); empty.className = 'empty-workspace'; empty.textContent = 'Open a window from the Windows menu.'; board.append(empty); }
  board.append(overlay); refresh();
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
  const bar = document.createElement('div'); bar.className = 'window-titlebar';
  const grip = document.createElement('button'); grip.className = 'window-grip'; grip.textContent = title; grip.title = 'Drag to dock beside another window'; grip.onpointerdown = e => startDrag(id, e);
  const location = document.createElement('select'); location.setAttribute('aria-label', 'Dock ' + title); location.innerHTML = '<option value="">Dock…</option>';
  location.onfocus = () => { location.replaceChildren(new Option('Dock…', '')); for (const other of ids(setup.tree).filter(other => other !== id)) for (const edge of ['left', 'right', 'top', 'bottom'] as Edge[]) location.add(new Option(`${edge === 'top' ? 'Above' : edge === 'bottom' ? 'Below' : edge + ' of'} ${panels.get(other)!.getAttribute('aria-label')!.replace(' window', '')}`, other + ':' + edge)); };
  location.onchange = () => { const [target, edge] = location.value.split(':'); if (target) { setup.tree = dock(setup.tree, id, target, edge as Edge); render(); persist(); } location.value = ''; };
  const close = document.createElement('button'); close.className = 'window-close'; close.innerHTML = icon('M6 6l12 12M18 6L6 18'); close.setAttribute('aria-label', 'Close ' + title); close.title = 'Close ' + title; close.onclick = () => closeWindow(id);
  bar.append(grip, location, close); const body = document.createElement('div'); body.className = 'window-body'; body.append(content); element.append(bar, body); panels.set(id, element);
  const toggle = document.createElement('button'); toggle.dataset.window = id; toggle.textContent = title; toggle.onclick = () => { ids(setup.tree).includes(id) ? closeWindow(id) : openWindow(id); windows.open = false; }; menu.append(toggle);
 }
 const assets = app.querySelector<HTMLElement>('aside.l')!, keys = app.querySelector<HTMLElement>('aside.r')!, viewer = main.querySelector<HTMLElement>('.viewer')!, image = main.querySelector<HTMLElement>('.image-stage')!, composer = main.querySelector<HTMLElement>('.composer')!, properties = document.getElementById('videoAttributes') as HTMLDetailsElement;
 const generate = composer.querySelector<HTMLElement>('.generate-action')!; composer.querySelector('.row')!.append(generate);
 properties.open = true; const viewContent = document.createElement('div'); viewContent.className = 'viewer-content'; viewContent.append(image, viewer);
 add('stylization', 'Stylization', document.getElementById('studioStylization')!); add('elements', 'Elements', document.getElementById('studioElements')!); add('assets', 'Selected media', assets); add('viewer', 'Viewer', viewContent); add('prompts', 'Prompts', composer); add('keyframes', 'Image & keyframes', keys); add('properties', 'Size & timing', properties); add('timeline', 'Sequence', main.querySelector<HTMLElement>('.tlw')!); add('takes', 'Takes', main.querySelector<HTMLElement>('.hist')!);
 const sequenceBar = panels.get('timeline')!.querySelector('.window-titlebar')!;
 for (const id of ['trashBtn', 'addKeyBtn']) { const control = document.getElementById(id); if (control) sequenceBar.insertBefore(control, sequenceBar.children[1]); }
 const stage = document.createElement('div'); stage.className = 'stage-placeholder'; stage.innerHTML = '<div class="stage-grid"></div><h2>3D workspace</h2><p>A 3D viewport and scene tools are not connected yet.</p>'; add('stage', '3D viewport', stage);
 for (const [id, value] of Object.entries(store.notes)) if (value && typeof value.title === 'string' && typeof value.text === 'string') note(id, value.title, value.text);
 function note(id: string, title: string, text: string): void { const field = document.createElement('textarea'); field.className = 'workspace-note'; field.placeholder = 'Ideas, shot notes, checklist…'; field.value = text; field.setAttribute('aria-label', title); field.oninput = () => { store.notes[id].text = field.value; persist(); }; add(id, title, field); }
 function ask(label: string, value: string): Promise<string | null> { return new Promise(resolve => { const dialog = document.createElement('dialog'); dialog.className = 'workspace-name-dialog'; const form = document.createElement('form'); form.method = 'dialog'; const heading = document.createElement('h2'); heading.textContent = label; const input = document.createElement('input'); input.value = value; input.required = true; input.maxLength = 80; input.setAttribute('aria-label', label); const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel'; cancel.onclick = () => dialog.close(); const ok = document.createElement('button'); ok.textContent = 'Save'; form.append(heading, input, cancel, ok); form.onsubmit = e => { e.preventDefault(); if (input.value.trim()) dialog.close('save'); }; dialog.append(form); document.body.append(dialog); dialog.onclose = () => { resolve(dialog.returnValue === 'save' ? input.value.trim() : null); dialog.remove(); }; dialog.showModal(); input.select(); }); }
 const newNote = document.createElement('button'); newNote.textContent = '+ New notes window…'; newNote.onclick = async () => { const title = await ask('Window name', 'Notes'); if (!title) return; const id = 'note-' + Date.now(); store.notes[id] = { title, text: '' }; note(id, title, ''); openWindow(id); windows.open = false; }; menu.append(newNote);
 function choices(): void { picker.replaceChildren(); for (const name of new Set([...Object.keys(presets), ...Object.keys(store.layouts)])) picker.add(new Option(name, name)); picker.value = active; }
 let switching = false;
 function select(name: string): void {
  if(switching)return;const next=clone(store.layouts[name]||presets[name]||presets.Video);
  if(next.tree&&!valid(next.tree,new Set(panels.keys())))next.tree=clone(presets.Video.tree);
  switching=true;try{workflow(next.mode)}finally{switching=false}
  // A running generation can decline a creation-mode change. Keep its current layout and mode together.
  if(document.body.dataset.workflow!==next.mode){choices();return}
  active=name;setup=next;choices();render();persist();
 }
 picker.onchange = () => select(picker.value); saveButton.onclick = async () => { const name = await ask('Save this window setup as', presets[active] ? 'My workspace' : active); if (!name) return; active = name; persist(); choices(); }; reset.onclick = () => { setup = clone(presets[active] || presets.Video); workflow(setup.mode); render(); persist(); };
 const top = document.createElement('div'); top.className = 'workspace-context'; while (main.firstChild) top.append(main.firstChild);
 app.replaceChildren(toolbar, top, board, parking); app.classList.add('window-workspace');
 top.querySelectorAll<HTMLButtonElement>('[data-workflow]').forEach(button => button.addEventListener('click', () => select(button.dataset.workflow === 'image' ? 'Image' : 'Video')));
 document.getElementById('showVideoAttributes')?.addEventListener('click', () => { openWindow('properties'); properties.open = true; });
 document.addEventListener('osh-workflow-changed', ((event: CustomEvent) => { if (!switching && setup.mode !== event.detail) select(event.detail === 'image' ? 'Image' : 'Video'); }) as EventListener);
 const observer = new ResizeObserver(refresh); observer.observe(board); for (const element of panels.values()) observer.observe(element);
 addEventListener('resize', refresh); if (setup.tree && !valid(setup.tree, new Set(panels.keys()))) setup = clone(presets.Video); choices(); render(); persist();
}
