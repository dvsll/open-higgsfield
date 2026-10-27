import type {StaticDesign,StaticImages} from './static-ad.ts';
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const raster=(s:string)=>{if(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s))throw Error('Use embedded local images.');return s;};
/** A full photographic campaign surface, never the source photograph in a panel.
 * All lettering remains deterministic. No source/product pixels are composited
 * here: the reference-conditioned scene is the hero, with explicit fidelity review.
 */
export function campaignSVG(d:StaticDesign,images:StaticImages,w:number,h:number){
 const food=d.campaign!.archetype==='food-editorial',bold=d.campaign!.archetype==='graphic-energy',m=72,parts:string[]=[],textBounds:{text:string;x:number;y:number;width:number;height:number;fontSize:number}[]=[];
 const text=(value:string,x:number,y:number,width:number,maxHeight:number,initial:number,family:string,weight=400,spacing=0)=>{
  if(!value.trim())return;let size=initial,lines:string[]=[];
  for(;size>=18;size-=2){lines=[];let line='';const measure=(s:string)=>Array.from(s).reduce((n,c)=>n+(/[MW@]/.test(c)?.95:/[ilI.,' ]/.test(c)?.28:.57)*size,0);for(const word of value.trim().split(/\s+/)){if(measure(word)>width)throw Error('Shorten an unbroken word for this campaign layout.');if(line&&measure(line+' '+word)>width){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);if(lines.length*size*1.05<=maxHeight)break;}
  if(size<18)throw Error('Shorten the campaign copy.');textBounds.push({text:value,x,y,width,height:lines.length*size*1.05,fontSize:size});parts.push(`<text fill="${d.textColor}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}">${lines.map((l,i)=>`<tspan x="${x}" y="${y+size*.83+i*size*1.05}">${esc(l)}</tspan>`).join('')}</text>`);
 };
 // Restrained lettering veils — photography stays primary; avoid heavy poster gradients.
 parts.push(`<defs><linearGradient id="campaign-top" x2="0" y2="1"><stop offset="0" stop-color="#100d0a" stop-opacity=".42"/><stop offset=".18" stop-color="#100d0a" stop-opacity=".18"/><stop offset=".38" stop-color="#100d0a" stop-opacity="0"/></linearGradient><linearGradient id="campaign-foot" x2="0" y2="1"><stop offset=".78" stop-color="#100d0a" stop-opacity="0"/><stop offset="1" stop-color="#100d0a" stop-opacity=".35"/></linearGradient></defs><rect width="${w}" height="${h}" fill="${d.background}"/>`);
 // Fit the entire 4:5 scene across all formats; never stretch or crop product edges.
 const scale=Math.min(w/768,h/960),pw=768*scale,ph=960*scale,px=(w-pw)/2,py=h-ph;
 parts.push(`<image href="${raster(images.photo)}" x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid meet"/><rect width="${w}" height="${h}" fill="url(#campaign-top)"/><rect width="${w}" height="${h}" fill="url(#campaign-foot)"/>`);
 const family=bold?'Inter, Arial, sans-serif':'Georgia, Times New Roman, serif';
 text(d.brandName.toUpperCase(),m,48,w-2*m-(images.logo?140:0),40,20,'Arial, sans-serif',600,1.5);
 if(images.logo)parts.push(`<image href="${raster(images.logo)}" x="${w-m-100}" y="40" width="100" height="78" preserveAspectRatio="xMidYMid meet"/>`);
 const headlineTop=h===1920?150:118; text(d.headline,m,headlineTop,w-2*m, h===1080?160:210,bold?72:food?68:70,family,bold?700:400,bold?-1.2:-0.8);
 text(d.body,m,h-172,w-2*m,70,28,'Arial, sans-serif');
 text(d.cta,m,h-74,w*.6,42,24,'Arial, sans-serif',600,.5);
 text(d.website,w*.62,h-74,w*.38-m,42,18,'Arial, sans-serif');
 return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`,width:w,height:h,photoBox:{x:px,y:py,width:pw,height:ph},textBounds,warnings:['AI restages the reference product. Inspect count, geometry, texture and labels against the original before publishing.',...(h!==1350?['The complete 4:5 scene is fitted without stretching or cropping; this format has additional surrounding space.']:[])]};
}
