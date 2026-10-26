import {scrubbedNumber} from '../src/number-scrub.ts';
import assert from 'node:assert/strict';
import {searchInput,searchResults} from '../../shared/runtime/semantic-search.ts';
import {viewerTetherPath} from '../src/viewer-tether-path.ts';
import {shouldOfferInitialSetup} from '../src/runtime-setup-policy.ts';
const input=searchInput({query:'  rainy city  ',documents:[{id:'city',text:'wet downtown after sunset'},{id:'garden',text:'sunny flowers'}]});assert.equal(input.query,'rainy city');assert.deepEqual(searchResults(input.documents,[.7,.1]).map(row=>row.id),['city','garden']);
for(const body of [{query:'x',documents:[]},{query:'x',documents:[{id:'a',text:'a'},{id:'a',text:'b'}]},{query:'x'.repeat(257),documents:input.documents}])assert.throws(()=>searchInput(body));
for(const scores of [[NaN,0],[1.1,0],[.4],['.1',.3]])assert.throws(()=>searchResults(input.documents,scores));
const initial={config:null,connected:false,proxy:false,task:{busy:false}};
assert.equal(shouldOfferInitialSetup(initial,false),true);assert.equal(shouldOfferInitialSetup(initial,true),false);assert.equal(shouldOfferInitialSetup({...initial,config:{mode:'existing'}},false),false);assert.equal(shouldOfferInitialSetup({...initial,task:{busy:true}},false),false);assert.equal(shouldOfferInitialSetup({...initial,connected:true,proxy:true},false),false);
const numbers=path=>path.match(/-?\d+(?:\.\d+)?/g).map(Number);
for(const [x,y] of [[0,0],[100,0],[-100,0],[0,100],[0,-100],[100,100],[-100,-100]])assert.ok(numbers(viewerTetherPath(0,0,x,y)).every(Number.isFinite));
const before=numbers(viewerTetherPath(0,0,100,99.99)),after=numbers(viewerTetherPath(0,0,100,100.01));assert.ok(before.every((value,index)=>Math.abs(value-after[index])<.1),'continuous across diagonals');
console.log('PASS: bounded semantic inputs/scores, setup first-boot policy, all-quadrant tether curves and smooth diagonal transitions.');

assert.equal(scrubbedNumber(24,0,-8,1,1,120),26);assert.equal(scrubbedNumber(24,0,8,1,1,120),22);assert.equal(scrubbedNumber(24,8,0,1,1,120),26);assert.equal(scrubbedNumber(24,8,-8,1,1,120),28);assert.equal(scrubbedNumber(97,0,-4,8,9,121),105);assert.equal(scrubbedNumber(24,8,0,1,1,120,true),44);assert.equal(scrubbedNumber(120,0,-8,1,1,120),120);
