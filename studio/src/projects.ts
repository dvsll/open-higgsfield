import { seedOnboarding } from './onboarding-starter.ts';
type Project = {id:string;name:string;created:number};
const registry='osh-projects-v1',active='osh-active-project';
const legacyKeys=['osh-director','osh-project','osh-elements','osh-frame-sizes','osh-workspace'];
let projects:Project[]=[];
try{const value=JSON.parse(localStorage.getItem(registry)||'[]');if(Array.isArray(value))projects=value.filter(p=>typeof p?.id==='string'&&typeof p?.name==='string')}catch{}
if(!projects.length){
 const migrated=!!localStorage.getItem('osh-director');
 projects=[{id:crypto.randomUUID(),name:migrated?'The Robot in the Junkyard':'Untitled project',created:Date.now()}];
 localStorage.setItem(registry,JSON.stringify(projects));localStorage.setItem(active,projects[0].id);
 for(const key of legacyKeys){const value=localStorage.getItem(key);if(value)localStorage.setItem(`osh:${projects[0].id}:${key}`,value)}
 if(!migrated)seedOnboarding(projects[0].id);
}
let current=projects.find(p=>p.id===localStorage.getItem(active))||projects[0];
export const projectKey=(key:string)=>`osh:${current.id}:${key}`;
export function mountProjects():void{
 const onboarding=document.getElementById('testOnboarding');if(onboarding)onboarding.onclick=()=>{if(document.querySelector<HTMLButtonElement>('#kgo')?.disabled||document.querySelector<HTMLElement>('#ov')?.style.display==='flex')return;const project={id:crypto.randomUUID(),name:`Onboarding test ${projects.filter(p=>p.name.startsWith('Onboarding test')).length+1}`,created:Date.now()};seedOnboarding(project.id);projects.push(project);localStorage.setItem(registry,JSON.stringify(projects));localStorage.setItem(active,project.id);location.href='director.html'};
 const label=document.querySelector<HTMLElement>('.proj')!;label.replaceChildren();
 const button=document.createElement('button');button.className='project-picker';button.textContent=current.name+' ▾';button.onclick=()=>{
  if(document.querySelector<HTMLButtonElement>('#kgo')?.disabled||document.querySelector<HTMLElement>('#ov')?.style.display==='flex')return;
  const dialog=document.createElement('dialog');dialog.className='projects-dialog';dialog.setAttribute('aria-label','Projects');
  dialog.innerHTML='<header><h2>Your projects</h2><button data-close>Close</button></header><p>Pick up an idea or start something new. Saved on this browser.</p><div data-list></div><form><label>Project name<input required maxlength="60" placeholder="Your next idea…"></label><button>Create project</button></form><form data-rename><label>Rename current project<input required maxlength="60"></label><button>Rename</button></form><p data-error role="status"></p>';
  const persist=()=>localStorage.setItem(registry,JSON.stringify(projects));
  const switchTo=(p:Project)=>{localStorage.setItem(active,p.id);location.href='director.html'};
  for(const p of projects){const row=document.createElement('button');row.className='project-row';row.textContent=p.name+(p.id===current.id?' · current':'');row.onclick=()=>switchTo(p);dialog.querySelector('[data-list]')!.append(row)}
  dialog.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
  dialog.querySelector('form')!.onsubmit=e=>{e.preventDefault();const input=dialog.querySelector('input')!;try{const p={id:crypto.randomUUID(),name:input.value.trim(),created:Date.now()};if(!p.name)return;seedOnboarding(p.id);projects.push(p);persist();switchTo(p)}catch{dialog.querySelector('[data-error]')!.textContent='Could not save. Browser storage may be full.'}};
  const rename=dialog.querySelector<HTMLFormElement>('[data-rename]')!;rename.querySelector('input')!.value=current.name;rename.onsubmit=e=>{e.preventDefault();const name=rename.querySelector('input')!.value.trim();if(!name)return;current.name=name;persist();button.textContent=name+' ▾';dialog.close()};
  document.body.append(dialog);dialog.showModal();
 };label.append(button);
}
