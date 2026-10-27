export function mountTimelineMarquee(root:HTMLElement,onChange:(ids:Set<string>)=>void){
 let selected=new Set<string>(),suppressClickUntil=0;
 root.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation()}},true);
 const paint=()=>root.querySelectorAll<HTMLElement>('[data-timeline-selection-id]').forEach(el=>el.toggleAttribute('data-marquee-selected',selected.has(el.dataset.timelineSelectionId!)));
 new MutationObserver(paint).observe(root,{childList:true,subtree:true});
 root.addEventListener('pointerdown',event=>{
  const target=event.target as Element;if(event.button!==0||target.closest('#ruler,.track-toggle,input,textarea,select,.addclip,.layer-add'))return;
  const item=target.closest<HTMLElement>('[data-timeline-selection-id]');
  if(item&&!event.shiftKey){selected.clear();paint();onChange(new Set(selected));return}
  if(target.closest('button')&&!item)return;
  event.preventDefault();event.stopImmediatePropagation();
  const origin={x:event.clientX,y:event.clientY},base=event.shiftKey?new Set(selected):new Set<string>();let moved=false;
  const box=document.createElement('div');box.className='timeline-marquee';document.body.append(box);
  root.setPointerCapture(event.pointerId);
  const move=(e:PointerEvent)=>{moved ||= Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>3;const left=Math.min(origin.x,e.clientX),top=Math.min(origin.y,e.clientY),right=Math.max(origin.x,e.clientX),bottom=Math.max(origin.y,e.clientY);Object.assign(box.style,{left:left+'px',top:top+'px',width:right-left+'px',height:bottom-top+'px'});selected=new Set(base);if(moved)root.querySelectorAll<HTMLElement>('[data-timeline-selection-id]').forEach(el=>{const r=el.getBoundingClientRect();if(r.width&&r.height&&r.left<right&&r.right>left&&r.top<bottom&&r.bottom>top)selected.add(el.dataset.timelineSelectionId!)});paint()};
  const finish=()=>{if(moved||event.shiftKey)suppressClickUntil=performance.now()+300;root.removeEventListener('pointermove',move);root.removeEventListener('pointerup',finish);root.removeEventListener('pointercancel',cancel);if(root.hasPointerCapture(event.pointerId))root.releasePointerCapture(event.pointerId);box.remove();onChange(new Set(selected))};
  const cancel=()=>{selected=base;paint();finish()};
  root.addEventListener('pointermove',move);root.addEventListener('pointerup',finish);root.addEventListener('pointercancel',cancel);
 },true);
 return ()=>{selected.clear();paint();onChange(new Set())};
}
