import { SC } from './scene';
import { mountOnboardingTour, type TourState } from './onboarding-tour';
import { ownsTour } from './onboarding-progress';
export function mountEditOnboarding(): void {
 const saved:TourState|null=SC.get('osh-edit-onboarding');let state=saved&&ownsTour('edit',saved.entry)?saved:null;
 mountOnboardingTour({get:()=>state,set:value=>{state=value},save:()=>{if(state&&ownsTour('edit',state.entry))SC.set('osh-edit-onboarding',state)},current:()=> 'edit',begin:entry=>({step:entry==='edit'?'edit-settings':entry==='image'?'image':entry==='director'?'keyframes':entry==='rendering'?'render-settings':entry==='3d'?'3d':'prompt',entry,shotId:'',images:[],dismissed:false}),choose:entry=>{if(entry!=='edit'){sessionStorage.setItem('osh-requested-workflow',entry);location.href='/studio/director'}}});
}
