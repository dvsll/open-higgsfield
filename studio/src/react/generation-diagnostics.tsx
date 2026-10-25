import type {GenerationActivity} from '../../../shared/runtime/client';
import './generation-diagnostics.css';
export function GenerationDiagnostics({entries=[]}:{entries?:GenerationActivity['diagnostics']}){
 const last=entries.at(-1);if(!last)return null;
 return <section className="generation-diagnostics" aria-label="ComfyUI loading details"><p>{last.source==='sdk'?'This job':'ComfyUI server'}: {last.message}</p><details><summary>Loading details</summary><small>Server messages can include activity from other ComfyUI clients. They do not set this job’s progress percentage.</small><ul>{entries.map((entry,index)=><li key={entry.at+':'+index}><span>{entry.source==='sdk'?'Job':'Server'}</span>{entry.message}</li>)}</ul></details></section>;
}
