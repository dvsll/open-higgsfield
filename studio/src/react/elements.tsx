import {ProjectImagePicker} from './project-image-picker';
import {useSemanticSearch} from './semantic-search';
import '../media-model-picker.css';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Element, PoolItem } from '../shell';
import { OSH } from '../../../shared/runtime/client';
import { projectKey } from '../projects';
import {Popup} from './popup';
function ReferenceImage({url,name}:{url:string;name:string}){const [missing,setMissing]=useState(false);return missing?<div className="element-no-reference">Reference unavailable</div>:<img loading="lazy" src={url} alt={name+' reference'} onError={()=>setMissing(true)}/>}
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
    if (!draft.refs?.length) throw new Error("Add a reference image before saving.");
    const next = elements.map((item) => (item.id === draft.id ? draft : item));
    if (!next.some((item) => item.id === draft.id)) next.push(draft);
    localStorage.setItem(projectKey('osh-elements'), JSON.stringify(next));
    elements.splice(0, elements.length, ...next);
    setItems([...next]);
    dispatchEvent(new Event('osh-elements-changed'));
    dispatchEvent(new Event('osh-project-media'));
    setEditing(undefined);
  };
  const [query,setQuery]=useState(''),[category,setCategory]=useState('all'),[selected,setSelected]=useState<string[]>([]);
  useEffect(()=>{const update=(event:Event)=>setSelected((event as CustomEvent<string[]>).detail);addEventListener('osh-element-usage',update);dispatchEvent(new Event('osh-request-element-usage'));return()=>removeEventListener('osh-element-usage',update)},[]);
  const labels={cast:'Character',place:'Place',object:'Object'};
  const candidates=items.filter(item=>category==='all'||item.kind===category);
  const semantic=useSemanticSearch(query,candidates.map(item=>({id:item.id,text:`${item.n}. ${item.kind}: ${item.d}`.slice(0,1200)})));
  const scores=new Map(semantic.results.map(result=>[result.id,result.score]));
  const semanticThreshold=Math.max(.28,Math.max(0,...semantic.results.map(result=>result.score))-.15);
  const literal=(item:Element)=>`${item.n} ${item.d}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const filtered=candidates.filter(item=>literal(item)||(scores.get(item.id)||0)>=semanticThreshold).sort((a,b)=>Number(literal(b))-Number(literal(a))||(scores.get(b.id)||0)-(scores.get(a.id)||0));
  return <div className="element-library">
    <div className="element-library-toolbar"><input type="search" aria-label="Search elements" placeholder="Search elements…" value={query} onChange={e=>setQuery(e.target.value)}/><button className="element-new" onClick={()=>setEditing(null)}><span aria-hidden="true">+</span> New</button></div>
    {semantic.status&&<p className="semantic-search-status" role="status">{semantic.status}</p>}
    <div className="element-library-filter"><select aria-label="Element category" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All elements</option><option value="cast">Characters</option><option value="place">Places</option><option value="object">Objects</option></select><span>{filtered.length} {filtered.length===1?'element':'elements'}</span></div>
    <div className="element-gallery">{filtered.map(element=><article key={element.id} className="element-tile">
      <button className="el" data-id={element.id} aria-label={`Use @${element.n}`} aria-pressed={selected.includes(element.id)} title={element.d} onClick={()=>onSelect(element)}>
        <div className="element-cover">{element.refs?.[0]?<ReferenceImage key={element.refs[0]} url={element.refs[0]} name={element.n}/>:<div className="element-no-reference"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={element.kind==='cast'?'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2':element.kind==='place'?'M3 21V9l9-6 9 6v12M9 21v-7h6v7':'M3 7l9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10'}/></svg><span>No reference</span></div>}{!!element.refs?.length&&<span className="element-ref-count">{element.refs.length} {element.refs.length===1?'image':'images'}</span>}</div>
        <div className="element-caption"><strong>{element.n}</strong><span>{labels[element.kind]}</span></div>
      </button>
      <button className="element-edit" aria-label={`Edit ${element.n}`} title={`Edit ${element.n}`} onClick={()=>setEditing(element)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z"/></svg></button>
    </article>)}</div>
    {!filtered.length&&<p className="element-library-empty">{items.length?'No matching elements. Try another search or category.':'Save a character, place or object to reuse in your scenes.'}</p>}
    <p className="element-library-help">Click to insert an @mention. Descriptions guide generation; photos are saved references, not identity conditioning.</p>
    {editing!==undefined&&<ElementMaker existing={editing||undefined} elements={items} pool={pool()} onSave={save} onClose={()=>setEditing(undefined)}/>}
  </div>;
}function ElementMaker({
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
  const input = useRef<HTMLInputElement>(null),
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

    input.current?.focus();
    return () => {
      alive.current = false;

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
    if (!refs.length) {
      setStatus("Add at least one reference image.");
      return;
    }
    const n = name.trim(),
      d = description.trim();
    if (!n) {
      setStatus('Add a name.');
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
    <Popup title={existing ? 'Edit element' : 'Create element'} className="element-maker" onClose={onClose} closeLabel="Close element maker">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="element-layout">
          <section>
            <label>Reference images <small>Required · first image is the library cover</small></label>
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
            <ProjectImagePicker onPick={item=>{if(refs.includes(item.url))return;if(refs.length>=4){setStatus('Up to 4 references. Remove one to choose another.');return}setRefs([...refs,item.url]);setStatus('')}}/>
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
              Description (optional)
              <textarea
                data-description
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
            {status || (!refs.length ? "Add a reference image to save this element." : "")}
          </span>
          <button type="button" data-cancel onClick={onClose}>
            Cancel
          </button>
          <button type="submit" data-save disabled={pending || !refs.length}>
            Save element
          </button>
        </footer>
      </form>
    </Popup>,
    document.body,
  );
}
