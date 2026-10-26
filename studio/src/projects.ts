import { seedOnboarding } from './onboarding-starter.ts';

export type Project = {id:string;name:string;created:number;deletedAt?:number};
export const projectRegistry='osh-projects-v1',activeProjectKey='osh-active-project';
const legacyKeys=['osh-director','osh-project','osh-elements','osh-frame-sizes','osh-workspace'];
function seedReplacement(id:string){
 localStorage.setItem(`osh:${id}:osh-director`,JSON.stringify({SH:[],cur:0,G:0,STASH:[],TRASH:[],HISTORY:[]}));
 localStorage.setItem(`osh:${id}:osh-onboarding`,JSON.stringify({step:'done',shotId:'',images:[],dismissed:true,suppressAutomatic:true}));
}
export function readProjects():Project[]{
 try{const value=JSON.parse(localStorage.getItem(projectRegistry)||'[]');return Array.isArray(value)?value.filter(p=>typeof p?.id==='string'&&typeof p?.name==='string'):[]}catch{return []}
}
const projects=readProjects();
if(!projects.some(p=>!p.deletedAt)){
 const migrated=!projects.length&&!!localStorage.getItem('osh-director');
 const project={id:crypto.randomUUID(),name:migrated?'The Robot in the Junkyard':'Untitled project',created:Date.now()};
 projects.push(project);localStorage.setItem(projectRegistry,JSON.stringify(projects));localStorage.setItem(activeProjectKey,project.id);
 if(migrated)for(const key of legacyKeys){const value=localStorage.getItem(key);if(value)localStorage.setItem(`osh:${project.id}:${key}`,value)}
 else if(projects.some(p=>p.deletedAt))seedReplacement(project.id);else seedOnboarding(project.id);
}
export const currentProject=projects.find(p=>p.id===localStorage.getItem(activeProjectKey)&&!p.deletedAt)||projects.find(p=>!p.deletedAt)!;
export const projectKey=(key:string)=>`osh:${currentProject.id}:${key}`;
export const orderedProjects=(items:Project[],currentId:string)=>items.filter(p=>!p.deletedAt).sort((a,b)=>Number(b.id===currentId)-Number(a.id===currentId)||b.created-a.created);
export function saveProjects(items:Project[]):void{localStorage.setItem(projectRegistry,JSON.stringify(items))}
export function createProject(name:string,onboarding=false):Project{
 const project={id:crypto.randomUUID(),name:name.trim().slice(0,60),created:Date.now()};
 if(!project.name)throw new Error('Give your project a name.');
 if(onboarding)seedOnboarding(project.id);else seedReplacement(project.id);saveProjects([...readProjects(),project]);return project;
}
export function renameProject(id:string,name:string):void{
 const clean=name.trim().slice(0,60);if(!clean)return;
 saveProjects(readProjects().map(p=>p.id===id?{...p,name:clean}:p));
}
export function recycleProject(id:string):Project{
 const next=readProjects().map(p=>p.id===id?{...p,deletedAt:Date.now()}:p);
 let replacement=next.find(p=>!p.deletedAt);
 if(!replacement){replacement={id:crypto.randomUUID(),name:'Untitled project',created:Date.now()};seedReplacement(replacement.id);next.push(replacement)}
 saveProjects(next);return replacement;
}
export function restoreProject(id:string):void{saveProjects(readProjects().map(p=>p.id===id?{...p,deletedAt:undefined}:p))}
export function permanentlyDeleteProject(id:string):void{
 const items=readProjects();if(!items.some(p=>p.id===id&&p.deletedAt))return;
 const prefix=`osh:${id}:`;const keys=Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).filter((key):key is string=>!!key&&key.startsWith(prefix));
 for(const key of keys)localStorage.removeItem(key);
 saveProjects(items.filter(p=>p.id!==id));
}
export function switchProject(project:Project):void{localStorage.setItem(activeProjectKey,project.id);location.href='/studio/director'}
