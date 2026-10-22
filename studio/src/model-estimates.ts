import type { ModelChoice } from '../../shared/runtime/model-catalog';
export type TimingSample = { id: string; seconds: number; duration?: number };
export function estimatedSeconds(model: ModelChoice, duration: number, samples: TimingSample[]) {
  const frames = (seconds: number) => Math.max(25, Math.min(121, Math.round(seconds * 24 / 8) * 8 + 1));
  const observations = samples.filter(s => s.id === model.id && Number.isFinite(s.seconds) && s.seconds > 0)
    .map(s => s.seconds * (model.timing.duration ? frames(duration) / frames(s.duration || model.timing.duration) : 1)).sort((a, b) => a - b);
  if (observations.length) {
    const median = observations[Math.floor(observations.length / 2)];
    return { low: Math.max(1, Math.floor(median * .7)), high: Math.ceil(median * 1.5), measured: observations.length };
  }
  const scale = model.timing.duration ? frames(duration) / frames(model.timing.duration) : 1;
  return { low: Math.max(1, Math.floor(model.timing.low * scale)), high: Math.ceil(model.timing.high * scale), measured: 0 };
}
