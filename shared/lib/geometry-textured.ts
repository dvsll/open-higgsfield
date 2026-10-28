export const texturedGeometryBase='trellis_2_int8_convrot.safetensors';
export function texturedGeometryGraph(seed=7,steps=20,texture=true){
 const sample=(model:string,stage:string,cfg:number,salt=0)=>({class_type:'KSampler',inputs:{model:[model,0],positive:[stage,0],negative:[stage,1],latent_image:[stage,2],seed:seed+salt,steps,cfg,sampler_name:'euler',scheduler:'normal',denoise:1}});
 const graph:Record<string,{class_type:string;inputs:Record<string,unknown>}>= {
 '1':{class_type:'UNETLoader',inputs:{unet_name:texturedGeometryBase,weight_dtype:'default'}},
 '2':{class_type:'LoadImage',inputs:{image:''}},
 '3':{class_type:'CLIPVisionLoader',inputs:{clip_name:'dino_v3_L_naf_fp32.safetensors'}},
 '4':{class_type:'Trellis2Conditioning',inputs:{clip_vision_model:['3',0],image:['crop',0]}},
 'background':{class_type:'LoadBackgroundRemovalModel',inputs:{bg_removal_name:'birefnet.safetensors'}},
 'mask':{class_type:'RemoveBackground',inputs:{bg_removal_model:['background',0],image:['2',0]}},
 'crop':{class_type:'ImageCropToMask',inputs:{images:['2',0],masks:['mask',0],width:1024,height:1024,pad_factor:1,grow_mask:0,background:'#000000'}},
 '5':{class_type:'VAELoader',inputs:{vae_name:'trellis_2_shape_vae_bf16.safetensors'}},
 '6':{class_type:'VAELoader',inputs:{vae_name:'trellis_2_texture_vae_bf16.safetensors'}},
 '7':{class_type:'EmptyTrellis2LatentStructure',inputs:{batch_size:1}},
 '10':{class_type:'CFGOverride',inputs:{model:['1',0],cfg:1,start_percent:.667,end_percent:1}},
 '11':{class_type:'RescaleCFG',inputs:{model:['10',0],multiplier:.7}},
 '12':{class_type:'ModelSamplingSD3',inputs:{model:['11',0],shift:5}},
 '13':{class_type:'KSampler',inputs:{model:['12',0],positive:['4',0],negative:['4',1],latent_image:['7',0],seed,steps:12,cfg:7.5,sampler_name:'euler',scheduler:'normal',denoise:1}},
 '14':{class_type:'VaeDecodeStructureTrellis2',inputs:{samples:['13',0],vae:['5',0],resolution:'32'}},
 '15':{class_type:'Trellis2ShapeStage',inputs:{positive:['4',0],negative:['4',1],voxel:['14',0]}},
 '16':{class_type:'CFGOverride',inputs:{model:['1',0],cfg:1,start_percent:.769,end_percent:1}},
 '17':{class_type:'RescaleCFG',inputs:{model:['16',0],multiplier:.5}},
 '18':sample('17','15',7.5),
 '19':{class_type:'VaeDecodeShapeTrellis',inputs:{samples:['18',0],vae:['5',0]}},
 '20':{class_type:'Trellis2TextureStage',inputs:{positive:['15',0],negative:['15',1],shape_latent:['18',0]}},
 '21':sample('1','20',1,1),
 '22':{class_type:'VaeDecodeTextureTrellis',inputs:{samples:['21',0],vae:['6',0],shape_subdivides:['19',1]}},
 '23':{class_type:'DecimateMesh',inputs:{mesh:['19',0],target_face_count:40000,placement_mode:'midpoint'}},
 '24':{class_type:'UnwrapMesh',inputs:{mesh:['23',0],segmenter:'pec',resolution:2048,padding:4,weld_distance:.0002}},
 '25':{class_type:'BakeTextureFromVoxel',inputs:{mesh:['24',0],voxel_colors:['22',0],texture_size:2048,reference_mesh:['19',0]}},
 '26':{class_type:'ApplyTextureToMesh',inputs:{mesh:['24',0],base_color:['25',0],metallic:['25',1],roughness:['25',2]}},
 '9':{class_type:'OSHSaveGeometry',inputs:{mesh:['26',0],filename_prefix:'osh/textured'}},
 };if(!texture){for(const id of ['6','20','21','22','24','25','26'])delete graph[id];graph['9'].inputs.mesh=['23',0]}return graph;
}
export function texturedGeometryReady(nodes:any){
 const required=[['UNETLoader','unet_name',texturedGeometryBase],['CLIPVisionLoader','clip_name','dino_v3_L_naf_fp32.safetensors'],['VAELoader','vae_name','trellis_2_shape_vae_bf16.safetensors'],['VAELoader','vae_name','trellis_2_texture_vae_bf16.safetensors'],['LoadBackgroundRemovalModel','bg_removal_name','birefnet.safetensors']];
 return required.every(([node,input,file])=>{const value=nodes[node]?.input?.required?.[input];return (Array.isArray(value?.[0])?value[0]:value?.[1]?.options)?.includes(file)})&&Object.values(texturedGeometryGraph()).every(node=>!!nodes[node.class_type]);
}
