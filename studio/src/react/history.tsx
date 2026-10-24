import { useState, type CSSProperties } from 'react';
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
  current,
  initialText,
  onClose,
  onRestore,
}: {
  title: string;
  revisions: Revision[];
  current: string;
  initialText: string;
  onClose: () => void;
  onRestore: (id: string) => string | void;
}) {
  const [selected, setSelected] = useState(revisions[0]?.id),
    [error, setError] = useState('');
  const revision = revisions.find((r) => r.id === selected);
  return (
    <>
      <header>
        <h2>{title}</h2>
        <button onClick={onClose}>Close</button>
      </header>
      <p>{error || 'Exact prompt checkpoints across edit branches. Restore changes only this prompt.'}</p>
      <div className="prompt-revisions">
        {revisions.map((row) => (
          <button
            key={row.id}
            data-revision={row.id}
            aria-pressed={row.id === selected}
            onClick={() => setSelected(row.id)}
          >
            {new Date(row.at).toLocaleString()} · {row.parent ? 'Revision' : 'Starting point'}
            {row.id === current ? ' · current' : ''}
          </button>
        ))}
      </div>
      <div className="prompt-comparison">
        <section>
          <h3>Before</h3>
          <pre aria-label="Previous prompt">
            <Difference value={revision?.before || ''} other={revision?.text || ''} />
          </pre>
        </section>
        <section>
          <h3>After</h3>
          <pre aria-label="Selected prompt">
            <Difference value={revision?.text || ''} other={revision?.before || ''} />
          </pre>
        </section>
      </div>
      <button
        disabled={!revision || initialText === revision.text}
        onClick={() => {
          if (revision) {
            const message = onRestore(revision.id);
            if (message) setError(message);
          }
        }}
      >
        Restore this prompt
      </button>
    </>
  );
}
