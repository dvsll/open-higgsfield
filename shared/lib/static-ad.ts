import {brandContext,type BrandProfile} from './brand.ts';
import {createHistory,validHistory,type HistoryTree} from './edit-history-tree.ts';
export const staticConcepts=[{id:'spotlight',name:'Product spotlight',description:'A generous product frame, clear headline and quiet brand details.'},{id:'editorial',name:'Editorial split',description:'Bold copy beside a tall product photograph.'},{id:'poster',name:'Brand poster',description:'A strong brand masthead, framed photograph and direct invitation.'}] as const;
export type StaticConcept=typeof staticConcepts[number]['id'];
export const staticSizes={feed:{width:1080,height:1350,label:'Feed · 4:5'},story:{width:1080,height:1920,label:'Story · 9:16'},square:{width:1080,height:1080,label:'Square · 1:1'}};
export type StaticDesign={version:1;id:string;name:string;brandId:string;brandRevision:number;brandReviewed:boolean;productId?:string;photoId:string;photoConfirmed:boolean;logoId?:string;supportId?:string;supportGeneration?:{model:string;prompt:string;seed:number};concept:StaticConcept;size:keyof typeof staticSizes;brandName:string;headline:string;body:string;cta:string;website:string;background:string;accent:string;textColor:string};
export type StaticDraft={design:StaticDesign;history:HistoryTree<StaticDesign>};
export type StaticExport={id:string;assetId:string;url:string;created:number;design:StaticDesign;sha256:string;sources:Record<string,string>};
export type StaticWorkspace={version:1;activeId?:string;drafts:StaticDraft[];exports:StaticExport[]};
export const emptyStaticAds=():StaticWorkspace=>({version:1,drafts:[],exports:[]});
export function luminance(color:string){const a=color.slice(1).match(/../g)!.map(s=>parseInt(s,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;}
export const ink=(background:string)=>luminance(background)>.35?'#100b08':'#fffaf0';
export function contrast(a:string,b:string){const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (values[0]+.05)/(values[1]+.05);}
export function newStaticDesign(brand:BrandProfile,productId?:string,concept:StaticConcept='spotlight'):StaticDraft{
 const context=brandContext(brand,productId?[productId]:[]),product=brand.products.find(p=>p.id===productId),photo=brand.assets.find(a=>product?.imageIds.includes(a.id))||brand.assets.find(a=>a.role==='product')||brand.assets.find(a=>a.role==='reference');
 const background=concept==='spotlight'?(brand.colors.find(c=>luminance(c)>.6)||'#eadcc8'):concept==='editorial'?(brand.colors.find(c=>luminance(c)<.04)||'#100b08'):(brand.colors.find(c=>luminance(c)>.1&&luminance(c)<.4)||'#9a5528');
 const design:StaticDesign={version:1,id:crypto.randomUUID(),name:staticConcepts.find(c=>c.id===concept)!.name,brandId:brand.id,brandRevision:context.revision,brandReviewed:context.reviewed,productId:product?.id,photoId:photo?.assetId||'',photoConfirmed:!product||Boolean(photo&&product.imageIds.includes(photo.id)),logoId:brand.assets.find(a=>a.role==='logo')?.assetId,concept,size:'feed',brandName:brand.dna.name.slice(0,60),headline:product?.name.slice(0,80)||'Explore the collection',body:'',cta:'Discover more',website:brand.website?new URL(brand.website).hostname.replace(/^www\./,''):'',background,accent:brand.colors.find(c=>luminance(c)>.08&&luminance(c)<.5)||'#9a5528',textColor:ink(background)};
 return {design,history:createHistory(design)};
}
export function validateStaticDesign(value:unknown):StaticDesign{const d=value as StaticDesign,fail=()=>{throw Error('Invalid static ad. Your previous concepts and exports were kept.');};if(!d||d.version!==1||typeof d.id!=='string'||!d.id||typeof d.brandId!=='string'||typeof d.photoId!=='string'||typeof d.photoConfirmed!=='boolean'||!staticConcepts.some(c=>c.id===d.concept)||!Object.hasOwn(staticSizes,d.size))return fail();for(const [key,max]of [['name',80],['brandName',60],['headline',80],['body',180],['cta',48],['website',80]] as const)if(typeof d[key]!=='string'||d[key].length>max)return fail();for(const color of [d.background,d.accent,d.textColor])if(!/^#[a-f0-9]{6}$/i.test(color))return fail();for(const key of ['logoId','supportId','productId'] as const)if(d[key]!==undefined&&typeof d[key]!=='string')return fail();return d;}
export function validateStaticWorkspace(value:unknown):StaticWorkspace{const w=value as StaticWorkspace;if(!w||w.version!==1||!Array.isArray(w.drafts)||w.drafts.length>100||!Array.isArray(w.exports)||w.exports.length>300)throw Error('Invalid saved static-ad workspace. Existing projects were not overwritten.');const ids=new Set<string>();for(const draft of w.drafts){validateStaticDesign(draft.design);if(ids.has(draft.design.id)||!validHistory(draft.history))throw Error('Invalid static ad history.');ids.add(draft.design.id);for(const node of draft.history.nodes)validateStaticDesign(node.state);}if(w.activeId&&!ids.has(w.activeId))throw Error('Missing active ad concept.');for(const e of w.exports){if(!e||!/^\/outputs\/[a-f0-9]{16}\.png$/.test(e.url)||typeof e.assetId!=='string'||! /^[a-f0-9]{64}$/.test(e.sha256))throw Error('Invalid static export history.');validateStaticDesign(e.design);}return w;}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const estimate=(s:string,size:number)=>Array.from(s).reduce((n,c)=>n+((c.codePointAt(0)||0)>0x2fff?1.05:/[MW@%]/.test(c)?1:/[mw]/.test(c)?.86:/[ilI.,'!| ]/.test(c)?.3:/[\p{Lu}0-9]/u.test(c)?.79:/[frt]/.test(c)?.4:.6)*size,0);
function wrapped(value:string,width:number,size:number){const lines:string[]=[];let line='';for(const word of value.trim().split(/\s+/)){if(!word)continue;if(estimate(line+(line?' ':'')+word,size)<=width)line+=(line?' ':'')+word;else{if(line)lines.push(line);line='';for(const c of Array.from(word)){if(estimate(line+c,size)>width&&line){lines.push(line);line='';}line+=c;}}}if(line)lines.push(line);return lines;}
export type StaticImages={photo:string;logo?:string;support?:string};
export function staticSVG(d:StaticDesign,images:StaticImages){
 validateStaticDesign(d);const {width:w,height:h}=staticSizes[d.size],parts:string[]=[],textBounds:{text:string;x:number;y:number;width:number;height:number;fontSize:number}[]=[],warnings:string[]=[];
 const rect=(x:number,y:number,width:number,height:number,fill:string,extra='')=>parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`);
 const image=(data:string|undefined,x:number,y:number,width:number,height:number)=>{if(data){if(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data))throw Error('Only embedded local raster images are supported.');parts.push(`<image href="${data}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`);}};
 const text=(value:string,x:number,y:number,width:number,height:number,initial:number,color=d.textColor,weight=400)=>{if(!value.trim())return;let size=initial,lines=wrapped(value,width,size);while((lines.length*size*1.17>height||lines.some(l=>estimate(l,size)>width))&&size>20){size-=2;lines=wrapped(value,width,size);}if(lines.length*size*1.17>height)throw Error('Text is too long for this layout. Shorten it or choose another concept.');if(size<initial*.75)warnings.push('Some text was reduced to fit. Check legibility at phone size.');textBounds.push({text:value,x,y,width,height:lines.length*size*1.17,fontSize:size});parts.push(`<text fill="${color}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}">${lines.map((line,i)=>`<tspan x="${x}" y="${y+size*.85+i*size*1.17}">${escape(line)}</tspan>`).join('')}</text>`);};
 const button=(x:number,y:number,width:number)=>{rect(x,y,width,76,d.accent);text(d.cta,x+24,y+18,width-48,44,34,ink(d.accent),700);};
 rect(0,0,w,h,d.background);if(images.support){image(images.support,0,0,w,h);rect(0,0,w,h,d.background,'opacity="0.9"');}
 let photoBox:{x:number;y:number;width:number;height:number};const m=64,square=h===1080;
 if(d.concept==='spotlight'){
  text(d.brandName,m,54,w-310,58,30,d.textColor,700);image(images.logo,w-220,36,156,148);
  text(d.headline,m,square?166:184,w-2*m,square?130:170,square?56:68,d.textColor,700);
  photoBox={x:m,y:square?316:380,width:w-2*m,height:h-(square?560:640)};rect(photoBox.x,photoBox.y,photoBox.width,photoBox.height,ink(d.background)==='#100b08'?'#fffaf0':'#17110d');image(images.photo,photoBox.x+16,photoBox.y+16,photoBox.width-32,photoBox.height-32);
  text(d.body,m,h-226,w-2*m,58,26);if(d.cta)button(m,h-140,Math.min(570,Math.max(300,estimate(d.cta,34)+64)));
  text(d.website,w-410,h-112,346,48,28);
 }else if(d.concept==='editorial'){
  image(images.logo,m,48,184,176);text(d.brandName,280,92,736,70,30,d.textColor,700);
  const top=272,bottom=h-220;photoBox={x:536,y:top,width:480,height:bottom-top};rect(photoBox.x,photoBox.y,photoBox.width,photoBox.height,'#eadcc8');image(images.photo,photoBox.x+12,photoBox.y+12,photoBox.width-24,photoBox.height-24);
  text(d.headline,m,top+20,420,square?280:390,square?52:64,d.textColor,700);text(d.body,m,top+(square?340:450),420,Math.max(70,bottom-top-(square?340:450)),28);
  rect(m,h-190,w-2*m,2,d.accent);if(d.cta)button(m,h-140,Math.min(620,Math.max(300,estimate(d.cta,34)+64)));text(d.website,w-380,h-108,316,44,28);
 }else{
  image(images.logo,m,48,200,190);text(d.brandName,300,72,716,130,48,d.textColor,700);
  photoBox={x:128,y:280,width:824,height:h-(square?576:664)};rect(photoBox.x-12,photoBox.y-12,photoBox.width+24,photoBox.height+24,'#eadcc8');image(images.photo,photoBox.x,photoBox.y,photoBox.width,photoBox.height);
  text(d.headline,m,h-(square?260:332),w-2*m,square?94:138,square?44:58,d.textColor,700);text(d.body,m,h-184,w-2*m,52,25);
  if(d.cta)text(d.cta,m,h-104,600,60,34,d.textColor,700);text(d.website,w-390,h-94,326,44,28);
 }
 if(contrast(d.background,d.textColor)<4.5)warnings.push('Text/background contrast is below 4.5:1. Adjust colors before publishing.');
 return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`,width:w,height:h,photoBox,textBounds,warnings};
}
