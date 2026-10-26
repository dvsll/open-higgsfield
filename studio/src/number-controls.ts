import {scrubbedNumber} from './number-scrub';
import './number-controls.css';
let mounted=false;
export function mountNumberControls():void{
 if(mounted)return;mounted=true;
 document.addEventListener('pointerdown',event=>{
  const input=event.target as HTMLInputElement;if(input.tagName!=='INPUT'||input.type!=='number'||input.disabled||input.readOnly||event.button!==0)return;
  const rect=input.getBoundingClientRect();if(event.clientX>=rect.right-18)return;
  const x=event.clientX,y=event.clientY,initial=+input.value,step=+(input.dataset.scrubStep||(input.step==='any'?'0.01':input.step||1));let moved=false;
  const move=(e:PointerEvent)=>{if(!moved&&Math.hypot(e.clientX-x,e.clientY-y)<5)return;if(!moved){moved=true;input.blur();document.body.classList.add('number-scrubbing')}document.body.classList.toggle('number-scrubbing-vertical',Math.abs(e.clientY-y)>Math.abs(e.clientX-x));const min=input.min===''?-Infinity:+input.min,max=input.max===''?Infinity:+input.max;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,String(scrubbedNumber(initial,e.clientX-x,e.clientY-y,step,min,max,e.shiftKey)));input.dispatchEvent(new Event('input',{bubbles:true}));e.preventDefault()};
  const end=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',end);document.removeEventListener('pointercancel',end);document.body.classList.remove('number-scrubbing','number-scrubbing-vertical');if(moved)input.dispatchEvent(new Event('change',{bubbles:true}))};
  document.addEventListener('pointermove',move);document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
 });
 const label=()=>document.querySelectorAll<HTMLInputElement>('input[type=number]').forEach(input=>{if(input.readOnly){input.title='Calculated value';return}if(!input.title)input.title='Drag right/up to increase, left/down to decrease · click to type · arrows for precise steps · Shift for larger steps'});label();new MutationObserver(label).observe(document.body,{childList:true,subtree:true});
}
