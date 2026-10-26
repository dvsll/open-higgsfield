"""Studio's bounded dataset and result nodes around ComfyUI native training."""
import json
import os
import re
import shutil
import folder_paths


class OSHTrainingPairs:
    @classmethod
    def INPUT_TYPES(cls):
        return {'required': {'images': ('IMAGE',), 'captions': ('STRING',)}}
    RETURN_TYPES = ('IMAGE', 'STRING')
    OUTPUT_IS_LIST = (True, True)
    FUNCTION = 'pairs'
    CATEGORY = 'Studio/Training'

    def pairs(self, images, captions):
        texts = json.loads(captions)
        if not 1 <= len(texts) <= 24 or len(texts) != images.shape[0] or any(not isinstance(text, str) or not text.strip() or len(text) > 1000 for text in texts):
            raise ValueError('Each training image needs its own caption.')
        return ([images[i:i + 1] for i in range(len(texts))], texts)


class OSHSaveTraining:
    @classmethod
    def INPUT_TYPES(cls):
        return {'required': {'lora': ('LORA_MODEL',), 'loss': ('LOSS_MAP',), 'steps': ('INT',), 'run_id': ('STRING',), 'name': ('STRING',), 'base': ('STRING',)}}
    RETURN_TYPES = ()
    OUTPUT_NODE = True
    FUNCTION = 'save'
    CATEGORY = 'Studio/Training'

    def save(self, lora, loss, steps, run_id, name, base):
        if not re.fullmatch('[a-f0-9]{32}', run_id) or base != 'z_image_turbo_bf16.safetensors' or not lora:
            raise ValueError('Invalid training result or incompatible base.')
        import safetensors.torch
        output = os.path.join(folder_paths.get_output_directory(), 'osh_training')
        os.makedirs(output, exist_ok=True)
        weight_name = run_id + '.safetensors'
        weight_path = os.path.join(output, weight_name)
        if os.path.exists(weight_path):
            raise ValueError('This training result already exists.')
        safetensors.torch.save_file(lora, weight_path, metadata={'studio_run': run_id, 'base_model': base, 'name': name})
        folders = folder_paths.get_folder_paths('loras')
        adapter_folder = os.path.join(folders[0] if folders else os.path.join(folder_paths.models_dir, 'loras'), 'studio')
        os.makedirs(adapter_folder, exist_ok=True)
        shutil.copyfile(weight_path, os.path.join(adapter_folder, weight_name))
        points = []
        history = list(enumerate(loss.get('loss', []))) if isinstance(loss.get('loss'), list) else list(loss.items())
        for step, value in history[-500:]:
            try:
                number = float(value)
                if number == number and abs(number) < 1e20:
                    points.append({'step': int(step), 'loss': number})
            except (TypeError, ValueError):
                pass
        metadata = {'id': run_id, 'base': base, 'steps': int(steps), 'loraFile': 'studio/' + weight_name, 'loss': points}
        filename = run_id + '.json'
        with open(os.path.join(output, filename), 'x', encoding='utf-8') as handle:
            json.dump(metadata, handle)
        return {'ui': {'text': [{'filename': filename, 'subfolder': 'osh_training', 'type': 'output'}, {'filename': weight_name, 'subfolder': 'osh_training', 'type': 'output'}]}}


NODE_CLASS_MAPPINGS = {'OSHTrainingPairs': OSHTrainingPairs, 'OSHSaveTraining': OSHSaveTraining}
NODE_DISPLAY_NAME_MAPPINGS = {'OSHTrainingPairs': 'Studio · training image/caption pairs', 'OSHSaveTraining': 'Studio · save LoRA and training result'}
