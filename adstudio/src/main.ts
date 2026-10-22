import { OSH } from '../../shared/runtime/client';

import { taglineOverlay } from './overlay';
import type { ShotResult } from '../../shared/runtime/client';
import { prepareReference, type Framing } from './reference';

const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const photo = el<HTMLInputElement>('photo');
const product = el<HTMLImageElement>('product');
const fields = el<HTMLFieldSetElement>('fields');
const go = el<HTMLButtonElement>('go');
const status = el<HTMLParagraphElement>('status');
const outs = el<HTMLDivElement>('outs');
const exportAll = el<HTMLButtonElement>('export-all');
const modeInput = el<HTMLSelectElement>('mode');
type Mode = 'creative' | 'locked' | 'camera';
type Ad = { mode: Mode; ratio: Ratio; seed: number; source: string; tagline: string; video: HTMLVideoElement; button: HTMLButtonElement; link: HTMLAnchorElement; message: HTMLParagraphElement; exporting: boolean; exported: boolean };
const ads: Ad[] = [];
let batchExporting = false;
let image = '';
let busy = false;
let reading = false;
let selection = 0;
const sizes = {
  '16:9': { width: 512, height: 288 },
  '9:16': { width: 288, height: 512 },
  '1:1': { width: 384, height: 384 },
};
type Ratio = keyof typeof sizes;
const vibes: Record<string, string> = {
  studio: 'Clean studio background, controlled lighting, smooth camera movement.',
  life: 'Natural daylight, lifestyle commercial, gentle cinematic camera movement.',
  ugc: 'Natural handheld camera movement, authentic product demonstration.',
};
function ready() {
  go.disabled = busy || reading || !image || (modeInput.value !== 'camera' && !OSH.online);
  exportAll.disabled = busy || batchExporting || !ads.some(ad => !ad.exported && !ad.exporting);
}
function updateMode() {
  const mode = modeInput.value as Mode;
  el<HTMLSelectElement>('camera-motion').disabled = mode !== 'camera';
  el<HTMLSelectElement>('framing').disabled = mode !== 'creative';
  el<HTMLSelectElement>('vibe').disabled = mode === 'camera';
  el<HTMLInputElement>('seed').disabled = mode === 'camera';
  el<HTMLTextAreaElement>('pitch').disabled = mode === 'camera';
  el('mode-help').textContent = mode === 'creative' ? 'Creative can reinterpret product textures and lettering.' : mode === 'locked' ?
    'A static rectangle from your original photo covers the generated background. The photo is fitted with a margin; no automatic segmentation.' :
    'Conventional push/pan of the original photo. No prompt, seed, GPU generation or invented scene movement. Margins keep the source inside the frame.';
  go.textContent = mode === 'camera' ? 'Animate photo' : 'Generate video';
  ready();
}
modeInput.addEventListener('change', updateMode);
async function exportAd(ad: Ad): Promise<boolean> {
  if (ad.exporting || ad.exported) return ad.exported;
  ad.exporting = true;
  ad.button.disabled = true;
  ad.message.textContent = 'Exporting MP4…';
  ready();
  try {
    let overlay: string | undefined;
    if (ad.tagline) {
      const size = sizes[ad.ratio];
      overlay = (await OSH.upload(taglineOverlay(size.width, size.height, ad.tagline))).url;
    }
    const result = await OSH.exportVideo(ad.source, overlay);
    ad.link.href = result.url;
    ad.link.download = `ad-${ad.mode}-${ad.ratio.replace(':', 'x')}-${ad.seed}.mp4`;
    ad.link.textContent = 'Download MP4';
    ad.link.hidden = false;
    ad.video.src = result.url;
    ad.message.textContent = `MP4 ready${ad.tagline ? ' with tagline' : ''} · exported in ${result.seconds} s`;
    ad.button.textContent = 'MP4 exported';
    ad.exported = true;
    return true;
  } catch (error) {
    ad.message.textContent = (error as Error).message;
    ad.button.textContent = 'Retry MP4 export';
    return false;
  } finally {
    ad.exporting = false;
    ad.button.disabled = ad.exported;
    ready();
  }
}
exportAll.addEventListener('click', async () => {
  batchExporting = true;
  ready();
  let failed = 0;
  for (const ad of ads.filter(ad => !ad.exported && !ad.exporting)) if (!(await exportAd(ad))) failed++;
  batchExporting = false;
  status.textContent = failed ? `${failed} export(s) failed. Generated WebMs remain available; retry on each card.` : 'MP4 exports ready. Preview or download each format below.';
  ready();
});
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
  const ratios = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="ratio"]:checked')).map(x => x.value as Ratio);
  if (!ratios.length) { status.textContent = 'Select at least one format.'; return; }
  const pitch = el<HTMLTextAreaElement>('pitch').value.trim();
  const mode = modeInput.value as Mode;
  if (mode !== 'camera' && !pitch) { status.textContent = 'Write a motion brief.'; return; }
  const duration = Number(el<HTMLSelectElement>('duration').value);
  const seed = Number(el<HTMLInputElement>('seed').value);
  const tagline = el<HTMLInputElement>('tagline').value.trim();
  const framing = el<HTMLSelectElement>('framing').value as Framing;
  const motion = el<HTMLSelectElement>('camera-motion').value as 'push' | 'pan-left' | 'pan-right';
  const prompt = `${pitch} ${vibes[el<HTMLSelectElement>('vibe').value]} Preserve the reference product appearance and branding. No added text.`;
  busy = true;
  fields.disabled = true;
  photo.disabled = true;
  ready();
  let completed = 0;
  try {
    await check();
    if (mode !== 'camera' && !OSH.online) throw new Error(OSH.reason + '. Start ComfyUI and the proxy, then check connection.');
    status.textContent = 'Uploading product reference…';
    const original = mode !== 'creative' ? await OSH.upload(image) : null;
    const uploaded = mode === 'creative' && framing === 'crop' ? await OSH.upload(image) : null;
    for (const ratio of ratios) {
      status.textContent = `Preparing ${ratio} product reference…`;
      const size = sizes[ratio];
      let result: ShotResult;
      let background: ShotResult | undefined;
      if (mode === 'camera') {
        status.textContent = `Animating ${ratio} (${completed + 1}/${ratios.length}) with FFmpeg…`;
        result = await OSH.productVideo({ image: original!.url, mode, ratio, duration, motion });
      } else {
        const reference = uploaded || await OSH.upload(await prepareReference(image, size.width, size.height, mode === 'creative' ? framing : 'fit'));
        status.textContent = `Generating ${ratio} (${completed + 1}/${ratios.length})… This may take several minutes. Keep this tab open.`;
        result = await OSH.shot([{ image: reference.url, t: 0 }], prompt, duration, seed, size);
        if (mode === 'locked') {
          background = result;
          status.textContent = `Protecting original photo in ${ratio}…`;
          result = await OSH.productVideo({ image: original!.url, background: background.url, mode, ratio, duration });
        }
      }
      const card = document.createElement('article');
      card.className = 'out';
      const title = document.createElement('strong');
      const modeLabel = mode === 'creative' ? 'Creative' : mode === 'locked' ? 'Product-Locked' : `Camera ${motion}`;
      title.textContent = `${modeLabel} · ${ratio} · ${(result.frames / 24).toFixed(1)} s · ${+(result.seconds + (background?.seconds || 0)).toFixed(1)} s processing`;
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.src = result.url;
      const download = document.createElement('a');
      download.href = result.url;
      download.download = `ad-${mode}-${ratio.replace(':', 'x')}-${seed}.webm`;
      download.textContent = 'Download WebM';
      const details = document.createElement('p');
      details.className = 'note';
      details.textContent = mode === 'camera' ? `FFmpeg ${motion} · no model/seed/prompt · fitted photo with safety margin` :
        `LTX-Video 2B · Seed ${seed} · ${mode === 'locked' ? 'Static original photo over LTX background' : framing === 'fit' ? 'Fit whole photo' : 'Crop to fill'} · ${prompt}`;
      const exportButton = document.createElement('button');
      exportButton.type = 'button';
      exportButton.className = 'btng';
      exportButton.textContent = 'Export MP4';
      const mp4 = document.createElement('a');
      mp4.hidden = true;
      const message = document.createElement('p');
      message.className = 'note';
      message.setAttribute('role', 'status');
      message.textContent = tagline ? `MP4 tagline: ${tagline}` : 'MP4 export without tagline.';
      const ad: Ad = { mode, ratio, seed, tagline, source: result.url, video, button: exportButton, link: mp4, message, exporting: false, exported: false };
      ads.push(ad);
      exportButton.addEventListener('click', () => void exportAd(ad));
      card.append(title, video, download, exportButton, mp4, message, details);
      if (background) {
        const sourceLink = document.createElement('a');
        sourceLink.href = background.url;
        sourceLink.textContent = 'Inspect Creative background';
        sourceLink.target = '_blank';
        sourceLink.rel = 'noopener';
        card.append(sourceLink);
      }
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
    updateMode();
  }
});
updateMode();
void check();
