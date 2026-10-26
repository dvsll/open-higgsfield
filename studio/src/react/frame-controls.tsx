import {NumberInput} from './number-input';
import type { FrameSize, GenerationKind } from '../frame-size';
import {useEffect,useState} from 'react';
import type {ModelChoice} from '../../../shared/runtime/model-catalog';
export function FrameControls({
  kind,
  size,
  onChange,
}: {
  kind: GenerationKind;
  size: FrameSize;
  onChange: () => void;
}) {
  const video = kind === 'video';
  const [preferences,setPreferences]=useState<{label?:string;generation?:ModelChoice['generation'];defaultSize?:FrameSize}>({});
  useEffect(()=>{const update=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail.kind===kind)setPreferences(detail)};addEventListener('osh-model-preferences',update);return()=>removeEventListener('osh-model-preferences',update)},[kind]);
  const sizes = video
    ? [
        [768, 448, 'Local model preset'],
        [768, 432, 'YouTube · 16:9'],
        [512, 288, 'Landscape draft · 16:9'],
        [432, 768, 'Shorts / Reels · 9:16'],
        [512, 640, 'Portrait feed · 4:5'],
        [512, 512, 'Instagram square · 1:1'],
        [1024, 576, 'HD landscape'],
      ]
    : [
        [768, 448, 'Local model preset'],
        [768, 432, 'YouTube / landscape · 16:9'],
        [432, 768, 'Shorts / Reels · 9:16'],
        [512, 640, 'Portrait feed · 4:5'],
        [512, 512, 'Instagram square · 1:1'],
        [1024, 1024, 'Large square'],
      ];
  const preset = sizes.some(([w, h]) => w === size.width && h === size.height)
    ? `${size.width}x${size.height}`
    : 'custom';
  return (
    <>
      <summary>{video ? 'Size & timing' : 'Image properties'}</summary>
      {video && <p id="selectedVideoAttributes" hidden />}
      {preferences.label&&<div className="frame-model-defaults"><span>{preferences.label}</span><button type="button" onClick={()=>{const defaults=preferences.defaultSize;if(defaults){(document.getElementById(kind+'Width') as HTMLInputElement).value=String(defaults.width);(document.getElementById(kind+'Height') as HTMLInputElement).value=String(defaults.height);const select=document.querySelector<HTMLSelectElement>(`[aria-label="${video?'Video':'Image'} frame preset"]`);if(select)select.value=`${defaults.width}x${defaults.height}`;onChange()}if(video&&preferences.generation?.preferredFps){const fps=document.getElementById('videoFPS') as HTMLInputElement;fps.value=String(preferences.generation.preferredFps);fps.dispatchEvent(new Event('input',{bubbles:true}))}}}>Use model defaults</button><small>{preferences.defaultSize?`${preferences.defaultSize.width}×${preferences.defaultSize.height} local preset`:''}{preferences.generation?.preferredFps?` · ${preferences.generation.preferredFps} FPS preferred`:''}</small></div>}
      <div className="frame-controls">
        <select
          aria-label={`${video ? 'Video' : 'Image'} frame preset`}
          defaultValue={preset}
          onChange={(e) => {
            if (e.currentTarget.value === 'custom') return;
            const [w, h] = e.currentTarget.value.split('x');
            (document.getElementById(kind + 'Width') as HTMLInputElement).value = w;
            (document.getElementById(kind + 'Height') as HTMLInputElement).value = h;
            onChange();
          }}
        >
          <option value="custom">Custom</option>
          {sizes.map(([w, h, label]) => (
            <option key={`${w}x${h}`} value={`${w}x${h}`}>
              {label} · {w}×{h}
            </option>
          ))}
        </select>
        {(['width', 'height'] as const).map((axis) => (
          <label key={axis}>
            {axis === 'width' ? 'Width' : 'Height'}
            <NumberInput
              type="number"
              id={kind + (axis === 'width' ? 'Width' : 'Height')}
              min={256}
              max={video ? 1024 : 1536}
              step={1}
              required
              defaultValue={size[axis]}
              aria-label={`${video ? 'Video' : 'Image'} ${axis} in pixels`}
              onInput={(e) => {
                e.currentTarget.closest('.frame-controls')!.querySelector('select')!.value = 'custom';
                onChange();
              }}
            />
          </label>
        ))}
      </div>
      {video && (
        <div
          className="frame-controls video-timing"
          onInput={(e) => {
            if (!['videoFrames', 'videoFPS'].includes((e.target as HTMLElement).id)) return;
            const frames = document.getElementById('videoFrames') as HTMLInputElement,
              fps = document.getElementById('videoFPS') as HTMLInputElement;
            if (frames.checkValidity() && fps.checkValidity())
              dispatchEvent(
                new CustomEvent('osh-video-timing', { detail: { frames: +frames.value, fps: +fps.value } }),
              );
          }}
        >
          <label>
            Frames
            <NumberInput
              id="videoFrames"
              aria-label="Video frames"
              type="number"
              min={9}
              max={121}
              step={8}
              defaultValue={97}
              required
            />
          </label>
          <div className="fps-field">
          <label>
            FPS
            <NumberInput
              id="videoFPS"
              aria-label="Video FPS"
              type="number"
              min={1}
              max={120}
              step="any"
              data-scrub-step="1"
              defaultValue={24}
              required
              aria-describedby={preferences.generation?.preferredFps?'videoFpsRecommendation':undefined}
            />
          </label>
          {preferences.generation?.preferredFps&&<button id="videoFpsRecommendation" className="fps-recommendation" type="button" title={preferences.generation.fpsNote} onClick={()=>{const input=document.getElementById('videoFPS') as HTMLInputElement;input.value=String(preferences.generation!.preferredFps);input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}}>{preferences.generation.preferredFps} FPS · model default</button>}
          </div>
          <output id="videoDuration" />
          <small>LTX: 9, 17, 25…121 frames (8n+1). Local workflow limit: 121.</small>
          <NumberInput id="videoSeed" aria-label="Video seed" hidden type="number" min={0} max={2147483647} step={1} />
        </div>
      )}
      {!video&&preferences.generation&&<div className="generation-preset"><span>Sampling steps</span><output aria-label="Image sampling steps">{preferences.generation.steps}</output><span>Workflow preset</span><p>{preferences.generation.stepNote}</p></div>}
    </>
  );
}
