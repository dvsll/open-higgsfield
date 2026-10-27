import {CloseButton} from './close-button';
import {ViewerTether} from './viewer-tether';
import { parkPanel } from '../panel-lifecycle';
import { useLayoutEffect, useRef, type CSSProperties, type PointerEvent } from 'react';
import type { LayoutNode, Edge } from '../window-layout';

export function DockTree({
  node,
  panels,
  parking,
  onRatio,
}: {
  node: LayoutNode | null;
  panels: Map<string, HTMLElement>;
  parking: HTMLElement;
  onRatio: () => void;
}) {
  if (!node) return <p className="empty-workspace">Open a window from the Windows menu.</p>;
  if (node.kind === 'panel') return <PanelSlot element={panels.get(node.id)!} parking={parking} />;
  return <Split node={node} panels={panels} parking={parking} onRatio={onRatio} />;
}
// Stable panel hosts preserve video playback, text selection and canvas contexts when reparented.
// React exclusively owns each slot; the registered panel is an isolated embedded surface.
function PanelSlot({ element, parking }: { element: HTMLElement; parking: HTMLElement }) {
  const slot = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = slot.current!;
    host.append(element);
    return () => parkPanel(element, host, parking);
  });
  return <div ref={slot} className="react-panel-slot" />;
}
function Split({
  node,
  panels,
  parking,
  onRatio,
}: {
  node: Extract<LayoutNode, { kind: 'split' }>;
  panels: Map<string, HTMLElement>;
  parking: HTMLElement;
  onRatio: () => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    handle = useRef<HTMLDivElement>(null);
  const apply = (ratio: number) => {
    node.ratio = Math.max(0.15, Math.min(0.85, ratio));
    container.current!.style.setProperty('--ratio', String(node.ratio));
    handle.current!.setAttribute('aria-valuenow', String(Math.round(node.ratio * 100)));
    dispatchEvent(new Event('resize'));
  };
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const element = event.currentTarget,
      initial = node.ratio,
      bounds = container.current!.getBoundingClientRect();
    element.setPointerCapture(event.pointerId);
    const move = (e: globalThis.PointerEvent) =>
      apply(
        node.axis === 'x'
          ? (e.clientX - bounds.left) / bounds.width
          : (e.clientY - bounds.top) / bounds.height,
      );
    const stop = () => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', cancel);
    };
    const up = () => {
        stop();
        onRatio();
      },
      cancel = () => {
        stop();
        apply(initial);
      };
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', cancel);
  };
  return (
    <div
      ref={container}
      className={'window-split axis-' + node.axis}
      style={{ '--ratio': node.ratio } as CSSProperties}
    >
      <DockTree node={node.first} panels={panels} parking={parking} onRatio={onRatio} />
      <div
        ref={handle}
        className="workspace-split"
        tabIndex={0}
        role="separator"
        aria-label="Resize window split"
        aria-orientation={node.axis === 'x' ? 'vertical' : 'horizontal'}
        aria-valuenow={Math.round(node.ratio * 100)}
        onPointerDown={drag}
        onKeyDown={(e) => {
          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
          e.preventDefault();
          apply(node.ratio + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 0.03 : -0.03));
          onRatio();
        }}
      />
      <DockTree node={node.second} panels={panels} parking={parking} onRatio={onRatio} />
    </div>
  );
}
export function WindowChrome({
  id,
  title,
  content,
  visible,
  panels,
  onDrag,
  onDock,
  onClose,
  tether,
}: {
  id: string;
  title: string;
  content: HTMLElement;
  visible: string[];
  panels: Map<string, HTMLElement>;
  onDrag: (id: string, e: globalThis.PointerEvent) => void;
  onDock: (id: string, target: string, edge: Edge) => void;
  onClose: () => void;
  tether?:{target:string|null;onChange:(target:string|null)=>void};
}) {
  const body = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    body.current!.append(content);
    return () => {
      content.remove();
    };
  }, [content]);
  return (
    <>
      <div className="window-titlebar">
        <button
          className="window-grip"
          title="Drag to dock beside another window"
          onPointerDown={(e) => onDrag(id, e.nativeEvent)}
        >
          {title}
        </button>
        {tether&&<ViewerTether {...tether}/>}
        <CloseButton className="window-close" label={'Close '+title} onClick={onClose}/>
      </div>
      <div ref={body} className="window-body" />
    </>
  );
}
