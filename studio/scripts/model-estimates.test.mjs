import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {videoModel,imageModel} from '../../shared/runtime/model-catalog.ts';
const videoGraph=JSON.parse(readFileSync(new URL('../../shared/workflows/shot_ltxv.json',import.meta.url),'utf8'));
const imageGraph=JSON.parse(readFileSync(new URL('../../shared/workflows/keyframe_zimage.json',import.meta.url),'utf8'));
assert.equal(videoModel.generation.steps,videoGraph['13'].inputs.steps);assert.equal(imageModel.generation.steps,imageGraph['8'].inputs.steps);assert.equal(videoModel.generation.preferredFps,30);assert.match(videoModel.generation.fpsNote,/24 FPS/);
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
