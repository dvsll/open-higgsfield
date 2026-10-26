import {useEffect,useState,type FormEvent} from 'react';
import type {AdApplication} from '../ad-application.ts';
import {productImageChoices,type BrandProfile,type BrandProduct} from '../../../shared/lib/brand.ts';
import type {WebsiteSource} from '../../../shared/lib/source-provenance.ts';
export function WebsiteOnboarding({app,brand,projectId,address,disabled}:{app:AdApplication;brand?:BrandProfile;projectId:string;address:string;disabled:boolean}){
 const [limit,setLimit]=useState(6);useEffect(()=>setLimit(6),[brand?.id]);
 const act=(work:()=>Promise<unknown>)=>void work().catch(e=>app.store.report(e));
 function submit(e:FormEvent){e.preventDefault();act(()=>app.discoverWebsite(address));}
 return <section className="website-onboarding" aria-label="Discover your business from its website">
  <form onSubmit={submit}><label>Business website<input type="text" inputMode="url" autoCapitalize="off" value={address} maxLength={2048} disabled={disabled} placeholder="https://your-business.com" onChange={e=>act(()=>app.editWebsite(e.target.value))}/></label><button className="primary" type="submit" disabled={disabled||!address.trim()}>Discover brand & products <span>↗</span></button></form>
  <p className="quiet-note">Public website only. Existing work opens separately when you research another business. Or enter your brand and upload a photograph below.</p>
  {brand?.research&&<>
   <div className="section-label"><h2>{brand.dna.name||'Discovered website'}</h2><span>{brand.products.length} products</span></div>
   <p className="quiet-note">{brand.research.aiCompleted?'AI hypotheses are labeled in Brand profile.':'Website evidence collected · no AI brand analysis claimed.'}</p>
   <div className="website-products" aria-label="Discovered products">{brand.products.slice(0,limit).map(product=><WebsiteProduct key={brand.id+product.id} app={app} brand={brand} product={product} disabled={disabled} projectId={projectId}/>)}</div>
   {brand.products.length>limit&&<button className="text-button" disabled={disabled} onClick={()=>setLimit(n=>n+6)}>Show more products</button>}
   <details className="inspection"><summary>Website evidence & limitations</summary><p>Descriptions and positioning are website statements. Tone and visual style remain unknown unless explicitly supplied. CSS colors are candidates, not confirmed brand preferences. Text planning does not see your photograph.</p>{brand.research.warnings.map((w,i)=><p key={i}>{w}</p>)}{brand.research.sources.map(s=><p key={s.id}><a href={s.url} target="_blank" rel="noreferrer noopener">{s.title||s.url} ↗</a></p>)}{brand.research.images.filter(i=>i.role==='logo').map(i=><p key={i.url}><a href={i.url} target="_blank" rel="noreferrer noopener">Website logo reference · review rights before use ↗</a></p>)}</details>
  </>}
 </section>;
}
function WebsiteProduct({app,brand,product,disabled,projectId}:{app:AdApplication;brand:BrandProfile;product:BrandProduct;disabled:boolean;projectId:string}){
 const choices=productImageChoices(brand,product.id),[selected,setSelected]=useState(''),url=choices.includes(selected)?selected:choices[0],key=JSON.stringify([projectId,brand.id,brand.research?.created,product.id,url]);
 const [preview,setPreview]=useState({key:'',image:'',error:''});
 useEffect(()=>{let stale=false;if(url)void app.websiteImage(product.id,url).then(r=>{if(!stale)setPreview({key,image:r.image,error:''});}).catch(e=>{if(!stale)setPreview({key,image:'',error:e.message});});return()=>{stale=true;};},[app,key,url,product.id]);
 return <article className="website-product"><div className="website-thumb">{preview.key===key&&preview.image?<img src={preview.image} alt={'Website photograph for '+product.name} onError={()=>setPreview({key,image:'',error:'The website photograph could not be decoded. No image imported.'})}/>:<span>{url?(preview.key===key&&preview.error?'Photo unavailable':'Checking source photograph...'):'No linked photograph'}</span>}</div><h3>{product.name}</h3><p>{product.description.slice(0,160)||'No description supplied.'}</p><small>{product.discovery?product.discovery.method+' · explicit page relationship':'No verified image relationship'}</small>{choices.length>1&&<label>Photograph<select disabled={disabled} value={url} onChange={e=>setSelected(e.target.value)}>{choices.map((src,i)=><option key={src} value={src}>Photo {i+1}</option>)}</select></label>}
  {preview.key===key&&preview.error&&<small className="error-text">{preview.error} Upload the correct photograph below.</small>}
  <button type="button" disabled={disabled||!url||preview.key!==key||!preview.image} onClick={()=>void app.importWebsiteProduct(product.id,url).catch(e=>app.store.report(e))}>Use this product</button>
  {product.sourceUrl&&<a className="text-button" href={product.sourceUrl} target="_blank" rel="noreferrer noopener">Product source ↗</a>}
 </article>;
}
export function WebsiteSourceConsent({app,sourceId,revision,disabled,changed}:{app:AdApplication;sourceId:string;revision:number;disabled:boolean;changed:()=>void}){
 const [state,setState]=useState<{key:string;value?:WebsiteSource}>({key:''}),key=sourceId+':'+revision;
 useEffect(()=>{let stale=false;void app.store.asset(sourceId).then(asset=>{if(!stale)setState({key,value:asset?.provenance});}).catch(e=>app.store.report(e));return()=>{stale=true;};},[app,key,sourceId]);
 const p=state.key===key?state.value:undefined;if(!p)return null;
 const confirm=(accuracy:boolean,permission:boolean)=>void app.confirmWebsiteSource(accuracy,permission).then(changed).catch(e=>app.store.report(e));
 return <WebsiteSourcePermission value={p} disabled={disabled} confirm={confirm}/>;
}
export function WebsiteSourcePermission({value:p,disabled,confirm}:{value:WebsiteSource;disabled:boolean;confirm:(accuracy:boolean,permission:boolean)=>void}){
 return <section className="fact-confirm" aria-label="Website photograph permission"><p>Website-sourced input · original bytes retained. Public access does not grant commercial-use rights.</p><a href={p.pageUrl} target="_blank" rel="noreferrer noopener">Review source page ↗</a><label className="check-label"><input type="checkbox" checked={p.accuracyConfirmed} disabled={disabled} onChange={e=>confirm(e.target.checked,p.permissionConfirmed)}/>I checked the photograph: it shows the selected product. I will correct any visible facts below.</label><label className="check-label"><input type="checkbox" checked={p.permissionConfirmed} disabled={disabled} onChange={e=>confirm(p.accuracyConfirmed,e.target.checked)}/>I have permission to use this photograph in an advertisement.</label><small>Neither checkbox confirms unseen ingredients, image quality, or all photo observations. Review the final direction separately.</small></section>;
}
