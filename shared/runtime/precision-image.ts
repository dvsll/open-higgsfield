import {heroSource} from './hero-ad.ts';
import {Resvg} from '@resvg/resvg-js';
export async function precisionSources(root:string,body:any){
 if(typeof body?.prompt!=='string'||!body.prompt.trim()||body.prompt.length>2000)throw Object.assign(new Error('Describe the selected-area edit in up to 2,000 characters.'),{status:400});
 if(body.strength!==undefined&&(typeof body.strength!=='number'||!Number.isFinite(body.strength)||body.strength<0.05||body.strength>1))throw Object.assign(new Error('Choose a change strength from 5% to 100%.'),{status:400});
 const image=await heroSource(root,body.image),mask=await heroSource(root,body.mask);
 if(image.width*image.height>768*768||mask.width!==image.width||mask.height!==image.height)throw Object.assign(new Error('Use matching image/mask dimensions, up to 768×768 total pixels.'),{status:400});
 const pixels=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${mask.width}" height="${mask.height}"><image href="${mask.data}" width="${mask.width}" height="${mask.height}"/></svg>`).render().pixels;
 if(!pixels.some((value,index)=>index%4===1&&value>0))throw Object.assign(new Error('Select an area before generating an edit.'),{status:400});
 return {image,mask};
}

export async function segmentationSource(root:string,body:any){
 const image=await heroSource(root,body?.image);
 if(image.width>768||image.height>768)throw Object.assign(new Error('Use an editing image up to 768px per side.'),{status:400});
 const point=body?.point;
 if(point!==undefined&&(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||point.x<0||point.y<0||point.x>=image.width||point.y>=image.height))throw Object.assign(new Error('Choose a point inside the image.'),{status:400});
 if(body?.list!==undefined&&typeof body.list!=='boolean')throw Object.assign(new Error('Invalid segment list request.'),{status:400});
 if(!body?.list&&point===undefined&&(typeof body?.prompt!=='string'||!body.prompt.trim()||body.prompt.length>120))throw Object.assign(new Error('Name the object to select (up to120 characters).'),{status:400});
 return {image,point:point?{x:Math.floor(point.x),y:Math.floor(point.y)}:null,prompt:body?.list?'object:16':point?'':body.prompt.trim(),list:body?.list===true};
}

export function maskedEditGraph(base:Record<string,any>,maskGraph:Record<string,any>,loraFile?:string,strength=0.35){
 const graph=structuredClone(base);
 for(const id of ['7','11','12','13','14'])graph[id]=structuredClone(maskGraph[id]);graph['10'].inputs.images=['14',0];
 graph['7']={class_type:'VAEEncode',inputs:{pixels:['11',0],vae:['3',0]}};
 graph['15']={class_type:'SetLatentNoiseMask',inputs:{samples:['7',0],mask:['13',0]}};
 graph['8'].inputs.latent_image=['15',0];graph['8'].inputs.denoise=strength;
 if(loraFile){graph['90']={class_type:'LoraLoaderModelOnly',inputs:{model:['1',0],lora_name:loraFile,strength_model:1}};graph['4'].inputs.model=['90',0]}
 return graph;
}
