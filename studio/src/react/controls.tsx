export function Glyph({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
export function Crumb({ index, name, onBack }: { index?: number; name?: string; onBack?: () => void }) {
  return index === undefined ? (
    <b>Sequence</b>
  ) : (
    <>
      <a id="toSeq" onClick={onBack}>
        Sequence
      </a>{' '}
      ›{' '}
      <b>
        Shot {index + 1} · {name}
      </b>
    </>
  );
}
export function RenderStatus({ generated }: { generated: boolean }) {
  return (
    <span style={{ color: generated ? 'var(--ok)' : 'var(--dim)' }}>
      {generated ? '● generated' : '○ keyframes only'}
    </span>
  );
}
export function Chips({ items }: { items: { key: string; name: string; selected: boolean }[] }) {
  return (
    <>
      {items.map((item) => (
        <button key={item.key} className={'chip' + (item.selected ? ' on' : '')} data-k={item.key}>
          {item.name}
        </button>
      ))}
    </>
  );
}
export function StagePlaceholder() {
  return (
    <>
      <div className="stage-grid" />
      <h2>3D workspace</h2>
      <p>A 3D viewport and scene tools are not connected yet.</p>
    </>
  );
}
