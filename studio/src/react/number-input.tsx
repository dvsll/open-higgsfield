import {forwardRef,useImperativeHandle,useRef,type InputHTMLAttributes} from 'react';
import {scrubbedNumber} from '../number-scrub';
import '../number-controls.css';
export const NumberInput=forwardRef<HTMLInputElement,InputHTMLAttributes<HTMLInputElement>>(function NumberInput(props,forwarded){
 const ref=useRef<HTMLInputElement>(null);
 useImperativeHandle(forwarded,()=>ref.current!);
 const label=String(props['aria-label']||props.id||'value');
 const step=(direction:1|-1)=>{
  const input=ref.current!;if(input.disabled||input.readOnly)return;
  if(input.step==='any')Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,String(scrubbedNumber(Number(input.value)||0,4*direction,0,1,input.min===''?-Infinity:+input.min,input.max===''?Infinity:+input.max)));
  else {const old=input.value;input.stepUp(direction);const next=input.value;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,old);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,next)}
  input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
 };
 return <span className={'number-control'+(/seed/i.test(label)?' number-control-wide':'')} hidden={props.hidden}>
  <input {...props} type="number" ref={ref}/>
  {!props.readOnly&&<span className="number-step-buttons"><button type="button" disabled={props.disabled} aria-label={'Increase '+label} title={'Increase '+label} onPointerDown={e=>e.stopPropagation()} onClick={()=>step(1)}><svg viewBox="0 0 10 8" aria-hidden="true"><path d="m2 6 3-3 3 3"/></svg></button><button type="button" disabled={props.disabled} aria-label={'Decrease '+label} title={'Decrease '+label} onPointerDown={e=>e.stopPropagation()} onClick={()=>step(-1)}><svg viewBox="0 0 10 8" aria-hidden="true"><path d="m2 2 3 3 3-3"/></svg></button></span>}
 </span>;
});
