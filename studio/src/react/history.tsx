import { useState, useId, useRef, useLayoutEffect, type CSSProperties } from 'react';
import {Popup} from './popup';
export function historyAction(label:string):'prompt'|'image'|'take'|'structure'|'start'{
 if(label==='Starting point')return 'start';
 if(/prompt/i.test(label))return 'prompt';
 if(/image|keyframe/i.test(label))return 'image';
 if(/take/i.test(label))return 'take';
 return 'structure';
}
export type HistoryRow = { id: string; label: string; at: number; depth: number; parent?:string|null };
export function HistoryView({
  rows,
  current,
  status,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onGo,
}: {
  rows: HistoryRow[];
  current: string;
  status: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onGo: (id: string) => void;
}) {
  const treeRef=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{const tree=treeRef.current;if(!tree)return;const reveal=()=>{if(tree.getClientRects().length)tree.querySelector('[aria-selected=true]')?.scrollIntoView({block:'nearest',inline:'nearest'})};reveal();const observer=new ResizeObserver(reveal);observer.observe(tree);return()=>observer.disconnect()},[current,rows.length]);
  const positions=new Map<string,{lane:number;index:number}>(),childCounts=new Map<string,number>();
  let lastLane=0;
  rows.forEach((row,index)=>{const parent=row.parent?positions.get(row.parent):undefined,sibling=row.parent?(childCounts.get(row.parent)||0):0;if(row.parent)childCounts.set(row.parent,sibling+1);positions.set(row.id,{index,lane:parent?(sibling===0?parent.lane:++lastLane):0})});
  const active=new Set<string>();let cursor=rows.find(row=>row.id===current);while(cursor&&!active.has(cursor.id)){active.add(cursor.id);cursor=rows.find(row=>row.id===cursor!.parent)}
  const graphWidth=24+lastLane*16;
  return (
    <>
      <div className="history-tools">
        <button disabled={!canUndo} title="Undo project edit (Ctrl+Z)" onClick={onUndo}>
          Undo
        </button>
        <button disabled={!canRedo} title="Redo project edit (Ctrl+Shift+Z / Ctrl+Y)" onClick={onRedo}>
          Redo
        </button>
      </div>
      <p className="history-status" role="status">
        {status}
      </p>
      <div
        ref={treeRef}
        className="history-graph"
        style={{"--history-graph-width":`${graphWidth}px`} as CSSProperties}
        role="tree"
        aria-label="Project edit branches"
        onKeyDown={(e) => {
          const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=treeitem]'));
          const index = items.indexOf(e.target as HTMLButtonElement);
          if (index < 0) return;
          let next = index;
          if (e.key === 'ArrowDown') next = Math.min(items.length - 1, index + 1);
          else if (e.key === 'ArrowUp') next = Math.max(0, index - 1);
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = items.length - 1;
          else return;
          e.preventDefault();
          items[next].focus();
        }}
      >
        <svg className="history-connections" width={graphWidth} height={rows.length*32} aria-hidden="true">{rows.map(row=>{const point=positions.get(row.id)!,parent=row.parent?positions.get(row.parent):undefined;if(!parent)return null;const x=12+point.lane*16,px=12+parent.lane*16,y=point.index*32+16,py=parent.index*32+16;return <path key={row.id} className={active.has(row.id)?'active':''} d={`M ${px} ${py} L ${x} ${py+12} L ${x} ${y}`}/>})}</svg>
        {rows.map((row) => (
          <button
            key={row.id}
            role="treeitem"
            aria-level={row.depth + 1}
            aria-selected={row.id === current}
            data-current={row.id===current||undefined}
            title={`${historyAction(row.label)} · ${new Date(row.at).toLocaleString()}`}
            onClick={() => onGo(row.id)}
          >
            <span data-action={historyAction(row.label)} className={'history-node'+(active.has(row.id)?' active':'')} style={{left:10+positions.get(row.id)!.lane*16}} aria-hidden="true"/>
            <span className="history-label">
            {row.label}</span>{row.id===current&&<span className="history-current">Current</span>}
          </button>
        ))}
      </div>
    </>
  );
}
export type Revision = { id: string; at: number; parent: string | null; text: string; before: string };
function Difference({ value, other }: { value: string; other: string }) {
  if (!value) return <>{'(empty prompt)'}</>;
  let start = 0,
    end = 0;
  while (start < value.length && start < other.length && value[start] === other[start]) start++;
  while (
    end < value.length - start &&
    end < other.length - start &&
    value[value.length - 1 - end] === other[other.length - 1 - end]
  )
    end++;
  return (
    <>
      {value.slice(0, start)}
      <mark>{value.slice(start, value.length - end)}</mark>
      {value.slice(value.length - end)}
    </>
  );
}
export function PromptHistory({
  title,
  revisions,
  initialText,
  onClose,
  onRestore,
}: {
  title: string;
  revisions: Revision[];
  current?: string;
  initialText: string;
  onClose: () => void;
  onRestore: (id: string) => string | void;
}) {
  const ordered=[...revisions].sort((a,b)=>a.at-b.at);
  const [selected,setSelected]=useState(()=>ordered.findLast(r=>r.text===initialText)?.id||ordered.at(-1)?.id),
    [error,setError]=useState('');
  const index=Math.max(0,ordered.findIndex(r=>r.id===selected)),revision=ordered[index];
  const sliderId=useId(),descriptionId=useId();
  const timestamp=(at:number)=>new Date(at).toLocaleString();
  return (
    <Popup title={title} className="prompt-history-popup" closeLabel="Close prompt history" onClose={onClose}>
      <p className="prompt-history-help">Scrub through saved edits to compare changes. Restore changes only this prompt.</p>
      <div className="prompt-time-slider">
        <div className="prompt-time-heading"><label htmlFor={sliderId}>Revision history</label><output htmlFor={sliderId} aria-live="polite">{revision?`${index+1} / ${ordered.length}`:'No saved edits'}</output></div>
        <input id={sliderId} type="range" min={0} max={Math.max(1,ordered.length-1)} step={1} value={index} disabled={ordered.length<2}
          aria-label="Prompt history time" aria-describedby={descriptionId}
          aria-valuetext={revision?`${timestamp(revision.at)}, revision ${index+1} of ${ordered.length}`:'No saved edits'}
          onChange={event=>{setSelected(ordered[+event.target.value]?.id);setError('')}}/>
        <div className="prompt-time-ends"><span>Oldest</span><span>Latest</span></div>
        <p id={descriptionId} className="prompt-time-selection">{revision?<><time dateTime={new Date(revision.at).toISOString()}>{timestamp(revision.at)}</time><span>{revision.text===initialText?'Current prompt':revision.parent?'Saved edit':'Starting point'}</span></>:'No saved revisions for this prompt yet.'}</p>
      </div>
      <div className="prompt-comparison">
        <section>
          <h3>Before</h3>
          <pre aria-label="Previous prompt">
            <Difference value={revision?.before ?? initialText} other={revision?.text ?? initialText} />
          </pre>
        </section>
        <section>
          <h3>After</h3>
          <pre aria-label="Selected prompt">
            <Difference value={revision?.text ?? initialText} other={revision?.before ?? initialText} />
          </pre>
        </section>
      </div>
      <div className="popup-actions"><p role="status">{error}</p><button
        disabled={!revision || initialText === revision.text}
        onClick={() => {
          if (revision) {
            const message = onRestore(revision.id);
            if (message) setError(message);
          }
        }}
      >
        Restore this prompt
      </button></div>
    </Popup>
  );
}
