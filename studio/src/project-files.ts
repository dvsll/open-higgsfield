import {createElement} from 'react';
import { SC } from './scene';
import { SHELL } from './shell';
import { projectFiles } from './project-files-index';
import {renderView} from './react/render';
import {ProjectFilesView} from './react/project-files';
export function mountProjectFiles():HTMLElement{
 const root=document.createElement('div');root.className='project-files';root.setAttribute('aria-label','Current project media');
 function render(){const files=projectFiles(SC.get('osh-director'),SC.get('osh-workspace'),SC.get('osh-elements')||[],SC.get('osh-project'),SC.get('osh-project-files')||[]);SC.set('osh-project-files',files);
  renderView(root,createElement(ProjectFilesView,{files,onSelect:file=>{SHELL.select({type:file.kind==='video'?'shot':'keyframe',label:file.label,...(file.kind==='image'?{img:file.url}:file.kind==='video'?{video:file.url}:{audio:file.url})});dispatchEvent(new CustomEvent('osh-project-file-selected',{detail:file}))},onOpen:file=>dispatchEvent(new CustomEvent('osh-project-file-open',{detail:file}))}));
 }
 let pending=false;addEventListener('osh-project-media',()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;render()})});render();return root;
}
