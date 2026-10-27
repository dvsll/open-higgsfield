import {panel,split,type LayoutNode} from './window-layout.ts';
export type Setup={tree:LayoutNode|null;mode:string;promptMedia?:'video'|'image'|'audio'|'3d'};
export const basicVideoWorkspace=():Setup=>({tree:split('x',panel('prompts'),panel('viewer'),.5),mode:'video'});
export function workspaceNameError(name:string,names:string[],current?:string):string{
 const trimmed=name.trim();
 if(!trimmed)return 'Give your workspace a name.';
 if(trimmed.length>80)return 'Use up to 80 characters.';
 if(['__proto__','prototype','constructor','__edit','__new'].includes(trimmed.toLowerCase()))return 'Choose another workspace name.';
 if(names.some(existing=>existing.toLowerCase()===trimmed.toLowerCase()&&!(existing===current&&trimmed===current)))return 'That workspace already exists. Choose another name.';
 return '';
}
/** Built-in presets can be reset, but only user-created layouts can be removed. */
export function recycleWorkspace(layouts:Record<string,Setup>,deleted:Record<string,Setup>,presets:Record<string,Setup>,name:string):boolean{
 if(Object.hasOwn(presets,name)||!Object.hasOwn(layouts,name))return false;
 deleted[name]=structuredClone(layouts[name]);delete layouts[name];return true;
}
export function restoredWorkspaceName(name:string,names:string[]):string{
 if(!names.some(n=>n.toLowerCase()===name.toLowerCase()))return name;
 let index=2;while(names.some(n=>n.toLowerCase()===`${name} (${index})`.toLowerCase()))index++;
 return `${name} (${index})`;
}
