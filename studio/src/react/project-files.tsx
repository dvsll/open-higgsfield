import {useEffect,useState,type DragEvent} from 'react';
import {SC} from '../scene';
import {trainingKind} from '../../../shared/lib/training';
import type {ProjectFile} from '../project-files-index';
import {removeFileFolder,type FileOrganization} from '../project-file-folders';
import {FilePreview} from './file-preview';
import {Popup} from './popup';
import './project-files.css';

const kinds=[['video','Videos'],['image','Images'],['audio','Audio'],['captions','Captions']] as const;
export function ProjectFilesView({files,organization,onOrganize,onSelect,onOpen,onUseKeyframe}:{files:ProjectFile[];organization:FileOrganization;onOrganize:(value:FileOrganization)=>void;onSelect:(file:ProjectFile)=>void;onOpen:(file:ProjectFile)=>void;onUseKeyframe?:(file:ProjectFile)=>void}){
 const [selected,setSelected]=useState(''),[editing,setEditing]=useState<string|null>(null),[name,setName]=useState(''),[dragOver,setDragOver]=useState<string|null>(null);
 const [filter,setFilter]=useState<'all'|'generated'|'uploaded'>('all');const visible=files.filter(file=>filter==='all'||file.origin===filter);
 useEffect(()=>{const showGuides=()=>setFilter('all');window.addEventListener('osh-tour-show-guides',showGuides);return()=>window.removeEventListener('osh-tour-show-guides',showGuides)},[]);
 const [trainingMedia,setTrainingMedia]=useState<'image'|'video'|null>(null);
 useEffect(()=>{const sync=()=>{const active=[...document.querySelectorAll<HTMLElement>('.studio-window[data-window="training-data"],.studio-window[data-window="stylization"]')].some(panel=>panel.getClientRects().length>0);setTrainingMedia(active?(trainingKind(SC.get('osh-training-draft')?.model)==='video'?'video':'image'):null)};sync();window.addEventListener('osh-training-media-changed',sync);document.addEventListener('osh-workspace-selected',sync);document.addEventListener('osh-window-layout-changed',sync);return()=>{window.removeEventListener('osh-training-media-changed',sync);document.removeEventListener('osh-workspace-selected',sync);document.removeEventListener('osh-window-layout-changed',sync)}},[]);
 const current=visible.find(file=>file.url===selected);
 const move=(url:string,folder:string)=>{if(!files.some(file=>file.url===url))return;const assignments={...organization.assignments};if(folder)assignments[url]=folder;else delete assignments[url];onOrganize({...organization,assignments})};
 const drop=(event:DragEvent,folder:string,kind?:string)=>{event.preventDefault();setDragOver(null);const url=event.dataTransfer.getData('application/x-studio-file');if(kind&&files.find(file=>file.url===url)?.kind!==kind)return;move(url,folder)};
 const row=(file:ProjectFile)=><div key={file.url} className="project-file" data-file-url={file.url} data-training-compatible={trainingMedia?file.kind===trainingMedia:undefined} data-selected={selected===file.url} draggable onDragStart={event=>{event.dataTransfer.setData('application/x-studio-file',file.url);event.dataTransfer.setData('application/x-studio-file-'+file.kind,'1');event.dataTransfer.effectAllowed='copyMove';const preview=event.currentTarget.querySelector<HTMLElement>('.file-preview');if(preview)event.dataTransfer.setDragImage(preview,preview.clientWidth/2,preview.clientHeight/2)}}>
  <button draggable className="project-file-select" title={file.label} aria-label={file.label} aria-pressed={selected===file.url} onClick={()=>{setSelected(file.url);onSelect(file)}} onDoubleClick={()=>onOpen(file)}>
   <FilePreview file={file}/><span className="file-copy"><strong>{file.label}</strong><small>{file.kind} · {file.url.split('.').at(-1)?.toUpperCase()}</small></span>
  </button>
  <a href={file.url} download={file.url.split('/').pop()} title={'Download '+file.label} aria-label={'Download '+file.label}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10m-4-4 4 4 4-4M4 14v3h12v-3"/></svg></a>
 </div>;
 const section=(id:string,title:string,items:ProjectFile[],custom=false)=><details key={id} className="file-group" data-drop={dragOver===id} open onDragOver={event=>{if(!event.dataTransfer.types.includes('application/x-studio-file')||!custom&&!event.dataTransfer.types.includes('application/x-studio-file-'+id))return;event.preventDefault();event.dataTransfer.dropEffect='move';setDragOver(id)}} onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node))setDragOver(null)}} onDrop={event=>drop(event,custom?id:'',custom?undefined:id)}>
  <summary><span>{title}</span><span className="file-count">{items.length}</span>{custom&&<button type="button" aria-label={'Manage folder '+title} title="Rename or remove folder" onClick={event=>{event.preventDefault();setName(title);setEditing(id)}}>⋯</button>}</summary>
  {items.length?items.map(row):<p className="file-folder-empty">Drop files here</p>}
 </details>;
 return <>
  <div className="file-source-filters" role="group" aria-label="Media source">{(['all','generated','uploaded'] as const).map(value=><button key={value} type="button" aria-pressed={filter===value} onClick={()=>setFilter(value)}>{value[0].toUpperCase()+value.slice(1)}</button>)}</div>
  <div className="file-library-tools"><span>{visible.length} {visible.length===1?'file':'files'}</span><div className="file-library-actions"><button type="button" aria-label="Import files" title="Import files" onClick={()=>window.dispatchEvent(new Event('osh-import-files'))}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 14V3m-4 4 4-4 4 4M4 14v3h12v-3"/></svg></button><button type="button" onClick={()=>{setName('');setEditing('new')}}><span aria-hidden="true">＋</span> New folder</button></div></div>
  {current?.kind==='image'&&onUseKeyframe&&<button className="file-add-keyframe" type="button" onClick={()=>onUseKeyframe(current)}>Add as keyframe</button>}
  {current&&<label className="file-move"><span>Folder</span><select aria-label={'Folder for '+current.label} value={organization.assignments[current.url]||''} onChange={event=>move(current.url,event.target.value)}><option value="">Media type</option>{organization.folders.map(folder=><option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>}
  <div className="file-library-list">
   {organization.folders.map(folder=>section(folder.id,folder.name,visible.filter(file=>organization.assignments[file.url]===folder.id),true))}
   {kinds.map(([kind,title])=>{const items=visible.filter(file=>file.kind===kind&&!organization.assignments[file.url]);return items.length?section(kind,title,items):null})}
   {!visible.length&&<p className="files-empty">{filter==='all'?'Your images, videos and audio appear here as you create them.':`No ${filter} media.`}</p>}
  </div>
  {editing!==null&&<Popup title={editing==='new'?'New folder':'Manage folder'} onClose={()=>setEditing(null)}><form className="file-folder-form" onSubmit={event=>{event.preventDefault();const clean=name.trim();if(!clean)return;const folders=editing==='new'?[...organization.folders,{id:crypto.randomUUID(),name:clean}]:organization.folders.map(folder=>folder.id===editing?{...folder,name:clean}:folder);onOrganize({...organization,folders});setEditing(null)}}>
   <label>Folder name<input autoFocus value={name} maxLength={60} onChange={event=>setName(event.target.value)} placeholder="e.g. Scene references"/></label>
   {editing!=='new'&&<p>Removing a folder returns its files to their media groups.</p>}
   <div className="file-folder-actions">{editing!=='new'&&<button type="button" onClick={()=>{onOrganize(removeFileFolder(organization,editing));setEditing(null)}}>Remove folder</button>}<button type="submit" disabled={!name.trim()}>{editing==='new'?'Create folder':'Save name'}</button></div>
  </form></Popup>}
 </>;
}
