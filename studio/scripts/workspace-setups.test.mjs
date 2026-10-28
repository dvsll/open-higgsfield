import assert from 'node:assert/strict';
import {workflowPromptMedia,basicVideoWorkspace,workspaceNameError,recycleWorkspace,restoredWorkspaceName} from '../src/workspace-setups.ts';
import {ids,panel} from '../src/window-layout.ts';
const base=basicVideoWorkspace();
assert.equal(base.mode,'video');
assert.deepEqual(ids(base.tree),['prompts','viewer']);
const second=basicVideoWorkspace();base.tree.first.id='changed';
assert.deepEqual(ids(second.tree),['prompts','viewer']);
const presets={Video:second},layouts={Video:structuredClone(second),Mine:{tree:panel('keyframes'),mode:'image'}},deleted={};
assert.equal(recycleWorkspace(layouts,deleted,presets,'Video'),false);
assert.equal(recycleWorkspace(layouts,deleted,presets,'Missing'),false);
const original=layouts.Mine;
assert.equal(recycleWorkspace(layouts,deleted,presets,'Mine'),true);
assert.equal(Object.hasOwn(layouts,'Mine'),false);
assert.deepEqual(deleted.Mine,original);
original.tree.id='mutated';assert.equal(deleted.Mine.tree.id,'keyframes');
const restored=JSON.parse(JSON.stringify(deleted));assert.equal(restored.Mine.mode,'image');
assert.equal(restoredWorkspaceName('Mine',['Mine','Mine (2)']),'Mine (3)');
for(const name of ['video','Mine','__proto__','constructor','__new','', 'x'.repeat(81)])assert.ok(workspaceNameError(name,['Video','Mine']));
assert.equal(workspaceNameError('Mine',['Video','Mine'],'Mine'),'');
assert.ok(workspaceNameError('mine',['Video','Mine'],'Mine'));
assert.equal(workspaceNameError('Fresh',['Video','Mine']),'');
console.log('PASS: minimal independent video layouts, preset protection, recoverable custom deletion, persistence, restore collisions and safe workspace names.');

for(const [name,media] of Object.entries({Video:'video',Image:'image',Audio:'audio','3D':'3d'}))for(const saved of ['video','image','audio','3d'])assert.equal(workflowPromptMedia(name,{tree:null,mode:saved==='image'?'image':'video',promptMedia:saved}),media);
assert.equal(workflowPromptMedia('Custom',{tree:null,mode:'video',promptMedia:'audio'}),'audio');
assert.equal(workflowPromptMedia('Custom',{tree:null,mode:'image'}),'image');
console.log('PASS: creation workflow media overrides stale saved choices; custom layouts retain their media.');

// Run the real dock startup tail: legacy controller callbacks must see connected controls.
const {readFileSync}=await import('node:fs');
const dockCode=readFileSync(new URL('../src/workspace-dock.ts',import.meta.url),'utf8');
const startup=dockCode.slice(dockCode.lastIndexOf(" addEventListener('resize', refresh);"),dockCode.lastIndexOf('}'));
for(const name of ['Video','Image','Audio','3D']){
 let connected=false,applied=null,published=null,persisted=false;
 const ctx={custom:false,setup:{tree:null,mode:'image',promptMedia:'image'},active:name,panels:new Map(),fallback:{},switching:false,addEventListener(){},refresh(){},remove:tree=>tree,valid:()=>true,clone:structuredClone,choices(){},render(){connected=true},workflow:mode=>{assert.ok(connected,'Workflow cannot run while service controls are detached');applied=mode},publishPromptMedia:media=>{published=media},persist(){persisted=true},workflowPromptMedia};
 Function('ctx','with(ctx){'+startup+'}')(ctx);
 assert.equal(published,{Video:'video',Image:'image',Audio:'audio','3D':'3d'}[name]);assert.equal(applied,name==='Image'?'image':'video');assert.ok(persisted);
}
console.log('PASS: real dock initialization mounts service hosts before applying workflow media.');
