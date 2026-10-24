import {useEffect,useRef,useState,type ReactNode} from 'react';
export type PromptHelperState={enabled:boolean;busy:boolean;message:string;manual:boolean};
const initial:PromptHelperState={enabled:true,busy:false,message:'Local prompt helper',manual:false};
export function AdvancedPrompt({children}:{children:ReactNode}){
 const details=useRef<HTMLDetailsElement>(null);
 const [helper,setHelper]=useState(initial);
 useEffect(()=>{const open=()=>{if(details.current)details.current.open=true};const update=(event:Event)=>setHelper((event as CustomEvent<PromptHelperState>).detail);addEventListener('osh-open-prompt-advanced',open);addEventListener('osh-prompt-helper',update);return()=>{removeEventListener('osh-open-prompt-advanced',open);removeEventListener('osh-prompt-helper',update)}},[]);
 const action=(name:string,value?:boolean)=>dispatchEvent(new CustomEvent('osh-prompt-helper-action',{detail:{name,value}}));
 return <details id="promptAdvanced" className="prompt-advanced" ref={details}>
  <summary>Advanced</summary>
  <div className="advanced-prompt-content">
   <div className="prompt-helper-controls">
    <label><input type="checkbox" checked={helper.enabled} onChange={event=>action('enabled',event.target.checked)}/>Auto-fill details</label>
    <button type="button" disabled={helper.busy||!helper.enabled} onClick={()=>action('rewrite')}>{helper.busy?'Writing details…':'Update details'}</button>
    {helper.manual&&<button type="button" disabled={helper.busy||!helper.enabled} onClick={()=>action('reset')}>Reset manual edits</button>}
    <p role="status">{helper.message}</p>
   </div>
   {children}
  </div>
 </details>;
}
