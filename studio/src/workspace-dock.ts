import './workspace-dock.css';

type Zone='left'|'center'|'right'|'bottom'|'floating'|'closed';
type PanelState={zone:Zone;x?:number;y?:number;w?:number;h?:number};
type Layout=Record<string,PanelState>;
type Saved={active:string;layouts:Record<string,Layout>;notes:Record<string,{title:string;text:string}>;modes?:Record<string,string>};
const KEY='osh-window-workspace-v1';
const presets:Record<string,Layout>={
 Video:{assets:{zone:'closed'},viewer:{zone:'center'},prompts:{zone:'left'},keyframes:{zone:'right'},properties:{zone:'closed'},timeline:{zone:'bottom'},takes:{zone:'closed'},stage:{zone:'closed'},render:{zone:'closed'}},
 Image:{assets:{zone:'left'},viewer:{zone:'center'},prompts:{zone:'closed'},keyframes:{zone:'right'},properties:{zone:'closed'},timeline:{zone:'closed'},takes:{zone:'bottom'},stage:{zone:'closed'},render:{zone:'closed'}},
 '3D':{assets:{zone:'left'},viewer:{zone:'closed'},prompts:{zone:'closed'},keyframes:{zone:'closed'},properties:{zone:'closed'},timeline:{zone:'closed'},takes:{zone:'bottom'},stage:{zone:'center'},render:{zone:'right'}},
 Rendering:{assets:{zone:'closed'},viewer:{zone:'center'},prompts:{zone:'closed'},keyframes:{zone:'closed'},properties:{zone:'right'},timeline:{zone:'closed'},takes:{zone:'bottom'},stage:{zone:'closed'},render:{zone:'left'}}
};
const clone=(v:Layout):Layout=>JSON.parse(JSON.stringify(v));
export function mountWorkspaceDock(resize:()=>void,workflow:(mode:string)=>void):void{
 const app=document.querySelector<HTMLElement>('.app')!,main=app.querySelector('main')!;
 let saved:Saved={active:'Video',layouts:{},notes:{}};
 try{const value=JSON.parse(localStorage.getItem(KEY)||'null');if(value&&typeof value.layouts==='object'&&value.layouts&&typeof value.notes==='object'&&value.notes)saved=value}catch{}
 if(!localStorage.getItem(KEY)&&document.body.dataset.workflow==='image')saved.active='Image';
 let active=typeof saved.active==='string'?saved.active:'Video';
 let layout=clone(saved.layouts[active]||presets[active]||presets.Video);
 const panels=new Map<string,HTMLElement>();
 const toolbar=document.createElement('nav');toolbar.className='workspace-toolbar';toolbar.setAttribute('aria-label','Workspace layout');
 const picker=document.createElement('select');picker.setAttribute('aria-label','Workspace setup');
 const windows=document.createElement('details');windows.className='window-menu';const summary=document.createElement('summary');summary.textContent='Windows';windows.append(summary);
 const menu=document.createElement('div');windows.append(menu);
 const saveButton=document.createElement('button');saveButton.textContent='Save setup…';
 const reset=document.createElement('button');reset.textContent='Reset setup';
 const hint=document.createElement('span');hint.textContent='Drag a window title to dock · double-click to float';toolbar.append(picker,windows,saveButton,reset,hint);
 const board=document.createElement('div');board.className='window-board';
 const zones=new Map<Zone,HTMLElement>();
 for(const zone of ['left','center','right','bottom','floating','closed'] as Zone[]){const el=document.createElement('div');el.className='window-zone zone-'+zone;el.dataset.zone=zone;board.append(el);zones.set(zone,el)}
 const persist=()=>{saved.active=active;saved.layouts[active]=clone(layout);try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{}};
 let pending=false;const refresh=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;resize()})};
 function render(){
  for(const[id,panel]of panels){const state=layout[id]||{zone:'closed'};const zone=zones.has(state.zone)?state.zone:'closed';if(panel.parentElement!==zones.get(zone))zones.get(zone)!.append(panel);panel.classList.toggle('is-floating',zone==='floating');panel.hidden=zone==='closed';
   if(zone==='floating'){panel.style.left=Math.max(0,Math.min(state.x||32,board.clientWidth-240))+'px';panel.style.top=Math.max(0,Math.min(state.y||32,board.clientHeight-100))+'px';panel.style.width=Math.min(state.w||460,board.clientWidth)+'px';panel.style.height=Math.min(state.h||320,board.clientHeight)+'px'}else{panel.removeAttribute('style')}
   const toggle=menu.querySelector<HTMLButtonElement>('[data-window="'+id+'"]');if(toggle)toggle.setAttribute('aria-pressed',String(zone!=='closed'));
  }
  for(const[zone,el]of zones){el.classList.toggle('zone-empty',!el.children.length);board.classList.toggle('has-'+zone,!!el.children.length)}
  refresh();
 }
 function move(id:string,zone:Zone){layout[id]={...layout[id],zone};render();persist()}
 function add(id:string,title:string,content:HTMLElement){
  const panel=document.createElement('section');panel.className='studio-window';panel.dataset.window=id;panel.setAttribute('aria-label',title+' window');
  const bar=document.createElement('div');bar.className='window-titlebar';
  const grip=document.createElement('button');grip.className='window-grip';grip.textContent=title;grip.title='Drag to dock; double-click to float';
  const dock=document.createElement('select');dock.setAttribute('aria-label','Dock '+title);dock.innerHTML='<option value="">Dock…</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="bottom">Bottom</option><option value="floating">Float</option>';dock.onchange=()=>{move(id,dock.value as Zone);dock.value=''};
  const close=document.createElement('button');close.textContent='×';close.title='Close '+title;close.setAttribute('aria-label','Close '+title);close.onclick=()=>move(id,'closed');bar.append(grip,dock,close);
  const body=document.createElement('div');body.className='window-body';body.append(content);panel.append(bar,body);panels.set(id,panel);
  const toggle=document.createElement('button');toggle.dataset.window=id;toggle.textContent=title;toggle.onclick=()=>{move(id,layout[id]?.zone==='closed'||!layout[id]?'center':'closed');windows.open=false};menu.append(toggle);
  grip.ondblclick=()=>move(id,layout[id]?.zone==='floating'?'center':'floating');
  grip.onpointerdown=e=>{
   if(e.button!==0)return;e.preventDefault();const initial={...layout[id]},startX=e.clientX,startY=e.clientY,rect=panel.getBoundingClientRect(),bounds=board.getBoundingClientRect();let dragging=false;
   // Use document listeners because docking reparents the captured title bar.
   const finish=(cancelled=false)=>{document.removeEventListener('pointermove',drag);document.removeEventListener('pointerup',drop);document.removeEventListener('pointercancel',cancel);document.removeEventListener('keydown',escape);board.classList.remove('is-dragging');for(const el of zones.values())el.classList.remove('drop-target');if(cancelled){layout[id]=initial;render()}persist()};
   const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')finish(true)};document.addEventListener('keydown',escape);
   const drag=(event:PointerEvent)=>{if(!dragging&&Math.hypot(event.clientX-startX,event.clientY-startY)<6)return;dragging=true;board.classList.add('is-dragging');layout[id]={zone:'floating',x:rect.left-bounds.left+event.clientX-startX,y:rect.top-bounds.top+event.clientY-startY,w:rect.width,h:rect.height};render();for(const[zone,el]of zones){const r=el.getBoundingClientRect();el.classList.toggle('drop-target',zone!=='floating'&&zone!=='closed'&&event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)}};
   const drop=(event:PointerEvent)=>{if(dragging){const x=(event.clientX-bounds.left)/bounds.width,y=(event.clientY-bounds.top)/bounds.height;let target:Zone='floating';if(y>.77)target='bottom';else if(x<.2)target='left';else if(x>.8)target='right';else if(y<.2)target='center';layout[id].zone=target;render()}finish()};const cancel=()=>finish(true);document.addEventListener('pointermove',drag);document.addEventListener('pointerup',drop);document.addEventListener('pointercancel',cancel);
  };
  const handle=document.createElement('button');handle.className='window-resize';handle.setAttribute('aria-label','Resize '+title);handle.title='Drag to resize floating window';panel.append(handle);
  handle.onpointerdown=e=>{e.preventDefault();const r=panel.getBoundingClientRect(),x=e.clientX,y=e.clientY,old={...layout[id]};handle.setPointerCapture(e.pointerId);handle.onpointermove=m=>{layout[id]={...layout[id],w:Math.max(240,r.width+m.clientX-x),h:Math.max(120,r.height+m.clientY-y)};render()};handle.onpointerup=()=>{handle.onpointermove=null;persist()};handle.onpointercancel=()=>{handle.onpointermove=null;layout[id]=old;render()}};
 }
 const assets=app.querySelector<HTMLElement>('aside.l')!,keys=app.querySelector<HTMLElement>('aside.r')!,viewer=main.querySelector<HTMLElement>('.viewer')!,image=main.querySelector<HTMLElement>('.image-stage')!,composer=main.querySelector<HTMLElement>('.composer')!,properties=document.getElementById('videoAttributes') as HTMLDetailsElement;
 const generate=composer.querySelector<HTMLElement>('.generate-action');if(generate)composer.append(generate);
 properties.open=true;const viewContent=document.createElement('div');viewContent.className='viewer-content';viewContent.append(image,viewer);
 add('assets','Assets',assets);add('viewer','Viewer',viewContent);add('prompts','Prompts',composer);add('keyframes','Image & keyframes',keys);add('properties','Size & timing',properties);add('timeline','Sequence',main.querySelector<HTMLElement>('.tlw')!);add('takes','Takes',main.querySelector<HTMLElement>('.hist')!);
 const stage=document.createElement('div');stage.className='stage-placeholder';stage.innerHTML='<div class="stage-grid"></div><h2>3D workspace</h2><p>Arrange your windows here. A 3D viewport and scene tools are not connected yet.</p>';add('stage','3D viewport',stage);
 const renderInfo=document.createElement('div');renderInfo.className='render-info';renderInfo.innerHTML='<h3>Local rendering</h3><p>Generation continues when you rearrange or close a window.</p><p>Use Prompts to generate video, or Image & keyframes for stills. Finished media appears in Takes.</p><button type="button">Open generation windows</button>';renderInfo.querySelector('button')!.onclick=()=>{move('prompts','center');move('keyframes','right')};add('render','Rendering',renderInfo);
 function ask(label:string,value:string):Promise<string|null>{return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='workspace-name-dialog';const form=document.createElement('form');form.method='dialog';const heading=document.createElement('h2');heading.textContent=label;const input=document.createElement('input');input.value=value;input.required=true;input.maxLength=80;input.setAttribute('aria-label',label);const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';cancel.onclick=()=>dialog.close();const ok=document.createElement('button');ok.textContent='Save';form.append(heading,input,cancel,ok);form.onsubmit=e=>{e.preventDefault();if(input.value.trim())dialog.close('save')};dialog.append(form);document.body.append(dialog);dialog.onclose=()=>{resolve(dialog.returnValue==='save'?input.value.trim():null);dialog.remove()};dialog.showModal();input.select()})}
 function note(id:string,title:string,text:string){const field=document.createElement('textarea');field.className='workspace-note';field.placeholder='Ideas, shot notes, checklist…';field.value=text;field.setAttribute('aria-label',title);field.oninput=()=>{saved.notes[id].text=field.value;persist()};add(id,title,field)}
 for(const[id,value]of Object.entries(saved.notes))if(value&&typeof value.title==='string'&&typeof value.text==='string')note(id,value.title,value.text);
 const newNote=document.createElement('button');newNote.textContent='+ New notes window…';newNote.onclick=async()=>{const title=await ask('Window name','Notes');if(!title?.trim())return;const id='note-'+Date.now();saved.notes[id]={title:title.trim().slice(0,80),text:''};note(id,saved.notes[id].title,'');move(id,'floating');windows.open=false};menu.append(newNote);
 function choices(){picker.replaceChildren();for(const name of new Set([...Object.keys(presets),...Object.keys(saved.layouts)])){const option=new Option(name,name);picker.add(option)}picker.value=active}
 function select(name:string){active=name;layout=clone(saved.layouts[name]||presets[name]||presets.Video);workflow(saved.modes?.[name]||(name==='Image'?'image':'video'));choices();render();persist()}
 picker.onchange=()=>select(picker.value);saveButton.onclick=async()=>{const name=await ask('Save this window setup as',presets[active]?'My workspace':active);if(!name?.trim())return;active=name.trim().slice(0,80);saved.modes||={};saved.modes[active]=document.body.dataset.workflow||'video';persist();choices()};reset.onclick=()=>{layout=clone(presets[active]||presets.Video);render();persist()};
 // Keep the existing creation-mode switch and project/onboarding controls above the panel grid.
 const top=document.createElement('div');top.className='workspace-context';while(main.firstChild)top.append(main.firstChild);
 app.replaceChildren(toolbar,top,board);app.classList.add('window-workspace');
 top.querySelectorAll<HTMLButtonElement>('[data-workflow]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.workflow==='image'?'Image':'Video')));
 document.getElementById('showVideoAttributes')?.addEventListener('click',()=>{move('properties','right');properties.open=true});
 for(const edge of ['left','right','bottom']){
  const divider=document.createElement('div');divider.className='workspace-split split-'+edge;divider.tabIndex=0;divider.setAttribute('role','separator');divider.setAttribute('aria-label','Resize '+edge+' dock');divider.setAttribute('aria-orientation',edge==='bottom'?'horizontal':'vertical');board.append(divider);
  const apply=(value:number)=>{const max=edge==='bottom'?board.clientHeight*.65:board.clientWidth*.4;board.style.setProperty('--'+edge+'-size',Math.max(edge==='bottom'?100:150,Math.min(max,value))+'px');refresh()};
  divider.onpointerdown=e=>{e.preventDefault();const x=e.clientX,y=e.clientY,initial=edge==='bottom'?zones.get('bottom')!.clientHeight:zones.get(edge as Zone)!.clientWidth;divider.setPointerCapture(e.pointerId);divider.onpointermove=m=>apply(initial+(edge==='left'?m.clientX-x:edge==='right'?x-m.clientX:y-m.clientY));divider.onpointerup=()=>{divider.onpointermove=null;try{localStorage.setItem(KEY+'-'+edge,board.style.getPropertyValue('--'+edge+'-size'))}catch{}}};
  divider.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const initial=edge==='bottom'?zones.get('bottom')!.clientHeight:zones.get(edge as Zone)!.clientWidth;apply(initial+(['ArrowRight','ArrowDown'].includes(e.key)?20:-20))};
  try{const value=localStorage.getItem(KEY+'-'+edge);if(value)board.style.setProperty('--'+edge+'-size',value)}catch{}
 }
 const observer=new ResizeObserver(refresh);observer.observe(board);for(const panel of panels.values())observer.observe(panel);
 document.addEventListener('osh-workflow-changed',((event:CustomEvent)=>{const name=event.detail==='image'?'Image':'Video';if((saved.modes?.[active]||(active==='Image'?'image':'video'))!==event.detail)select(name)}) as EventListener);
 addEventListener('resize',render);choices();render();persist();
}
