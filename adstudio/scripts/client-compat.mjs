// No server/GPU needed: verify both branches' shared-client calling conventions.
import assert from 'node:assert/strict';
import { OSH } from '../../shared/runtime/client.ts';
const requests = [];
globalThis.fetch = async (url, init) => {
  requests.push({ url, body: JSON.parse(init.body) });
  return { ok: true, json: async () => ({ url: '/outputs/test.webm' }) };
};
const keys = [{ image: '/outputs/0123456789abcdef.png', t: 0 }];
await OSH.shot(keys, 'motion', 2, 7);
await OSH.shot(keys, 'motion', 2, 7, 'ltxv-model');
await OSH.shot(keys, 'motion', 2, 7, { width: 288, height: 512 });
await OSH.shot(keys, 'motion', 2, 7, { width: 384, height: 384, model: 'ltxv-model' });
await OSH.keyframe('still', 7, { width: 256 }, 'z-image-model');
await OSH.shot(keys, 'timed', 3, 1, { frames: 73, fps: 24 });
assert.deepEqual(requests.map(r => r.body), [
  { keys, prompt: 'motion', duration: 2, seed: 7 },
  { keys, prompt: 'motion', duration: 2, seed: 7, model: 'ltxv-model' },
  { keys, prompt: 'motion', duration: 2, seed: 7, width: 288, height: 512 },
  { keys, prompt: 'motion', duration: 2, seed: 7, width: 384, height: 384, model: 'ltxv-model' },
  { prompt: 'still', seed: 7, width: 256, model: 'z-image-model' },
  { keys, prompt: 'timed', duration: 3, seed: 1, frames: 73, fps: 24 },
]);
console.log('PASS: default, Director model, Ad Studio size, combined model/size, keyframe model, explicit frame/FPS calls.');
