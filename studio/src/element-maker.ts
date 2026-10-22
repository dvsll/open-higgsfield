import { projectKey } from './projects';
import { OSH } from '../../shared/runtime/client';
import type { Element, PoolItem } from './shell';
import './elements.css';

export function elementLibrary(root:HTMLElement,elements:Element[],select:(e:Element)=>void,pool:()=>PoolItem[]):void {
  const save=()=>{localStorage.setItem(projectKey('osh-elements'),JSON.stringify(elements));dispatchEvent(new Event('osh-elements-changed'));draw()};
  const draw=()=>{
    root.replaceChildren();
    for(const element of elements){const card=document.createElement('div');card.className='element-tile';
      const use=document.createElement('button');use.className='el';use.dataset.id=element.id;use.title=`Use @${element.n}`;
      if(element.refs?.[0]){const image=document.createElement('img');image.src=element.refs[0];image.alt='';use.append(image)}else{const icon=document.createElement('span');icon.className='av';icon.textContent=element.ic;use.append(icon)}
      const name=document.createElement('span');name.textContent=element.n;use.append(name);use.onclick=()=>select(element);
      const edit=document.createElement('button');edit.className='element-edit';edit.textContent='✎';edit.title=`Edit ${element.n}`;edit.onclick=()=>maker(element);card.append(use,edit);root.append(card);
    }
    const add=document.createElement('button');add.className='element-add';add.textContent='＋ Create';add.onclick=()=>maker();root.append(add);
  };
  const maker=(existing?:Element)=>{
    const dialog=document.createElement('dialog');dialog.className='element-maker';dialog.setAttribute('aria-label',existing?'Edit element':'Create element');
    dialog.innerHTML='<form><header><h2></h2><button type="button" data-close aria-label="Close element maker">✕</button></header><div class="element-layout"><section><label>Reference images</label><div class="element-drop" tabindex="0" role="button" aria-label="Upload reference images">Drop images here or click to upload<small>PNG, JPEG, WebP · up to 4 references</small></div><input data-files type="file" accept="image/png,image/jpeg,image/webp" multiple hidden><div class="element-refs"></div><details><summary>Use a generated image</summary><div class="element-pool"></div></details></section><section><label>Element name<input data-name required maxlength="48" placeholder="e.g. Copper Robot"></label><label>Type<select data-kind><option value="cast">Character</option><option value="object">Object</option><option value="place">Place</option></select></label><label>Description<textarea data-description required rows="5" maxlength="500" placeholder="Describe appearance, colors and details to preserve…"></textarea></label><p>Use <b data-handle>@name</b> in a prompt. Current models use this description; reference images are saved for future image conditioning.</p></section></div><footer><span role="status" data-status></span><button type="button" data-cancel>Cancel</button><button type="submit" data-save>Save element</button></footer></form>';
    const q=<T extends HTMLElement>(s:string)=>dialog.querySelector<T>(s)!;
    q('h2').textContent=existing?'Edit element':'Create element';
    const name=q<HTMLInputElement>('[data-name]'),kind=q<HTMLSelectElement>('[data-kind]'),description=q<HTMLTextAreaElement>('[data-description]'),status=q('[data-status]'),submit=q<HTMLButtonElement>('[data-save]');
    let refs=[...(existing?.refs||[])],pending=0;
    name.value=existing?.n||'';kind.value=existing?.kind||'cast';description.value=existing?.d||'';
    const handle=()=>q('[data-handle]').textContent='@'+(name.value||'name');name.oninput=handle;handle();
    const redraw=()=>{const target=q('.element-refs');target.replaceChildren();refs.forEach((url,i)=>{const tile=document.createElement('div');const image=document.createElement('img');image.src=url;image.alt=`Reference ${i+1}`;const remove=document.createElement('button');remove.type='button';remove.textContent='✕';remove.setAttribute('aria-label',`Remove reference ${i+1}`);remove.onclick=()=>{refs.splice(i,1);redraw()};tile.append(image,remove);target.append(tile)})};redraw();
    const upload=async(files:FileList|File[])=>{pending++;submit.disabled=true;try{for(const file of Array.from(files)){if(refs.length>=4)break;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Choose PNG/JPEG/WebP files under 10 MB.');status.textContent=`Uploading ${file.name}…`;const bitmap=await createImageBitmap(file);const scale=Math.min(1,1024/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const result=await OSH.upload(canvas.toDataURL('image/png'));if(refs.length<4)refs.push(result.url);redraw()}status.textContent='References saved locally.'}catch(e){status.textContent=(e as Error).message}finally{pending--;submit.disabled=pending>0}};
    const files=q<HTMLInputElement>('[data-files]'),drop=q('.element-drop');drop.onclick=()=>files.click();drop.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();files.click()}};files.onchange=()=>{if(files.files)void upload(files.files)};
    drop.ondragover=e=>{e.preventDefault();drop.classList.add('over')};drop.ondragleave=()=>drop.classList.remove('over');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');if(e.dataTransfer?.files)void upload(e.dataTransfer.files)};
    for(const item of pool().slice(0,24)){const button=document.createElement('button');button.type='button';button.title=item.label;const image=document.createElement('img');image.src=item.url;image.alt=item.label;button.append(image);button.onclick=()=>{if(refs.length<4&&!refs.includes(item.url)){refs.push(item.url);redraw()}};q('.element-pool').append(button)}
    const close=()=>dialog.close();q('[data-close]').onclick=close;q('[data-cancel]').onclick=close;dialog.onclose=()=>dialog.remove();
    q<HTMLFormElement>('form').onsubmit=e=>{e.preventDefault();if(pending)return;const n=name.value.trim(),d=description.value.trim();if(!n||!d){status.textContent='Add a name and description.';return}if(elements.some(el=>el.id!==existing?.id&&el.n.toLowerCase()===n.toLowerCase())){status.textContent='Choose a unique element name.';return}if(!/^[\p{L}\p{N} '_-]+$/u.test(n)){status.textContent='Use letters, numbers, spaces, apostrophes, dashes or underscores.';return}
      const draft:Element={id:existing?.id||crypto.randomUUID(),n,d,kind:kind.value as Element['kind'],ic:kind.value==='cast'?'👤':kind.value==='place'?'🏙':'◈',refs,user:true};
      try{const next=elements.map(el=>el.id===draft.id?draft:el);if(!existing)next.push(draft);localStorage.setItem(projectKey('osh-elements'),JSON.stringify(next));elements.splice(0,elements.length,...next);save();close()}catch{status.textContent='Could not save the element. Browser storage may be full.'}
    };
    document.body.append(dialog);dialog.showModal();name.focus();
  };
  draw();
}
