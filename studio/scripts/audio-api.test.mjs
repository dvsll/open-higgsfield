import assert from 'node:assert/strict';
const base=process.env.OSH_TEST_URL||'http://127.0.0.1:8288';
for(const body of [{prompt:''},{prompt:'rain',duration:48},{prompt:'rain',duration:-1},{prompt:'rain',video:'/outputs/../../secret'},{prompt:'rain',video:'https://example.com/video.webm'}]){
 const response=await fetch(base+'/api/audio',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,400,JSON.stringify(body));
}
const response=await fetch(base+'/api/models');const models=await response.json();assert.equal(typeof models.audio.available,'boolean');
console.log('PASS: audio duration/prompt validation, API-owned media boundary and model readiness metadata.');
