import '../model-picker.css';
import {NumberInput} from './number-input';
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
export type ModelRow = { id: string; label: string; description: string; info: ModelInfoData;parentId?:string;family?:string;generation?:{steps:number;stepNote:string} };
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
  const [polisher,setPolisher]=useState(initialPolisher),[advanced,setAdvanced]=useState(false),[filter,setFilter]=useState('all'),[expanded,setExpanded]=useState<Record<string,boolean>>({});
  const [seed,setSeed]=useState(()=>Number((typeof document!=='undefined'?(document.getElementById('videoSeed') as HTMLInputElement|null)?.value:undefined)||7));
  const videoPreset=groups.find(group=>group.kind==='video');const generation=videoPreset?.rows.find(row=>row.id===videoPreset.selected)?.generation;
  useEffect(()=>{const controller=new AbortController();void fetch('/api/prompt-rewriter',{signal:controller.signal}).then(r=>r.json()).then(setPolisher).catch(()=>{});return()=>controller.abort()},[]);
  return (
    <Popup title="Choose model" closeLabel="Close model chooser" className="model-chooser" onClose={onClose} onDialog={onDialog}>
      <div className="model-picker-toolbar"><details className="model-picker-filter"><summary aria-label="Filter models" title="Filter models"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18l-7 8v7l-4 2v-9Z"/></svg></summary><label>Type<select aria-label="Model type filter" value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">All compatible models</option><option value="base">Base models</option><option value="tuned">Fine-tunes</option></select></label></details><label className="model-picker-mode"><input type="checkbox" checked={advanced} onChange={event=>setAdvanced(event.target.checked)}/>Advanced view</label></div>
      {groups.map(group=>{const roots=group.rows.filter(row=>!row.parentId);const renderRow=(row:ModelRow,tune=false)=><div key={row.id} className={'model-tree-row'+(row.id===group.selected?' active':'')+(tune?' model-tree-tune':'')}><button type="button" className="model-tree-name" aria-pressed={row.id===group.selected} onClick={()=>onChoose(group.kind,row.id)}><span>{row.label}</span>{advanced&&<small>{row.description}</small>}</button><ModelTiming info={row.info} attach={attach}/>{advanced&&<div className="model-tree-capabilities"><ModelInfo info={row.info} attach={attach} timing={false}/></div>}</div>;
       const visibleRoots=roots.filter(root=>filter!=='tuned'||group.rows.some(row=>row.parentId===root.id));
       return <section key={group.kind} className="model-media-group" aria-label={group.label+' models'}><h3>{group.label}</h3>{!visibleRoots.length&&<p className="model-picker-empty">No compatible {filter==='tuned'?'fine-tunes':'models'} installed.</p>}{visibleRoots.map(root=>{const tunes=group.rows.filter(row=>row.parentId===root.id),open=expanded[root.id]??(tunes.some(row=>row.id===group.selected)||filter==='tuned');return <div className="model-tree-family" key={root.id}>{filter!=='tuned'&&renderRow(root)}{tunes.length>0&&filter!=='base'&&<><button type="button" className="model-tune-toggle" aria-expanded={open} onClick={()=>setExpanded(value=>({...value,[root.id]:!open}))}>{open?'▾':'▸'} {filter==='tuned'?root.label+' · ':''}Fine-tunes · {tunes.length}</button>{open&&tunes.map(row=>renderRow(row,true))}</>}</div>})}</section>})}
      <details className="model-selection-advanced" open={advanced} hidden={!advanced}><summary>Advanced</summary>
       {videoPreset&&<label>Video seed<NumberInput aria-label="Video seed" type="number" min={0} max={2147483647} step={1} value={seed} onChange={event=>{const value=Number(event.target.value);setSeed(value);if(event.target.checkValidity())dispatchEvent(new CustomEvent('osh-video-seed',{detail:value}))}}/></label>}
       {generation&&<div className="generation-preset"><span>Sampling steps</span><output aria-label="Video sampling steps">{generation.steps}</output><span>Workflow preset</span><p>{generation.stepNote}</p></div>}
       <p>Choose where text processing runs. GPU mode lets ComfyUI offload when needed. Image/video generation stays managed by your ComfyUI server.</p>
       <div className="model-compute-grid">{groups.flatMap(group=>group.rows.map(row=><ComputeSelect key={row.id} id={row.id} label={group.label+' · '+row.label}/>))}
       {!polisher&&<p>Checking prompt model in ComfyUI…</p>}{polisher&&<ComputeSelect id={polisher.id} cpuSupported={!!polisher.cpuSupported} label={'Prompt polishing · '+polisher.model}/>}</div>
       {polisher&&!polisher.available&&<p>{polisher.reason}</p>}{polisher&&!polisher.cpuSupported&&<p>Prompt polishing uses ComfyUI-managed placement. Forcing only text generation to CPU is unavailable in this workflow.</p>}
      </details>

    </Popup>
  );
}
