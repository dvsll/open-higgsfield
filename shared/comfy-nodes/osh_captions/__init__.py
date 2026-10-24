"""Local speech transcription. MIT; uses MIT Whisper Tiny via faster-whisper."""
import importlib.util
import json
import os
import uuid
import folder_paths

MODEL = os.path.join(folder_paths.models_dir, 'whisper', 'faster-whisper-tiny')


class OSHWhisperCaptions:
    @classmethod
    def INPUT_TYPES(cls):
        ready = importlib.util.find_spec('faster_whisper') and all(
            os.path.isfile(os.path.join(MODEL, name)) for name in ['model.bin', 'config.json', 'tokenizer.json']
        )
        return {'required': {'audio': ('AUDIO',), 'model': (['Whisper Tiny · CPU'] if ready else [],)}}

    RETURN_TYPES = ()
    FUNCTION = 'transcribe'
    OUTPUT_NODE = True
    CATEGORY = 'Studio/Captions'

    def transcribe(self, audio, model):
        from faster_whisper import WhisperModel
        import torchaudio.functional
        import numpy as np
        wave = audio['waveform'][0].detach().cpu().float().mean(dim=0)
        rate = int(audio['sample_rate'])
        if rate != 16000:
            wave = torchaudio.functional.resample(wave, rate, 16000)
        samples = wave.numpy().astype(np.float32)
        duration = len(samples) / 16000
        if duration <= 0 or duration > 600:
            raise ValueError('Select audio between 0 and 600 seconds.')
        segments = []
        language = None
        if np.max(np.abs(samples)) > 0.001:
            # CPU int8 deliberately avoids contention with video generation VRAM.
            engine = WhisperModel(MODEL, device='cpu', compute_type='int8', cpu_threads=4, local_files_only=True)
            stream, info = engine.transcribe(samples, beam_size=5, temperature=0, vad_filter=False,
                                              condition_on_previous_text=False, no_speech_threshold=0.6)
            language = info.language
            for segment in stream:
                text = segment.text.strip()
                start, end = max(0, float(segment.start)), min(duration, float(segment.end))
                if text and end > start and segment.no_speech_prob < 0.6:
                    segments.append({'start': start, 'end': end, 'text': text})
            del engine
        payload = {'model': 'Whisper Tiny · CPU', 'language': language, 'duration': duration, 'segments': segments}
        folder = os.path.join(folder_paths.get_output_directory(), 'osh_captions')
        os.makedirs(folder, exist_ok=True)
        filename = uuid.uuid4().hex + '.json'
        with open(os.path.join(folder, filename), 'x', encoding='utf-8') as output:
            json.dump(payload, output, ensure_ascii=False)
        return {'ui': {'text': [{'filename': filename, 'subfolder': 'osh_captions', 'type': 'output'}]}}


NODE_CLASS_MAPPINGS = {'OSHWhisperCaptions': OSHWhisperCaptions}
NODE_DISPLAY_NAME_MAPPINGS = {'OSHWhisperCaptions': 'Studio · Whisper captions (CPU)'}
