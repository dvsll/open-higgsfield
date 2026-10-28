export const blockoutBase='ltxv-13b-0.9.7-dev-fp8.safetensors';
export const blockoutAdapter='ltxv-097-ic-lora-depth-control-comfyui.safetensors';
export function blockoutGraph(width=512,height=320,frames=49,fps=24,seed=7,strength=1){
 const graph:Record<string,{class_type:string;inputs:Record<string,unknown>}>= {
  '1':{class_type:'CheckpointLoaderSimple',inputs:{ckpt_name:blockoutBase}},
  '2':{class_type:'CLIPLoader',inputs:{clip_name:'t5xxl_fp8_e4m3fn_scaled.safetensors',type:'ltxv',device:'cpu'}},
  '3':{class_type:'CLIPTextEncode',inputs:{clip:['2',0],text:''}},
  '4':{class_type:'CLIPTextEncode',inputs:{clip:['2',0],text:'blurry, distorted geometry, inconsistent motion, text, watermark'}},
  '7':{class_type:'EmptyLTXVLatentVideo',inputs:{width,height,length:frames,batch_size:1}},
  '8':{class_type:'LTXVAddGuide',inputs:{positive:['3',0],negative:['4',0],vae:['1',2],latent:['7',0],image:['depthBatch'+(frames-1),0],frame_idx:0,strength}},
  '9':{class_type:'LoraLoaderModelOnly',inputs:{model:['1',0],lora_name:blockoutAdapter,strength_model:1}},
  '11':{class_type:'LTXVConditioning',inputs:{positive:['8',0],negative:['8',1],frame_rate:fps}},
  '12':{class_type:'KSamplerSelect',inputs:{sampler_name:'euler'}},
  '13':{class_type:'LTXVScheduler',inputs:{steps:30,max_shift:2.05,base_shift:.95,stretch:true,terminal:.1,latent:['8',2]}},
  '14':{class_type:'SamplerCustom',inputs:{model:['9',0],add_noise:true,noise_seed:seed,cfg:3,positive:['11',0],negative:['11',1],sampler:['12',0],sigmas:['13',0],latent_image:['8',2]}},
  '15':{class_type:'LTXVCropGuides',inputs:{positive:['11',0],negative:['11',1],latent:['14',0]}},
  '16':{class_type:'VAEDecode',inputs:{samples:['15',2],vae:['1',2]}},
  '17':{class_type:'SaveWEBM',inputs:{images:['16',0],filename_prefix:'osh/blockout',codec:'vp9',fps,crf:24}},
 };for(let i=0;i<frames;i++){graph['depth'+i]={class_type:'LoadImage',inputs:{image:''}};if(i)graph['depthBatch'+i]={class_type:'ImageBatch',inputs:{image1:[i===1?'depth0':'depthBatch'+(i-1),0],image2:['depth'+i,0]}}}return graph;
}
export function blockoutReady(nodes:any){return nodes.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0]?.includes(blockoutBase)&&nodes.CLIPLoader?.input?.required?.clip_name?.[0]?.includes('t5xxl_fp8_e4m3fn_scaled.safetensors')&&nodes.LoraLoaderModelOnly?.input?.required?.lora_name?.[0]?.includes(blockoutAdapter)&&Object.values(blockoutGraph()).every(node=>!!nodes[node.class_type])}
