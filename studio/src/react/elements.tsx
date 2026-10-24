import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Element, PoolItem } from '../shell';
import { OSH } from '../../../shared/runtime/client';
import { projectKey } from '../projects';
export function ElementLibrary({
  elements,
  onSelect,
  pool,
}: {
  elements: Element[];
  onSelect: (element: Element) => void;
  pool: () => PoolItem[];
}) {
  const [items, setItems] = useState(() => [...elements]),
    [editing, setEditing] = useState<Element | null | undefined>(undefined);
  const save = (draft: Element) => {
    const next = elements.map((item) => (item.id === draft.id ? draft : item));
    if (!next.some((item) => item.id === draft.id)) next.push(draft);
    localStorage.setItem(projectKey('osh-elements'), JSON.stringify(next));
    elements.splice(0, elements.length, ...next);
    setItems([...next]);
    dispatchEvent(new Event('osh-elements-changed'));
    setEditing(undefined);
  };
  return (
    <>
      {items.map((element) => (
        <div key={element.id} className="element-tile">
          <button
            className="el"
            data-id={element.id}
            title={`Use @${element.n}`}
            onClick={() => onSelect(element)}
          >
            {element.refs?.[0] ? (
              <img src={element.refs[0]} alt="" />
            ) : (
              <span className="av">{element.ic}</span>
            )}
            <span>{element.n}</span>
          </button>
          <button className="element-edit" title={`Edit ${element.n}`} onClick={() => setEditing(element)}>
            ✎
          </button>
        </div>
      ))}
      <button className="element-add" onClick={() => setEditing(null)}>
        ＋ Create
      </button>
      {editing !== undefined && (
        <ElementMaker
          existing={editing || undefined}
          elements={items}
          pool={pool()}
          onSave={save}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  );
}
function ElementMaker({
  existing,
  elements,
  pool,
  onSave,
  onClose,
}: {
  existing?: Element;
  elements: Element[];
  pool: PoolItem[];
  onSave: (element: Element) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    input = useRef<HTMLInputElement>(null),
    fileInput = useRef<HTMLInputElement>(null),
    alive = useRef(true),
    uploading = useRef(false);
  const [name, setName] = useState(existing?.n || ''),
    [kind, setKind] = useState<Element['kind']>(existing?.kind || 'cast'),
    [description, setDescription] = useState(existing?.d || ''),
    [refs, setRefs] = useState(existing?.refs || []),
    [pending, setPending] = useState(false),
    [status, setStatus] = useState(''),
    [over, setOver] = useState(false);
  const references = useRef(refs);
  references.current = refs;
  useEffect(() => {
    alive.current = true;
    dialog.current!.showModal();
    input.current?.focus();
    return () => {
      alive.current = false;
      dialog.current?.close();
    };
  }, []);
  const upload = async (files: FileList | File[]) => {
    if (uploading.current) return;
    uploading.current = true;
    setPending(true);
    try {
      for (const file of Array.from(files)) {
        if (references.current.length >= 4 || !alive.current) break;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)
          throw new Error('Choose PNG/JPEG/WebP files under 10 MB.');
        setStatus(`Uploading ${file.name}…`);
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height)),
          canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const result = await OSH.upload(canvas.toDataURL('image/png'));
        if (alive.current) {
          references.current = [...references.current, result.url].slice(0, 4);
          setRefs(references.current);
        }
      }
      if (alive.current) setStatus('References saved locally.');
    } catch (error) {
      if (alive.current) setStatus((error as Error).message);
    } finally {
      uploading.current = false;
      if (alive.current) setPending(false);
    }
  };
  const submit = () => {
    if (pending) return;
    const n = name.trim(),
      d = description.trim();
    if (!n || !d) {
      setStatus('Add a name and description.');
      return;
    }
    if (
      elements.some((element) => element.id !== existing?.id && element.n.toLowerCase() === n.toLowerCase())
    ) {
      setStatus('Choose a unique element name.');
      return;
    }
    if (!/^[\p{L}\p{N} '_-]+$/u.test(n)) {
      setStatus('Use letters, numbers, spaces, apostrophes, dashes or underscores.');
      return;
    }
    try {
      onSave({
        id: existing?.id || crypto.randomUUID(),
        n,
        d,
        kind,
        ic: kind === 'cast' ? '👤' : kind === 'place' ? '🏙' : '◈',
        refs,
        user: true,
      });
    } catch {
      setStatus('Could not save the element. Browser storage may be full.');
    }
  };
  return createPortal(
    <dialog
      ref={dialog}
      className="element-maker"
      aria-label={existing ? 'Edit element' : 'Create element'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <header>
          <h2>{existing ? 'Edit element' : 'Create element'}</h2>
          <button type="button" data-close aria-label="Close element maker" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="element-layout">
          <section>
            <label>Reference images</label>
            <div
              className={'element-drop' + (over ? ' over' : '')}
              tabIndex={0}
              role="button"
              aria-label="Upload reference images"
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInput.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                void upload(e.dataTransfer.files);
              }}
            >
              Drop images here or click to upload<small>PNG, JPEG, WebP · up to 4 references</small>
            </div>
            <input
              ref={fileInput}
              data-files
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) void upload(e.target.files);
              }}
            />
            <div className="element-refs">
              {refs.map((url, index) => (
                <div key={url + index}>
                  <img src={url} alt={`Reference ${index + 1}`} />
                  <button
                    type="button"
                    aria-label={`Remove reference ${index + 1}`}
                    onClick={() => setRefs(refs.filter((_, i) => i !== index))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <details>
              <summary>Use a generated image</summary>
              <div className="element-pool">
                {pool.slice(0, 24).map((item) => (
                  <button
                    key={item.url}
                    type="button"
                    title={item.label}
                    onClick={() => {
                      if (refs.length < 4 && !refs.includes(item.url)) setRefs([...refs, item.url]);
                    }}
                  >
                    <img src={item.url} alt={item.label} />
                  </button>
                ))}
              </div>
            </details>
          </section>
          <section>
            <label>
              Element name
              <input
                ref={input}
                data-name
                required
                maxLength={48}
                placeholder="e.g. Copper Robot"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Type
              <select data-kind value={kind} onChange={(e) => setKind(e.target.value as Element['kind'])}>
                <option value="cast">Character</option>
                <option value="object">Object</option>
                <option value="place">Place</option>
              </select>
            </label>
            <label>
              Description
              <textarea
                data-description
                required
                rows={5}
                maxLength={500}
                placeholder="Describe appearance, colors and details to preserve…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <p>
              Use <b data-handle>@{name || 'name'}</b> in a prompt. Current models use this description;
              reference images are saved for future image conditioning.
            </p>
          </section>
        </div>
        <footer>
          <span role="status" data-status>
            {status}
          </span>
          <button type="button" data-cancel onClick={onClose}>
            Cancel
          </button>
          <button type="submit" data-save disabled={pending}>
            Save element
          </button>
        </footer>
      </form>
    </dialog>,
    document.body,
  );
}
