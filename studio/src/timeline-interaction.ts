/** Find a sequence insertion boundary using clip midpoints, not the playhead. */
export function insertionIndex(durations: number[], time: number): number {
  let start = 0;
  for (let i = 0; i < durations.length; i++) {
    if (time < start + durations[i] / 2) return i;
    start += durations[i];
  }
  return durations.length;
}
export function movedIndex(from: number, boundary: number): number {
  return boundary > from ? boundary - 1 : boundary;
}
