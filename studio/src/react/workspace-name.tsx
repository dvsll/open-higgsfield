import { useEffect, useRef, useState } from 'react';
import {Popup} from './popup';
export function WorkspaceName({
  label,
  value,
  onSave,
  onCancel,
  validate,
  submitLabel='Save',
}: {
  label: string;
  value: string;
  onSave: (name: string) => void;
  onCancel: () => void;
  validate?:(name:string)=>string;
  submitLabel?:string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error,setError]=useState('');
  useEffect(() => input.current?.select(), []);
  return (
    <Popup title={label} onClose={onCancel} className="workspace-name-popup" closeLabel="Close workspace name"><form
      onSubmit={(e) => {
        e.preventDefault();
        const name = input.current!.value.trim();
        const message=validate?.(name)||'';
        if(message){setError(message);return}
        if (name) onSave(name);
      }}
    >
      <input ref={input} defaultValue={value} required maxLength={80} aria-label={label} aria-invalid={!!error} onChange={()=>setError('')} />
      {error&&<p role="alert">{error}</p>}
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
      <button type="submit">{submitLabel}</button>
    </form></Popup>
  );
}
