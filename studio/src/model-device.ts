export type TextDevice='default'|'cpu';
const key='osh-model-compute';
export function modelDevice(id:string):TextDevice{try{return JSON.parse(localStorage.getItem(key)||'{}')[id]==='cpu'?'cpu':'default'}catch{return 'default'}}
export function setModelDevice(id:string,device:TextDevice):void{let settings:Record<string,TextDevice>={};try{settings=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}settings[id]=device;localStorage.setItem(key,JSON.stringify(settings))}
