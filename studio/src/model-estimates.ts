import type { ModelChoice } from '../../shared/runtime/model-catalog';
import type { ServerTiming } from '../../shared/runtime/render-timings';
export function serverEstimate(model: ModelChoice, duration: number, width: number, height: number, server?: ServerTiming) {
  const frames=model.timing.duration?Math.max(25,Math.min(121,Math.round(duration*24/8)*8+1)):1;
  const workload=width*height*frames;
  const samples=(server?.samples||[]).filter(s=>s.hardware===server?.hardware?.id&&s.model===model.id&&s.seconds>0);
  const warm=samples.filter(s=>!s.cold);
  const distance=(s:typeof samples[number])=>Math.abs(Math.log((s.width*s.height)/(width*height)))+Math.abs(Math.log(s.frames/frames));
  const nearest=(runs:typeof samples)=>{const best=Math.min(...runs.map(distance));return runs.filter(s=>distance(s)<=best+.00001)};
  const nearWarm=nearest(warm);
  const rates=nearWarm.map(s=>s.seconds/(s.width*s.height*s.frames)).sort((a,b)=>a-b);
  const median=(values:number[])=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
  let rate=rates.length?median(rates):null;
  let basis=rates.length?`${rates.length} measured warm runs on ${server!.hardware!.name}`:'Hardware calibration needed';
  if (!rate && /4070\s*super/i.test(server?.hardware?.name||'')) {
    rate=(model.timing.duration?25:7)/(768*448*(model.timing.duration?97:1));basis=`Recorded 4070 Super baseline; calibrating this server`;
  }
  if (!rate && samples.length) {const s=samples[samples.length-1];rate=s.seconds/(s.width*s.height*s.frames);basis='First measured run; includes model loading';}
  if (!rate) return {seconds:null,render:null,load:0,basis};
  const render=rate*workload;
  const cold=nearest(samples.filter(s=>s.cold)).map(s=>Math.max(0,s.seconds-rate!*s.width*s.height*s.frames));
  const load=server?.activeModel!==model.id&&cold.length&&warm.length?median(cold):0;
  return {seconds:Math.max(1,Math.round(render+load)),render:Math.round(render),load:Math.round(load),basis};
}
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
