import { OSH, type LocalModels, type ShotKey } from '../../shared/runtime/client';

type Kind = 'keyframe' | 'video';
const select = (kind: Kind) => document.getElementById(`${kind}Model`) as HTMLSelectElement;
const storageKey = 'osh-local-models';
let chosen: Partial<Record<Kind, string>> = {};
try { chosen = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { /* Use installed defaults. */ }

function model(kind: Kind): string {
  const control = select(kind);
  if (control.disabled || !control.value) throw new Error(`Refresh local models and select a ${kind} model first`);
  return control.value;
}

// The same selections apply to direct generation, automatic keyframes, and Stylemaxx.
export const localGeneration = {
  keyframe: (prompt: string, seed = 1) => OSH.keyframe(prompt, seed, {}, model('keyframe')),
  shot: (keys: ShotKey[], prompt: string, duration: number, seed = 1) => OSH.shot(keys, prompt, duration, seed, model('video')),
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
      };
    }
    localStorage.setItem(storageKey, JSON.stringify(chosen));
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
    count.textContent = `${data.inventory.reduce((n, group) => n + group.files.length, 0)} installed`;
    status.textContent = 'Connected to local ComfyUI. Selectors show models with a compatible app workflow and installed supporting models. All other local models are listed below.';
  } catch (error) {
    count.textContent = 'offline';
    status.textContent = (error as Error).message;
    document.getElementById('modelInventory')!.replaceChildren();
    for (const kind of ['keyframe', 'video'] as const) select(kind).replaceChildren(new Option('ComfyUI unavailable', ''));
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
  document.getElementById('refreshModels')!.onclick = () => { void refreshModels(); };
  void refreshModels();
}
