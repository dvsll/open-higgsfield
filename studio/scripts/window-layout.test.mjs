import assert from 'node:assert/strict';
import { panel, split, ids, remove, dock, valid, preview, boundsOf, dockAtSize } from '../src/window-layout.ts';
const original=split('y',split('x',panel('prompts'),panel('viewer'),.4),panel('timeline'),.66);
const allowed=new Set(['prompts','viewer','timeline','elements']);
for(const edge of ['left','right','top','bottom']){
 const result=dock(original,'prompts','viewer',edge);
 assert.ok(valid(result,allowed));assert.equal(ids(result).length,3);assert.equal(new Set(ids(result)).size,3);
 const pair=result.first;assert.equal(pair.axis,['left','right'].includes(edge)?'x':'y');
 assert.deepEqual(ids(pair),['left','top'].includes(edge)?['prompts','viewer']:['viewer','prompts']);
}
assert.equal(dock(original,'prompts','missing','right'),original,'invalid drop preserves layout');
assert.equal(dock(original,'viewer','viewer','left'),original,'self drop preserves layout');
assert.deepEqual(remove(original,'prompts').first,panel('viewer'),'removal collapses empty split');
assert.equal(remove(panel('viewer'),'viewer'),null);
assert.ok(valid(dock(original,'elements','viewer','right'),allowed),'closed window can reopen beside a target');
assert.ok(!valid(split('x',panel('viewer'),panel('viewer')),allowed),'duplicate windows rejected');
assert.ok(!valid({...original,ratio:NaN},allowed));
assert.ok(!valid(panel('floating'),allowed),'unknown/floating states rejected');
assert.deepEqual(preview({x:10,y:20,width:600,height:400},'right'),{x:310,y:20,width:300,height:400});
assert.deepEqual(preview({x:10,y:20,width:600,height:400},'bottom'),{x:10,y:220,width:600,height:200});
assert.deepEqual(JSON.parse(JSON.stringify(original)),original,'split layout round-trips');
console.log('PASS: four-direction splits, horizontal/vertical order, invalid/self drops, collapse, validation, exact preview and persistence.');

assert.deepEqual(boundsOf(dock(split('x',panel('prompts'),panel('viewer')),'prompts','viewer','right'),'prompts',{x:0,y:0,width:1005,height:500}),{x:505,y:0,width:500,height:500},'preview accounts for source split collapsing before docking');

const withStash=split('x',split('x',panel('prompts'),panel('viewer'),.25),panel('stash'),.6);
const viewport={x:4,y:4,width:2000,height:900};
const anchored=dockAtSize(withStash,'stash','viewer','bottom',viewport);
assert.equal(boundsOf(anchored,'prompts',viewport).width,boundsOf(withStash,'prompts',viewport).width,'unrelated prompt column does not stretch when stash is removed');
assert.equal(boundsOf(anchored,'stash',viewport).x,boundsOf(withStash,'viewer',viewport).x,'below preview remains anchored to viewer left edge');
assert.ok(valid(anchored,new Set(['prompts','viewer','stash'])));
for(const edge of ['left','right','top','bottom'])assert.ok(valid(dockAtSize(withStash,'stash','viewer',edge,viewport),new Set(['prompts','viewer','stash'])));
