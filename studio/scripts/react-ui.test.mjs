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
  const {AdvancedPrompt}=await server.ssrLoadModule('/studio/src/react/prompt-advanced.tsx');
  const advanced=renderToStaticMarkup(createElement(AdvancedPrompt,null,createElement('textarea',{'aria-label':'Motion prompt'})));
  assert.match(advanced,/<details[^>]*id="promptAdvanced"/);assert.doesNotMatch(advanced,/<details[^>]* open/);assert.match(advanced,/<summary>Advanced<\/summary>/);assert.match(advanced,/Auto-fill details/);
  const { SequenceTrack, Ruler } = await server.ssrLoadModule('/studio/src/react/timeline.tsx');
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
  const choices = renderToStaticMarkup(
    createElement(TourChoice, { onChoose: () => {}, onBack: () => {}, onSkip: () => {} }),
  );
  assert.equal((choices.match(/viewBox="0 0 16 16"/g) || []).length, 6);
  const { ModelInfo } = await server.ssrLoadModule('/studio/src/react/models.tsx');
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
  const { HistoryView } = await server.ssrLoadModule('/studio/src/react/history.tsx');
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
  console.log(
    'PASS: React timeline escaping/selection, frame ruler, tutorial action gating/experience icons, model capabilities and history tree semantics.',
  );
} finally {
  await server.close();
}
