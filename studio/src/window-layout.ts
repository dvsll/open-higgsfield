export type Edge = 'left' | 'right' | 'top' | 'bottom';
export type LayoutNode = { kind: 'panel'; id: string } | { kind: 'split'; axis: 'x' | 'y'; ratio: number; first: LayoutNode; second: LayoutNode };
export const panel = (id: string): LayoutNode => ({ kind: 'panel', id });
export const split = (axis: 'x' | 'y', first: LayoutNode, second: LayoutNode, ratio = .5): LayoutNode => ({ kind: 'split', axis, ratio, first, second });
export function ids(node: LayoutNode | null): string[] { return !node ? [] : node.kind === 'panel' ? [node.id] : [...ids(node.first), ...ids(node.second)]; }
export function remove(node: LayoutNode | null, id: string): LayoutNode | null {
 if (!node || node.kind === 'panel') return node?.id === id ? null : node;
 const first = remove(node.first, id), second = remove(node.second, id);
 return !first ? second : !second ? first : { ...node, first, second };
}
export function dock(node: LayoutNode | null, id: string, target: string, edge: Edge): LayoutNode | null {
 if (id === target || !ids(node).includes(target)) return node;
 const stripped = remove(node, id);
 const insert = (current: LayoutNode): LayoutNode => {
  if (current.kind === 'panel') {
   if (current.id !== target) return current;
   return split(edge === 'left' || edge === 'right' ? 'x' : 'y', edge === 'left' || edge === 'top' ? panel(id) : current, edge === 'left' || edge === 'top' ? current : panel(id));
  }
  return { ...current, first: insert(current.first), second: insert(current.second) };
 };
 return stripped ? insert(stripped) : node;
}
export function valid(value: unknown, allowed: Set<string>): value is LayoutNode {
 const seen = new Set<string>();
 const visit = (node: any, depth: number): boolean => {
  if (!node || depth > 24) return false;
  if (node.kind === 'panel') { if (!allowed.has(node.id) || seen.has(node.id)) return false; seen.add(node.id); return true; }
  return node.kind === 'split' && ['x', 'y'].includes(node.axis) && Number.isFinite(node.ratio) && node.ratio >= .1 && node.ratio <= .9 && visit(node.first, depth + 1) && visit(node.second, depth + 1);
 };
 return visit(value, 0);
}
export function preview(rect: { x: number; y: number; width: number; height: number }, edge: Edge) {
 const result = { ...rect };
 if (edge === 'left' || edge === 'right') { result.width /= 2; if (edge === 'right') result.x += result.width; }
 else { result.height /= 2; if (edge === 'bottom') result.y += result.height; }
 return result;
}
export type LayoutRect = { x: number; y: number; width: number; height: number };
export function boundsOf(node: LayoutNode | null, id: string, rect: LayoutRect, gap = 5): LayoutRect | null {
 if (!node) return null;
 if (node.kind === 'panel') return node.id === id ? rect : null;
 const first = { ...rect }, second = { ...rect };
 if (node.axis === 'x') { first.width = (rect.width - gap) * node.ratio; second.x += first.width + gap; second.width -= first.width + gap; }
 else { first.height = (rect.height - gap) * node.ratio; second.y += first.height + gap; second.height -= first.height + gap; }
 return boundsOf(node.first, id, first, gap) || boundsOf(node.second, id, second, gap);
}
