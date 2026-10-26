import importlib.util, json, sys, tempfile, types
from pathlib import Path
import torch
from safetensors.torch import load_file
with tempfile.TemporaryDirectory(prefix='osh-training-test-') as temporary:
 root=Path(temporary);output=root/'output';model=root/'models';(model/'loras').mkdir(parents=True)
 sys.modules['folder_paths']=types.SimpleNamespace(models_dir=str(model),get_output_directory=lambda:str(output),get_folder_paths=lambda name:[str(model/'loras')])
 spec=importlib.util.spec_from_file_location('training_fixture',Path('shared/comfy-nodes/osh_training/__init__.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 images=torch.zeros((2,16,16,3));paired=module.OSHTrainingPairs().pairs(images,json.dumps(['a robot','a garden']));assert len(paired[0])==2 and paired[0][1].shape==(1,16,16,3) and paired[1][1]=='a garden'
 try:module.OSHTrainingPairs().pairs(images,'["one caption"]');raise AssertionError('mismatch accepted')
 except ValueError:pass
 run='a'*32;weights={'fixture.lora_up.weight':torch.ones((2,2))};result=module.OSHSaveTraining().save(weights,{'loss':[.4,.2]},2,run,'Fixture','z_image_turbo_bf16.safetensors');assert len(result['ui']['text'])==2
 metadata=json.loads((output/'osh_training'/(run+'.json')).read_text());assert metadata['steps']==2 and metadata['loss'][-1]['loss']==.2
 assert torch.equal(load_file(str(model/'loras'/'studio'/(run+'.safetensors')))['fixture.lora_up.weight'],weights['fixture.lora_up.weight'])
 try:module.OSHSaveTraining().save(weights,{},2,run,'Fixture','z_image_turbo_bf16.safetensors');raise AssertionError('overwritten')
 except ValueError:pass
 print('PASS: real CPU tensors, caption pairing, safetensors/manifest outputs, model-folder copy and overwrite refusal; no GPU training.')
