import './prompt-input.css';
import {useState,type ReactNode,type ButtonHTMLAttributes} from 'react';
import {GeometryReferences} from './geometry-references';
import {SC} from '../scene';
import {OSH} from '../../../shared/runtime/client';
export function PromptInput({children,references}:{children:ReactNode;references:ReactNode}){return <div className="shared-prompt-input">{children}{references}</div>}
export function PromptReferences({media}:{media:'Video'|'Image'|'Audio'}){const [image,setImage]=useState<string>(()=>media==='Image'?SC.get('osh-image-reference')||'':'');const attach=(file:{url:string;kind:string})=>{if(media==='Image'){SC.set('osh-image-reference',file.url);setImage(file.url);dispatchEvent(new Event('osh-image-reference-attached'))}else dispatchEvent(new CustomEvent('osh-attach-prompt-reference',{detail:file}))};return <GeometryReferences image={image} busy={false} media={media} unavailable={media!=='Audio'?'':`The current ${media.toLowerCase()} model supports text prompts only. Reference conditioning is not available.`} onRemove={()=>{setImage('');SC.set('osh-image-reference','')}} onAttach={attach} onUpload={async file=>{try{const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');const scale=Math.min(1,1024/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const result=await OSH.upload(canvas.toDataURL('image/png'));attach({url:result.url,kind:'image'})}catch(error){dispatchEvent(new CustomEvent('osh-toast',{detail:(error as Error).message}))}}}/>}


export function GenerateButton({className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>){return <button {...props} className={'shared-generate-button '+className}/>}
