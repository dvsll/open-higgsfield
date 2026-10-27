import {CloseButton} from './close-button';
import { useEffect, useRef, useState } from 'react';
import type { Style, PoolItem } from '../shell';
type Paint = (canvas: HTMLCanvasElement, style: Style) => void;
function Preview({ style, paint, large = false }: { style: Style; paint: Paint; large?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    paint(ref.current!, style);
  }, [style, paint]);
  return (
    <canvas
      ref={ref}
      className={large ? 'prev' : undefined}
      width={large ? 720 : 320}
      height={large ? 240 : 200}
    />
  );
}
export function StyleSelector({
  styles,
  selected,
  paint,
  onSelect,
  onEdit,
  onNew,
  onClose,
}: {
  styles: Style[];
  selected: string;
  paint: Paint;
  onSelect: (style: Style) => void;
  onEdit: (style: Style) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  return (
    <div className="box">
      <h3>
        Styles
        <CloseButton label="Close styles" onClick={onClose}/>
      </h3>
      <div className="grid">
        {styles.map((style) => (
          <div key={style.id} className={'card' + (style.id === selected ? ' on' : '')}>
            <button className="style-card-select" onClick={() => onSelect(style)}>
              <Preview style={style} paint={paint} />
              <div>{style.n}</div>
            </button>
            {style.user && (
              <button className="ed" title="Edit style" onClick={() => onEdit(style)}>
                ✎
              </button>
            )}
          </div>
        ))}
        <button className="add" onClick={onNew}>
          <span style={{ fontSize: 22 }}>＋</span>add style
        </button>
      </div>
    </div>
  );
}
export function StyleMaker({
  initial,
  pool,
  paint,
  recolor,
  onSave,
  onDelete,
  onClose,
}: {
  initial: Style;
  pool: PoolItem[];
  paint: Paint;
  recolor: (refs: string[]) => Promise<{ sw: string[]; sky: [string, string] }>;
  onSave: (style: Style) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial),
    [picking, setPicking] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState('');
  const title = useRef<HTMLInputElement>(null);
  useEffect(() => title.current?.focus(), []);
  useEffect(() => {
    let cancelled = false;
    const refs = draft.refs || [];
    if (!refs.length) {
      setPending(false);
      return;
    }
    setPending(true);
    recolor(refs)
      .then((colors) => {
        if (!cancelled) setDraft((value) => ({ ...value, ...colors }));
      })
      .catch(() => {
        if (!cancelled) setError('A reference image could not be read.');
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draft.refs, recolor]);
  const toggle = (url: string) =>
    setDraft((value) => ({
      ...value,
      refs: value.refs?.includes(url)
        ? value.refs.filter((ref) => ref !== url)
        : [...(value.refs || []), url],
    }));
  return (
    <div className="box">
      <h3>
        {onDelete ? 'Edit style' : 'Style maker'}
        <CloseButton label="Close styles" onClick={onClose}/>
      </h3>
      <input
        ref={title}
        className="title"
        placeholder="Style title"
        value={draft.n}
        onChange={(e) => setDraft({ ...draft, n: e.target.value })}
      />
      <Preview style={draft} paint={paint} large />
      <div
        className="sec"
        style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.09em' }}
      >
        Media to use as reference
      </div>
      <div className="refs">
        {draft.refs?.map((url) => (
          <div className="ref" key={url}>
            <img src={url} alt="Style reference" />
            <button title="Remove" onClick={() => toggle(url)}>
              ✕
            </button>
          </div>
        ))}
        <button
          className="add"
          style={{ minHeight: 0, aspectRatio: '16/10' }}
          onClick={() => setPicking(!picking)}
        >
          ＋<small>add more</small>
        </button>
      </div>
      {picking && (
        <div className="pool">
          {pool.length ? (
            pool.map((item) => (
              <button
                key={item.url}
                title={item.label}
                className={draft.refs?.includes(item.url) ? 'on' : ''}
                onClick={() => toggle(item.url)}
              >
                <img src={item.url} alt={item.label} />
              </button>
            ))
          ) : (
            <span className="note">No generated media yet. Generate some keyframes first.</span>
          )}
        </div>
      )}
      <textarea
        rows={2}
        placeholder="Describe the look (added to every prompt), e.g. 'grainy 16mm, teal shadows, warm skin'"
        value={draft.prompt}
        onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
      />
      <div className="note">
        Colours are taken from the reference media; the description steers generation.
      </div>
      {error && <p role="status">{error}</p>}
      <div className="acts">
        {onDelete && (
          <button className="btn" onClick={onDelete}>
            Delete style
          </button>
        )}
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn solid"
          disabled={pending}
          onClick={() => {
            try {
              onSave({ ...draft, n: draft.n.trim() || 'Untitled style', prompt: draft.prompt.trim() });
            } catch {
              setError('Could not save the style. Browser storage may be full.');
            }
          }}
        >
          Save style
        </button>
      </div>
    </div>
  );
}
