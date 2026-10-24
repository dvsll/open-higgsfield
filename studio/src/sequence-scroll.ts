/** The dock body owns both scroll axes, regardless of the hovered timeline child. */
export function mountSequenceScroll():void {
 document.addEventListener('wheel',event=>{
  if(event.ctrlKey)return; // Preserve browser/trackpad zoom.
  const panel=(event.target as Element)?.closest('.studio-window[data-window="timeline"]');
  const body=panel?.querySelector<HTMLElement>(':scope > .window-body');
  if(!body)return;
  const unit=event.deltaMode===1?20:1;
  const x=(event.shiftKey&&!event.deltaX?event.deltaY:event.deltaX)*(event.deltaMode===2?body.clientWidth:unit);
  const y=(event.shiftKey?0:event.deltaY)*(event.deltaMode===2?body.clientHeight:unit);
  // Capture before native number-input wheel handling changes a value.
  event.preventDefault();
  body.scrollBy({left:x,top:y,behavior:'instant'});
 },{passive:false,capture:true});
}
