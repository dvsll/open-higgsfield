type Point = { x: number; y: number };
const rect = (element: Element) => element.getBoundingClientRect();

// Both endpoints must remain visible inside every scrolling/clipping ancestor.
function visible(element: HTMLElement): boolean {
 const r = rect(element);
 if (r.width < 2 || r.height < 2 || r.left < 8 || r.top < 8 || r.right > innerWidth - 8 || r.bottom > innerHeight - 8) return false;
 for (let node: HTMLElement | null = element; node; node = node.parentElement) {
  const style = getComputedStyle(node);
  if (style.visibility !== 'visible' || style.display === 'none' || Number(style.opacity) === 0) return false;
  const clip = rect(node);
  if (node !== element && ((/(auto|scroll|hidden|clip)/.test(style.overflowX) && (r.left < clip.left || r.right > clip.right)) || (/(auto|scroll|hidden|clip)/.test(style.overflowY) && (r.top < clip.top || r.bottom > clip.bottom)))) return false;
 }
 const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
 return !!top && (element.contains(top) || top.contains(element));
}

export function updateGenerateArrow(enabled: boolean): void {
 const arrow = document.querySelector<SVGElement>('#generateArrow')!;
 const message = document.querySelector<HTMLElement>('#empty .msg')!;
 const button = document.querySelector<HTMLButtonElement>('#gen')!;
 arrow.style.display = 'none';
 if (!enabled || button.disabled || document.querySelector('dialog[open],.runtime-setup[open]') || !visible(message) || !visible(button)) return;
 const m = rect(message), b = rect(button);
 const dx = b.left + b.width / 2 - (m.left + m.width / 2);
 const dy = b.top + b.height / 2 - (m.top + m.height / 2);
 let start: Point, end: Point, c1: Point, c2: Point;
 if (Math.abs(dx) > Math.abs(dy)) {
  const direction = Math.sign(dx), gap = direction > 0 ? b.left - m.right : m.left - b.right;
  if (gap < 64) return;
  start = { x: m.left + m.width * (direction > 0 ? .35 : .65), y: dy >= 0 ? m.bottom + 12 : m.top - 12 };
  end = { x: direction > 0 ? b.left - 14 : b.right + 14, y: b.top + b.height / 2 };
  const bend = Math.min(160, Math.abs(end.x - start.x) * .4);
  c1 = { x: start.x + direction * bend, y: start.y + Math.sign(dy) * Math.min(48, Math.abs(dy) * .3) };
  c2 = { x: end.x - direction * bend, y: end.y };
 } else {
  const direction = Math.sign(dy), gap = direction > 0 ? b.top - m.bottom : m.top - b.bottom;
  if (gap < 64) return;
  start = { x: m.left + m.width * .65, y: direction > 0 ? m.bottom + 12 : m.top - 12 };
  end = { x: b.left + b.width / 2, y: direction > 0 ? b.top - 14 : b.bottom + 14 };
  const bend = Math.min(100, gap * .4);
  c1 = { x: start.x + 28, y: start.y + direction * bend };
  c2 = { x: end.x, y: end.y - direction * bend };
 }
 // A cubic stays inside its control-point hull; keep the whole stroke on screen.
 if ([start, end, c1, c2].some(p => p.x < 12 || p.y < 12 || p.x > innerWidth - 12 || p.y > innerHeight - 12)) return;
 arrow.querySelector('path#generateArrowCurve')!.setAttribute('d', `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`);
 arrow.style.display = 'block';
}
