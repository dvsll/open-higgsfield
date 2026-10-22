import { OSH } from '../../shared/runtime/client';

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const photo = el<HTMLInputElement>('photo');
const product = el<HTMLImageElement>('product');
const fields = el<HTMLFieldSetElement>('fields');
const go = el<HTMLButtonElement>('go');
const status = el<HTMLParagraphElement>('status');
const outs = el<HTMLDivElement>('outs');
let image = '';
let busy = false;
let reading = false;
let selection = 0;
const sizes: Record<string, { width: number; height: number }> = {
  '16:9': { width: 512, height: 288 },
  '9:16': { width: 288, height: 512 },
  '1:1': { width: 384, height: 384 },
};
const vibes: Record<string, string> = {
  studio: 'Clean studio background, controlled lighting, smooth camera movement.',
  life: 'Natural daylight, lifestyle commercial, gentle cinematic camera movement.',
  ugc: 'Natural handheld camera movement, authentic product demonstration.',
};
function ready() { go.disabled = busy || reading || !image || !OSH.online; }
async function check() {
  const h = await OSH.health();
  el('health').textContent = h.online ? '● Local ComfyUI connected' : `Offline: ${h.reason}`;
  ready();
}
el('check').addEventListener('click', () => void check());
photo.addEventListener('change', async () => {
  const ticket = ++selection;
  image = '';
  product.removeAttribute('src');
  reading = true;
  ready();
  const file = photo.files?.[0];
  try {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Choose a PNG, JPEG or WebP under 10 MB.');
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 1536 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const normalized = canvas.toDataURL('image/png');
      if (normalized.length > 7 * 1024 * 1024) throw new Error('Photo is too complex; choose a smaller image.');
      if (ticket !== selection) return;
      image = normalized;
      product.src = image;
      status.textContent = 'Photo ready. Choose formats and generate.';
    } finally { bitmap.close(); }
  } catch (e) {
    if (ticket === selection) status.textContent = (e as Error).message;
  } finally {
    if (ticket === selection) { reading = false; ready(); }
  }
});
el<HTMLFormElement>('brief').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy || reading || !image) return;
  const ratios = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="ratio"]:checked')).map(x => x.value);
  if (!ratios.length) { status.textContent = 'Select at least one format.'; return; }
  const pitch = el<HTMLTextAreaElement>('pitch').value.trim();
  if (!pitch) { status.textContent = 'Write a motion brief.'; return; }
  const duration = Number(el<HTMLSelectElement>('duration').value);
  const seed = Number(el<HTMLInputElement>('seed').value);
  const prompt = `${pitch} ${vibes[el<HTMLSelectElement>('vibe').value]} Preserve the reference product appearance and branding. No added text.`;
  busy = true;
  fields.disabled = true;
  photo.disabled = true;
  ready();
  let completed = 0;
  try {
    await check();
    if (!OSH.online) throw new Error(OSH.reason + '. Start ComfyUI and the proxy, then check connection.');
    status.textContent = 'Uploading product reference…';
    const uploaded = await OSH.upload(image);
    for (const ratio of ratios) {
      status.textContent = `Generating ${ratio} (${completed + 1}/${ratios.length})… This may take several minutes. Keep this tab open.`;
      const result = await OSH.shot([{ image: uploaded.url, t: 0 }], prompt, duration, seed, sizes[ratio]);
      const card = document.createElement('article');
      card.className = 'out';
      const title = document.createElement('strong');
      title.textContent = `${ratio} · ${(result.frames / 24).toFixed(1)} s · rendered in ${result.seconds} s`;
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = result.url;
      const download = document.createElement('a');
      download.href = result.url;
      download.download = `ad-${ratio.replace(':', 'x')}-${seed}.webm`;
      download.textContent = 'Download WebM';
      const details = document.createElement('p');
      details.className = 'note';
      details.textContent = `Seed ${seed} · ${prompt}`;
      card.append(title, video, download, details);
      outs.prepend(card);
      completed++;
    }
    status.textContent = `${completed} video${completed === 1 ? '' : 's'} ready. Preview or download below.`;
  } catch (e) {
    status.textContent = `${completed ? `${completed} video(s) saved below. ` : ''}${(e as Error).message} You can retry generation.`;
  } finally {
    busy = false;
    fields.disabled = false;
    photo.disabled = false;
    ready();
  }
});
void check();
