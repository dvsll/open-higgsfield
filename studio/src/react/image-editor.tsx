import { useEffect, useRef, useState } from 'react';
type Region = { n: string; ic: string; sug: string[] };
export function ImageLayers({
  layers,
  regions,
  selected,
  onSelect,
  onToggle,
  onRemove,
}: {
  layers: { id: number; r: string; txt: string; on: boolean }[];
  regions: Record<string, Region>;
  selected: string | null;
  onSelect: (region: string) => void;
  onToggle: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  if (!layers.length)
    return <div className="empty">Click anything in the frame and say what it should be.</div>;
  return (
    <>
      {layers.map((layer, index) => (
        <div
          key={layer.id}
          className={'layer' + (layer.on ? '' : ' off') + (selected === layer.r ? ' hl' : '')}
          onClick={() => onSelect(layer.r)}
        >
          <span className="ic">{regions[layer.r].ic}</span>
          <div>
            {regions[layer.r].n} → {layer.txt}
            <small>{layer.r === 'place' || layer.r === 'sky' ? 'whole frame' : 'tracked region'}</small>
          </div>
          <span className="x">
            <button
              title="Show / hide"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(index);
              }}
            >
              {layer.on ? '◉' : '○'}
            </button>
            <button
              title="Remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
            >
              ✕
            </button>
          </span>
        </div>
      ))}
    </>
  );
}
export function ImageSelection({
  region,
  tracked,
  value,
  onApply,
}: {
  region: Region;
  tracked: boolean;
  value: string;
  onApply: (text: string) => void;
}) {
  const [text, setText] = useState(value);
  return (
    <>
      <div className="selc">
        <span className="ic">{region.ic}</span>
        <div>
          {region.n}
          <small>{tracked ? 'tracked through the shot' : 'whole frame'}</small>
        </div>
      </div>
      <input
        className="t"
        id="selIn"
        placeholder={`What should ${region.n.toLowerCase()} become?`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ marginTop: 8 }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text.trim()) onApply(text.trim());
        }}
      />
      <div className="chips" style={{ marginTop: 8 }}>
        {region.sug.map((suggestion) => (
          <button key={suggestion} className="chip" onClick={() => onApply(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>
    </>
  );
}
export function CanvasAsk({
  region,
  onApply,
  onCancel,
}: {
  region: Region;
  onApply: (text: string) => void;
  onCancel: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const submit = () => {
    const value = input.current!.value.trim();
    if (value) onApply(value);
  };
  return (
    <>
      <b>
        {region.ic} {region.n} →
      </b>
      <input
        ref={input}
        placeholder="describe the change"
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button onClick={submit}>Edit</button>
    </>
  );
}
