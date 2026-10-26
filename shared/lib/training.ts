export const trainingBase='z_image_turbo_bf16.safetensors';
export type TrainingInput={projectId:string;name:string;model:string;images:{url:string;caption:string}[];steps:number;rank:number;learningRate:number;size:number;seed:number};
export type TrainingRun=TrainingInput&{id:string;createdAt:number;status:'running'|'complete'|'error';error?:string;loraFile?:string;download?:string;loss?:{step:number;loss:number}[]};
export function trainingInput(value:unknown):TrainingInput{
 const b=value as TrainingInput;
 if(!b||typeof b.projectId!=='string'||!b.projectId||b.projectId.length>128||typeof b.name!=='string'||!b.name.trim()||b.name.length>64||b.model!==trainingBase)throw Error('Choose a name, project and compatible image base.');
 if(!Array.isArray(b.images)||!b.images.length||b.images.length>24)throw Error('Choose between 1 and 24 training images.');
 const seen=new Set<string>();const images=b.images.map(image=>{if(!image||typeof image.url!=='string'||!/^\/outputs\/[a-f0-9]{16}\.png$/.test(image.url)||seen.has(image.url)||typeof image.caption!=='string'||!image.caption.trim()||image.caption.length>1000)throw Error('Each unique project image needs a caption under 1000 characters.');seen.add(image.url);return {url:image.url,caption:image.caption.trim()}});
 for(const [key,min,max]of [['steps',1,500],['rank',1,16],['size',256,768],['seed',0,2147483647]] as const)if(!Number.isInteger(b[key])||b[key]<min||b[key]>max)throw Error('Invalid '+key+'.');
 if(b.size%16||!Number.isFinite(b.learningRate)||b.learningRate<.000001||b.learningRate>.001)throw Error('Choose a supported training size and learning rate.');
 return {projectId:b.projectId,name:b.name.trim(),model:b.model,images,steps:b.steps,rank:b.rank,size:b.size,seed:b.seed,learningRate:b.learningRate};
}
export function trainingGraph(input:TrainingInput,id:string){
 if(!/^[a-f0-9]{32}$/.test(id))throw Error('Invalid training ID.');
 const graph:Record<string,{class_type:string;inputs:Record<string,unknown>}>={
  '1':{class_type:'UNETLoader',inputs:{unet_name:input.model,weight_dtype:'fp8_e4m3fn'}},
  '2':{class_type:'CLIPLoader',inputs:{clip_name:'qwen_3_4b_fp8_mixed.safetensors',type:'lumina2',device:'cpu'}},
  '3':{class_type:'VAELoader',inputs:{vae_name:'ae.safetensors'}},
  '4':{class_type:'ModelSamplingAuraFlow',inputs:{model:['1',0],shift:3}},
  '5':{class_type:'OSHTrainingPairs',inputs:{images:[],captions:JSON.stringify(input.images.map(image=>image.caption))}},
  '6':{class_type:'MakeTrainingDataset',inputs:{images:['5',0],texts:['5',1],clip:['2',0],vae:['3',0]}},
  '7':{class_type:'TrainLoraNode',inputs:{model:['4',0],latents:['6',0],positive:['6',1],steps:input.steps,rank:input.rank,learning_rate:input.learningRate,seed:input.seed,batch_size:1,grad_accumulation_steps:1,optimizer:'AdamW',loss_function:'MSE',training_dtype:'none',lora_dtype:'bf16',quantized_backward:false,algorithm:'LoRA',gradient_checkpointing:true,checkpoint_depth:2,offloading:false,existing_lora:'[None]',bucket_mode:false,bypass_mode:true}},
  '8':{class_type:'OSHSaveTraining',inputs:{lora:['7',0],loss:['7',1],steps:['7',2],run_id:id,name:input.name,base:input.model}},
 };
 let previous:unknown;
 input.images.forEach((image,index)=>{const load=String(100+index*3),scale=String(101+index*3),batch=String(102+index*3);graph[load]={class_type:'LoadImage',inputs:{image:image.url}};graph[scale]={class_type:'ImageScale',inputs:{image:[load,0],upscale_method:'area',width:input.size,height:input.size,crop:'center'}};if(index){graph[batch]={class_type:'ImageBatch',inputs:{image1:previous,image2:[scale,0]}};previous=[batch,0]}else previous=[scale,0]});
 graph['5'].inputs.images=previous;return graph;
}
