import { useEffect, useRef, useState } from 'react';
export type AudioShot = {
  d: number;
  audio?: string;
  audioMuted?: boolean;
  audioLinked?: boolean;
  audioStart?: number;
  audioDuration?: number;
};
export function AudioLane({
  shots,
  pixels,
  select,
  selected = -1,
  origin = 0,
  waveform,
}: {
  shots: AudioShot[];
  pixels: number;
  select: (index: number) => void;
  selected?: number;
  origin?: number;
  waveform: (url: string) => Promise<number[]>;
}) {
  let time = origin;
  return (
    <>
      {shots.map((shot, index) => {
        const linked = shot.audioLinked !== false,
          duration = linked ? shot.d : shot.audioDuration || shot.d,
          position = linked ? time : (shot.audioStart ?? time);
        time += shot.d;
        return (
          <AudioClip
            key={index}
            shot={shot}
            index={index}
            left={Math.max(0, (position - origin) * pixels)}
            width={Math.max(1, duration * pixels - 3)}
            selected={index === selected}
            select={() => select(index)}
            waveform={waveform}
          />
        );
      })}
    </>
  );
}
function AudioClip({
  shot,
  index,
  left,
  width,
  selected,
  select,
  waveform,
}: {
  shot: AudioShot;
  index: number;
  left: number;
  width: number;
  selected: boolean;
  select: () => void;
  waveform: (url: string) => Promise<number[]>;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    [unavailable, setUnavailable] = useState(false),
    linked = shot.audioLinked !== false;
  useEffect(() => {
    let cancelled = false;
    setUnavailable(false);
    if (shot.audio)
      waveform(shot.audio)
        .then((peaks) => {
          if (cancelled) return;
          const canvas = ref.current!,
            g = canvas.getContext('2d')!;
          g.clearRect(0, 0, canvas.width, canvas.height);
          g.fillStyle = '#7ebbb0';
          for (let x = 0; x < canvas.width; x += 3) {
            const height = Math.max(
              1,
              peaks[Math.min(peaks.length - 1, Math.floor((x / canvas.width) * peaks.length))] * 40,
            );
            g.fillRect(x, 23 - height / 2, 2, height);
          }
        })
        .catch(() => {
          if (!cancelled) setUnavailable(true);
        });
    return () => {
      cancelled = true;
    };
  }, [shot.audio, width, waveform]);
  return (
    <button
      className={
        'audio-clip' +
        (shot.audio ? ' ready' : '') +
        (shot.audioMuted ? ' muted' : '') +
        (selected ? ' on' : '')
      }
      style={{ position: 'absolute', left, width }}
      aria-label={
        shot.audio
          ? `Audio for scene ${index + 1} · ${linked ? 'linked' : 'unlinked'}${shot.audioMuted ? ' · muted' : ''}`
          : `Scene ${index + 1}: add an audio prompt`
      }
      onClick={select}
    >
      <canvas ref={ref} width={Math.max(1, Math.floor(width))} height={46} />
      <span title={!shot.audio && width < 78 ? 'Add sound' : undefined}>
        {unavailable ? (
          'Audio unavailable'
        ) : shot.audio ? (
          shot.audioMuted ? (
            'Muted'
          ) : linked ? (
            'Audio · linked'
          ) : (
            'Audio · unlinked'
          )
        ) : (
          <>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {width >= 78 && 'Add sound'}
          </>
        )}
      </span>
    </button>
  );
}
