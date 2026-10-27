export type ModelPack={id:string;name:string;models:{file:string;size_gb:number;license:string;url:string;installed:boolean}[]};
export function modelInstallPlan(packs:ModelPack[],chosen:string[]){
 const files=[...new Map(packs.filter(pack=>chosen.includes(pack.id)).flatMap(pack=>pack.models).map(file=>[file.file,file])).values()];
 const missing=files.filter(file=>!file.installed);
 return {files,missing,sizeGB:missing.reduce((total,file)=>total+file.size_gb,0)};
}
