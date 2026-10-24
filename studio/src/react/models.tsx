import { useEffect, useRef } from 'react';
export type Help = { title: string; text: string };
export type Badge = { name: string; status: string; label: string; help: Help; onClick?: () => void };
export type ModelInfoData = { timing: string; help: Help; badges: Badge[] };
export type AttachHelp = (button: HTMLButtonElement, title: string, text: string) => void;
export function HelpButton({
  label,
  help,
  className,
  ariaLabel,
  onClick,
  attach,
}: {
  label: string;
  help: Help;
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
  attach: AttachHelp;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const button = ref.current!;
    attach(button, help.title, help.text);
    return () => {
      button.onmouseenter =
        button.onmouseleave =
        button.onfocus =
        button.onblur =
        button.onclick =
        button.onkeydown =
          null;
    };
  }, [attach, help.title, help.text]);
  return (
    <button ref={ref} type="button" className={className} aria-label={ariaLabel} onClick={onClick}>
      {label}
    </button>
  );
}
export function ModelTiming({ info, attach }: { info: ModelInfoData; attach: AttachHelp }) {
  return <HelpButton label={info.timing} help={info.help} className="model-time" attach={attach} />;
}
export function ModelInfo({
  info,
  attach,
  timing = true,
}: {
  info: ModelInfoData;
  attach: AttachHelp;
  timing?: boolean;
}) {
  return (
    <>
      {timing && <ModelTiming info={info} attach={attach} />}
      <span className="cap-label">Capabilities</span>
      <div className="cap-badges">
        {info.badges.map((badge) => (
          <HelpButton
            key={badge.name}
            label={badge.name}
            help={badge.help}
            className={badge.status}
            ariaLabel={badge.label}
            onClick={badge.onClick}
            attach={attach}
          />
        ))}
      </div>
    </>
  );
}
export type ModelRow = { id: string; label: string; description: string; info: ModelInfoData };
export function ModelChooser({
  kind,
  rows,
  selected,
  research,
  attach,
  onChoose,
  onClose,
}: {
  kind: 'video' | 'keyframe';
  rows: ModelRow[];
  selected: string;
  research: string[];
  attach: AttachHelp;
  onChoose: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <header>
        <h2>Choose {kind === 'video' ? 'video' : 'image'} model</h2>
        <button onClick={onClose}>Close</button>
      </header>
      <small>Select a model name. Hover or focus capabilities for explanations and usage.</small>
      {rows.map((row) => (
        <div key={row.id} className={'model-choice' + (row.id === selected ? ' active' : '')}>
          <button type="button" aria-pressed={row.id === selected} onClick={() => onChoose(row.id)}>
            <b>{row.label}</b>
            <small>{row.description}</small>
          </button>
          <div className="model-card">
            <ModelInfo info={row.info} attach={attach} />
          </div>
        </div>
      ))}
      {research.map((repo) => (
        <div key={repo} className="model-research">
          {repo} · downloaded for LoRA training · generation workflow not connected · estimate unavailable
        </div>
      ))}
    </>
  );
}
