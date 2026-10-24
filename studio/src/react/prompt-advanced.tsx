import {useEffect,useRef,useState,type ReactNode} from 'react';
export type PromptHelperState={enabled:boolean;busy:boolean;message:string;manual:boolean};
const initial:PromptHelperState={enabled:true,busy:false,message:'Local prompt helper',manual:false};
export function AdvancedPrompt({children}:{children:ReactNode}){
 const details=useRef<HTMLDetailsElement>(null);
 const [helper,setHelper]=useState(initial);
 useEffect(()=>{const open=()=>{if(details.current)details.current.open=true};const update=(event:Event)=>setHelper((event as CustomEvent<PromptHelperState>).detail);addEventListener('osh-open-prompt-advanced',open);addEventListener('osh-prompt-helper',update);return()=>{removeEventListener('osh-open-prompt-advanced',open);removeEventListener('osh-prompt-helper',update)}},[]);
 const action=(name:string,value?:boolean)=>dispatchEvent(new CustomEvent('osh-prompt-helper-action',{detail:{name,value}}));
 return <details id="promptAdvanced" className="prompt-advanced" ref={details} onToggle={event=>dispatchEvent(new CustomEvent('osh-prompt-advanced-mode',{detail:event.currentTarget.open}))}>
  <summary>Advanced</summary>
  <div className="advanced-prompt-content">
   <div className="prompt-helper-controls">
    <label><input type="checkbox" checked={helper.enabled} onChange={event=>action('enabled',event.target.checked)}/>Auto-fill in simple view</label>
    {helper.manual&&<button type="button" disabled={helper.busy||!helper.enabled} onClick={()=>action('reset')}>Reset manual edits</button>}
    <p role="status">{helper.message}</p>
   </div>
   {children}
  </div>
 </details>;
}
export function PromptPolishButton(){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{const mode=(event:Event)=>setOpen((event as CustomEvent<boolean>).detail);const status=(event:Event)=>setBusy((event as CustomEvent<PromptHelperState>).detail.busy);addEventListener('osh-prompt-advanced-mode',mode);addEventListener('osh-prompt-helper',status);return()=>{removeEventListener('osh-prompt-advanced-mode',mode);removeEventListener('osh-prompt-helper',status)}},[]);
 return <button id="polishPrompt" type="button" hidden={!open} disabled={busy} onClick={()=>dispatchEvent(new CustomEvent('osh-prompt-helper-action',{detail:{name:'polish'}}))} title="Polish the current prompts and return them to the boxes for review; does not generate video">{busy?'Polishing…':'Polish prompt'}</button>;
}
