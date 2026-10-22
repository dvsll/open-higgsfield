import assert from 'node:assert/strict';
import { imageModel, videoModel } from '../../shared/runtime/model-catalog.ts';
import { estimatedSeconds } from '../src/model-estimates.ts';
assert.equal(estimatedSeconds(imageModel, 4, []).low, 7);
assert.equal(estimatedSeconds(imageModel, 4, []).high, 20);
const short = estimatedSeconds(videoModel, 1, []);
const long = estimatedSeconds(videoModel, 4, []);
assert.ok(short.high < long.high);
// Video workflow clamps to 121 frames: estimates must not double from 6 to 8 seconds.
assert.deepEqual(estimatedSeconds(videoModel, 6, []), estimatedSeconds(videoModel, 8, []));
const observed = [{ id: videoModel.id, seconds: 10, duration: 1 }];
assert.ok(estimatedSeconds(videoModel, 4, observed).low > 10);
assert.equal(estimatedSeconds(imageModel, 4, observed).measured, 0);
assert.equal(estimatedSeconds(imageModel, 4, [{ id: imageModel.id, seconds: -3 }]).measured, 0);
for (const m of [imageModel, videoModel]) {
  assert.equal(m.capabilities.find(c => c.name === 'JSON posing').status, 'unavailable');
  assert.equal(m.capabilities.find(c => c.name === 'Elements').status, 'prompt');
}
console.log('PASS: timing defaults, frame scaling/cap, model-specific observations, invalid times and capability truthfulness.');
