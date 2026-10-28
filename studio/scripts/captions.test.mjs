import assert from 'node:assert/strict';
import {captionSegments,captionSrt} from '../../shared/lib/captions.ts';
import {applyCaptions} from '../src/caption-state.ts';
const segments=[{start:0,end:1.25,text:'Hello there.'},{start:1.25,end:3,text:'Welcome back.'}];
const source={id:'sound-1',url:'/outputs/1111111111111111.flac',label:'Voice',start:7,duration:2,origin:'timeline'};
const state={overlays:[{id:'manual',kind:'text',name:'Title',start:0,duration:2,text:'Keep me'}],audio:[]};
const applied=applyCaptions(state,source,segments);
assert.equal(applied.overlays.length,3);assert.equal(applied.overlays[1].start,7);assert.equal(applied.overlays[2].duration,.75);
assert.equal(applied.overlays[1].captionSource,'sound-1');
const replaced=applyCaptions(applied,source,[{start:0,end:1,text:'Corrected'}]);
assert.equal(replaced.overlays.length,2);assert.equal(replaced.overlays[0].text,'Keep me');assert.equal(replaced.overlays[1].text,'Corrected');
assert.equal(state.overlays.length,1);assert.deepEqual(captionSegments([{start:-1,end:2,text:'bad'},{start:1,end:1,text:'bad'},{start:0,end:1,text:'  '}]),[]);
assert.throws(()=>captionSegments(null));
assert.match(captionSrt(segments),/00:00:01,250 --> 00:00:03,000/);
assert.match(captionSrt([{start:59.9996,end:61,text:'Rounded'}]),/00:01:00,000 --> 00:01:01,000/);
console.log('PASS: speech segment validation, source-relative timeline offsets, duration clipping, source-specific replacement, immutable history input and SRT timing.');

const {captionFileSource}=await import('../src/caption-state.ts');
const library=[{url:'/outputs/1111111111111111.webm',kind:'video',label:'Video'},{url:'/outputs/2222222222222222.flac',kind:'audio',label:'Audio'},{url:'/outputs/3333333333333333.png',kind:'image',label:'Image'}];
assert.equal(captionFileSource(library,library[0].url).url,library[0].url);assert.equal(captionFileSource(library,library[1].url).origin,'library');assert.equal(captionFileSource(library,library[2].url),null);assert.equal(captionFileSource(library,'https://example.com/audio.wav'),null);assert.equal(captionFileSource(library,'/outputs/4444444444444444.flac'),null);

const {parseCaptionSrt}=await import('../../shared/lib/captions.ts');
assert.deepEqual(parseCaptionSrt(captionSrt(segments)),segments);
assert.deepEqual(parseCaptionSrt('\uFEFF1\r\n00:00:00,000 --> 00:00:02,500\r\nTwo lines\r\nof text.\r\n\r\n2\r\n00:00:01.000 --> 00:00:03.000\r\nOverlap is intentional.'),[{start:0,end:2.5,text:'Two lines\nof text.'},{start:1,end:3,text:'Overlap is intentional.'}]);
for(const invalid of ['', '1\n00:00:02,000 --> 00:00:01,000\nWrong', '1\n00:99:00,000 --> 00:99:01,000\nWrong','1\n00:00:00,000 --> 00:00:01,000\n'])assert.throws(()=>parseCaptionSrt(invalid));
assert.throws(()=>parseCaptionSrt('x'.repeat(2_000_001)));
assert.throws(()=>applyCaptions(state,{...source,start:3601},segments),/timeline range/);

const {retimeCaption}=await import('../src/caption-state.ts');
const range={start:2,end:4,text:'Bound to audio'};
assert.deepEqual(retimeCaption(range,-4,'move',10),{...range,start:0,end:2});assert.deepEqual(retimeCaption(range,20,'move',10),{...range,start:8,end:10});assert.equal(retimeCaption(range,5,'start',10).start,3.99);assert.equal(retimeCaption(range,-5,'end',10).end,2.01);assert.equal(range.start,2);

const {captionText,transcriptionOutput}=await import('../../shared/lib/captions.ts');
assert.equal(captionText([{start:0,end:1,text:'  First\nline. '},{start:1,end:2,text:'Second line.'}]),'First line. Second line.');
assert.deepEqual(transcriptionOutput(segments,'text'),{text:'Hello there. Welcome back.',srt:null});
assert.equal(transcriptionOutput(segments).srt,captionSrt(segments));
assert.equal(transcriptionOutput([]).srt,null);
assert.equal(captionText(parseCaptionSrt(captionSrt(segments))),'Hello there. Welcome back.');
console.log('PASS: text-only transcription omits SRT and subtitle-to-speech strips cue timing without changing words.');
