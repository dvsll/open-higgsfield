export function WorkspaceToolbar() {
  return (
    <>
      <select aria-label="Workspace setup" />
      <button data-new-setup>New workspace…</button>
      <details className="window-menu">
        <summary>Windows</summary>
        <div />
      </details>
      <button data-save-setup>Save setup…</button>
      <button data-reset-setup>Reset setup</button>
      <button data-delete-setup aria-label="Delete workspace" title="Delete this custom workspace" disabled className="workspace-delete"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
      <button data-restore-setup hidden>Undo delete</button>
      <span>Drag a window title · release on a docking guide</span>
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
