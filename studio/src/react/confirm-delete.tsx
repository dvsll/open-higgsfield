import {Popup} from './popup';

export function ConfirmDelete({kind,name,onCancel,onConfirm}:{kind:'project'|'workspace';name:string;onCancel:()=>void;onConfirm:()=>void}){
 return <Popup title={`Delete ${kind}?`} onClose={onCancel} closeLabel="Cancel deletion">
  <p>Are you sure you want to delete “{name}”?</p>
  <p>{kind==='project'?'It will move to the Recycle Bin. You can restore it with its scenes and settings.':'You can restore this workspace using Restore deleted workspace. Your project media will stay intact.'}</p>
  <div className="popup-actions"><button type="button" autoFocus onClick={onCancel}>Cancel</button><button type="button" onClick={onConfirm}>Delete {kind}</button></div>
 </Popup>;
}
