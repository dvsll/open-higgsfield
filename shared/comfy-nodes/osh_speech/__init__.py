"""Local open-weight Kokoro speech; setup is explicit and inference never downloads."""
import importlib.util
import pathlib
import folder_paths
import torch

_CACHE = None
VOICES = ['af_heart', 'af_bella', 'am_adam', 'am_michael', 'bf_emma', 'bm_george']
def paths():
    roots = [pathlib.Path(folder_paths.models_dir)] + [pathlib.Path(path).parent for path in folder_paths.get_folder_paths('checkpoints')]
    for base in roots:
        root = base / 'kokoro'
        pair = root / 'kokoro-v1.0.int8.onnx', root / 'voices-v1.0.bin'
        if all(path.is_file() for path in pair):
            return pair
    return roots[0] / 'kokoro/kokoro-v1.0.int8.onnx', roots[0] / 'kokoro/voices-v1.0.bin'
class OSHKokoroSpeech:
    @classmethod
    def INPUT_TYPES(cls):
        ready = all(p.is_file() for p in paths()) and importlib.util.find_spec('kokoro_onnx') is not None
        return {'required': {'text': ('STRING', {'multiline': True}), 'model': (['Kokoro 82M'] if ready else [],), 'voice': (VOICES,), 'speed': ('FLOAT', {'default': 1.0, 'min': 0.5, 'max': 2.0})}}
    RETURN_TYPES = ('AUDIO',)
    FUNCTION = 'speak'
    CATEGORY = 'Studio/Audio'
    def speak(self, text, model, voice, speed):
        global _CACHE
        if model != 'Kokoro 82M' or voice not in VOICES or not 0.5 <= speed <= 2.0 or not isinstance(text, str) or not text.strip() or len(text) > 6000:
            raise ValueError('Enter up to 6000 characters and choose an installed voice.')
        import numpy as np
        from kokoro_onnx import Kokoro
        import onnxruntime as ort
        model_path, voices_path = paths()
        if not model_path.is_file() or not voices_path.is_file():
            raise ValueError('Install local speech files and restart ComfyUI.')
        if _CACHE is None:
            options = ort.SessionOptions()
            options.intra_op_num_threads = 4
            session = ort.InferenceSession(str(model_path), sess_options=options, providers=['CPUExecutionProvider'])
            _CACHE = Kokoro.from_session(session, str(voices_path))
        language = 'en-gb' if voice.startswith('b') else 'en-us'
        audio, rate = _CACHE.create(text.strip(), voice=voice, speed=float(speed), lang=language)
        if len(audio) > rate * 600:
            raise ValueError('Speech exceeds ten minutes. Split the text into smaller sections.')
        waveform = torch.from_numpy(np.asarray(audio, dtype=np.float32).copy()).reshape(1, 1, -1)
        return ({'waveform': waveform, 'sample_rate': int(rate)},)
NODE_CLASS_MAPPINGS = {'OSHKokoroSpeech': OSHKokoroSpeech}
NODE_DISPLAY_NAME_MAPPINGS = {'OSHKokoroSpeech': 'Studio · Text to speech (Kokoro)'}
