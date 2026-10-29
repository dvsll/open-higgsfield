import assert from 'node:assert/strict';
import {validLayers,layerRows,independentSoundtracks} from '../src/sequence-layer-state.ts';
const layer=(id,start,duration)=>({id,name:id,kind:'text',start,duration,text:'caption'});
const rows=layerRows([layer('a',0,3),layer('b',1,1),layer('c',3,2)]);
assert.equal(rows.get('a'),0);assert.equal(rows.get('b'),1);assert.equal(rows.get('c'),0);
const url='/outputs/1111111111111111.flac';
const shots=[{id:'a',n:'a',d:4,audio:url},{id:'b',n:'b',d:3,audio:url,audioLinked:true},{id:'c',n:'c',d:2,audio:url,audioLinked:false,audioStart:1}];
assert.deepEqual(independentSoundtracks(shots).map(s=>[s.id,s.start,s.duration]),[['legacy:c',1,2]]);
assert.equal(shots[0].audio,url); // Linked sound stays on its video; it is never deleted by lane filtering.
const state={overlays:[layer('a',0,3),layer('bad',-1,2)],audio:[{...layer('audio',2,4),kind:'music',url}, {...layer('remote',0,1),kind:'sfx',url:'https://example.com/a.mp3'}]};
const parsed=validLayers(JSON.parse(JSON.stringify(state)));
assert.equal(parsed.overlays.length,1);assert.equal(parsed.audio.length,1);assert.equal(parsed.audio[0].url,url);
assert.deepEqual(validLayers(null),{overlays:[],audio:[]});
console.log('PASS: three-lane persistence validation, overlapping layer packing and default linked soundtrack ownership.');

const placed=layerRows([{...layer('chosen',2,2),row:0},{...layer('lower',0,2),row:1},layer('auto',2,1)]);
assert.equal(placed.get('chosen'),0,'Moving up preserves the requested row');assert.equal(placed.get('lower'),1,'Manual lower row does not collapse');assert.equal(placed.get('auto'),1,'Automatic placement avoids occupied manual clips');
const saved=validLayers({audio:[{...layer('saved',0,2),kind:'sfx',row:1}]});assert.equal(saved.audio[0].row,1);
assert.equal(independentSoundtracks([{id:'row',n:'Row',d:2,audio:url,audioLinked:false,audioRow:2}])[0].row,2);
