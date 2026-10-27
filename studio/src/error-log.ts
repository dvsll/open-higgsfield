import {errorText,type ErrorEntry} from '../../shared/lib/error-log';
const key='osh-browser-errors-v1';
export function browserErrors():ErrorEntry[]{try{return JSON.parse(localStorage.getItem(key)||'[]').filter((entry:ErrorEntry)=>typeof entry?.id==='string'&&Number.isFinite(entry.at)&&typeof entry.message==='string').slice(-100).reverse()}catch{return []}}
export function clearBrowserErrors(){localStorage.removeItem(key)}
export function logBrowserError(error:unknown,source='Studio browser',requestId?:string){try{const cause=error instanceof Error?error:Error(String(error));const entries=browserErrors().reverse();entries.push({id:crypto.randomUUID(),at:Date.now(),source,...(requestId&&/^[a-f0-9]{32}$/.test(requestId)?{requestId}:{}),message:errorText(cause.message,1000),details:errorText(cause.stack||cause.message)});localStorage.setItem(key,JSON.stringify(entries.slice(-100)))}catch{}}
let installed=false;
export function installErrorLogs(){if(installed)return;installed=true;addEventListener('error',event=>{if(event instanceof ErrorEvent)logBrowserError(event.error||event.message)});addEventListener('unhandledrejection',event=>logBrowserError(event.reason));addEventListener('osh-request-error',event=>{const detail=(event as CustomEvent).detail;logBrowserError(detail.message,'Request '+detail.operation,detail.id)})}
