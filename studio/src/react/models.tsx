import {modelDevice,setModelDevice,type TextDevice} from '../model-device';
import { useEffect, useRef,useState,useLayoutEffect,useId } from 'react';
import {createPortal} from 'react-dom';
import {Popup} from './popup';
export type Help = { title: string; text: string };
export type Badge = { name: string; status: string; label: string; help: Help; description?:string;usage?:string;onClick?: () => void };
export function ModelCapabilities({info}:{info:ModelInfoData}){
 const id=useId(),suppressFocus=useRef(false);const [open,setOpen]=useState(false),[position,setPosition]=useState({left:8,top:8});const trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null),closeTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const show=()=>{clearTimeout(closeTimer.current);setOpen(true)},hide=()=>{closeTimer.current=setTimeout(()=>setOpen(false),160)};
 useLayoutEffect(()=>{if(!open)return;const place=()=>{const a=trigger.current!.getBoundingClientRect(),p=panel.current!.getBoundingClientRect();setPosition({left:Math.max(8,Math.min(a.left,innerWidth-p.width-8)),top:a.bottom+p.height+6<=innerHeight-8?a.bottom+6:Math.max(8,a.top-p.height-6)})};place();addEventListener('resize',place);addEventListener('scroll',place,true);return()=>{removeEventListener('resize',place);removeEventListener('scroll',place,true)}},[open,info]);
 useEffect(()=>{const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&open){setOpen(false);suppressFocus.current=true;trigger.current?.focus();suppressFocus.current=false}};const outside=(event:PointerEvent)=>{if(!panel.current?.contains(event.target as Node)&&!trigger.current?.contains(event.target as Node))setOpen(false)};const mode=()=>setOpen(false);addEventListener('keydown',escape);addEventListener('pointerdown',outside);addEventListener('osh-prompt-advanced-mode',mode);return()=>{clearTimeout(closeTimer.current);removeEventListener('keydown',escape);removeEventListener('pointerdown',outside);removeEventListener('osh-prompt-advanced-mode',mode)}},[open]);
 return <><button ref={trigger} type="button" className="capability-trigger" aria-label="Model capabilities" aria-expanded={open} aria-controls={open?id:undefined} onMouseEnter={show} onMouseLeave={hide} onFocus={()=>{if(!suppressFocus.current)show()}} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();show();requestAnimationFrame(()=>panel.current?.focus())}}} onBlur={event=>{if(!panel.current?.contains(event.relatedTarget as Node))hide()}} onClick={show}><span aria-hidden="true">?</span> Capabilities</button>{open&&createPortal(<div ref={panel} id={id} tabIndex={-1} className="capability-popover" role="region" aria-label="Model capabilities" style={{left:position.left,top:position.top}} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))hide()}}><table><thead><tr><th>Capability</th><th>What it does</th><th>How to use it</th></tr></thead><tbody>{info.badges.map(badge=><tr key={badge.name}><th>{badge.name}{badge.status==='prompt'&&<small>Prompt only</small>}</th><td>{badge.description||badge.help.text}</td><td>{badge.usage||'Describe the result you want in your prompt.'}{badge.onClick&&<button type="button" onClick={()=>{setOpen(false);badge.onClick?.()}}>Open control ↗</button>}</td></tr>)}</tbody></table></div>,document.body)}</>;
}
export type ModelInfoData = { timing: string; help: Help; badges: Badge[] };
export type AttachHelp = (button: HTMLButtonElement, title: string, text: string) => void;
export function HelpButton({
  label,
  help,
  className,
  ariaLabel,
  onClick,
  attach,
}: {
  label: string;
  help: Help;
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
  attach: AttachHelp;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const button = ref.current!;
    attach(button, help.title, help.text);
    return () => {
      button.onmouseenter =
        button.onmouseleave =
        button.onfocus =
        button.onblur =
        button.onclick =
        button.onkeydown =
          null;
    };
  }, [attach, help.title, help.text]);
  return (
    <button ref={ref} type="button" className={className} aria-label={ariaLabel} onClick={onClick}>
      {label}
    </button>
  );
}
export function ModelTiming({ info, attach }: { info: ModelInfoData; attach: AttachHelp }) {
  return <HelpButton label={info.timing} help={info.help} className="model-time" attach={attach} />;
}
export function ModelInfo({
  info,
  attach,
  timing = true,
}: {
  info: ModelInfoData;
  attach: AttachHelp;
  timing?: boolean;
}) {
  return (
    <>
      {timing && <ModelTiming info={info} attach={attach} />}
      <span className="cap-label">Capabilities</span>
      <div className="cap-badges">
        {info.badges.map((badge) => (
          <HelpButton
            key={badge.name}
            label={badge.name}
            help={badge.help}
            className={badge.status}
            ariaLabel={badge.label}
            onClick={badge.onClick}
            attach={attach}
          />
        ))}
      </div>
    </>
  );
}
export type ModelRow = { id: string; label: string; description: string; info: ModelInfoData };
export type ModelGroup={kind:'video'|'keyframe';label:string;rows:ModelRow[];selected:string};
function ComputeSelect({id,label,cpuSupported=true}:{id:string;label:string;cpuSupported?:boolean}){const [device,setDevice]=useState<TextDevice>(()=>cpuSupported?modelDevice(id):'default');return <label>{label}<select aria-label={label+' text processing device'} value={device} onChange={event=>{const value=event.target.value as TextDevice;setDevice(value);setModelDevice(id,value)}}><option value="default">GPU / automatic offload</option><option value="cpu" disabled={!cpuSupported}>{cpuSupported?'CPU':'CPU · unavailable for this workflow'}</option></select></label>}
export function ModelChooser({
  polisher:initialPolisher,
  groups,
  research,
  attach,
  onChoose,
  onClose,
  onDialog,
}: {
  groups:ModelGroup[];
  research: string[];
  attach: AttachHelp;
  onChoose: (kind:'video'|'keyframe',id: string) => void;
  onClose: () => void;
  onDialog?:(dialog:HTMLDialogElement|null)=>void;
  polisher?:{id:string;model:string;available:boolean;reason:string;cpuSupported?:boolean};
}) {
  const [polisher,setPolisher]=useState(initialPolisher);
  useEffect(()=>{const controller=new AbortController();void fetch('/api/prompt-rewriter',{signal:controller.signal}).then(r=>r.json()).then(setPolisher).catch(()=>{});return()=>controller.abort()},[]);
  return (
    <Popup title="Choose model" closeLabel="Close model chooser" className="model-chooser" onClose={onClose} onDialog={onDialog}>
      <small>Select a model name. Hover or focus capabilities for explanations and usage.</small>
      {groups.map(group=><section key={group.kind} className="model-media-group" aria-label={group.label+' models'}><h3>{group.label}</h3>{!group.rows.length&&<p>No compatible local models installed.</p>}{group.rows.map((row) => (
        <div key={row.id} className={'model-choice' + (row.id === group.selected ? ' active' : '')}>
          <button type="button" aria-pressed={row.id === group.selected} onClick={() => onChoose(group.kind,row.id)}>
            <b>{row.label}</b>
            <small>{row.description}</small>
          </button>
          <div className="model-card">
            <ModelInfo info={row.info} attach={attach} />
          </div>
        </div>
      ))}</section>)}
      <details className="model-selection-advanced"><summary>Advanced · compute settings</summary>
       <p>Choose where text processing runs. GPU mode lets ComfyUI offload when needed. Image/video generation stays managed by your ComfyUI server.</p>
       <div className="model-compute-grid">{groups.flatMap(group=>group.rows.map(row=><ComputeSelect key={row.id} id={row.id} label={group.label+' · '+row.label}/>))}
       {!polisher&&<p>Checking prompt model in ComfyUI…</p>}{polisher&&<ComputeSelect id={polisher.id} cpuSupported={!!polisher.cpuSupported} label={'Prompt polishing · '+polisher.model}/>}</div>
       {polisher&&!polisher.available&&<p>{polisher.reason}</p>}{polisher&&!polisher.cpuSupported&&<p>Prompt polishing uses ComfyUI-managed placement. Forcing only text generation to CPU is unavailable in this workflow.</p>}
      </details>
      {research.map((repo) => (
        <div key={repo} className="model-research">
          {repo} · downloaded for LoRA training · generation workflow not connected · estimate unavailable
        </div>
      ))}
    </Popup>
  );
}
