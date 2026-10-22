import assert from 'node:assert/strict';
import { mentionAt, matchingElements, expandMentions, mentionRanges } from '../src/mention-matching.ts';
const elements = [
  { id:'mia', n:'Mia', d:'girl in a yellow raincoat', ic:'', kind:'cast' },
  { id:'bolt', n:'Bolt', d:'small robot', ic:'', kind:'cast' },
  { id:'room', n:"Mia's room", d:'bedroom with a desk', ic:'', kind:'place' },
];
assert.deepEqual(mentionAt('Look at @Mi',11), {start:8,end:11,query:'Mi'});
assert.equal(mentionAt('test@example.com',16), null);
assert.equal(mentionAt('No mention',10), null);
assert.equal(mentionAt('@Mia, hello',11), null);
assert.equal(matchingElements(elements,'').length,3);
assert.deepEqual(matchingElements(elements,'robot').map(e=>e.id),['bolt']);
assert.deepEqual(matchingElements(elements,'Mi').map(e=>e.id),['mia','room']);
assert.equal(expandMentions("@Mia meets @Bolt in @Mia's room.",elements), "Mia (girl in a yellow raincoat) meets Bolt (small robot) in Mia's room (bedroom with a desk).");
assert.equal(expandMentions('@Miax and @Unknown',elements), '@Miax and @Unknown');
assert.equal(expandMentions('test@Mia.com',elements), 'test@Mia.com');
assert.deepEqual(mentionRanges("@Mia's room and @Bolt! @Unknown @Miax",elements),[{start:0,end:11},{start:16,end:21}]);
assert.deepEqual(mentionRanges('test@Mia.com',elements),[]);
console.log('PASS: mention triggers, filtering, email exclusion, multiword names and prompt expansion.');
