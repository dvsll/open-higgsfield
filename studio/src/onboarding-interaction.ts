/** Locks the surrounding application without changing its saved layout or disabled states. */
export function lockTourInteraction(options:{roots:()=>HTMLElement[]|null;blocked:()=>void}) {
 const changed=new Map<HTMLElement,boolean>();
 const restore=()=>{for(const [element,inert] of changed)element.inert=inert;changed.clear()};
 const roots=()=>options.roots();
 function sync(){
  restore();const allowed=roots();if(!allowed)return;
  const visit=(parent:HTMLElement)=>{for(const child of parent.children){
   if(!(child instanceof HTMLElement))continue;
   if(allowed.some(root=>root===child))continue;
   if(allowed.some(root=>child.contains(root)))visit(child);
   else if(!child.inert){changed.set(child,false);child.inert=true}
  }};visit(document.body);
 }
 const contains=(allowed:HTMLElement[],target:EventTarget|null)=>target instanceof Node&&allowed.some(root=>root.contains(target));
 function block(event:Event){event.preventDefault();event.stopImmediatePropagation()}
 function pointer(event:Event){const allowed=roots();if(allowed&&!contains(allowed,event.target)){block(event);if(event.type==='pointerdown')options.blocked()}}
 const focusable=()=> (roots()||[]).flatMap(root=>[root,...root.querySelectorAll<HTMLElement>('button,input,textarea,select,a[href],summary,[tabindex]')]).filter(element=>element.tabIndex>=0&&!element.matches(':disabled')&&!element.closest('[inert]')&&element.getClientRects().length>0);
 function focus(event:FocusEvent){const allowed=roots();if(allowed&&!contains(allowed,event.target)){event.stopImmediatePropagation();focusable()[0]?.focus({preventScroll:true})}}
 function key(event:KeyboardEvent){
  const allowed=roots();if(!allowed)return;
  if(!contains(allowed,event.target)){block(event);focusable()[0]?.focus({preventScroll:true});return}
  // Keep native text undo/copy/paste, but prevent application-wide shortcuts from escaping the lesson.
  if(event.ctrlKey||event.metaKey){event.stopImmediatePropagation();return}
  const target=event.target as HTMLElement;
  if(event.key==='F2'||(!target.closest('input,textarea,select,button,summary,[contenteditable=true]')&&['Delete','Backspace',' ','Escape'].includes(event.key))){block(event);return}
  if(event.key==='Tab'){
   const editor=event.target as HTMLElement;
   if(editor.getAttribute('aria-expanded')==='true'&&editor.getAttribute('aria-autocomplete')==='list')return;
   const items=focusable();const index=items.indexOf(document.activeElement as HTMLElement);
   block(event);items[(index+(event.shiftKey?-1:1)+items.length)%items.length]?.focus({preventScroll:true});
  }
 }
 const pointerEvents=['pointerdown','mousedown','click','dblclick','contextmenu','dragstart','drop','wheel'];
 pointerEvents.forEach(name=>window.addEventListener(name,pointer,{capture:true,passive:false}));
 window.addEventListener('focusin',focus,true);window.addEventListener('keydown',key,true);
 return {sync,dispose(){restore();pointerEvents.forEach(name=>window.removeEventListener(name,pointer,true));window.removeEventListener('focusin',focus,true);window.removeEventListener('keydown',key,true)}};
}
