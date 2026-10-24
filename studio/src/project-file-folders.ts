export type FileFolder={id:string;name:string};
export type FileOrganization={folders:FileFolder[];assignments:Record<string,string>};
export function readFileOrganization(value:unknown):FileOrganization{
 const input=value as Partial<FileOrganization>|null;
 const folders:FileFolder[]=[];
 if(Array.isArray(input?.folders))for(const folder of input.folders){
  if(typeof folder?.id==='string'&&typeof folder?.name==='string'&&folder.name.trim()&&!folders.some(item=>item.id===folder.id))folders.push({id:folder.id,name:folder.name.trim().slice(0,60)});
 }
 const assignments:Record<string,string>=Object.create(null);
 if(input?.assignments&&typeof input.assignments==='object')for(const [url,id] of Object.entries(input.assignments))if(folders.some(folder=>folder.id===id))assignments[url]=id;
 return {folders,assignments};
}
export function removeFileFolder(state:FileOrganization,id:string):FileOrganization{
 return {folders:state.folders.filter(folder=>folder.id!==id),assignments:Object.fromEntries(Object.entries(state.assignments).filter(([,folder])=>folder!==id))};
}
