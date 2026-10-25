import {ProjectPicker,tryOnboarding} from './projects';
export function WorkspaceToolbar({studio=false}:{studio?:boolean}) {
  return (
    <>
      {studio&&<div className="toolbar-project"><ProjectPicker /></div>}
      <select aria-label="Workspace setup" />
      <details className="window-menu">
        <summary>Windows</summary>
        <div />
      </details>
      <button data-delete-media aria-label="Delete selected media" title="Delete selected media" disabled className="workspace-delete"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
      <button data-history-undo aria-label="Undo" title="Undo (Ctrl+Z)" className="workspace-delete" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 3 11l6 6M3 11h11a6 6 0 0 1 6 6v2"/></svg></button>
      <button data-history-redo aria-label="Redo" title="Redo (Ctrl+Shift+Z)" className="workspace-delete" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 6 6-6 6m6-6H10a6 6 0 0 0-6 6v2"/></svg></button>
      {studio&&<button id="testOnboarding" className="toolbar-onboarding" onClick={tryOnboarding} title="Start a fresh test project; keep your current work">Try onboarding</button>}
    </>
  );
}
export function WindowsMenu({
  panels,
  visible,
  onToggle,
  onNew,
}: {
  panels: { id: string; title: string }[];
  visible: string[];
  onToggle: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <>
      {panels.map(({ id, title }) => (
        <button
          key={id}
          data-window={id}
          aria-label={title}
          aria-pressed={visible.includes(id)}
          onClick={() => onToggle(id)}
        >
          {title}
        </button>
      ))}
      <button onClick={onNew}>+ New notes window…</button>
    </>
  );
}
