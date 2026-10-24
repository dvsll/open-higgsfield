import type {PromptHelperState} from './react/prompt-advanced';
type Details={visual:string;motion:string;audio:string};
export type PromptShot={prompt?:string;m?:string;audioPrompt?:string;visualPrompt?:string;promptAutofill?:boolean;rewriteSource?:string;promptOverrides?:Partial<Record<keyof Details,boolean>>};
export function shouldRewriteBeforeGeneration(advanced:boolean,shot:PromptShot):boolean{return !advanced&&shot.promptAutofill!==false}
export function manualPromptFields(shot:PromptShot){return shot.promptOverrides??{visual:!!shot.visualPrompt,motion:!!shot.m?.trim(),audio:!!shot.audioPrompt?.trim()}}
export function applyPromptDetails(shot:PromptShot,prompt:string,details:Details){
 const locks=manualPromptFields(shot);shot.promptOverrides={...locks};
 if(!locks.visual)shot.visualPrompt=details.visual;
 if(!locks.motion)shot.m=details.motion;
 if(!locks.audio)shot.audioPrompt=details.audio;
 shot.rewriteSource=prompt;
}
export function mountPromptAssistant(current:()=>PromptShot,commit:()=>void,contains:(shot:PromptShot)=>boolean=shot=>current()===shot){
 let timer:ReturnType<typeof setTimeout>|undefined,active:Promise<void>|null=null,activeShot:PromptShot|null=null,activePrompt='',message='Details update automatically as you write.';
 let available=false;
 const advanced=()=>!!(document.getElementById('promptAdvanced') as HTMLDetailsElement)?.open;
 const controls={visual:document.getElementById('visualPrompt') as HTMLTextAreaElement,motion:document.getElementById('motion') as HTMLTextAreaElement,audio:document.getElementById('audioPrompt') as HTMLTextAreaElement};
 const sync=()=>{const shot=current();if(document.activeElement!==controls.visual)controls.visual.value=shot.visualPrompt||'';const state:PromptHelperState={enabled:shot.promptAutofill!==false,busy:!!active,manual:Object.values(manualPromptFields(shot)).some(Boolean),message};const generate=document.getElementById('gen') as HTMLButtonElement;generate.disabled=advanced()&&!!active;generate.title=advanced()?'Generate directly from the reviewed prompt boxes':'Prepare details and generate video';dispatchEvent(new CustomEvent('osh-prompt-helper',{detail:state}))};
 async function prepare(shot=current(),force=false,review=false,fromMain=false):Promise<void>{
  const prompt=shot.prompt?.trim()||'';if(!prompt){message='Write a main prompt before polishing.';sync();return;}if(!review&&(shot.promptAutofill===false||advanced()))return;
  if(active){if(activeShot===shot&&activePrompt===prompt)return active;try{await active}catch{}if(!contains(shot)||shot.prompt?.trim()!==prompt)return;}
  if(!force&&shot.rewriteSource===prompt)return;
  activeShot=shot;activePrompt=prompt;message='Writing video, motion and sound details locally…';
  const before={visual:shot.visualPrompt||'',motion:shot.m||'',audio:shot.audioPrompt||''};
  const reviewDetails=Object.fromEntries(Object.entries(before).filter(([key,value])=>value.trim()||manualPromptFields(shot)[key as keyof Details]));
  active=(async()=>{try{
   const response=await fetch('/api/prompt-rewriter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,...(review&&!fromMain?{details:reviewDetails}:{})}),signal:AbortSignal.timeout(75000)}),result=await response.json();
   if(!response.ok)throw new Error(result.error||'The local prompt helper is unavailable.');
   if(!contains(shot)||shot.prompt?.trim()!==prompt||(!review&&(shot.promptAutofill===false||advanced())))return;
   if(review&&JSON.stringify(before)!==JSON.stringify({visual:shot.visualPrompt||'',motion:shot.m||'',audio:shot.audioPrompt||''})){message='Details changed while polishing. Your edits are kept; polish again when ready.';return;}
   if(review)shot.promptOverrides={};
   applyPromptDetails(shot,prompt,result);message=review?'Polished prompts ready to review. Generate video uses these boxes directly.':'Details ready · local CPU. Manual edits are kept.';commit();dispatchEvent(new Event('osh-audio-prompt'));
  }catch(error){message=(error as Error).message+' Open Advanced to retry or turn off Auto-fill details.';throw error}
  finally{active=null;activeShot=null;sync()}})();sync();return active;
 }
 for(const [field,control]of Object.entries(controls) as [keyof Details,HTMLTextAreaElement][]){control.addEventListener('input',()=>{const shot=current();shot.promptOverrides={...manualPromptFields(shot),[field]:true};if(field==='visual')shot.visualPrompt=control.value;message='Manual details are kept when your prompt changes.';commit();sync()})}
 document.getElementById('shotPromptInput')!.addEventListener('input',()=>{clearTimeout(timer);const shot=current();if(!advanced()&&shot.promptAutofill!==false&&available)timer=setTimeout(()=>{if(current()===shot&&!advanced())void prepare(shot).catch(()=>{})},1500)});
 addEventListener('osh-prompt-advanced-mode',()=>{clearTimeout(timer);message=advanced()?'Polish prompt returns details here for review. Generate video uses the boxes directly.':'Details update automatically as you write.';sync()});
 addEventListener('osh-prompt-values',sync);
 addEventListener('osh-prompt-helper-action',event=>{const {name,value}=(event as CustomEvent).detail,shot=current();clearTimeout(timer);
  if(name==='enabled'){shot.promptAutofill=value;message=value?'Details update automatically as you write.':'Auto-fill off · your prompt and manual details are used.';commit();sync();if(value)void prepare(shot).catch(()=>{});}
  else{if(name==='reset'){shot.promptOverrides={};shot.rewriteSource=undefined;commit()}void prepare(shot,true,advanced(),name==='reset').catch(()=>{})}
 });
 void fetch('/api/prompt-rewriter').then(response=>response.json()).then(status=>{available=status.available;message=available?'Details update automatically as you write · local CPU.':'Local helper is not installed. Use Advanced to enter details manually.';sync()}).catch(()=>{message='Local helper is unavailable. Use Advanced to enter details manually.';sync()});
 sync();return {prepare};
}
