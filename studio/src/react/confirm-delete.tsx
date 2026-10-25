import {Popup} from './popup';

export function ConfirmDelete({kind,name,onCancel,onConfirm}:{kind:'project'|'workspace';name:string;onCancel:()=>void;onConfirm:()=>void}){
 return <Popup title={`Permanently delete ${kind}?`} onClose={onCancel} closeLabel="Cancel deletion">
  <p>Permanently delete “{name}”? This cannot be undone.</p>
  <p>{kind==='project'?'Its saved project data will be removed from this browser. Downloaded and generated media files will stay on disk.':'This saved window layout will be removed. Your project media will stay intact.'}</p>
  <div className="popup-actions"><button type="button" autoFocus onClick={onCancel}>Cancel</button><button type="button" onClick={onConfirm}>Permanently delete {kind}</button></div>
 </Popup>;
}
