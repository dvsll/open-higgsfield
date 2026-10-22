export type MentionElement = { id: string; n: string; d: string; ic: string; kind: string;refs?:string[] };
export function mentionAt(value: string, caret: number) {
  const before = value.slice(0, caret);
  const match = /(?:^|[\s(])@([\p{L}\p{N} '_-]*)$/u.exec(before);
  return match ? { start: caret - match[1].length - 1, end: caret, query: match[1] } : null;
}
export function matchingElements(elements: MentionElement[], query: string): MentionElement[] {
  const q = query.trim().toLocaleLowerCase();
  return elements.filter(e => `${e.n} ${e.d}`.toLocaleLowerCase().includes(q))
    .sort((a,b) => Number(b.n.toLocaleLowerCase().startsWith(q)) - Number(a.n.toLocaleLowerCase().startsWith(q)));
}
export function mentionRanges(text: string, elements: MentionElement[]) {
  const names = [...elements].sort((a,b) => b.n.length - a.n.length).map(e => e.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!names.length) return [];
  const regex = new RegExp(`(^|[\\s(])@(${names.join('|')})(?=$|[\\s.,!?;:)])`, 'gi');
  return [...text.matchAll(regex)].map(match => ({ start: match.index! + match[1].length, end: match.index! + match[0].length }));
}
/** Mentions currently resolve to prompt descriptions, not visual identity conditioning. */
export function expandMentions(text: string, elements: MentionElement[]): string {
  for (const element of [...elements].sort((a,b) => b.n.length - a.n.length)) {
    const escaped = element.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`(^|[\\s(])@${escaped}(?=$|[\\s.,!?;:)])`, 'gi'), (_, prefix: string) => `${prefix}${element.n} (${element.d})`);
  }
  return text;
}
