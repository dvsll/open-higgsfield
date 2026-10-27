import {TrainingPanel} from './react/training-workspace';
import {SC} from './scene';
import {GeometryWorkspace} from './react/geometry-workspace';
import {WorkspaceName} from './react/workspace-name';
import {WorkspacePicker} from './react/workspace-picker';
import {WorkspaceRecycleBin} from './react/workspace-recycle-bin';
import {ConfirmDelete} from './react/confirm-delete';
import {WorkspaceToolbar,WindowsMenu} from './react/workspace-toolbar';
import {createElement} from 'react';
import {renderView,unmountView} from './react/render';
import {DockTree,WindowChrome} from './react/docking';
import './workspace-dock.css';
import './sequence-transport.css';
import { mountProjectFiles } from './project-files';

import { panel, split, ids, remove, dock, valid, preview,dockAtSize, type Edge, type LayoutNode } from './window-layout';
import {workspaceNameError,recycleWorkspace,restoredWorkspaceName,type Setup} from './workspace-setups';

type Store = { version: 2; active: string; layouts: Record<string, Setup>; notes: Record<string, { title: string; text: string }>; deletedLayouts?:Record<string,Setup> };
const KEY = 'osh-window-workspace-v2';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const icon = (path: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;

export type CustomWorkspace={storageKey:string;active:string;presets:Record<string,Setup>;panels:{id:string;title:string;content:HTMLElement}[]};
export function mountWorkspaceDock(resize: () => void, workflow: (mode: string) => void,custom?:CustomWorkspace): void {
 const storageKey=custom?.storageKey||KEY;
 const app = document.querySelector<HTMLElement>('.app')!, main = app.querySelector('main')!;
 const wide = innerWidth >= 1150;
 const creation = split('x', panel('prompts'), panel('viewer'), .5);
 const bottom=Math.max(260,Math.min(360,innerHeight*.34)),topRatio=Math.max(.5,Math.min(.8,1-bottom/Math.max(300,innerHeight-110)));
 const captionCreation=split('x',panel('captions'),panel('viewer'),.5);
 const overlayTop=wide?split('x',split('y',panel('assets'),panel('files'),.5),captionCreation,.19):captionCreation;
 const videoTop=wide?split('x',split('y',panel('assets'),panel('files'),.5),creation,.19):creation;
 const presets: Record<string, Setup> = custom?.presets||{
  Video: { tree: split('y', videoTop, panel('timeline'), topRatio), mode: 'video' },
  Image: { tree: split('x',split('y',panel('assets'),panel('files'),.5),creation,.22), mode: 'image' },
  Audio:{tree:split('y',split('x',panel('files'),panel('prompts'),.35),panel('timeline'),topRatio),mode:'video'},
  Overlays:{tree:split('y',overlayTop,panel('timeline'),topRatio),mode:'video'},
  Training:{tree:split('x',panel('files'),split('y',split('x',panel('training-data'),panel('stylization'),.65),panel('training-runs'),.7),.22),mode:'video'},
  Edit:{tree:split('x',panel('files'),split('x',panel('edit-viewer'),split('y',panel('edit-controls'),panel('edit-versions'),.65),.7),.2),mode:'video'},
  '3D': { tree: split('x',panel('files'),split('x',panel('prompts'),panel('stage'),.36),.22), mode:'video',promptMedia:'3d' },
  Rendering: { tree: split('x',panel('files'),split('x',panel('viewer'),panel('prompts'),.6),.2), mode: 'video' }
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
 if(!custom){delete store.layouts.Director;delete store.deletedLayouts?.Director;if(store.active==='Director')store.active='Video'}
 if(!custom&&!localStorage.getItem('osh-caption-training-layout-v1')){store.layouts.Overlays=clone(presets.Overlays);store.layouts.Training=clone(presets.Training);localStorage.setItem('osh-caption-training-layout-v1','1')}
 if(!custom){const replaceAudio=(tree:LayoutNode|null):LayoutNode|null=>tree?.kind==='panel'?(tree.id==='audio-create'?panel('prompts'):tree):tree?{...tree,first:replaceAudio(tree.first)!,second:replaceAudio(tree.second)!}:null;for(const value of [...Object.values(store.layouts),...Object.values(store.deletedLayouts||{})])value.tree=ids(value.tree).includes('prompts')?remove(value.tree,'audio-create'):replaceAudio(value.tree)}
 if(!custom){const mergeImages=(tree:LayoutNode|null):LayoutNode|null=>tree?.kind==='panel'?(tree.id==='keyframes'?panel('prompts'):tree):tree?{...tree,first:mergeImages(tree.first)!,second:mergeImages(tree.second)!}:null;for(const value of [...Object.values(store.layouts),...Object.values(store.deletedLayouts||{})])value.tree=ids(value.tree).includes('prompts')?remove(value.tree,'keyframes'):mergeImages(value.tree)}
 if(!custom&&!localStorage.getItem('osh-image-library-layout-v1')){store.layouts.Image=clone(presets.Image);localStorage.setItem('osh-image-library-layout-v1','1')}
 for(const value of [...Object.values(store.layouts),...Object.values(store.deletedLayouts||{})])for(const id of ids(value.tree))if(['takes','stash'].includes(id)||id.startsWith('note-')||Object.hasOwn(store.notes,id))value.tree=remove(value.tree,id);
 if(!custom&&!localStorage.getItem('osh-prompt-3d-layout-v1')){store.layouts['3D']=clone(presets['3D']);localStorage.setItem('osh-prompt-3d-layout-v1','1')}
 if(!custom&&!localStorage.getItem('osh-3d-shared-prompt-v1')){store.layouts['3D']=clone(presets['3D']);localStorage.setItem('osh-3d-shared-prompt-v1','1')}
 let active = store.active;
 let setup = clone(store.layouts[active] || presets[active] || fallback);
 if(!custom){const replace=(tree:LayoutNode|null):LayoutNode|null=>tree?.kind==='panel'?(tree.id==='overlay-create'?panel('captions'):tree):tree?{...tree,first:replace(tree.first)!,second:replace(tree.second)!}:null;for(const value of [...Object.values(store.layouts),...Object.values(store.deletedLayouts||{})])value.tree=ids(value.tree).includes('captions')?remove(value.tree,'overlay-create'):replace(value.tree);setup.tree=ids(setup.tree).includes('captions')?remove(setup.tree,'overlay-create'):replace(setup.tree)}
 try{if(!custom&&!localStorage.getItem('osh-video-layout-reference-v2')){store.layouts.Video=clone(fallback);if(active==='Video')setup=clone(fallback);localStorage.setItem('osh-video-layout-reference-v2','1')}}catch{}
 const panels = new Map<string, HTMLElement>();
 let viewerSequence:string|null=SC.get('osh-viewer-sequence')==='unbound'?null:'timeline';
 const applyViewerBinding=()=>{document.body.dataset.viewerBound=String(viewerSequence==='timeline');dispatchEvent(new CustomEvent('osh-viewer-sequence',{detail:viewerSequence}))};
 const viewerTether=()=>({target:viewerSequence,onChange:(target:string|null)=>{viewerSequence=target==='timeline'?'timeline':null;SC.set('osh-viewer-sequence',viewerSequence||'unbound');applyViewerBinding();render()}});
 if(!custom)applyViewerBinding();
 const registrations=new Map<string,{title:string;content:HTMLElement}>();
 const toolbar = document.createElement('nav'); toolbar.className = 'workspace-toolbar'; toolbar.setAttribute('aria-label', 'Workspace layout');
 renderView(toolbar,createElement(WorkspaceToolbar,{studio:!custom}));
 const picker=toolbar.querySelector('select')!,windows=toolbar.querySelector('details')!,menu=windows.querySelector('div')!;
 function renderMenu(){renderView(menu,createElement(WindowsMenu,{panels:[...registrations].map(([id,p])=>({id,title:p.title})),visible:ids(setup.tree),onToggle:id=>{ids(setup.tree).includes(id)?closeWindow(id):openWindow(id);windows.open=false}}))}
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
  if(!custom)setup.tree=remove(setup.tree,'properties');
  board.dataset.defaultLayout=String(active==='Video'&&JSON.stringify(setup.tree)===JSON.stringify(fallback.tree));
  const visible = new Set(ids(setup.tree));
  for(const [id,{title,content}] of registrations)renderView(panels.get(id)!,createElement(WindowChrome,{id,title,content,tether:!custom&&id==='viewer'?viewerTether():undefined,visible:[...visible],panels,onDrag:startDrag,onDock:(moving,target,edge)=>{setup.tree=dockAtSize(setup.tree,moving,target,edge,{x:4,y:4,width:board.clientWidth-8,height:board.clientHeight-8});render();persist()},onClose:()=>closeWindow(id)}));
  for (const [id, element] of panels) { element.hidden = !visible.has(id); element.classList.remove('is-dragging-window'); element.removeAttribute('style'); parking.append(element); menu.querySelector(`[data-window="${id}"]`)?.setAttribute('aria-pressed', String(visible.has(id))); }
  renderView(layout,createElement(DockTree,{node:setup.tree,panels,parking,onRatio:persist}));
  board.append(overlay); renderMenu();refresh();document.dispatchEvent(new Event('osh-window-layout-changed'));
 }
 function openWindow(id: string): void { if(!custom&&id==='properties'&&document.getElementById('videoTrackToggle')?.getAttribute('aria-expanded')!=='true'){dispatchEvent(new Event('osh-expand-video'));return}if (ids(setup.tree).includes(id)) return; setup.tree = setup.tree ? split('x', setup.tree, panel(id), .7) : panel(id); render(); persist(); }
 function closeWindow(id: string): void {if(!ids(setup.tree).includes(id))return;setup.tree = remove(setup.tree, id); render(); persist();if(!custom&&id==='properties')dispatchEvent(new Event('osh-collapse-video')); }
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
   const area = preview({x:r.left-bounds.left,y:r.top-bounds.top,width:r.width,height:r.height},edge);
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
   if (moving && !cancelled && candidate) setup.tree = dockAtSize(initial, id, candidate.target, candidate.edge,{x:4,y:4,width:board.clientWidth-8,height:board.clientHeight-8});
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
  renderView(element,createElement(WindowChrome,{id,title,content,tether:!custom&&id==='viewer'?viewerTether():undefined,visible:ids(setup.tree),panels,onDrag:startDrag,onDock:(moving,target,edge)=>{setup.tree=dockAtSize(setup.tree,moving,target,edge,{x:4,y:4,width:board.clientWidth-8,height:board.clientHeight-8});render();persist()},onClose:()=>closeWindow(id)}));
  renderMenu();
 }
 if(custom){for(const item of custom.panels)add(item.id,item.title,item.content)}else{
 const assets = app.querySelector<HTMLElement>('aside.l')!, keys = app.querySelector<HTMLElement>('aside.r')!, viewer = main.querySelector<HTMLElement>('.viewer')!, image = main.querySelector<HTMLElement>('.image-stage')!, composer = main.querySelector<HTMLElement>('.composer')!, properties = document.getElementById('videoAttributes') as HTMLDetailsElement;
 keys.classList.add('image-composer');const imageSettings=keys.querySelector('.frame-properties');if(imageSettings)keys.querySelector('.advanced-prompt-content')!.append(imageSettings);composer.append(keys);const modelSlot=document.getElementById('promptModelSlot')!;for(const bar of [document.getElementById('videoModel')!.closest<HTMLElement>('.modelbar'),keys.querySelector<HTMLElement>('.image-modelbar')])if(bar)modelSlot.append(bar);
 properties.open = true; const viewContent = document.createElement('div'); viewContent.className = 'viewer-content'; viewContent.append(image, viewer);
 add('captions','Captions',document.getElementById('studioCaptions')!);add('edit-history','History',document.getElementById('studioEditHistory')!);add('files','Project files',mountProjectFiles());parking.append(document.getElementById('stash')!);
 add('edit-viewer','Edit viewer',document.getElementById('studioEditViewer')!);add('edit-controls','Edit controls',document.getElementById('studioEditControls')!);add('edit-versions','Edit versions',document.getElementById('studioEditVersions')!);
 const inspector=document.createElement('div');inspector.className='sequence-inspector';const identity=document.getElementById('videoTrackAttributes')!;identity.hidden=false;identity.className='scene-property-identity';inspector.append(identity);parking.append(inspector);
 const oldStyling=document.getElementById('studioStylization')!;oldStyling.hidden=true;parking.append(oldStyling);
 for(const [id,title,kind] of [['training-data','Training dataset','dataset'],['stylization','Training settings','settings'],['training-runs','Training runs','runs']] as const){const host=document.createElement('div');renderView(host,createElement(TrainingPanel,{panel:kind}));add(id,title,host)}
 add('elements', 'Elements', document.getElementById('studioElements')!); add('assets', 'Selected media', assets); add('viewer', 'Timeline viewer', viewContent); add('prompts', 'Prompt', composer); add('timeline', 'Sequence', main.querySelector<HTMLElement>('.tlw')!); parking.append(main.querySelector<HTMLElement>('.hist')!);
 const sequenceBar = panels.get('timeline')!.querySelector('.window-titlebar')!;
 const sequenceTransport=document.createElement('div');sequenceTransport.className='sequence-transport';sequenceTransport.setAttribute('role','group');sequenceTransport.setAttribute('aria-label','Sequence playback position');
 for(const id of ['previousFrame','nextFrame','viewerTime']){const control=panels.get('viewer')!.querySelector<HTMLElement>('#'+id)!;sequenceTransport.append(id==='viewerTime'?control.closest('label')!:control)}
 sequenceBar.insertBefore(sequenceTransport,sequenceBar.children[1]);
 for (const id of ['trashBtn', 'addKeyBtn']) { const control = document.getElementById(id); if (control) sequenceBar.insertBefore(control, sequenceBar.children[1]); }
 const stage = document.createElement('div'); stage.className = 'geometry-host'; renderView(stage,createElement(GeometryWorkspace)); add('stage', '3D viewport', stage);
 document.getElementById('showVideoAttributes')?.addEventListener('click', () => dispatchEvent(new Event('osh-open-prompt-advanced')));
 }
 function ask(label:string,value:string,validate?:(name:string)=>string,submitLabel='Save'):Promise<string|null>{
  return new Promise(resolve=>{
   const host=document.createElement('div');document.body.append(host);let settled=false;
   const finish=(name:string|null)=>{if(settled)return;settled=true;resolve(name);queueMicrotask(()=>{unmountView(host);host.remove()})};
   renderView(host,createElement(WorkspaceName,{label,value,validate,submitLabel,onSave:finish,onCancel:()=>finish(null)}));
  });
 }
 function choices(): void {
  picker.replaceChildren();
  for(const [label,names] of [['Presets',Object.keys(presets)],['My workspaces',Object.keys(store.layouts).filter(name=>!Object.hasOwn(presets,name))]] as const){
   if(!names.length)continue;const group=document.createElement('optgroup');group.label=label;group.style.color='#89929f';
   for(const name of names){const option=new Option(name,name);option.style.color='var(--ui-text, #e8e9ed)';group.append(option)}picker.append(group);
  }
  const actions=document.createElement('optgroup');actions.label='Create';const create=new Option('＋ Create workspace from current layout…','__new');create.style.fontWeight='600';actions.append(create);picker.append(actions);picker.value=active;
  if(!Object.hasOwn(presets,active)){const manage=document.createElement('optgroup');manage.label='Edit current workspace';for(const [label,value]of [['✎ Rename workspace…','__rename'],['♲ Move workspace to Recycle Bin…','__recycle']]){const option=new Option(label,value);option.style.color='#a0a7b3';manage.append(option)}picker.append(manage)}
  if(Object.keys(store.deletedLayouts||{}).length){const restore=new Option('Restore last recycled workspace','__restore');picker.append(restore)}
  picker.value=active;
 }
 let switching = false;
 function select(name: string): boolean {
  if(!custom&&name==='Director')name='Video';
  if(name==='__edit')name='Edit';
  if(name==='__new'){picker.value=active;void createWorkspace();return false}
  if(name==='__rename'){picker.value=active;void renameWorkspace();return false}
  if(name==='__recycle'){picker.value=active;deleteWorkspace();return false}
  if(name==='__restore'){picker.value=active;const last=Object.keys(store.deletedLayouts||{}).at(-1);if(last)restoreWorkspace(last);return false}
  if(name==='__bin'){picker.value=active;openRecycleBin();return false}
  if(switching)return false;const next=clone(store.layouts[name]||presets[name]||fallback);
  if(!custom&&name==='Edit')document.dispatchEvent(new Event('osh-edit-entering'));
  if(!custom)next.tree=remove(next.tree,'properties');
  if(next.tree&&!valid(next.tree,new Set(panels.keys())))next.tree=clone(fallback.tree);
  switching=true;try{workflow(next.mode)}finally{switching=false}
  // A running generation can decline a creation-mode change. Keep its current layout and mode together.
  if(document.body.dataset.workflow!==next.mode){choices();return false}
  active=name;setup=next;if(!custom)dispatchEvent(new CustomEvent('osh-prompt-media',{detail:next.promptMedia||(name==='Audio'?'audio':next.mode==='image'?'image':'video')}));choices();render();persist();document.dispatchEvent(new CustomEvent('osh-workspace-selected',{detail:{name,mode:setup.mode}}));return true;
 }
 if(!custom)setup.tree=remove(setup.tree,'properties');
 const promptMedia=(media:string)=>{switching=true;try{workflow(media==='image'?'image':'video')}finally{switching=false}if(document.body.dataset.workflow!==(media==='image'?'image':'video'))return;setup.mode=media==='image'?'image':'video';setup.promptMedia=media==='image'?'image':media==='audio'?'audio':media==='3d'?'3d':'video';dispatchEvent(new CustomEvent('osh-prompt-media',{detail:media}));persist()};
 if(!custom)addEventListener('osh-prompt-media-request',((event:CustomEvent)=>promptMedia(event.detail)) as EventListener);
 addEventListener('osh-reveal-window',((event:CustomEvent)=>{if(!custom&&event.detail==='keyframes'){promptMedia('image');openWindow('prompts');return}if(panels.has(event.detail))openWindow(event.detail)}) as EventListener);
 document.addEventListener('osh-workspace-select',((event:CustomEvent)=>{if(presets[event.detail]||!custom&&event.detail==='Director')select(event.detail)}) as EventListener);
 const names=()=>[...new Set([...Object.keys(presets),...Object.keys(store.layouts)])];
 async function createWorkspace(){
  const next=clone(setup);
  const proposed=restoredWorkspaceName('My workspace',names());
  const name=await ask('New workspace',proposed,value=>workspaceNameError(value,names()),'Create workspace');if(!name)return;
  store.layouts[name]=next;
  if(!select(name)){delete store.layouts[name];choices()}
 }
 picker.onchange=()=>select(picker.value);
 let closePicker:(()=>void)|null=null;
 windows.querySelector('summary')!.addEventListener('pointerdown',()=>closePicker?.());windows.querySelector('summary')!.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key))closePicker?.()});
 document.addEventListener('pointerdown',event=>{if(!windows.contains(event.target as Node))windows.open=false});
 function openPicker(){
  windows.open=false;
  if(document.querySelector('.workspace-picker-menu'))return;
  const host=document.createElement('div');document.body.append(host);const rect=picker.getBoundingClientRect();
  const close=()=>{closePicker=null;picker.removeAttribute('aria-controls');picker.removeAttribute('aria-expanded');unmountView(host);host.remove();picker.focus();document.dispatchEvent(new Event('osh-workspace-picker-changed'))};closePicker=close;picker.setAttribute('aria-controls','workspacePickerMenu');picker.setAttribute('aria-expanded','true');
  renderView(host,createElement(WorkspacePicker,{disabled:[...picker.options].filter(option=>option.disabled).map(option=>option.value),recycled:Object.keys(store.deletedLayouts||{}),onRestore:name=>{close();restoreWorkspace(name)},onPurge:name=>{close();purgeWorkspace(name)},groups:[{label:'Presets',names:Object.keys(presets)},{label:'My workspaces',names:Object.keys(store.layouts).filter(name=>!Object.hasOwn(presets,name)),editable:true}],active,left:Math.min(rect.left,Math.max(4,innerWidth-320)),top:rect.bottom+4,onClose:close,onSelect:name=>{close();select(name)},onRename:name=>{close();void renameWorkspace(name)},onRecycle:name=>{close();deleteWorkspace(name)}}));document.dispatchEvent(new Event('osh-workspace-picker-changed'));
 }
 picker.onpointerdown=e=>{e.preventDefault();openPicker()};picker.onkeydown=e=>{if(['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){e.preventDefault();openPicker()}};
 async function renameWorkspace(previous=active){
  if(Object.hasOwn(presets,previous))return;
  const name=await ask('Rename workspace',previous,value=>workspaceNameError(value,names(),previous),'Rename');
  if(!name||name===previous||!store.layouts[previous])return;
  store.layouts[name]=clone(previous===active?setup:store.layouts[previous]);delete store.layouts[previous];if(active===previous)active=name;persist();choices();
 }
 function deleteWorkspace(removed=active){
  if(Object.hasOwn(presets,removed)||!store.layouts[removed])return;
  // Change mode first; a running generation may reject a workflow switch.
  if(active===removed&&!select(custom?.active||'Video'))return;
  store.deletedLayouts||={};recycleWorkspace(store.layouts,store.deletedLayouts,presets,removed);persist();choices();
 };
 function purgeWorkspace(name:string){
  if(!store.deletedLayouts?.[name])return;
  const host=document.createElement('div');document.body.append(host);const close=()=>{unmountView(host);host.remove()};
  renderView(host,createElement(ConfirmDelete,{kind:'workspace',name,onCancel:close,onConfirm:()=>{close();delete store.deletedLayouts?.[name];persist();choices()}}));
 }
 function openRecycleBin(){
  const host=document.createElement('div');document.body.append(host);const close=()=>{unmountView(host);host.remove()};
  renderView(host,createElement(WorkspaceRecycleBin,{names:Object.keys(store.deletedLayouts||{}),onClose:close,onRestore:name=>{close();restoreWorkspace(name)},onDelete:name=>{close();purgeWorkspace(name)}}));
 }
 toolbar.querySelector<HTMLButtonElement>('[data-delete-media]')!.onclick=()=>dispatchEvent(new Event('osh-delete-selected-media'));
 function restoreWorkspace(name:string){
  const deleted=store.deletedLayouts||{};if(!deleted[name])return;
  const restored=restoredWorkspaceName(name,names());store.layouts[restored]=clone(deleted[name]);
  if(select(restored)){delete deleted[name];persist()}else delete store.layouts[restored];choices();
 };
 const top = document.createElement('div'); top.className = 'workspace-context'; if(!custom)while (main.firstChild) top.append(main.firstChild);
 app.replaceChildren(toolbar, top, board, parking); app.classList.add('window-workspace');
 if(!custom)document.body.classList.add('studio-single-bar');
 top.querySelectorAll<HTMLButtonElement>('[data-workflow]').forEach(button => button.addEventListener('click', () => select(button.dataset.workflow === 'image' ? 'Image' : 'Video')));
 document.addEventListener('osh-workflow-changed', ((event: CustomEvent) => { if (!switching && setup.mode !== event.detail) select(event.detail === 'image' ? 'Image' : 'Video'); }) as EventListener);
 const observer = new ResizeObserver(refresh); observer.observe(board); for (const element of panels.values()) observer.observe(element);
 addEventListener('resize', refresh); if(!custom)setup.tree=remove(setup.tree,'properties'); if (setup.tree && !valid(setup.tree, new Set(panels.keys()))) setup = clone(fallback); choices(); render(); persist();if(!custom)dispatchEvent(new CustomEvent('osh-prompt-media',{detail:setup.promptMedia||(active==='Audio'?'audio':setup.mode==='image'?'image':'video')}));
}
