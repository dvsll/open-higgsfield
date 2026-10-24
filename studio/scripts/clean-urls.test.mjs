import assert from 'node:assert/strict';
import {createServer,preview} from 'vite';
import {studioRoute,cleanStudioUrls} from '../clean-urls.ts';
assert.deepEqual(studioRoute('/studio/director.html?from=edit&token=a%2Bb'),{redirect:'/studio/director?from=edit&token=a%2Bb'});
assert.deepEqual(studioRoute('/studio/edit?from=director'),{rewrite:'/studio/edit.html?from=director'});
assert.deepEqual(studioRoute('/studio/design-lab/'),{redirect:'/studio/design-lab'});
assert.deepEqual(studioRoute('/adstudio/'),{});assert.deepEqual(studioRoute('/api/shot'),{});assert.deepEqual(studioRoute('/studio/src/director.ts'),{});assert.deepEqual(studioRoute('/studio/unknown'),{});
for(const production of [false,true]){
 const options={configFile:false,plugins:[cleanStudioUrls()],appType:'mpa',cacheDir:'outputs/.route-test-vite-cache',server:{host:'127.0.0.1',port:0},preview:{host:'127.0.0.1',port:0}};
 const server=production?await preview(options):await createServer(options);if(!production)await server.listen();
 try{const address=server.httpServer.address(),base='http://127.0.0.1:'+address.port;
  for(const [path,title]of [['director','Director Demo'],['edit','Edit Anything'],['design-lab','Cinema Studio']]){
   const response=await fetch(base+'/studio/'+path);assert.equal(response.status,200);assert.match(await response.text(),new RegExp(title));
   const old=await fetch(base+'/studio/'+path+'.html?from=test',{redirect:'manual'});assert.equal(old.status,308);assert.equal(old.headers.get('location'),'/studio/'+path+'?from=test');
  }
  const head=await fetch(base+'/studio/director',{method:'HEAD'});assert.equal(head.status,200);
  assert.equal((await fetch(base+'/studio/not-a-page')).status,404);
  assert.equal((await fetch(base+'/adstudio/')).status,200);
 }finally{if(production)await new Promise(resolve=>server.httpServer.close(resolve));else await server.close()}
}
console.log('PASS clean Studio routes in dev and built preview, legacy redirects/query preservation, HEAD, unknown404 and Ad Studio isolation.');
