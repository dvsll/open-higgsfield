import {Popup} from './popup';
export function WorkspaceRecycleBin({names,onClose,onRestore,onDelete}:{names:string[];onClose:()=>void;onRestore:(name:string)=>void;onDelete:(name:string)=>void}){
 return <Popup title="Workspace Recycle Bin" onClose={onClose}>
  {names.length?names.map(name=><div className="workspace-bin-row" key={name}><span>{name}</span><button onClick={()=>onRestore(name)}>Restore</button><button className="workspace-bin-delete" title="Permanently delete" aria-label={`Permanently delete ${name}`} onClick={()=>onDelete(name)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button></div>):<p>Recycle Bin is empty.</p>}
 </Popup>;
}
