// Opt-in installed local CPU inference only; never downloads or generates media.
import assert from 'node:assert/strict';
const base=process.env.OSH_TEST_URL||'http://127.0.0.1:8288';
const status=await(await fetch(base+'/api/prompt-rewriter')).json();assert.equal(status.available,true,'Explicitly install the helper before this live test.');
const post=async prompt=>{const response=await fetch(base+'/api/prompt-rewriter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt}),signal:AbortSignal.timeout(75000)});return {status:response.status,data:await response.json()}};
assert.equal((await post('')).status,400);
const prompt='A copper robot waters a yellow flower in a sunlit greenhouse. The camera slowly pushes closer. Gentle water droplets and birdsong, no music.';
const pair=await Promise.all([post(prompt),post(prompt)]);assert.deepEqual(pair.map(r=>r.status).sort(),[200,409]);
const result=pair.find(r=>r.status===200).data;for(const key of ['visual','motion','audio'])assert.equal(typeof result[key],'string');assert.match(result.visual,/robot/i);assert.match(result.visual,/flower/i);assert.match(result.audio,/water|droplet|bird/i);assert.match(result.model,/CPU/);
const silent=await post('A red fox walks through a snowy forest at sunrise. Slow camera pan. Completely silent, no sound or music.');assert.equal(silent.status,200);assert.equal(silent.data.audio,'');
console.log('PASS actual local CPU rewriting: structured scene/motion/sound, explicit silence, invalid-input rejection and concurrent-job protection. No media generation.');
