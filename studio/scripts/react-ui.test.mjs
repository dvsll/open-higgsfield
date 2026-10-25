import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const server = await createServer({
  configFile: false,
  cacheDir: 'outputs/.react-ui-vite-cache',
  server: { middlewareMode: true, watch: null },
  appType: 'custom',
});
try {
  const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
  const {ElementLibrary}=await server.ssrLoadModule('/studio/src/react/elements.tsx');
  const library=renderToStaticMarkup(createElement(ElementLibrary,{elements:[{id:'photo',n:'Copper Robot',d:'small robot',kind:'cast',ic:'',refs:['/outputs/1111111111111111.png']},{id:'plain',n:'Garden',d:'green plants',kind:'place',ic:''}],onSelect:()=>{},pool:()=>[]}));
  assert.match(library,/Copper Robot reference/);assert.match(library,/No reference/);assert.match(library,/Search elements/);assert.match(library,/Edit Copper Robot/);assert.match(library,/not identity conditioning/);
  const {DirectorSurface}=await server.ssrLoadModule('/studio/src/react/director-surface.tsx');
  const director=renderToStaticMarkup(createElement(DirectorSurface));assert.doesNotMatch(director,/id="(?:audio|overlay)TrackAttributes"/);assert.doesNotMatch(director,/id="els"/);assert.ok(director.indexOf('id="overlayTrack"')<director.indexOf('id="trk"'));assert.ok(director.indexOf('id="trk"')<director.indexOf('id="audioTrack"'));
  const {AdvancedPrompt}=await server.ssrLoadModule('/studio/src/react/prompt-advanced.tsx');
  const advanced=renderToStaticMarkup(createElement(AdvancedPrompt,null,createElement('textarea',{'aria-label':'Motion prompt'})));
  assert.match(advanced,/<details[^>]*id="promptAdvanced"/);assert.doesNotMatch(advanced,/<details[^>]* open/);assert.match(advanced,/<summary>Advanced<\/summary>/);assert.match(advanced,/Auto-fill in simple view/);
  const { SequenceTrack, Ruler } = await server.ssrLoadModule('/studio/src/react/timeline.tsx');
  const {GenerationDiagnostics}=await server.ssrLoadModule('/studio/src/react/generation-diagnostics.tsx');
  const loadingDetails=renderToStaticMarkup(createElement(GenerationDiagnostics,{entries:[{at:1,source:'comfy-server',message:'Requested to load <LTXV>'}]}));assert.match(loadingDetails,/Loading details/);assert.match(loadingDetails,/other ComfyUI clients/);assert.match(loadingDetails,/&lt;LTXV&gt;/);assert.equal(renderToStaticMarkup(createElement(GenerationDiagnostics)), '');
  const {FileDropOverlay}=await server.ssrLoadModule('/studio/src/react/file-drop.tsx');
  const dropOverlay=renderToStaticMarkup(createElement(FileDropOverlay,{active:true,busy:false,message:'',errors:[],onDismiss:()=>{},onFiles:()=>{}}));assert.match(dropOverlay,/Add to project files/);assert.match(dropOverlay,/type="file"/);assert.doesNotMatch(dropOverlay,/<dialog/);
  const {LayerLane,LayerEditor}=await server.ssrLoadModule('/studio/src/react/sequence-layers.tsx');
  for(const group of ['audio','overlays']){
   const lane=renderToStaticMarkup(createElement(LayerLane,{group,items:[],pixels:100,origin:0,onAdd:()=>{},onEdit:()=>{}}));
   assert.match(lane,group==='audio'?/Open Audio workflow/:/Open Overlays workflow/);assert.doesNotMatch(lane,/<dialog/);
   const creator=renderToStaticMarkup(createElement(LayerEditor,{group,embedded:true,start:0,duration:4,audioReady:false,onClose:()=>{},onSave:()=>{}}));
   assert.match(creator,/layer-workflow-editor/);assert.doesNotMatch(creator,/<dialog/);assert.match(creator,/Save to/);
  }
  const empty=renderToStaticMarkup(createElement(SequenceTrack,{clips:[],onAdd:()=>{}}));assert.match(empty,/Open Video workflow/);assert.doesNotMatch(empty,/Add scene|No video scenes/);assert.doesNotMatch(empty,/class="clip/);
  const name = '<img src=x onerror=alert(1)>';
  const html = renderToStaticMarkup(
    createElement(SequenceTrack, {
      clips: [
        {
          id: 'scene',
          name,
          duration: 4,
          generated: true,
          selected: true,
          width: 240,
          height: 80,
          bind: () => {},
        },
      ],
      onAdd: () => {},
    }),
  );
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('aria-selected="true"'));
  assert.ok(html.includes('title="Add shot"'));
  const expandedScenes=renderToStaticMarkup(createElement(SequenceTrack,{expanded:true,clips:[{id:'a',name:'First',duration:2,selected:true,generated:false,width:100,height:80,offset:0,bind:()=>{}},{id:'b',name:'Second',duration:3,selected:false,generated:false,width:150,height:80,offset:100,bind:()=>{}}]}));assert.equal((expandedScenes.match(/class="sequence-scene-row"/g)||[]).length,2);assert.match(expandedScenes,/padding-left:100px/);
  const {TrackAttributes}=await server.ssrLoadModule('/studio/src/react/track-attributes.tsx');const noSelection=renderToStaticMarkup(createElement(TrackAttributes,{kind:'video',options:{selected:-1,offset:0,shots:[]}}));assert.match(noSelection,/Select a video scene/);
  const ruler = renderToStaticMarkup(createElement(Ruler, { duration: 2, pixels: 100, half: true }));
  assert.ok(ruler.includes('left:150px'));
  assert.ok(ruler.includes('2s'));
  const { TourPopover, TourChoice } = await server.ssrLoadModule('/studio/src/react/onboarding.tsx');
  const tour = renderToStaticMarkup(
    createElement(TourPopover, {
      experience: 'beginner',
      entry: 'video',
      done: false,
      tip: { title: 'Generate', text: 'Use Generate' },
      onSkip: () => {},
      onNext: () => {},
      onWorkflow: () => {},
      onFinish: () => {},
    }),
  );
  assert.ok(tour.includes('Use the highlighted control'));
  assert.ok(!tour.includes('tour-primary'));
  assert.ok(!tour.includes('Focus'));
  const invitation=renderToStaticMarkup(createElement(TourPopover,{experience:'beginner',entry:'video',done:false,tip:{title:'Try the Image workflow',text:'Create guides'},onLater:()=>{},onSkip:()=>{},onNext:()=>{},onWorkflow:()=>{},onFinish:()=>{}}));
  assert.ok(invitation.includes('I’ll try it later'));
  assert.ok(!tour.includes('I’ll try it later'));
  const choices = renderToStaticMarkup(
    createElement(TourChoice, { onChoose: () => {}, onBack: () => {}, onSkip: () => {} }),
  );
  assert.equal((choices.match(/viewBox="0 0 16 16"/g) || []).length, 6);
  const { ModelInfo,ModelChooser,ModelCapabilities } = await server.ssrLoadModule('/studio/src/react/models.tsx');
  const groupInfo={timing:'Est: ~20s',help:{title:'Estimate',text:'GPU'},badges:[]};
  const grouped=renderToStaticMarkup(createElement(ModelChooser,{groups:[{kind:'video',label:'Video',selected:'v',rows:[{id:'v',label:'Local video',description:'Video model',info:groupInfo}]},{kind:'keyframe',label:'Image',selected:'i',rows:[{id:'i',label:'Local image',description:'Image model',info:groupInfo}]}],research:[],attach:()=>{},onChoose:()=>{},onClose:()=>{}}));
  assert.match(grouped,/<dialog/);assert.match(grouped,/studio-popup/);assert.match(grouped,/aria-label="Close model chooser"/);assert.match(grouped,/popup-close/);assert.doesNotMatch(grouped,/>Close<\/button>/);
  assert.match(grouped,/aria-label="Video models"/);assert.match(grouped,/aria-label="Image models"/);assert.ok(grouped.indexOf('Local video')<grouped.indexOf('Local image'));
  const capabilityTrigger=renderToStaticMarkup(createElement(ModelCapabilities,{info:groupInfo}));assert.match(capabilityTrigger,/aria-expanded="false"/);assert.match(capabilityTrigger,/Model capabilities/);
  const model = renderToStaticMarkup(
    createElement(ModelInfo, {
      info: {
        timing: 'Est: ~20s',
        help: { title: 'Estimate', text: 'GPU' },
        badges: [
          {
            name: 'Motion prompt',
            status: 'ready',
            label: 'Motion prompt: Available',
            help: { title: 'Motion', text: 'Write motion' },
          },
        ],
      },
      attach: () => {},
    }),
  );
  assert.ok(model.includes('Motion prompt: Available'));
  assert.ok(model.includes('Est: ~20s'));
  const chooser=renderToStaticMarkup(createElement(ModelChooser,{groups:[],research:[],attach:()=>{},onChoose:()=>{},onClose:()=>{},polisher:{id:'qwen',model:'Qwen3',available:true,cpuSupported:false,reason:''}}));assert.match(chooser,/Advanced · compute settings/);assert.match(chooser,/text processing device/);assert.match(chooser,/CPU · unavailable for this workflow/);assert.match(chooser,/value="cpu" disabled/);
  const { HistoryView,PromptHistory } = await server.ssrLoadModule('/studio/src/react/history.tsx');
  const history = renderToStaticMarkup(
    createElement(HistoryView, {
      rows: [{ id: 'n', label: 'Edit', at: 1, depth: 1 }],
      current: 'n',
      status: '',
      canUndo: true,
      canRedo: false,
      onUndo: () => {},
      onRedo: () => {},
      onGo: () => {},
    }),
  );
  assert.ok(history.includes('role="treeitem"'));
  assert.ok(history.includes('aria-level="2"'));
  assert.ok(history.includes('aria-selected="true"'));
  const revisions=[{id:'new',at:2000,parent:'old',text:'New prompt',before:'Old prompt'},{id:'old',at:1000,parent:null,text:'Old prompt',before:''}];
  const promptHistory=renderToStaticMarkup(createElement(PromptHistory,{title:'Audio prompt history',revisions,initialText:'New prompt',onClose:()=>{},onRestore:()=>{}}));
  assert.match(promptHistory,/studio-popup prompt-history-popup/);assert.match(promptHistory,/aria-label="Close prompt history"/);assert.doesNotMatch(promptHistory,/>Close<|data-revision=/);
  assert.match(promptHistory,/type="range"/);assert.match(promptHistory,/aria-label="Prompt history time"/);assert.match(promptHistory,/value="1"/);assert.match(promptHistory,/Current prompt/);
  const noHistory=renderToStaticMarkup(createElement(PromptHistory,{title:'Prompt history',revisions:[],initialText:'Unsaved draft',onClose:()=>{},onRestore:()=>{}}));
  assert.match(noHistory,/No saved edits/);assert.match(noHistory,/Unsaved draft/);assert.match(noHistory,/disabled=""/);
  console.log(
    'PASS: React timeline escaping/selection, frame ruler, tutorial action gating/experience icons, model capabilities and history tree semantics.',
  );
} finally {
  await server.close();
}
