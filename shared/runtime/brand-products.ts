// Evidence-backed DOM/metadata relationships only; no network, vision or AI.
import {createHash} from 'node:crypto';
import {parseFragment} from 'parse5';
import type {BrandProduct,ProductDiscovery} from '../lib/brand.ts';
export type WebNode={nodeName:string;tagName?:string;value?:string;attrs?:{name:string;value:string}[];childNodes?:WebNode[]};
type Product=Omit<BrandProduct,'id'|'imageIds'> & {discovery:ProductDiscovery};
const attr=(n:WebNode,k:string)=>n.attrs?.find(a=>a.name===k)?.value||'';
function nodes(root:WebNode){const found:WebNode[]=[],stack=[root];while(stack.length){const n=stack.pop()!;found.push(n);for(const c of n.childNodes||[])stack.push(c);}return found;}
export function discoverProducts(all:WebNode[],structured:any[],text:(n:WebNode)=>string,resolve:(s:string)=>string,url:string){
 const products:Product[]=[],links:string[]=[];
 const clean=(v:unknown,max=3000)=>typeof v==='string'?text(parseFragment(v) as unknown as WebNode).slice(0,max):'';
 const imageURL=(n:WebNode)=>{
  const set=attr(n,'data-srcset')||attr(n,'srcset'),options=set.split(',').map(s=>s.trim().split(/\s+/)).filter(s=>resolve(s[0]||''));
  options.sort((a,b)=>(parseInt(b[1])||0)-(parseInt(a[1])||0));
  return resolve(attr(n,'data-src')||options.find(s=>(parseInt(s[1])||0)<=2400)?.[0]||attr(n,'src')||attr(n,'content')||attr(n,'href'));
 };
 function add(name:string,description:string,productUrl:string,images:string[],method:ProductDiscovery['method']){
  name=name.replace(/\s+/g,' ').trim().slice(0,200);if(!name||products.length>=40)return;
  productUrl=resolve(productUrl)||url;const key=createHash('sha256').update(productUrl+'\n'+name).digest('hex').slice(0,16);
  images=[...new Set(images.map(resolve).filter(Boolean))].slice(0,3);
  if(method!=='json-ld'&&products.some(p=>p.sourceUrl===productUrl&&p.discovery.method==='json-ld'&&p.discovery.imageUrls.length))return; // one stronger record, not another SKU from an OG title or image alt

  const existing=products.find(p=>p.discovery.key===key);if(existing){if(!existing.discovery.imageUrls.length){existing.discovery.imageUrls=images;existing.discovery.method=method;}return;}
  products.push({name,description:clean(description),sellingPoints:'',sourceUrl:productUrl,discovery:{key,sourceId:'',method,imageUrls:images}});if(new URL(productUrl).origin===new URL(url).origin)links.push(productUrl);
 }
 const types=(x:any)=>Array.isArray(x?.['@type'])?x['@type']:[x?.['@type']];
 for(const x of structured)if(types(x).includes('Product')&&typeof x.name==='string'){
  const refs:any[]=Array.isArray(x.image)?x.image:[x.image],images=refs.map(i=>typeof i==='string'?i:typeof i?.url==='string'?i.url:typeof i?.contentUrl==='string'?i.contentUrl:'');
  add(x.name,typeof x.description==='string'?x.description:'',typeof x.url==='string'?x.url:url,images,'json-ld');
 }
 // schema.org Product microdata binds names/images inside that exact scope.
 for(const scope of all.filter(n=>/\bhttps?:\/\/schema\.org\/Product\b/i.test(attr(n,'itemtype')))){
  const stack=[scope],inside:WebNode[]=[];while(stack.length){const n=stack.pop()!;if(n!==scope&&n.attrs?.some(a=>a.name==='itemscope'))continue;inside.push(n);stack.push(...(n.childNodes||[]));}
  const prop=(s:string)=>inside.filter(n=>attr(n,'itemprop').split(/\s+/).includes(s));
  const name=prop('name')[0],desc=prop('description')[0],link=prop('url')[0];
  if(name)add(attr(name,'content')||text(name),desc?(attr(desc,'content')||text(desc)):'',link?(attr(link,'href')||attr(link,'content')):url,prop('image').map(imageURL),'microdata');
 }
 const meta=(s:string)=>attr(all.find(n=>n.tagName==='meta'&&(attr(n,'property')===s||attr(n,'name')===s))||{} as WebNode,'content');
 if(/(^|:)product$/i.test(meta('og:type'))){const name=meta('og:title')||text(all.find(n=>n.tagName==='h1')||{} as WebNode);add(name,meta('og:description')||meta('description'),url,[meta('og:image')],'product-metadata');}
 // Shopify/WooCommerce-style product links: image and one explicit title must
 // be inside the SAME product permalink. A page banner is never a fallback.
 for(const anchor of all.filter(n=>{if(n.tagName!=='a')return false;const link=resolve(attr(n,'href'));if(!link)return false;const u=new URL(link);return u.origin===new URL(url).origin&&/\/products?\/[^/]+\/?$/i.test(u.pathname)&&!/(?:^|\/)(?:cdn|images|assets|files|media)\//i.test(u.pathname)&&! /\.(?:png|jpe?g|webp|svg|gif|pdf|zip)$/i.test(u.pathname);})){
  const inside=nodes(anchor),imgs=inside.filter(n=>n.tagName==='img'),titles=inside.filter(n=>['h2','h3','h4'].includes(n.tagName||'')||/product[-_ ]?(title|name)/i.test(attr(n,'class')));
  const names=[...new Set(titles.map(text).filter(Boolean))];if(!imgs.length||names.length>1)continue;
  const label=[names[0],attr(anchor,'title'),attr(imgs[0],'alt'),attr(anchor,'aria-label'),text(anchor)].find(s=>s&&!/[$??%]|^(view|shop|buy|learn more|details)$/i.test(s))||'';
  if(!label||label.length>200)continue;add(label,'',attr(anchor,'href'),imgs.map(imageURL),'product-link');
 }
 return {products,links};
}
