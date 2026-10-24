import {useEffect,useRef,useId,type ReactNode} from 'react';
import './popup.css';
/** Shared modal chrome and native focus trapping. Backdrop drags never dismiss. */
export function Popup({title,children,onClose,onDialog,className='',closeLabel='Close popup'}:{title:string;children:ReactNode;onClose:()=>void;onDialog?:(dialog:HTMLDialogElement|null)=>void;className?:string;closeLabel?:string}){
 const dialog=useRef<HTMLDialogElement|null>(null),pressedOutside=useRef(false),heading=useId();
 useEffect(()=>{const element=dialog.current!;element.showModal();return()=>{element.close()}},[]);
 const outside=(event:{clientX:number;clientY:number})=>{const bounds=dialog.current!.getBoundingClientRect();return event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom};
 const close=()=>dialog.current?.close();
 return <dialog ref={element=>{dialog.current=element;onDialog?.(element)}} className={'studio-popup '+className} aria-labelledby={heading} onClose={onClose} onPointerDown={event=>{pressedOutside.current=outside(event)}} onPointerUp={event=>{if(pressedOutside.current&&outside(event))close();pressedOutside.current=false}} onPointerCancel={()=>{pressedOutside.current=false}}>
  <header className="popup-header"><h2 id={heading}>{title}</h2><button type="button" className="popup-close" aria-label={closeLabel} onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
  <div className="popup-content">{children}</div>
 </dialog>;
}
