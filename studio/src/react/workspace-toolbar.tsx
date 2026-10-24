export function WorkspaceToolbar() {
  return (
    <>
      <select aria-label="Workspace setup" />
      <details className="window-menu">
        <summary>Windows</summary>
        <div />
      </details>
      <button data-save-setup>Save setup…</button>
      <button data-reset-setup>Reset setup</button>
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
