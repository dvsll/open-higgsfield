/** Deterministic brand/campaign typography for multi-shot film end cards (canvas, not LTX). */
export type CampaignFilmCopy={brand:string;headline:string;cta?:string;silent?:boolean};

export function campaignFilmEndCard(copy:CampaignFilmCopy,width=720,height=1280){
 const el=document.createElement('canvas');el.width=width;el.height=height;
 const ctx=el.getContext('2d')!;
 const g=ctx.createLinearGradient(0,0,0,height);
 g.addColorStop(0,'#111311');g.addColorStop(1,'#1a1d18');
 ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 const m=Math.round(width*0.1);
 ctx.fillStyle='#c5d4a8';ctx.fillRect(m,Math.round(height*0.22),Math.round(width*0.14),3);
 const wrap=(text:string,size:number,max:number,weight=500,face='"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif')=>{
  ctx.font=`${weight} ${size}px ${face}`;
  ctx.textBaseline='top';
  const lines:string[]=[];
  for(const word of text.replace(/\s+/g,' ').trim().split(' ')){
   if(!word)continue;
   if(!lines.length){lines.push(word);continue;}
   const i=lines.length-1,trial=lines[i]+' '+word;
   if(ctx.measureText(trial).width<=max)lines[i]=trial;
   else lines.push(word);
  }
  return lines.slice(0,4);
 };
 ctx.fillStyle='#f0ede4';
 const brand=wrap((copy.brand||'Brand').toUpperCase(),Math.round(width*0.038),width-m*2,600,'Inter,system-ui,sans-serif');
 brand.forEach((line,i)=>{ctx.font=`600 ${Math.round(width*0.038)}px Inter,system-ui,sans-serif`;ctx.fillText(line,m,Math.round(height*0.26)+i*Math.round(width*0.055));});
 const headSize=Math.round(width*0.068);
 const head=wrap(copy.headline||'',headSize,width-m*2,500);
 head.forEach((line,i)=>{ctx.font=`500 ${headSize}px "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif`;ctx.fillText(line,m,Math.round(height*0.42)+i*Math.round(headSize*1.2));});
 if(copy.cta){
  ctx.font=`500 ${Math.round(width*0.034)}px Inter,system-ui,sans-serif`;
  ctx.fillStyle='#c5d4a8';
  ctx.fillText(copy.cta.slice(0,48),m,Math.round(height*0.72));
 }
 ctx.font=`400 ${Math.round(width*0.028)}px Inter,system-ui,sans-serif`;
 ctx.fillStyle='rgba(240,237,228,.55)';
 ctx.fillText(copy.silent!==false?'Silent export · no soundtrack':'',m,Math.round(height*0.88));
 return el.toDataURL('image/png');
}
