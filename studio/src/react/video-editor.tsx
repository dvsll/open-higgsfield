import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { OSH } from '../../../shared/runtime/client';
import { SC } from '../scene';
import { SHELL, type Media } from '../shell';
import {captureViewerFrame} from '../frame-keyframe';
export type VideoHandoff = Media & { video: string; from?: string };
type Take = { video: string; audio?: string; prompt: string; edited: boolean };
export function VideoEditor({
  hand,
  right,
  actions,
  onFrame,
  versionsHost,
}: {
  hand: VideoHandoff;
  right: HTMLElement;
  actions: HTMLElement;
  onFrame?:(image:string)=>void|Promise<void>;
  versionsHost?:HTMLElement;
}) {
  const [take, setTake] = useState<Take>({
      video: hand.video,
      audio: hand.audio,
      prompt: hand.audioPrompt || '',
      edited: false,
    }),
    [history, setHistory] = useState<Take[]>([]),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [comparing, setComparing] = useState(false),
    [loaded, setLoaded] = useState(false),
    [audioPrompt, setAudioPrompt] = useState(hand.audioPrompt || '');
  const [meta, setMeta] = useState({ duration: hand.duration || 0, width: 0, height: 0 }),
    [start, setStart] = useState('0'),
    [end, setEnd] = useState(''),
    [width, setWidth] = useState(''),
    [height, setHeight] = useState(''),
    [speed, setSpeed] = useState('1'),
    [reverse, setReverse] = useState(false),
    [preset, setPreset] = useState('original');
  const video = useRef<HTMLVideoElement>(null),
    url = comparing ? hand.video : take.video;
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled)
        SHELL.select({
          ...hand,
          video: take.video,
          audio: take.audio,
          audioPrompt: take.prompt,
          duration: meta.duration,
          label: 'Video · ' + hand.label,
        });
    });
    return () => {
      cancelled = true;
    };
  }, [take, meta.duration, hand]);
  useEffect(() => {
    video.current?.load();
  }, [take.video, history.length]);
  const loadedMetadata = () => {
    const v = video.current!;
    setLoaded(true);
    if (!comparing) {
      setMeta({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
      setStart('0');
      setEnd(v.duration.toFixed(3));
      setWidth(String(v.videoWidth));
      setHeight(String(v.videoHeight));
      setSpeed('1');
      setReverse(false);
      setPreset('original');
    }
  };
  const loadTake = (next: Take) => {
    setHistory((previous) => [...previous, take]);
    setComparing(false);
    setLoaded(false);
    setTake(next);
  };
  const render = async () => {
    if (busy || !loaded) {
      setStatus('Wait for the video to load.');
      return;
    }
    const begin = +start,
      finish = +end,
      w = +width,
      h = +height;
    if (
      ![begin, finish, w, h].every(Number.isFinite) ||
      begin < 0 ||
      begin >= finish ||
      finish > meta.duration + 0.01 ||
      w < 16 ||
      h < 16 ||
      w > 4096 ||
      h > 4096 ||
      !Number.isInteger(w) ||
      !Number.isInteger(h)
    ) {
      setStatus('Choose a valid trim range and size.');
      return;
    }
    if (w * h > 4096 * 2160) {
      setStatus('Size exceeds the 4096×2160 pixel limit.');
      return;
    }
    setBusy(true);
    setStatus('Rendering edits locally…');
    try {
      const result = await OSH.editVideo({
        video: take.video,
        keepAudio: hand.audioLinked !== false,
        start: begin,
        end: finish,
        width: w,
        height: h,
        speed: +speed,
        reverse,
      });
      loadTake({
        ...take,
        video: result.url,
        audio: take.audio && hand.audioLinked !== false ? result.url : take.audio,
      });
      setStatus(`Edited video ready · ${result.seconds.toFixed(1)}s processing. Original kept.`);
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const audio = async () => {
    if (busy || !loaded) return;
    const prompt = audioPrompt.trim();
    if (!prompt) {
      setStatus('Describe the new sound first.');
      return;
    }
    if (meta.duration > 47) {
      setStatus('Audio supports clips up to 47 seconds.');
      return;
    }
    setBusy(true);
    setStatus('Generating a new soundtrack…');
    try {
      const result = await OSH.audio(
        prompt,
        meta.duration,
        Math.floor(Math.random() * 1e9),
        hand.audioLinked === false ? undefined : take.video,
      );
      loadTake({ video: result.video || take.video, audio: result.audio, prompt, edited: true });
      setStatus('New soundtrack ready. Apply to keep it.');
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const undo = () => {
    const previous = history.at(-1);
    if (!previous || busy) return;
    setHistory(history.slice(0, -1));
    setTake(previous);
    setAudioPrompt(previous.prompt);
    setComparing(false);
    setLoaded(false);
    setStatus('Restored the previous version.');
  };
  const apply = () => {
    if (busy || !loaded || !Number.isFinite(meta.duration)) return;
    SC.set('osh-video-edit-return', {
      ref: hand.ref,
      original: hand.video,
      video: take.video,
      duration: meta.duration,
      hasAudio: !!take.audio,
      audio: take.audio,
      audioPrompt: take.prompt,
      audioEdited: take.edited,
    });
    location.href = '/studio/director';
  };
  const choosePreset = (value: string) => {
    setPreset(value);
    let size = [meta.width, meta.height];
    if (value === '2' || value === '4') size = [meta.width * +value, meta.height * +value];
    else if (value === 'landscape') size = [768, 432];
    else if (value === 'portrait') size = [432, 768];
    else if (value === 'square') size = [768, 768];
    else if (value === 'custom') return;
    setWidth(String(size[0]));
    setHeight(String(size[1]));
  };
  return (
    <>
      {versionsHost&&createPortal(<><p className="precision-status">Video versions from this editing session</p>{[...history,take].map((version,index)=><button className="precision-version" key={index} disabled={busy} aria-pressed={version===take} onClick={()=>loadTake(version)}>{index===0?"Original":"Edit "+index}</button>)}</>,versionsHost)}
      <div className="video-edit-toolbar">
        {onFrame&&<button disabled={busy||!loaded} onClick={async()=>{setBusy(true);try{video.current?.pause();await onFrame(captureViewerFrame(video.current!))}catch(error){setStatus((error as Error).message)}finally{setBusy(false)}}}>Precision edit current frame</button>}
        <button data-original disabled={busy || !loaded} onClick={() => setComparing(!comparing)}>
          {comparing ? 'Show edited video' : 'Compare original'}
        </button>
        <button data-undo disabled={busy || !history.length} onClick={undo}>
          Undo last edit
        </button>
        <span data-meta>
          {meta.width}×{meta.height} · {meta.duration.toFixed(2)} s
        </span>
      </div>
      <video
        ref={video}
        src={url}
        className="video-edit-preview"
        controls
        playsInline
        onLoadedMetadata={loadedMetadata}
        onError={() => {
          setLoaded(false);
          setStatus('Video unavailable. Return to Director to choose another take.');
        }}
      />
      <p data-status role="status">
        {status}
      </p>
      <a data-download href={take.video} download>
        Download video
      </a>
      {createPortal(
        <>
          <details className="video-properties audio-properties" open={hand.editTarget === 'audio'}>
            <summary>Audio</summary>
            <label htmlFor="editAudioPrompt">Audio prompt</label>
            <textarea
              id="editAudioPrompt"
              rows={4}
              placeholder="Describe the new sound…"
              value={audioPrompt}
              onChange={(e) => setAudioPrompt(e.target.value)}
            />
            <button
              className="pill solid"
              data-audio-render
              disabled={busy || !loaded}
              onClick={() => void audio()}
            >
              Regenerate audio
            </button>
            <small>Replaces the soundtrack. Your previous version stays available with Undo.</small>
          </details>
          <details className="video-properties" open>
            <summary>Video properties</summary>
            <label>
              Trim start (seconds)
              <input
                data-start
                type="number"
                min={0}
                max={meta.duration}
                step="any"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              Trim end (seconds)
              <input
                data-end
                type="number"
                min={0}
                max={meta.duration}
                step="any"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
            <label>
              Speed
              <select data-speed value={speed} onChange={(e) => setSpeed(e.target.value)}>
                {['.25', '.5', '1', '2', '4'].map((value) => (
                  <option key={value} value={value}>
                    {+value}×
                  </option>
                ))}
              </select>
            </label>
            <label>
              <input
                data-reverse
                type="checkbox"
                checked={reverse}
                onChange={(e) => setReverse(e.target.checked)}
              />{' '}
              Reverse video
            </label>
          </details>
          <details className="video-properties" open>
            <summary>Resize / upscale</summary>
            <label>
              Preset
              <select data-preset value={preset} onChange={(e) => choosePreset(e.target.value)}>
                {[
                  ['original', 'Original size'],
                  ['2', 'Upscale 2× · Lanczos'],
                  ['4', 'Upscale 4× · Lanczos'],
                  ['landscape', 'Landscape · 768×432'],
                  ['portrait', 'Portrait · 432×768'],
                  ['square', 'Square · 768×768'],
                  ['custom', 'Custom'],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Width
              <input
                data-width
                type="number"
                min={16}
                max={4096}
                step={1}
                value={width}
                onChange={(e) => {
                  setWidth(e.target.value);
                  setPreset('custom');
                }}
              />
            </label>
            <label>
              Height
              <input
                data-height
                type="number"
                min={16}
                max={4096}
                step={1}
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  setPreset('custom');
                }}
              />
            </label>
            <small>
              Lanczos resizing. This does not synthesize new detail. Maximum 4096×2160 total pixels; audio is
              kept when present.
            </small>
          </details>
          <button className="pill solid" data-render disabled={busy || !loaded} onClick={() => void render()}>
            Render edits
          </button>
        </>,
        right,
      )}
      {hand.from === 'director' &&
        createPortal(
          <button className="pill solid" data-apply disabled={busy || !loaded} onClick={apply}>
            Apply to shot →
          </button>,
          actions,
        )}
    </>
  );
}
