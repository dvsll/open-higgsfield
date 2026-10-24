import { useState, useId, type CSSProperties } from 'react';
import {Popup} from './popup';
export type HistoryRow = { id: string; label: string; at: number; depth: number };
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
        {rows.map((row) => (
          <button
            key={row.id}
            role="treeitem"
            aria-level={row.depth + 1}
            aria-selected={row.id === current}
            style={{ '--history-depth': Math.min(row.depth, 8) } as CSSProperties}
            title={new Date(row.at).toLocaleString()}
            onClick={() => onGo(row.id)}
          >
            {row.id === current ? '● ' : '↳ '}
            {row.label}
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
