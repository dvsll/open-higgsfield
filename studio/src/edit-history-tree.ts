export type HistoryNode<T> = {id:string;parent:string|null;label:string;at:number;state:T};
export type HistoryTree<T> = {version:1;current:string;preferred?:Record<string,string>;nodes:HistoryNode<T>[]};
const copy=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
export function createHistory<T>(state:T):HistoryTree<T>{const id=crypto.randomUUID();return {version:1,current:id,nodes:[{id,parent:null,label:'Starting point',at:Date.now(),state:copy(state)}]}}
export function recordHistory<T>(tree:HistoryTree<T>,state:T,label:string):boolean{
 const current=tree.nodes.find(n=>n.id===tree.current)!;
 if(JSON.stringify(current.state)===JSON.stringify(state))return false;
 const node={id:crypto.randomUUID(),parent:current.id,label,at:Date.now(),state:copy(state)};tree.nodes.push(node);tree.current=node.id;
 // Bound browser storage while preserving recent alternate branches and a valid root.
 while(tree.nodes.length>160){
  const ancestors=new Set<string>();let n:HistoryNode<T>|undefined=node;
  while(n){ancestors.add(n.id);n=tree.nodes.find(p=>p.id===n!.parent)}
  const leaf=tree.nodes.find(n=>!ancestors.has(n.id)&&!tree.nodes.some(c=>c.parent===n.id));
  if(leaf){tree.nodes=tree.nodes.filter(n=>n!==leaf);continue}
  const root=tree.nodes.find(n=>n.parent===null)!;tree.nodes=tree.nodes.filter(n=>n!==root);tree.nodes.filter(n=>n.parent===root.id).forEach(n=>n.parent=null);
 }
 if(tree.preferred){const kept=new Set(tree.nodes.map(n=>n.id));tree.preferred=Object.fromEntries(Object.entries(tree.preferred).filter(([parent,child])=>kept.has(parent)&&kept.has(child)))};
 return true;
}
export function historyTarget<T>(tree:HistoryTree<T>,direction:'undo'|'redo'):string|null{
 const current=tree.nodes.find(n=>n.id===tree.current);if(!current)return null;
 if(direction==='undo')return current.parent;
 const preferred=tree.preferred?.[current.id];return tree.nodes.find(n=>n.id===preferred&&n.parent===current.id)?.id||tree.nodes.filter(n=>n.parent===current.id).at(-1)?.id||null;
}
export function validHistory<T>(value:unknown):value is HistoryTree<T>{
 const t=value as HistoryTree<T>;if(t?.version!==1||!Array.isArray(t.nodes)||!t.nodes.length||t.nodes.length>160)return false;
 const ids=new Set(t.nodes.map(n=>n?.id));if(ids.size!==t.nodes.length||!ids.has(t.current)||t.nodes.filter(n=>n.parent===null).length!==1)return false;
 return t.nodes.every(n=>typeof n.id==='string'&&typeof n.label==='string'&&Number.isFinite(n.at)&&!!n.state&&(n.parent===null||ids.has(n.parent)))&&t.nodes.every(n=>{const seen=new Set<string>();while(n.parent!==null){if(seen.has(n.id))return false;seen.add(n.id);n=t.nodes.find(p=>p.id===n.parent)!}return true});
}
