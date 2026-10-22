import './number-controls.css';
let mounted=false;
export function mountNumberControls():void{
 if(mounted)return;mounted=true;
 document.addEventListener('pointerdown',event=>{
  const input=event.target as HTMLInputElement;if(input.tagName!=='INPUT'||input.type!=='number'||input.disabled||input.readOnly||event.button!==0)return;
  const x=event.clientX,initial=+input.value,step=+(input.step==='any'?'0.01':input.step||1);let moved=false;
  const move=(e:PointerEvent)=>{if(!moved&&Math.abs(e.clientX-x)<5)return;if(!moved){moved=true;input.blur();document.body.classList.add('number-scrubbing')}const delta=Math.round((e.clientX-x)/4)*(e.shiftKey?10:1)*step,min=input.min===''?-Infinity:+input.min,max=input.max===''?Infinity:+input.max;input.value=String(+Math.max(min,Math.min(max,initial+delta)).toFixed(4));input.dispatchEvent(new Event('input',{bubbles:true}));e.preventDefault()};
  const end=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',end);document.removeEventListener('pointercancel',end);document.body.classList.remove('number-scrubbing');if(moved)input.dispatchEvent(new Event('change',{bubbles:true}))};
  document.addEventListener('pointermove',move);document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
 });
 const label=()=>document.querySelectorAll<HTMLInputElement>('input[type=number]').forEach(input=>{if(input.readOnly){input.title='Calculated value';return}if(!input.title)input.title='Drag left or right to adjust · click to type · Shift for larger steps'});label();new MutationObserver(label).observe(document.body,{childList:true,subtree:true});
}
