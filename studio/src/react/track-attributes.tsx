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
  if (!s) return null;
  const start = o.start + o.shots.slice(0, local).reduce((sum, shot) => sum + shot.d, 0);
  return (
    <div className="clip-attributes selection-properties" aria-label={`${s.n} ${kind} attributes`}>
      <strong>{s.n}</strong>
      {kind === 'video' ? (
        <>
          <small>{s.d.toFixed(2)} seconds · Detailed output settings are in the viewer.</small>
          <button
            onClick={() => {
              o.select(o.selected, false);
              o.settings();
            }}
          >
            Open size & timing
          </button>
        </>
      ) : (
        <>
          {s.audio && (
            <>
              <label>
                Seconds
                <input
                  type="number"
                  value={+(s.audioDuration || s.d).toFixed(3)}
                  min={0}
                  max={600}
                  step="0.001"
                  readOnly
                  aria-label={`${s.n} Seconds`}
                />
              </label>
              <label>
                Start
                <input
                  type="number"
                  value={+(s.audioLinked === false ? (s.audioStart ?? start) : start).toFixed(3)}
                  min={0}
                  max={600}
                  step="0.01"
                  readOnly
                  aria-label={`${s.n} Start`}
                />
              </label>
            </>
          )}
          <small>
            {s.audio
              ? s.audioLinked === false
                ? 'Unlinked'
                : 'Linked to video'
              : 'This scene has no sound. Add a prompt to create its soundtrack.'}
          </small>
          <button
            onClick={() => {
              o.select(o.selected, true);
              o.audio();
            }}
          >
            {s.audio ? 'Edit audio ↗' : 'Add sound'}
          </button>
        </>
      )}
    </div>
  );
}
