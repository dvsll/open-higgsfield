import {useEffect,useState} from 'react';
import {SC} from '../scene';
import {projectFiles,type ProjectFile} from '../project-files-index';
import {readFileOrganization} from '../project-file-folders';
import {ProjectFilesView} from './project-files';
export function ProjectImagePicker({onPick}:{onPick:(file:ProjectFile)=>void}){
 const read=()=>projectFiles(SC.get('osh-director'),SC.get('osh-workspace'),SC.get('osh-elements')||[],SC.get('osh-project'),SC.get('osh-project-files')||[]).filter(file=>file.kind==='image');
 const [files,setFiles]=useState(read),[organization,setOrganization]=useState(()=>readFileOrganization(SC.get('osh-file-organization')));
 useEffect(()=>{const refresh=()=>setFiles(read());addEventListener('osh-project-media',refresh);return()=>removeEventListener('osh-project-media',refresh)},[]);
 return <section className="element-project-files"><h3>Project files</h3><div className="project-files"><ProjectFilesView files={files} organization={organization} onOrganize={next=>{SC.set('osh-file-organization',next);setOrganization(next)}} onSelect={onPick} onOpen={onPick}/></div></section>;
}
