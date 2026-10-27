import {createElement} from 'react';
import { SC } from './scene';
import { SHELL } from './shell';
import { projectFiles } from './project-files-index';
import {renderView} from './react/render';
import {ProjectFilesView} from './react/project-files';
import {readFileOrganization} from './project-file-folders';
import {mountProjectFileDrop} from './project-file-drop';
export function mountProjectFiles():HTMLElement{
 mountProjectFileDrop();
 const root=document.createElement('div');root.className='project-files';root.setAttribute('aria-label','Current project media');
 function render(){const edits=SC.get('osh-precision-history')||{};const editFiles=Object.entries(edits).flatMap(([url,versions]:[string,any])=>[{url,label:'Edit source',kind:'image' as const},...(Array.isArray(versions)?versions:[]).map(v=>({url:v.url,label:'Precision edit · '+(v.prompt||'Image'),kind:'image' as const,origin:'generated' as const}))]);const files=projectFiles(SC.get('osh-director'),SC.get('osh-workspace'),SC.get('osh-elements')||[],SC.get('osh-project'),[...(SC.get('osh-project-files')||[]),...editFiles]);SC.set('osh-project-files',files);
  renderView(root,createElement(ProjectFilesView,{files,onRename:(file,label)=>{SC.set('osh-project-files',files.map(item=>item.url===file.url?{...item,label,userLabel:label}:item));render();dispatchEvent(new Event('osh-project-media'))},onUseKeyframe:document.body.dataset.workflow==='video'&&document.querySelector<HTMLSelectElement>('.workspace-toolbar select')?.value!=='Edit'&&document.getElementById('trk')?file=>dispatchEvent(new CustomEvent('osh-project-file-keyframe',{detail:file})):undefined,organization:readFileOrganization(SC.get('osh-file-organization')),onOrganize:value=>{SC.set('osh-file-organization',value);render()},onSelect:file=>{if(file.kind==='mesh'){dispatchEvent(new CustomEvent('osh-select-3d-output',{detail:file}));dispatchEvent(new CustomEvent('osh-reveal-window',{detail:'stage'}));return}if(file.kind==='captions'){dispatchEvent(new CustomEvent('osh-project-file-selected',{detail:file}));dispatchEvent(new CustomEvent('osh-reveal-window',{detail:'captions'}));return}SHELL.select({type:file.kind==='video'?'shot':'keyframe',label:file.label,...(file.kind==='image'?{img:file.url}:file.kind==='video'?{video:file.url}:{audio:file.url})});dispatchEvent(new CustomEvent('osh-project-file-selected',{detail:file}))},onOpen:file=>{if(file.kind==='mesh'){dispatchEvent(new CustomEvent('osh-select-3d-output',{detail:file}));dispatchEvent(new CustomEvent('osh-reveal-window',{detail:'stage'}));return}dispatchEvent(new CustomEvent('osh-project-file-open',{detail:file}))}}));
 }
 let pending=false;const refresh=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render()})};addEventListener('osh-project-media',refresh);document.addEventListener('osh-workflow-changed',refresh);document.addEventListener('osh-workspace-selected',refresh);render();return root;
}
