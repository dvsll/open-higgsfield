import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  createProject,
  currentProject,
  orderedProjects,
  readProjects,
  recycleProject,
  permanentlyDeleteProject,
  renameProject,
  restoreProject,
  switchProject,
  type Project,
} from '../projects';
import '../projects.css';
import {ConfirmDelete} from './confirm-delete';
import {profileKey} from '../onboarding-progress';

const paths = {
  close: 'M6 6l12 12M18 6L6 18',
  pencil: 'm15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z',
  bin: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  restore: 'M4 10a8 8 0 1 1 0 6M4 4v6h6',
};
function IconButton({
  kind,
  label,
  onClick,
}: {
  kind: keyof typeof paths;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={'project-icon'+(['pencil','bin'].includes(kind)?' muted-action':'')} title={label} aria-label={label} onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d={paths[kind]} />
      </svg>
    </button>
  );
}
function NameForm({
  name = '',
  onSave,
  onCancel,
}: {
  name?: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <form
      className="project-name-form"
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const value = ref.current!.value.trim();
        if (value) onSave(value);
      }}
    >
      <input
        ref={ref}
        required
        maxLength={60}
        defaultValue={name}
        placeholder="Your next idea…"
        aria-label={name ? 'Project name' : 'New project name'}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }
        }}
      />
      <button type="submit">{name ? 'Save' : 'Create'}</button>
      <IconButton kind="close" label="Cancel" onClick={onCancel} />
    </form>
  );
}
export function ProjectPicker() {
  const [deleting,setDeleting]=useState<Project|null>(null);
  const [open, setOpen] = useState(false),
    [items, setItems] = useState(readProjects),
    [recycled, setRecycled] = useState(false),
    [editing, setEditing] = useState<string | null>(null),
    [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null),
    pressedOutside = useRef(false);
  const busy = () =>
    document.querySelector<HTMLButtonElement>('#kgo')?.disabled ||
    document.querySelector<HTMLElement>('#ov')?.style.display === 'flex';
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      return () => dialog.current?.close();
    }
  }, [open]);
  useEffect(() => {
    const sync = () => setItems(readProjects());
    addEventListener('storage', sync);
    return () => removeEventListener('storage', sync);
  }, []);
  const commit = (action: () => void) => {
    try {
      action();
      setError('');
      setItems(readProjects());
      setEditing(null);
    } catch {
      setError('Could not save. Browser storage may be full.');
    }
  };
  const name = items.find((p) => p.id === currentProject.id)?.name || currentProject.name;
  const outside = (e: PointerEvent<HTMLDialogElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    return e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom;
  };
  const list = recycled
    ? items.filter((p) => p.deletedAt).sort((a, b) => b.deletedAt! - a.deletedAt!)
    : orderedProjects(items, currentProject.id);
  return (
    <>
      <button
        className="project-picker"
        onClick={() => {
          if (!busy()) {
            setItems(readProjects());
            setOpen(true);
          }
        }}
      >
        <svg className="project-folder-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h7l2 3h9l-2 12H3V6Z"/></svg><span>{name} ▾</span>
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className="projects-dialog"
            aria-label="Projects"
            onCancel={() => setOpen(false)}
            onClose={() => setOpen(false)}
            onPointerDown={(e) => {
              pressedOutside.current = outside(e);
            }}
            onPointerUp={(e) => {
              if (pressedOutside.current && outside(e)) setOpen(false);
              pressedOutside.current = false;
            }}
          >
            <header>
              <h2>Your projects</h2>
              <IconButton kind="close" label="Close projects" onClick={() => setOpen(false)} />
            </header>
            <p className="project-caption">Saved on this browser.</p>
            <div data-content>
              {!recycled && (
                <div className="project-create-slot">
                  {editing === 'new' ? (
                    <NameForm
                      onSave={(value) => commit(() => switchProject(createProject(value)))}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <button className="project-create" onClick={() => setEditing('new')}>
                      <span aria-hidden="true">＋</span> New project
                    </button>
                  )}
                </div>
              )}
              <div className="project-list">
                {list.map((p: Project) => (
                  <div
                    key={p.id}
                    className={'project-row' + (p.id === currentProject.id && !recycled ? ' is-current' : '')}
                  >
                    {editing === p.id ? (
                      <NameForm
                        name={p.name}
                        onSave={(value) => commit(() => renameProject(p.id, value))}
                        onCancel={() => setEditing(null)}
                      />
                    ) : (
                      <>
                        <button
                          className="project-name"
                          disabled={recycled}
                          aria-current={p.id === currentProject.id && !recycled ? 'true' : undefined}
                          onClick={() => switchProject(p)}
                        >
                          {p.name}
                        </button>
                        {recycled ? (
                          <><IconButton
                            kind="restore"
                            label={`Restore ${p.name}`}
                            onClick={() => commit(() => restoreProject(p.id))}
                          /><IconButton kind="bin" label={`Permanently delete ${p.name}`} onClick={()=>setDeleting(p)}/></>
                        ) : (
                          <>
                            <IconButton
                              kind="pencil"
                              label={`Rename ${p.name}`}
                              onClick={() => setEditing(p.id)}
                            />
                            <IconButton
                              kind="bin"
                              label={`Recycle ${p.name}`}
                              onClick={() => commit(()=>{const replacement=recycleProject(p.id);if(p.id===currentProject.id)switchProject(replacement)})}
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {!list.length && <p>Recycle Bin is empty.</p>}
              </div>
              <button
                className="project-bin-toggle"
                onClick={() => {
                  setRecycled(!recycled);
                  setEditing(null);
                }}
              >
                {recycled ? '← Back to projects' : `Recycle Bin (${items.filter((p) => p.deletedAt).length})`}
              </button>
              {recycled && (
                <p className="project-caption">Restore a project with all its scenes and settings.</p>
              )}
            </div>
            {error && (
              <p data-error role="status">
                {error}
              </p>
            )}
          </dialog>,
          document.body,
        )}
      {deleting&&createPortal(<ConfirmDelete kind="project" name={deleting.name} onCancel={()=>setDeleting(null)} onConfirm={()=>{const project=deleting;setDeleting(null);commit(()=>permanentlyDeleteProject(project.id))}}/>,document.body)}
    </>
  );
}
export function tryOnboarding() {
  if (
    document.querySelector<HTMLButtonElement>('#kgo')?.disabled ||
    document.querySelector<HTMLElement>('#ov')?.style.display === 'flex'
  )
    return;
  const project=createProject(
      `Onboarding test ${readProjects().filter((p) => p.name.startsWith('Onboarding test')).length + 1}`,
  );
  localStorage.removeItem(profileKey);
  switchProject(project);
}
