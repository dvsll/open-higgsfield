import { seedOnboarding } from './onboarding-starter.ts';

type Project = {id:string;name:string;created:number;deletedAt?:number};
const registry='osh-projects-v1',active='osh-active-project';
const legacyKeys=['osh-director','osh-project','osh-elements','osh-frame-sizes','osh-workspace'];
function readProjects():Project[]{
 try{const value=JSON.parse(localStorage.getItem(registry)||'[]');return Array.isArray(value)?value.filter(p=>typeof p?.id==='string'&&typeof p?.name==='string'):[]}catch{return []}
}
let projects=readProjects();
if(!projects.some(p=>!p.deletedAt)){
 const migrated=!projects.length&&!!localStorage.getItem('osh-director');
 const project={id:crypto.randomUUID(),name:migrated?'The Robot in the Junkyard':'Untitled project',created:Date.now()};
 projects.push(project);localStorage.setItem(registry,JSON.stringify(projects));localStorage.setItem(active,project.id);
 if(migrated)for(const key of legacyKeys){const value=localStorage.getItem(key);if(value)localStorage.setItem(`osh:${project.id}:${key}`,value)}
 else seedOnboarding(project.id);
}
let current=projects.find(p=>p.id===localStorage.getItem(active)&&!p.deletedAt)||projects.find(p=>!p.deletedAt)!;
export const projectKey=(key:string)=>`osh:${current.id}:${key}`;
export const orderedProjects=(items:Project[],currentId:string)=>items.filter(p=>!p.deletedAt).sort((a,b)=>Number(b.id===currentId)-Number(a.id===currentId)||b.created-a.created);
const icons={close:'M6 6l12 12M18 6L6 18',plus:'M12 5v14M5 12h14',pencil:'m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z',bin:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',restore:'M4 10a8 8 0 1 1 0 6M4 4v6h6'};
function iconButton(kind:keyof typeof icons,label:string):HTMLButtonElement{
 const button=document.createElement('button');button.type='button';button.className='project-icon';button.title=label;button.setAttribute('aria-label',label);
 button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter"><path d="${icons[kind]}"/></svg>`;return button;
}
export function mountProjects():void{
 const busy=()=>document.querySelector<HTMLButtonElement>('#kgo')?.disabled||document.querySelector<HTMLElement>('#ov')?.style.display==='flex';
 const switchTo=(p:Project)=>{localStorage.setItem(active,p.id);location.href='director.html'};
 const onboarding=document.getElementById('testOnboarding');if(onboarding)onboarding.onclick=()=>{if(busy())return;projects=readProjects();const project={id:crypto.randomUUID(),name:`Onboarding test ${projects.filter(p=>p.name.startsWith('Onboarding test')).length+1}`,created:Date.now()};seedOnboarding(project.id);localStorage.setItem(registry,JSON.stringify([...projects,project]));switchTo(project)};
 const label=document.querySelector<HTMLElement>('.proj')!;label.replaceChildren();
 const button=document.createElement('button');button.className='project-picker';button.textContent=current.name+' ▾';button.onclick=()=>{
  if(busy())return;
  const dialog=document.createElement('dialog');dialog.className='projects-dialog';dialog.setAttribute('aria-label','Projects');
  dialog.innerHTML='<header><h2>Your projects</h2></header><p class="project-caption">Saved on this browser.</p><div data-content></div><p data-error role="status"></p>';
  const close=iconButton('close','Close projects');close.onclick=()=>dialog.close();dialog.querySelector('header')!.append(close);
  // Require both ends of the gesture outside: dragging text out must not dismiss the dialog.
  const outside=(e:MouseEvent)=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom};
  let pressedOutside=false;dialog.onpointerdown=e=>{pressedOutside=outside(e)};dialog.onclick=e=>{if(e.target===dialog&&pressedOutside&&outside(e))dialog.close();pressedOutside=false};
  dialog.onclose=()=>dialog.remove();
  let recycled=false;
  const error=()=>{dialog.querySelector('[data-error]')!.textContent='Could not save. Browser storage may be full.'};
  const save=(items:Project[])=>{localStorage.setItem(registry,JSON.stringify(items));projects=items};
  const content=dialog.querySelector<HTMLElement>('[data-content]')!;
  function editor(host:HTMLElement,value:string,submit:(name:string)=>void,cancel:()=>void){
   const form=document.createElement('form');form.className='project-name-form';
   const input=document.createElement('input');input.required=true;input.maxLength=60;input.value=value;input.placeholder='Your next idea…';input.setAttribute('aria-label',value?'Project name':'New project name');
   const ok=document.createElement('button');ok.textContent=value?'Save':'Create';ok.type='submit';
   const back=iconButton('close','Cancel');back.onclick=cancel;
   form.append(input,ok,back);form.onsubmit=e=>{e.preventDefault();const name=input.value.trim();if(name)try{submit(name)}catch{error()}};
   input.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel()}};
   host.replaceChildren(form);input.focus();input.select();
  }
  function render(){
   projects=readProjects();content.replaceChildren();
   if(!recycled){
    const create=document.createElement('button');create.className='project-create';create.type='button';create.innerHTML='<span aria-hidden="true">＋</span> New project';
    const createHost=document.createElement('div');createHost.className='project-create-slot';createHost.append(create);content.append(createHost);
    create.onclick=()=>editor(createHost,'',name=>{const p={id:crypto.randomUUID(),name,created:Date.now()};seedOnboarding(p.id);save([...readProjects(),p]);switchTo(p)},render);
   }
   const list=document.createElement('div');list.className='project-list';content.append(list);
   const items=recycled?projects.filter(p=>p.deletedAt).sort((a,b)=>b.deletedAt!-a.deletedAt!):orderedProjects(projects,current.id);
   for(const p of items){
    const row=document.createElement('div');row.className='project-row';row.classList.toggle('is-current',p.id===current.id&&!recycled);
    const name=document.createElement('button');name.type='button';name.className='project-name';name.textContent=p.name;if(p.id===current.id&&!recycled)name.setAttribute('aria-current','true');name.disabled=recycled;name.onclick=()=>switchTo(p);row.append(name);
    if(recycled){const restore=iconButton('restore',`Restore ${p.name}`);restore.onclick=()=>{try{save(readProjects().map(q=>q.id===p.id?{...q,deletedAt:undefined}:q));render()}catch{error()}};row.append(restore)}
    else{
     const rename=iconButton('pencil',`Rename ${p.name}`);rename.onclick=()=>editor(row,p.name,value=>{save(readProjects().map(q=>q.id===p.id?{...q,name:value}:q));if(p.id===current.id){current={...current,name:value};button.textContent=value+' ▾'}render()},render);
     const recycle=iconButton('bin',`Recycle ${p.name}`);recycle.onclick=()=>{try{
      const next=readProjects().map(q=>q.id===p.id?{...q,deletedAt:Date.now()}:q);
      let replacement=next.find(q=>!q.deletedAt);
      if(!replacement){replacement={id:crypto.randomUUID(),name:'Untitled project',created:Date.now()};seedOnboarding(replacement.id);next.push(replacement)}
      save(next);if(p.id===current.id)switchTo(replacement);else render();
     }catch{error()}};row.append(rename,recycle);
    }
    list.append(row);
   }
   if(!items.length){const empty=document.createElement('p');empty.textContent='Recycle Bin is empty.';list.append(empty)}
   const toggle=document.createElement('button');toggle.type='button';toggle.className='project-bin-toggle';toggle.textContent=recycled?'← Back to projects':`Recycle Bin (${projects.filter(p=>p.deletedAt).length})`;toggle.onclick=()=>{recycled=!recycled;render()};content.append(toggle);
   if(recycled){const hint=document.createElement('p');hint.className='project-caption';hint.textContent='Restore a project with all its scenes and settings.';content.append(hint)}
  }
  document.body.append(dialog);dialog.showModal();render();close.focus();
 };label.append(button);
}
