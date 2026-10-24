import {createElement} from 'react';
import {renderView,unmountView} from './react/render';
import {HistoryView,PromptHistory,type HistoryRow} from './react/history';
import {SC} from './scene';
import {createHistory,recordHistory,historyTarget,validHistory,type HistoryTree} from './edit-history-tree';
import './edit-history.css';
type Shot={id?:string;n?:string;keys?:unknown[];[key:string]:unknown};
export type EditState={SH:Shot[];STASH:unknown[];TRASH:unknown[];imageDraft:unknown;keyframeBatch:number;LAYERS?:unknown};
export function mountEditHistory(read:()=>EditState,restore:(state:EditState)=>void,busy:()=>boolean){
 const stored=SC.get('osh-edit-history');let tree:HistoryTree<EditState>=validHistory<EditState>(stored)&&stored.nodes.every(n=>Array.isArray(n.state.SH)&&n.state.SH.length&&Array.isArray(n.state.STASH)&&Array.isArray(n.state.TRASH))?stored:createHistory(read());
 const root=document.createElement('div');root.className='edit-history';let statusMessage='';
 let applying=false,timer:ReturnType<typeof setTimeout>|undefined;
 const persist=()=>{SC.set('osh-edit-history',tree);if(SC.get('osh-edit-history')?.current!==tree.current)statusMessage='Browser storage is full. This session’s new history is available until you close the page.'};
 function label(before:EditState,after:EditState):string{
  if(after.SH.length!==before.SH.length)return after.SH.length>before.SH.length?'Add scene':'Remove scene';
  if(after.STASH.length!==before.STASH.length)return 'Move scene to / from Stash';
  if(after.TRASH.length!==before.TRASH.length)return 'Move scene to / from Trash';
  if(before.SH.map(s=>s.id).join()!==after.SH.map(s=>s.id).join())return 'Reorder scenes';
  for(let i=0;i<after.SH.length;i++){const a=after.SH[i],b=before.SH[i];if(JSON.stringify(a)===JSON.stringify(b))continue;
   const changes=[['prompt','Shot prompt'],['m','Motion prompt'],['audioPrompt','Audio prompt'],['n','Rename scene'],['video','Video take'],['audio','Audio take'],['keys','Keyframes'],['renderWidth','Width'],['renderHeight','Height'],['frames','Frame count'],['fps','Frame rate'],['d','Duration'],['seed','Seed'],['audioLinked','Audio link'],['audioMuted','Audio mute'],['audioStart','Audio timing']];
   return (changes.find(([key])=>JSON.stringify(a[key])!==JSON.stringify(b[key]))?.[1]||'Edit scene')+': '+(a.n||`Scene ${i+1}`);
  }
  if(JSON.stringify(before.LAYERS)!==JSON.stringify(after.LAYERS))return 'Edit sequence layers';
  return 'Edit image workshop';
 }
 function flush(){clearTimeout(timer);if(applying)return;const state=read(),before=tree.nodes.find(n=>n.id===tree.current)!.state;if(recordHistory(tree,state,label(before,state))){persist();draw()}}
 function draw(){const rows:HistoryRow[]=[];const visit=(parent:string|null,depth:number)=>{for(const node of tree.nodes.filter(n=>n.parent===parent)){rows.push({id:node.id,label:node.label,at:node.at,depth});visit(node.id,depth+1)}};visit(null,0);
  renderView(root,createElement(HistoryView,{rows,current:tree.current,status:statusMessage,canUndo:!!historyTarget(tree,'undo'),canRedo:!!historyTarget(tree,'redo'),onUndo:()=>move('undo'),onRedo:()=>move('redo'),onGo:id=>{flush();go(id)}}));
 }
 function go(id:string|null){if(!id||id===tree.current)return;if(busy()){statusMessage='Finish the current generation or drag before changing history.';draw();return}const n=tree.nodes.find(n=>n.id===id);if(!n)return;applying=true;try{restore(JSON.parse(JSON.stringify(n.state)));const old=tree.nodes.find(p=>p.id===tree.current)!;tree.preferred??={};if(old.parent===id)tree.preferred[id]=old.id;else if(n.parent)tree.preferred[n.parent]=id;tree.current=id;statusMessage=n.label;persist()}finally{applying=false;draw()}}
 const move=(direction:'undo'|'redo')=>{flush();go(historyTarget(tree,direction))};
 addEventListener('keydown',e=>{const target=e.target as HTMLElement;if(e.defaultPrevented||!(e.ctrlKey||e.metaKey)||e.altKey||target.closest('input,textarea,select,[contenteditable=true],dialog'))return;const key=e.key.toLowerCase();if(key!=='z'&&key!=='y')return;e.preventDefault();move(key==='y'||e.shiftKey?'redo':'undo')});
 const schedule=()=>{if(applying)return;clearTimeout(timer);timer=setTimeout(flush,450)};
 for(const event of ['input','change','click','pointerup'])addEventListener(event,schedule);
 addEventListener('focusout',()=>{if(!applying)flush()});addEventListener('pagehide',flush);
 const promptFields=[{id:'shotPromptInput',key:'prompt',name:'Shot prompt'},{id:'motion',key:'m',name:'Motion prompt'},{id:'audioPrompt',key:'audioPrompt',name:'Audio prompt'},{id:'kp',key:'image',name:'Image prompt'}];
 for(const field of promptFields){const input=document.getElementById(field.id);const label=document.querySelector(`label[for="${field.id}"]`);if(!input||!label)continue;
  const button=document.createElement('button');button.type='button';button.className='prompt-history-button';button.textContent='History';button.setAttribute('aria-label',`${field.name} history`);label.append(button);
  button.onclick=e=>{e.preventDefault();flush();const current=read();const index=Number(document.querySelector('#sNum')?.textContent?.match(/\d+/)?.[0]||1)-1;const shot=current.SH[index]||current.SH[0],shotId=shot.id;
   const text=(state:EditState)=>String(field.key==='image'?(state.imageDraft as {prompt?:string})?.prompt||'':state.SH.find(s=>s.id===shotId)?.[field.key]||'');
   const revisions=tree.nodes.filter(n=>{const parent=tree.nodes.find(p=>p.id===n.parent);return (!parent||text(parent.state)!==text(n.state))&&(field.key==='image'||n.state.SH.some(s=>s.id===shotId))}).reverse();
   const dialog=document.createElement('dialog');dialog.className='prompt-history-dialog';dialog.setAttribute('aria-label',`${field.name} revision history`);
   renderView(dialog,createElement(PromptHistory,{title:field.name+' history',current:tree.current,initialText:text(read()),revisions:revisions.map(n=>({id:n.id,at:n.at,parent:n.parent,text:text(n.state),before:text(tree.nodes.find(p=>p.id===n.parent)?.state||n.state)})),onClose:()=>dialog.close(),onRestore:id=>{
    if(busy())return 'Finish the current generation or drag before restoring a prompt.';
    const selected=tree.nodes.find(n=>n.id===id);if(!selected)return;
    const next=read();if(field.key==='image')(next.imageDraft as {prompt:string}).prompt=text(selected.state);else{const target=next.SH.find(s=>s.id===shotId);if(!target)return;target[field.key]=text(selected.state);if(field.key!=='audioPrompt')target.r=false}restore(next);flush();dialog.close();
   }}));dialog.onclose=()=>{unmountView(dialog);dialog.remove()};document.body.append(dialog);dialog.showModal();
  };
 }
 // Edits applied in another workflow since the last visit become a new branch node.
 flush();draw();return {element:root,record:schedule};
}
