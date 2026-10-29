import {heroSource} from './hero-ad.ts';
import {Resvg} from '@resvg/resvg-js';
export async function precisionSources(root:string,body:any){
 if(typeof body?.prompt!=='string'||!body.prompt.trim()||body.prompt.length>2000)throw Object.assign(new Error('Describe the selected-area edit in up to 2,000 characters.'),{status:400});
 if(body.guidance!==undefined&&(typeof body.guidance!=='number'||!Number.isFinite(body.guidance)||body.guidance<1||body.guidance>10))throw Object.assign(new Error('Choose prompt guidance from 1 to 10.'),{status:400});
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

// Editing models receive both the source image and the user's instruction.
// Text-to-image models must not appear here as interchangeable editors.
export const instructionEditModels=[
 {id:'qwen_image_edit_2511_fp8mixed.safetensors',label:'Qwen Image Edit 2511',graph:'precision_qwen_edit'},
 {id:'qwen_image_edit_2511_bf16.safetensors',label:'Qwen Image Edit 2511 - BF16',graph:'precision_qwen_edit'},
];
export function instructionEditReady(nodes:Record<string,any>,graph:Record<string,any>){
 return instructionEditModels.filter(model=>Object.values(graph).every(node=>!!nodes[node.class_type])&&
 nodes.UNETLoader?.input?.required?.unet_name?.[0]?.includes(model.id)&&
 nodes.CLIPLoader?.input?.required?.clip_name?.[0]?.includes(graph['2'].inputs.clip_name)&&
 nodes.VAELoader?.input?.required?.vae_name?.[0]?.includes(graph['3'].inputs.vae_name));
}

export function instructionEditSize(width:number,height:number){
 const scale=Math.sqrt(1024*1024/(width*height));
 return {width:Math.max(8,Math.round(width*scale/8)*8),height:Math.max(8,Math.round(height*scale/8)*8)};
}
