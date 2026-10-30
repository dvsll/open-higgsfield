export type Experience = 'beginner' | 'seasoned' | 'professional';
export type Workflow = 'video' | 'image' | 'director' | 'rendering' | 'edit' | '3d';
export type TutorialProfile = { version: 1; experience?: Experience; workflows: Partial<Record<Workflow, 'started' | 'completed' | 'skipped'>> };
export const profileKey = 'osh-tutorial-profile-v1';
export const workflows: Workflow[] = ['video', 'image', 'director', 'rendering', 'edit', '3d'];
export function readProfile(value: unknown): TutorialProfile {
 const source = value as TutorialProfile;
 const profile: TutorialProfile = { version: 1, workflows: {} };
 if (['beginner', 'seasoned', 'professional'].includes(source?.experience || '')) profile.experience = source.experience;
 for (const key of workflows) if (['started', 'completed', 'skipped'].includes(source?.workflows?.[key] || '')) profile.workflows[key] = source.workflows[key];
 return profile;
}
export function workflowForSetup(name: string, mode = 'video'): Workflow {
 return ({ Video: 'video', Image: 'image', Director: 'director', Rendering: 'rendering', Edit: 'edit', '3D': '3d' } as Record<string, Workflow>)[name] || (mode === 'image' ? 'image' : 'video');
}
export function firstVisit(profile: TutorialProfile, workflow: Workflow): boolean { return !!profile.experience && !profile.workflows[workflow]; }
export function canResumeWorkflow(state: { entry?:Workflow; shotId?:string; dismissed?:boolean } | undefined, entry:Workflow): boolean {
 return !!state && state.entry === entry && !state.dismissed && (entry === 'edit' || !!state.shotId);
}
export function ownsTour(page:'director'|'edit', entry?:Workflow): boolean { return page === 'edit' ? entry === 'edit' : entry !== 'edit'; }
export function windowLesson(step:string, visible:ReadonlySet<string>, menuOpen:boolean):{window:string;stage:'menu'|'item'}|null {
 const required:Record<string,string[]>={'play-video':['viewer'],keyframes:['prompts'],add:['files','timeline'],position:['timeline'],image:['prompts'],'image-review':['viewer'],'image-video':['prompts'],prompt:['prompts'],regenerate:['prompts'],'render-settings':['properties'],'render-takes':['files'],'3d':['prompts'],'3d-camera':['stage'],'3d-motion':['prompts'],'3d-motion-generate':['prompts'],'3d-record':['stage','prompts'],'3d-guide':['stage'],'3d-video':['prompts']};
 const missing=required[step]?.find(id=>!visible.has(id));
 return missing?{window:missing,stage:menuOpen?'item':'menu'}:null;
}
export function guidesPlaced(keys: { img?: string; anchor?: string }[]): boolean {
 return keys.some(k => k.img && k.anchor === 'start') && keys.some(k => k.img && k.anchor === 'end');
}

export function continuesImageTour(state:{entry?:Workflow;step:string;dismissed?:boolean;suspended?:boolean}|null,entry:Workflow):boolean{return !!state&&!state.dismissed&&!state.suspended&&state.entry==='image'&&entry==='video'&&['image-review','return-video','add','position','image-video'].includes(state.step)}
export function workflowTourStep(state:{entry?:Workflow;step:string;dismissed?:boolean;suspended?:boolean}|null,entry:Workflow):string|null{
 if(!state||state.dismissed||state.suspended)return null;
 if(state.entry==='3d'&&entry==='video'&&['3d-guide','3d-video'].includes(state.step))return '3d-video';
 if(['video','director'].includes(state.entry||'')){
  if(entry==='image'&&['switch-image','keyframes'].includes(state.step))return 'keyframes';
  if(entry==='video'&&['return-video','add','position','regenerate'].includes(state.step))return state.step==='return-video'?'add':state.step;
 }
 return continuesImageTour(state,entry)?(['image-review','return-video'].includes(state!.step)?'add':state!.step):null;
}

/** Only successful backend milestones advance the 3D lesson. */
export function geometryTourStep(step:string,event:string,detail?:{reference?:unknown;shotId?:string},shotId?:string):string|null {
 if(event==='osh-camera-generated'&&step==='3d-motion-generate')return '3d-record';
 if(event==='osh-camera-prompt-reveal'&&step==='3d-camera')return '3d-motion';
 if(event==='osh-geometry-generated'&&step==='3d')return '3d-camera';
 if(event==='osh-scene-video-status'&&detail?.reference&&['3d-camera','3d-record'].includes(step))return '3d-guide';
 if(event==='osh-3d-guide-attached'&&step==='3d-guide'&&detail?.shotId)return '3d-video';
 if(event==='osh-video-generated'&&step==='3d-video'&&detail?.shotId===shotId)return 'done';
 return null;
}
