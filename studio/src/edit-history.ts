import {SC} from './scene';
import {createHistory,recordHistory,historyTarget,validHistory,type HistoryTree} from './edit-history-tree';
import './edit-history.css';
type Shot={id?:string;n?:string;keys?:unknown[];[key:string]:unknown};
export type EditState={SH:Shot[];STASH:unknown[];TRASH:unknown[];imageDraft:unknown;keyframeBatch:number};
export function mountEditHistory(read:()=>EditState,restore:(state:EditState)=>void,busy:()=>boolean){
 const stored=SC.get('osh-edit-history');let tree:HistoryTree<EditState>=validHistory<EditState>(stored)&&stored.nodes.every(n=>Array.isArray(n.state.SH)&&n.state.SH.length&&Array.isArray(n.state.STASH)&&Array.isArray(n.state.TRASH))?stored:createHistory(read());
 const root=document.createElement('div');root.className='edit-history';const tools=document.createElement('div');tools.className='history-tools';
 const undo=document.createElement('button');undo.textContent='Undo';undo.title='Undo project edit (Ctrl+Z)';const redo=document.createElement('button');redo.textContent='Redo';redo.title='Redo project edit (Ctrl+Shift+Z / Ctrl+Y)';
 const status=document.createElement('p');status.className='history-status';status.setAttribute('role','status');
 const list=document.createElement('div');list.setAttribute('role','tree');list.setAttribute('aria-label','Project edit branches');tools.append(undo,redo);root.append(tools,status,list);
 list.addEventListener('keydown',e=>{const items=Array.from(list.querySelectorAll<HTMLButtonElement>('[role=treeitem]'));const index=items.indexOf(e.target as HTMLButtonElement);if(index<0)return;let next=index;if(e.key==='ArrowDown')next=Math.min(items.length-1,index+1);else if(e.key==='ArrowUp')next=Math.max(0,index-1);else if(e.key==='Home')next=0;else if(e.key==='End')next=items.length-1;else return;e.preventDefault();items[next].focus()});
 let applying=false,timer:ReturnType<typeof setTimeout>|undefined;
 const persist=()=>{SC.set('osh-edit-history',tree);if(SC.get('osh-edit-history')?.current!==tree.current)status.textContent='Browser storage is full. This session’s new history is available until you close the page.'};
 function label(before:EditState,after:EditState):string{
  if(after.SH.length!==before.SH.length)return after.SH.length>before.SH.length?'Add scene':'Remove scene';
  if(after.STASH.length!==before.STASH.length)return 'Move scene to / from Stash';
  if(after.TRASH.length!==before.TRASH.length)return 'Move scene to / from Trash';
  if(before.SH.map(s=>s.id).join()!==after.SH.map(s=>s.id).join())return 'Reorder scenes';
  for(let i=0;i<after.SH.length;i++){const a=after.SH[i],b=before.SH[i];if(JSON.stringify(a)===JSON.stringify(b))continue;
   const changes=[['prompt','Shot prompt'],['m','Motion prompt'],['audioPrompt','Audio prompt'],['n','Rename scene'],['video','Video take'],['audio','Audio take'],['keys','Keyframes'],['renderWidth','Width'],['renderHeight','Height'],['frames','Frame count'],['fps','Frame rate'],['d','Duration'],['seed','Seed'],['audioLinked','Audio link'],['audioMuted','Audio mute'],['audioStart','Audio timing']];
   return (changes.find(([key])=>JSON.stringify(a[key])!==JSON.stringify(b[key]))?.[1]||'Edit scene')+': '+(a.n||`Scene ${i+1}`);
  }
  return 'Edit image workshop';
 }
 function flush(){clearTimeout(timer);if(applying)return;const state=read(),before=tree.nodes.find(n=>n.id===tree.current)!.state;if(recordHistory(tree,state,label(before,state))){persist();draw()}}
 function draw(){undo.disabled=!historyTarget(tree,'undo');redo.disabled=!historyTarget(tree,'redo');list.replaceChildren();
  const visit=(parent:string|null,depth:number)=>{for(const n of tree.nodes.filter(n=>n.parent===parent)){const item=document.createElement('button');item.setAttribute('role','treeitem');item.setAttribute('aria-level',String(depth+1));item.setAttribute('aria-selected',String(n.id===tree.current));item.style.setProperty('--history-depth',String(Math.min(depth,8)));item.textContent=(n.id===tree.current?'● ':'↳ ')+n.label;item.title=new Date(n.at).toLocaleString();item.onclick=()=>{flush();go(n.id)};list.append(item);visit(n.id,depth+1)}};visit(null,0);
 }
 function go(id:string|null){if(!id||id===tree.current)return;if(busy()){status.textContent='Finish the current generation or drag before changing history.';return}const n=tree.nodes.find(n=>n.id===id);if(!n)return;applying=true;try{restore(JSON.parse(JSON.stringify(n.state)));const old=tree.nodes.find(p=>p.id===tree.current)!;tree.preferred??={};if(old.parent===id)tree.preferred[id]=old.id;else if(n.parent)tree.preferred[n.parent]=id;tree.current=id;status.textContent=n.label;persist()}finally{applying=false;draw()}}
 const move=(direction:'undo'|'redo')=>{flush();go(historyTarget(tree,direction))};undo.onclick=()=>move('undo');redo.onclick=()=>move('redo');
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
   const heading=document.createElement('h2');heading.textContent=`${field.name} history`;const close=document.createElement('button');close.textContent='Close';close.onclick=()=>dialog.close();const header=document.createElement('header');header.append(heading,close);
   const help=document.createElement('p');help.textContent='Exact prompt checkpoints across edit branches. Restore changes only this prompt.';
   const versions=document.createElement('div');versions.className='prompt-revisions';const before=document.createElement('pre'),after=document.createElement('pre');before.setAttribute('aria-label','Previous prompt');after.setAttribute('aria-label','Selected prompt');const comparison=document.createElement('div');comparison.className='prompt-comparison';
   for(const [name,pre] of [['Before',before],['After',after]] as const){const section=document.createElement('section');const h=document.createElement('h3');h.textContent=name;section.append(h,pre);comparison.append(section)}
   const apply=document.createElement('button');apply.textContent='Restore this prompt';let selected=revisions[0];
   const highlight=(pre:HTMLElement,value:string,other:string)=>{let start=0,end=0;while(start<value.length&&start<other.length&&value[start]===other[start])start++;while(end<value.length-start&&end<other.length-start&&value[value.length-1-end]===other[other.length-1-end])end++;const mark=document.createElement('mark');mark.textContent=value.slice(start,value.length-end);pre.replaceChildren(document.createTextNode(value.slice(0,start)),mark,document.createTextNode(value.slice(value.length-end)));if(!value)pre.textContent='(empty prompt)'};
   const select=(n:typeof selected)=>{selected=n;const previous=tree.nodes.find(p=>p.id===n.parent);const old=previous?text(previous.state):'';highlight(before,old,text(n.state));highlight(after,text(n.state),old);for(const item of versions.children)item.setAttribute('aria-pressed',String((item as HTMLElement).dataset.revision===n.id));apply.disabled=text(read())===text(n.state)};
   for(const n of revisions){const item=document.createElement('button');item.dataset.revision=n.id;item.textContent=new Date(n.at).toLocaleString()+' · '+(n.parent?'Revision':'Starting point')+(n.id===tree.current?' · current':'');item.onclick=()=>select(n);versions.append(item)}
   apply.onclick=()=>{if(busy()){help.textContent='Finish the current generation or drag before restoring a prompt.';return}const next=read();if(field.key==='image')(next.imageDraft as {prompt:string}).prompt=text(selected.state);else{const target=next.SH.find(s=>s.id===shotId);if(!target)return;target[field.key]=text(selected.state);if(field.key!=='audioPrompt')target.r=false}restore(next);flush();dialog.close()};
   dialog.append(header,help,versions,comparison,apply);dialog.onclose=()=>dialog.remove();document.body.append(dialog);if(selected)select(selected);else apply.disabled=true;dialog.showModal();
  };
 }
 // Edits applied in another workflow since the last visit become a new branch node.
 flush();draw();return {element:root,record:schedule};
}
