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
export function guidesPlaced(keys: { img?: string; anchor?: string }[]): boolean {
 return keys.some(k => k.img && k.anchor === 'start') && keys.some(k => k.img && k.anchor === 'end');
}
