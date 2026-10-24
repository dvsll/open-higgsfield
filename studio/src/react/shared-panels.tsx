import { useEffect, useRef } from 'react';
import type { Media } from '../shell';
type AppEntry = [string, string, string, ('shot' | 'keyframe' | 'frame')[]];
export function SharedSurface({
  app,
  apps,
  elementHint,
}: {
  app: string;
  apps: AppEntry[];
  elementHint?: string;
}) {
  return (
    <>
      <div className="sec">Selected media</div>
      <div className="media" />
      <div className="apps">
        {apps.map(([id, name, href]) => (
          <a key={id} data-app={id} href={href} className={id === app ? 'on' : ''}>
            {name}
          </a>
        ))}
      </div>
      <section id="studioStylization" className="shared-section">
        <div className="sec">Stylization</div>
        <button className="style" title="Change style">
          <canvas width={480} height={160} />
          <div>
            <span className="sn" />
            <small>change ▸</small>
          </div>
        </button>
        <div className="fit">
          <div className="row">
            <span>Palette match · selected media</span>
            <b className="fv">—</b>
          </div>
          <div className="meter">
            <i style={{ left: 0 }} />
          </div>
        </div>
        <button
          className="maxx"
          title="Try three prompt-based variations and keep the closest palette. This does not train or apply a LoRA."
        >
          Try style variations
        </button>
      </section>
      <section id="studioElements" className="shared-section">
        <div className="sec">
          Elements <span>{elementHint || ''}</span>
        </div>
        <div className="wall" />
      </section>
    </>
  );
}
export function SelectedMedia({
  media,
  app,
  apps,
  paint,
  onOpen,
}: {
  media: Media | null;
  app: string;
  apps: AppEntry[];
  paint: (canvas: HTMLCanvasElement, media: Media) => void | (() => void);
  onOpen: (app: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current && media) return paint(ref.current, media);
  }, [media, paint]);
  if (!media)
    return <div className="none">Select a shot, keyframe or frame to open it in another workflow.</div>;
  return (
    <>
      <canvas ref={ref} width={320} height={180} />
      <div className="mt">
        <span className="ty">{{ shot: 'Shot', keyframe: 'Keyframe', frame: 'Frame' }[media.type]}</span>
        <b>{media.label}</b>
      </div>
      <div className="openin">
        {apps.map(([id, name, , types]) => {
          const available =
              types.includes(media.type) && !(id === 'edit' && media.type === 'shot' && !media.video),
            here = id === app;
          return (
            <button key={id} disabled={here || !available} onClick={() => onOpen(id)}>
              <span>
                {here ? '● ' : ''}
                {name}
              </span>
              <small>{here ? 'open here' : available ? 'open in →' : `can't edit a ${media.type}`}</small>
            </button>
          );
        })}
      </div>
    </>
  );
}
