import { useLayoutEffect, useRef } from 'react';
type Take = { kind: string; url: string; label: string; at: number };
export function Takes({
  items,
  ago,
  onUse,
}: {
  items: Take[];
  ago: (time: number) => string;
  onUse: (item: Take) => void;
}) {
  return (
    <>
      <div className="hh">
        Generation history{' '}
        <span>
          {items.length
            ? `${items.length} · click a keyframe to add it to the selected shot, a shot to use it as that shot's take`
            : ''}
        </span>
      </div>
      <div className="hs">
        {!items.length ? (
          <span className="none">Everything you generate shows up here.</span>
        ) : (
          items.map((item, index) => (
            <button
              key={item.url + index}
              className="hc"
              title={item.label}
              onClick={() => onUse(item)}
              onMouseEnter={(e) => {
                const video = e.currentTarget.querySelector('video');
                void video?.play().catch(() => {});
              }}
              onMouseLeave={(e) => {
                const video = e.currentTarget.querySelector('video');
                if (video) {
                  video.pause();
                  video.currentTime = 0.5;
                }
              }}
            >
              {item.kind === 'shot' ? (
                <video src={item.url + '#t=0.5'} muted preload="metadata" />
              ) : (
                <img src={item.url} loading="lazy" alt={item.label} />
              )}
              <div>
                <span className="kind">{item.kind}</span>
                <small>{item.label}</small>
                <small>{ago(item.at)}</small>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}
export function Stash({
  items,
  bind,
  onRestore,
}: {
  items: { shot: { n: string; d: number; id?: string } }[];
  bind: (element: HTMLDivElement, index: number) => void;
  onRestore: (index: number) => void;
}) {
  return (
    <>
      <span className="sl">Stash{items.length ? ' · ' + items.length : ''}</span>
      <div className="items">
        {!items.length ? (
          <span className="none">
            Park shots here with ⇣ on a clip. Drag them back into the sequence any time.
          </span>
        ) : (
          items.map((item, index) => (
            <StashCard
              key={item.shot.id || index}
              name={item.shot.n}
              duration={item.shot.d}
              bind={(element) => bind(element, index)}
              restore={() => onRestore(index)}
            />
          ))
        )}
      </div>
    </>
  );
}
function StashCard({
  name,
  duration,
  bind,
  restore,
}: {
  name: string;
  duration: number;
  bind: (element: HTMLDivElement) => void;
  restore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => bind(ref.current!), [bind]);
  return (
    <div ref={ref} className="it" draggable title="Drag into the sequence, or click ↩">
      <canvas width={192} height={80} />
      <span>
        {name} · {duration}s
      </span>
      <button title="Back to the sequence" onClick={restore}>
        ↩
      </button>
    </div>
  );
}
export function Trash({
  items,
  bind,
  onRestore,
  onEmpty,
}: {
  items: { shot: { n: string; d: number; id?: string }; at: number }[];
  bind: (canvas: HTMLCanvasElement, index: number) => void;
  onRestore: (index: number) => void;
  onEmpty: () => void;
}) {
  return (
    <>
      {items.map((item, index) => (
        <div key={item.shot.id || index} className="tr">
          <canvas
            width={96}
            height={54}
            ref={(canvas) => {
              if (canvas) bind(canvas, index);
            }}
          />
          <div>
            {item.shot.n} · {item.shot.d}s
            <small>deleted {Math.max(1, Math.round((Date.now() - item.at) / 60000))} min ago</small>
          </div>
          <button onClick={() => onRestore(index)}>Restore</button>
        </div>
      ))}
      <div className="foot">
        <span>Deleted shots stay here.</span>
        <button onClick={onEmpty}>Empty trash</button>
      </div>
    </>
  );
}
export function Results({
  items,
  bind,
}: {
  items: { pending?: boolean; img?: string; p?: string }[];
  bind: (element: HTMLDivElement, index: number) => void;
}) {
  return items.length ? (
    <div className="gen">
      {items.map((item, index) =>
        item.pending ? (
          <div key={'pending-' + index} className="v busy">
            generating…
          </div>
        ) : (
          <Result key={item.img || index} prompt={item.p} bind={(element) => bind(element, index)} />
        ),
      )}
    </div>
  ) : (
    <div className="empty">Generated keyframes show up here.</div>
  );
}
function Result({ prompt, bind }: { prompt?: string; bind: (element: HTMLDivElement) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => bind(ref.current!), [bind]);
  return (
    <div
      ref={ref}
      className="v"
      draggable
      tabIndex={0}
      role="button"
      aria-label="Add generated image to the selected scene"
      title={prompt}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
    >
      <canvas width={256} height={144} />
      <span>＋ add to selected shot</span>
    </div>
  );
}
