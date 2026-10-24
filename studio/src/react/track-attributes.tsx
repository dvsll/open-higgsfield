import type { AttributeOptions } from '../timeline-attributes';
export function TrackAttributes({
  options: o,
  kind,
}: {
  options: AttributeOptions;
  kind: 'video' | 'audio';
}) {
  const local = o.selected - o.offset,
    s = o.shots[local];
  if (!s) return <p className="properties-empty">Select a video scene to view its properties.</p>;
  const start = o.start + o.shots.slice(0, local).reduce((sum, shot) => sum + shot.d, 0);
  return <section className="scene-properties" aria-label={s.n+' properties'}><h3>{s.n}</h3><dl><dt>Start</dt><dd>{+start.toFixed(3)} s</dd><dt>Duration</dt><dd>{+s.d.toFixed(3)} s</dd><dt>Soundtrack</dt><dd>{s.audio?(s.audioLinked===false?'Unlinked':'Linked to video'):'None'}</dd></dl>{s.audio&&<div className="scene-property-actions"><button onClick={o.audio}>Edit soundtrack</button>{s.audioLinked!==false&&<button onClick={o.unlink}>Unlink soundtrack</button>}</div>}</section>;
}
