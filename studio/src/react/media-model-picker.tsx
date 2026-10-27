import {useState} from 'react';
import {createPortal} from 'react-dom';
import {Popup} from './popup';
import '../media-model-picker.css';
export function MediaModelPicker({media,models,value,onChange,disabled=false,formatLabel=(value:string)=>value}:{media:string;models:string[];value:string;onChange:(model:string)=>void;disabled?:boolean;formatLabel?:(value:string)=>string}){
 const [open,setOpen]=useState(false);
 return <><div className="media-modelbar"><span>Model</span><button type="button" className="model-picker" disabled={disabled||!models.length} aria-haspopup="dialog" aria-label={`${media} model: ${value?formatLabel(value):'unavailable'}. Choose model`} onClick={()=>setOpen(true)}>{value?formatLabel(value):'No compatible model'} ▾</button><span className="media-kind">{media}</span></div>
 {open&&createPortal(<Popup title={`Choose ${media.toLowerCase()} model`} onClose={()=>setOpen(false)} className="media-model-popup"><div role="group" aria-label={`${media} models`}>{models.map(model=><button type="button" key={model} aria-pressed={value===model} onClick={()=>{onChange(model);setOpen(false)}}><strong>{formatLabel(model)}</strong></button>)}</div><small>Only compatible models installed on the connected ComfyUI server are shown.</small></Popup>,document.body)}</>;
}
