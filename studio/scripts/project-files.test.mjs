import assert from 'node:assert/strict';
import {projectFiles}from'../src/project-files-index.ts';
const image='/outputs/'+ 'a'.repeat(16)+'.png',video='/outputs/'+'b'.repeat(16)+'.webm',audio='/outputs/'+'c'.repeat(16)+'.flac';
const current={SH:[{n:'Scene',video,audio,keys:[{img:image}]}],HISTORY:[{url:image,label:'Image'},{url:'https://remote.test/private.png'},{url:'/outputs/../config.json'}]};
assert.equal(projectFiles(current,{}).length,3);assert.deepEqual(new Set(projectFiles(current,{}).map(f=>f.kind)),new Set(['image','audio','video']));assert.equal(projectFiles({SH:[],HISTORY:[]},{}).length,0);assert.equal(projectFiles({}, {image:{url:image}})[0].url,image);assert.equal(projectFiles({}, {},[{n:'Actor',refs:[image]}])[0].url,image);assert.equal(projectFiles({}, {},[],{styles:[{n:'Look',refs:[image]}]})[0].url,image);assert.equal(projectFiles({TRASH:[{shot:{video}}]},{}).length,0);
console.log('PASS: project file indexing deduplicates, excludes remote/unsafe paths and trash, includes project image/audio/video references without reading other projects.');

assert.equal(projectFiles({}, {}, [], {}, [{url:image,label:'Older generated image',kind:'image'}]).length,1,'saved project assets survive the bounded take history');
