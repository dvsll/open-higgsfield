import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { ReactNode } from 'react';
// Canvas/media controllers publish views here. Each host has exactly one React owner.
const roots = new WeakMap<Element, Root>();
export function renderView(host: Element, view: ReactNode): void {
  let root = roots.get(host);
  if (!root) {
    root = createRoot(host);
    roots.set(host, root);
  }
  flushSync(() => root.render(view));
}
export function unmountView(host: Element): void {
  const root = roots.get(host);
  if (root) {
    flushSync(() => root.unmount());
    roots.delete(host);
  }
}
