import { useLayoutEffect, useRef, type ReactNode } from 'react';

export type ClipItem = {
  id: string;
  name: string;
  duration: number;
  generated: boolean;
  selected: boolean;
  width: number;
  height: number;
  opened?: boolean;
  offset?:number;
  hasAudio?:boolean;
  bind: (element: HTMLDivElement) => void;
  keys?: GuideItem[];
};
export type GuideItem = { id: string; bind: (element: HTMLDivElement) => void };
function Guide({ item }: { item: GuideItem }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    item.bind(ref.current!);
  }, [item]);
  return (
    <div ref={ref}>
      <canvas width={160} height={96} />
      <span className="anchor-label" />
    </div>
  );
}
function Clip({ item, index }: { item: ClipItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    item.bind(ref.current!);
  }, [item]);
  return (
    <div
      ref={ref}
      className={'clip' + (item.selected ? ' on' : '')}
      style={{ width: item.width }}
      role={item.opened ? undefined : 'option'}
      aria-label={`Shot ${index + 1}: ${item.name}`}
      aria-selected={item.selected}
      tabIndex={item.selected ? 0 : -1}
    >
      <canvas className="strip" width={Math.max(10, Math.floor(item.width + 3))} height={item.height} />
      <span className="lbl">
        {item.opened && (
          <button className="tw" title="Back to the sequence">
            ◂ Sequence
          </button>
        )}
        <i className={item.generated ? 'ok' : ''} />
        {index + 1} · {item.name}
        {item.opened
          ? item.generated
            ? ' · generated'
            : ' · keyframes only'
          : ` · ${+item.duration.toFixed(3)}s`}
        {!item.opened && (
          <span className="act">
            <button className="tw" title="Open this shot">
              Open ▸
            </button>
            <button data-a="stash" title="Move to stash">
              ⇣
            </button>
            <button data-a="del" title="Delete (goes to trash)">
              ✕
            </button>
          </span>
        )}
      </span>
      {item.hasAudio&&<span className="clip-linked-sound" title="Soundtrack attached to this video">♫ Linked sound</span>}
      <div className="grip" title="Drag to trim" />
      {item.keys?.map((key) => (
        <Guide key={key.id} item={key} />
      ))}
    </div>
  );
}
export function SequenceTrack({ clips, onAdd,expanded=false }: { clips: ClipItem[]; onAdd?: () => void;expanded?:boolean }) {
  return (
    <>
      {clips.length===0&&<div className="sequence-empty"><button onClick={()=>openSequenceWorkflow('video')}>Open Video workflow →</button></div>}
      {clips.map((item, index) => (
        expanded?<div key={item.id} className="sequence-scene-row" style={{paddingLeft:item.offset||0}}><Clip item={item} index={index} /></div>:<Clip key={item.id} item={item} index={index} />
      ))}
      {onAdd && clips.length>0 && (
        <button className="addclip" title="Add shot" onClick={onAdd}>
          ＋
        </button>
      )}
    </>
  );
}
export function Ruler({
  duration,
  pixels,
  half = false,
}: {
  duration: number;
  pixels: number;
  half?: boolean;
}) {
  return (
    <>
      {Array.from({ length: Math.floor(duration * (half ? 2 : 1)) + 1 }, (_, index) => (
        <span key={index} style={{ left: (index / (half ? 2 : 1)) * pixels }}>
          {half && index % 2 ? '·' : index / (half ? 2 : 1) + 's'}
        </span>
      ))}
    </>
  );
}
export function BoundCard({
  className,
  bind,
  children,
  draggable = false,
}: {
  className?: string;
  bind: (element: HTMLDivElement) => void;
  children: ReactNode;
  draggable?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    bind(ref.current!);
  }, [bind]);
  return (
    <div ref={ref} className={className} draggable={draggable}>
      {children}
    </div>
  );
}
import {openSequenceWorkflow} from '../sequence-workflows';
