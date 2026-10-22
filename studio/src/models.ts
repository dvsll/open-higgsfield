import { OSH, type LocalModels, type ShotKey } from '../../shared/runtime/client';
import { serverEstimate } from './model-estimates';
import { frameSize, mountFrameSizes, videoTiming } from './frame-size';
import type { ModelChoice } from '../../shared/runtime/model-catalog';
import { SHELL } from './shell';
import { attachElementMentions } from './element-mentions';
import { expandMentions } from './mention-matching';

type Kind = 'keyframe' | 'video';
const select = (kind: Kind) => document.getElementById(`${kind}Model`) as HTMLSelectElement;
const storageKey = 'osh-local-models';
let chosen: Partial<Record<Kind, string>> = {};
let catalog: LocalModels | null = null;
let context = { duration: 4, missingKeys: 0, frames:97 };
try { chosen = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { /* Use installed defaults. */ }

function model(kind: Kind): string {
  const control = select(kind);
  if (control.disabled || !control.value) throw new Error(`Refresh local models and select a ${kind} model first`);
  return control.value;
}

export function estimateContext(duration: number, missingKeys: number,frames=97): void {
  if (context.duration === duration && context.missingKeys === missingKeys&&context.frames===frames) return;
  context = { duration, missingKeys,frames };
  renderDetails();
}

const usage: Record<string, string> = {
  'Shot prompt': 'Use Shot prompt to describe the scene. Use the separate Motion prompt box for camera and subject movement. Both are sent together to the video model.',
  'Text to image': 'Write your prompt in Generate keyframe, choose Elements and Framing, then Generate 4 keyframes.',
  'Keyframe-guided video': 'Optional: double-click a shot, add image guides and drag them to the clip edges for start/end frames or into the middle for timed guidance. Generate shot also works with no guides.',
  'Motion prompt': 'Describe movement in the motion box next to Generate shot, for example: slow camera push toward the robot.',
  'Elements': 'Type @ in Image, Shot or Motion prompt, then search and choose an element. Mentions expand into descriptions; this does not lock character identity.',
  'JSON posing': 'There is no pose JSON input yet. A pose-control workflow and parser must be connected before you can use it.',
  'LoRA stylization': 'LoRA loading is not wired up yet. Training assets are in the local LoRA lab; they are not active style adapters.',
  'Reference image editing': 'Editing from a source image needs a separate image-edit workflow. The current image model generates a new image from text.',
};
let tooltip: HTMLDivElement | null = null;
function attachHelp(button: HTMLButtonElement, heading: string, description: string): void {
  const show = () => {
    tooltip ??= Object.assign(document.createElement('div'), { id: 'model-tooltip', className: 'model-tooltip' });
    tooltip.setAttribute('role', 'tooltip');
    const title = document.createElement('strong'); title.textContent = heading;
    const text = document.createElement('div'); text.textContent = description;
    tooltip.replaceChildren(title, text); (chooser?.open ? chooser : document.body).append(tooltip); tooltip.hidden = false;
    button.setAttribute('aria-describedby', tooltip.id);
    const r = button.getBoundingClientRect();
    tooltip.style.left = `${Math.max(8, Math.min(r.left, innerWidth - tooltip.offsetWidth - 8))}px`;
    tooltip.style.top = `${r.bottom + tooltip.offsetHeight + 8 > innerHeight ? Math.max(8, r.top - tooltip.offsetHeight - 8) : r.bottom + 8}px`;
  };
  const hide = () => { if (tooltip) tooltip.hidden = true; button.removeAttribute('aria-describedby'); };
  button.onmouseenter = show; button.onmouseleave = hide;
  button.onfocus = show; button.onblur = hide; button.onclick = show;
  button.onkeydown = e => { if (e.key === 'Escape') hide(); };
}
function renderDetails(): void {
  dispatchEvent(new Event('osh-models-changed'));
  if (tooltip) tooltip.hidden = true;
  for (const kind of ['keyframe', 'video'] as const) {
    const el = document.getElementById(`${kind}ModelDetails`);
    if (!el) continue;
    el.replaceChildren();
    const entry = catalog?.[kind].find(m => m.id === select(kind).value);
    if (catalog) document.querySelectorAll<HTMLElement>(`[data-model-kind="${kind}"][data-model-control]`).forEach(field => {
      field.hidden = !entry?.capabilities.some(capability => capability.control === field.dataset.modelControl && capability.status !== 'unavailable');
    });
    const picker = document.getElementById(`${kind}ModelPicker`) as HTMLButtonElement | null;
    if (picker) {
      picker.textContent = `${entry?.label || 'Choose model'} ▾`; picker.disabled = !catalog;
      picker.setAttribute('aria-label', `${kind === 'video' ? 'Video' : 'Image'} model: ${entry?.label || 'unavailable'}. Choose model`);
    }
    if (!entry) {if(kind==='video'){el.replaceChildren();const estimate=document.getElementById('videoGenerationEstimate');if(estimate)estimate.textContent='Est: unavailable'}else el.textContent='Est: unavailable';continue; }
    renderModelInfo(kind, entry, el);
  }
}
function renderModelInfo(kind: Kind, entry: ModelChoice, el: HTMLElement): void {
    let size; try { size=frameSize(kind,false); } catch { el.textContent='Enter valid dimensions';return; }
    const step=kind==='video'?32:16, width=Math.ceil(size.width/step)*step,height=Math.ceil(size.height/step)*step;
    const timingServer=catalog?.timing;
    const videoServer=kind==='video'&&context.missingKeys&&timingServer?{...timingServer,activeModel:select('keyframe').value}:timingServer;
    const estimate=serverEstimate(entry,context.duration,width,height,videoServer,kind==='video'?context.frames:undefined);
    let total=estimate.seconds,extra=0;
    if(kind==='video'&&context.missingKeys){const image=catalog?.keyframe.find(m=>m.id===select('keyframe').value);if(image){const imageSize=frameSize('keyframe',false);const iw=Math.ceil(imageSize.width/16)*16,ih=Math.ceil(imageSize.height/16)*16;const first=serverEstimate(image,1,iw,ih,timingServer);const rest=serverEstimate(image,1,iw,ih,timingServer?{...timingServer,activeModel:image.id}:undefined);if(first.seconds!==null&&rest.seconds!==null){extra=first.seconds+(context.missingKeys-1)*rest.seconds;total=total===null?null:total+extra;}}}
    const audioRequested=kind==='video'&&!!(document.getElementById('audioPrompt') as HTMLTextAreaElement|null)?.value.trim();
    const timing=document.createElement('button');timing.type='button';timing.className='model-time';timing.textContent=total===null?'Est: benchmark needed':audioRequested?`Video ~${total}s · audio extra`:`Est: ~${total}s`;
    attachHelp(timing,'Server-based estimate',`${timingServer?.hardware?.name||'GPU unavailable'} · ${timingServer?.hardware?.vramGB||'?'} GB VRAM. ${size.width}×${size.height}${kind==='video'?` · ${context.duration}s clip`: ' per image'}. ${estimate.basis}. ${estimate.render??'?'}s rendering + ${estimate.load}s observed model-switch overhead${extra?` + ${extra}s for ${context.missingKeys} missing keyframes`:''}. ${timingServer?.queued?`${timingServer.queued} queued jobs; waiting is additional.`:'Queue empty at last refresh.'} Resolution/frame scaling is approximate; measured samples improve the estimate.`);    const label = document.createElement('span'); label.className = 'cap-label'; label.textContent = 'Capabilities';
    const badges = document.createElement('div'); badges.className = 'cap-badges';
    for (const capability of entry.capabilities.filter(capability => capability.status !== 'unavailable')) {
      const badge = document.createElement('button'); badge.type = 'button'; badge.className = capability.status;
      const state = capability.status === 'ready' ? 'Available' : capability.status === 'prompt' ? 'Prompt only' : 'Not connected';
      badge.textContent = capability.name;
      badge.setAttribute('aria-label', `${capability.name}: ${state}`);
      attachHelp(badge, `${capability.name} · ${state}`, `${capability.detail} ${usage[capability.name] || ''}${capability.control ? ' Click to open this control.' : ''}`);
      if (capability.control && capability.status !== 'unavailable') badge.onclick = () => {
        select(kind).value = entry.id; chosen[kind] = entry.id;
        localStorage.setItem(storageKey, JSON.stringify(chosen)); renderDetails(); chooser?.close();
        requestAnimationFrame(() => {
          if (tooltip) tooltip.hidden = true;
          if (capability.control === 'timeline') dispatchEvent(new CustomEvent('osh-model-control', { detail: 'timeline' }));
          const target = document.getElementById(capability.control!)!;
          target?.scrollIntoView({ block: 'nearest' });
          const focus = target?.matches('textarea,input,button') ? target : target?.querySelector<HTMLElement>('button');
          (focus as HTMLElement | undefined)?.focus();
        });
      };
      badges.append(badge);
    }
    if(kind==='video'&&el.id==='videoModelDetails'){document.getElementById('videoGenerationEstimate')?.replaceChildren(timing);el.append(label,badges)}else el.append(timing, label, badges);
}
let chooser: HTMLDialogElement | null = null;
function chooseModel(kind: Kind): void {
  chooser?.remove();
  chooser = document.createElement('dialog'); chooser.className = 'model-chooser';
  chooser.setAttribute('aria-label', kind === 'video' ? 'Choose video model' : 'Choose image model');
  const heading = document.createElement('header');
  const title = document.createElement('h2'); title.textContent = kind === 'video' ? 'Choose video model' : 'Choose image model';
  const close = document.createElement('button'); close.textContent = 'Close'; close.onclick = () => chooser?.close();
  heading.append(title, close); chooser.append(heading);
  const hint = document.createElement('small'); hint.textContent = 'Select a model name. Hover or focus capabilities for explanations and usage.'; chooser.append(hint);
  for (const entry of catalog?.[kind] || []) {
    const row = document.createElement('div'); row.className = `model-choice${entry.id === select(kind).value ? ' active' : ''}`;
    const button = document.createElement('button'); button.type = 'button';
    button.setAttribute('aria-pressed', String(entry.id === select(kind).value));
    const name = document.createElement('b'); name.textContent = entry.label;
    const description = document.createElement('small'); description.textContent = entry.description;
    button.append(name, description);
    button.onclick = () => {
      select(kind).value = entry.id; chosen[kind] = entry.id;
      localStorage.setItem(storageKey, JSON.stringify(chosen)); renderDetails(); chooser?.close();
    };
    const info = document.createElement('div'); info.className = 'model-card'; renderModelInfo(kind, entry, info);
    row.append(button, info); chooser.append(row);
  }
  for (const research of kind === 'keyframe' ? catalog?.research || [] : []) {
    const row = document.createElement('div'); row.className = 'model-research';
    row.textContent = `${research.repo} · downloaded for LoRA training · generation workflow not connected · estimate unavailable`;
    chooser.append(row);
  }
  chooser.onclose = () => { if (tooltip) tooltip.hidden = true; };
  document.body.append(chooser); chooser.showModal();
}
// The same selections apply to direct generation, automatic keyframes, and stylization.
export const localGeneration = {
  async keyframe(prompt: string, seed = 1) {
    const id = model('keyframe'); const result = await OSH.keyframe(expandMentions(prompt, SHELL.ELEMENTS), seed, frameSize('keyframe'), id);
    catalog=await OSH.models().catch(()=>catalog);renderDetails();return result;
  },
  async shot(keys: ShotKey[], prompt: string, duration: number, seed = 1,timing:{frames:number;fps:number;width?:number;height?:number}=videoTiming()) {
    const id = model('video'); const result = await OSH.shot(keys, expandMentions(prompt, SHELL.ELEMENTS), duration, seed, {...frameSize('video'),...timing,model:id});
    catalog=await OSH.models().catch(()=>catalog);renderDetails();return result;
  },
};

export async function refreshModels(): Promise<void> {
  const button = document.getElementById('refreshModels') as HTMLButtonElement;
  const status = document.getElementById('modelStatus')!;
  const count = document.getElementById('modelCount')!;
  button.disabled = true;
  status.textContent = 'Reading models from local ComfyUI…';
  for (const kind of ['keyframe', 'video'] as const) select(kind).disabled = true;
  try {
    const data: LocalModels = await OSH.models();
    catalog = data;
    const audioStatus=document.getElementById('audioStatus');if(audioStatus)audioStatus.textContent=data.audio?.available?'Stable Audio Open · Powered by Stability AI':'Audio models not installed · refresh after setup';
    for (const kind of ['keyframe', 'video'] as const) {
      const control = select(kind);
      control.replaceChildren();
      for (const entry of data[kind]) control.add(new Option(entry.label, entry.id));
      if (!data[kind].length) control.add(new Option('No compatible model installed', ''));
      if (data[kind].some(entry => entry.id === chosen[kind])) control.value = chosen[kind]!;
      chosen[kind] = control.value;
      control.disabled = data[kind].length === 0;
      control.onchange = () => {
        chosen[kind] = control.value;
        localStorage.setItem(storageKey, JSON.stringify(chosen));
        renderDetails();
      };
    }
    localStorage.setItem(storageKey, JSON.stringify(chosen));
    renderDetails();
    const inventory = document.getElementById('modelInventory')!;
    inventory.replaceChildren();
    for (const group of data.inventory) {
      const section = document.createElement('details');
      const title = document.createElement('summary');
      title.textContent = `${group.category.replaceAll('_', ' ')} · ${group.files.length}`;
      section.append(title);
      for (const file of group.files) {
        const row = document.createElement('div');
        row.textContent = file;
        section.append(row);
      }
      inventory.append(section);
    }
    for (const item of data.research || []) {
      const row = document.createElement('p');
      row.textContent = `${item.repo} · ${(item.bytes / 1e9).toFixed(2)} GB downloaded · LoRA lab only; generation workflow not connected`;
      inventory.append(row);
    }
    count.textContent = `${data.inventory.reduce((n, group) => n + group.files.length, 0)} installed`;
    status.textContent = 'Connected to local ComfyUI. Selectors show models with a compatible app workflow and installed supporting models. All other local models are listed below.';
  } catch (error) {
    catalog = null;
    count.textContent = 'offline';
    status.textContent = (error as Error).message;
    document.getElementById('modelInventory')!.replaceChildren();
    for (const kind of ['keyframe', 'video'] as const) select(kind).replaceChildren(new Option('ComfyUI unavailable', ''));
    renderDetails();
  } finally {
    button.disabled = false;
    const { online, reason } = await OSH.health();
    const badge = document.getElementById('rt')!;
    badge.classList.toggle('on', online);
    badge.textContent = online ? '● local ComfyUI' : '○ disconnected';
    badge.title = online ? 'Connected to local ComfyUI through the Comfy SDK' : reason;
  }
}

export function mountModels(): void {
  mountFrameSizes(()=>{const size=frameSize('video',false);const canvas=document.getElementById('cv') as HTMLCanvasElement;canvas.width=size.width;canvas.height=size.height;(canvas.parentElement as HTMLElement).style.aspectRatio=String(size.width/size.height);renderDetails()});
  for (const [id, kind] of [['kp','keyframe'],['shotPromptInput','video'],['motion','video']] as const) {
    attachElementMentions(document.getElementById(id) as HTMLTextAreaElement, SHELL.ELEMENTS, () => !!catalog?.[kind].find(m => m.id === select(kind).value)?.capabilities.some(c => c.name === 'Elements' && c.status !== 'unavailable'));
  }
  for (const kind of ['keyframe', 'video'] as const) {
    const control = select(kind); control.classList.add('model-native'); control.tabIndex = -1; control.setAttribute('aria-hidden', 'true');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'model-picker'; button.id = `${kind}ModelPicker`;
    button.textContent = 'Connecting…'; button.disabled = true; button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', kind === 'video' ? 'Choose video model' : 'Choose image model');
    button.onclick = () => chooseModel(kind); control.after(button);
  }
  document.getElementById('refreshModels')!.onclick = () => { void refreshModels(); };
  void refreshModels();
}

addEventListener('osh-audio-prompt',()=>renderDetails());
addEventListener('osh-reconnected',()=>{if(document.getElementById('refreshModels'))void refreshModels()});
