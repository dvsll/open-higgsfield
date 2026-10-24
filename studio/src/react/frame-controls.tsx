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
  const [preferences,setPreferences]=useState<{label?:string;generation?:ModelChoice['generation']}>({});
  useEffect(()=>{const update=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail.kind===kind)setPreferences(detail)};addEventListener('osh-model-preferences',update);return()=>removeEventListener('osh-model-preferences',update)},[kind]);
  const sizes = video
    ? [
        [768, 448, 'Default'],
        [512, 288, 'Landscape 16:9'],
        [288, 512, 'Portrait 9:16'],
        [384, 384, 'Square'],
        [1024, 576, 'HD landscape'],
      ]
    : [
        [768, 448, 'Default'],
        [768, 432, 'Landscape 16:9'],
        [432, 768, 'Portrait 9:16'],
        [512, 512, 'Square'],
        [1024, 1024, 'Large square'],
      ];
  const preset = sizes.some(([w, h]) => w === size.width && h === size.height)
    ? `${size.width}x${size.height}`
    : 'custom';
  return (
    <>
      <summary>{video ? 'Size & timing' : 'Image properties'}</summary>
      {video && (
        <>
          <p id="selectedVideoAttributes" className="selected-video-attributes">
            Select a clip to see its video size.
          </p>
          <p className="attributes-caption">Next render</p>
        </>
      )}
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
            {axis === 'width' ? 'W' : 'H'}
            <input
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
            <input
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
            <input
              id="videoFPS"
              aria-label="Video FPS"
              type="number"
              min={1}
              max={120}
              step="0.01"
              defaultValue={24}
              required
              aria-describedby={preferences.generation?.preferredFps?'videoFpsRecommendation':undefined}
            />
          </label>
          {preferences.generation?.preferredFps&&<button id="videoFpsRecommendation" className="fps-recommendation" type="button" title={preferences.generation.fpsNote} onClick={()=>{const input=document.getElementById('videoFPS') as HTMLInputElement;input.value=String(preferences.generation!.preferredFps);input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}}>{preferences.generation.preferredFps} FPS · model default</button>}
          </div>
          <output id="videoDuration" />
          <small>LTX: 9, 17, 25…121 frames (8n+1). Local workflow limit: 121.</small>
          <label>
            Seed
            <input id="videoSeed" aria-label="Video seed" type="number" min={0} max={2147483647} step={1} />
          </label>
        </div>
      )}
      {preferences.generation&&<div className="generation-preset"><span>Sampling steps</span><output aria-label={`${video?'Video':'Image'} sampling steps`}>{preferences.generation.steps}</output><span>Workflow preset</span><p>{preferences.generation.stepNote}</p></div>}
    </>
  );
}
