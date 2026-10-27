import type {ButtonHTMLAttributes} from 'react';
import './close-button.css';
/** Shared icon-only dismissal control for dialogs, walkthroughs and panels. */
export function CloseButton({label='Close',className='',...props}:Omit<ButtonHTMLAttributes<HTMLButtonElement>,'children'|'aria-label'> & {label?:string}){
 return <button {...props} type="button" className={'studio-close '+className} aria-label={label} title={props.title||label}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>;
}
