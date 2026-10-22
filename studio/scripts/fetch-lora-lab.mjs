// Download pinned, licensed small research bases + a bounded train/holdout image set.
// No Python dependencies or model code are installed or executed.
import { mkdir, readFile, writeFile, rename, stat, appendFile, unlink } from 'node:fs/promises';
import { createWriteStream, createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { resolve, dirname, join } from 'node:path';
const root = resolve('outputs/lora-lab');
await mkdir(root, { recursive: true });
const manifest = { created: new Date().toISOString(), purpose: 'LoRA preparation only; training has not run', models: [], images: [] };
if (process.argv.includes('--images-only')) {
  const previous = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8').catch(() => '{"models":[]}'));
  manifest.models = previous.models || [];
}
async function json(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
async function hash(path) {
  const h = createHash('sha256');
  for await (const chunk of createReadStream(path)) h.update(chunk);
  return h.digest('hex');
}
async function download(url, path, expectedSize) {
  await mkdir(dirname(path), { recursive: true });
  const existing = await stat(path).catch(() => null);
  if (!existing || (expectedSize && existing.size !== expectedSize)) {
    if (expectedSize > 20 * 1024 * 1024) {
      // Preserve the contiguous prefix left by an interrupted sequential transfer.
      const prefix = path + '.prefix';
      if (!(await stat(prefix).catch(() => null)) && await stat(path + '.part').catch(() => null)) await rename(path + '.part', prefix);
      const offset = (await stat(prefix).catch(() => null))?.size || 0;
      const size = 16 * 1024 * 1024;
      const count = Math.ceil((expectedSize - offset) / size);
      let next = 0;
      await Promise.all(Array.from({ length: Math.min(6, count) }, async () => {
        while (next < count) {
          const index = next++, start = offset + index * size, end = Math.min(expectedSize - 1, start + size - 1);
          const chunk = path + `.chunk-${index}`;
          if ((await stat(chunk).catch(() => null))?.size === end - start + 1) continue;
          const r = await fetch(url, { headers: { Range: `bytes=${start}-${end}` }, signal: AbortSignal.timeout(180000) });
          if (r.status !== 206 || !r.body || !r.headers.get('content-range')?.startsWith(`bytes ${start}-${end}/`)) throw new Error(`Range download failed: ${path} chunk ${index} (${r.status})`);
          await pipeline(Readable.fromWeb(r.body), createWriteStream(chunk));
          if ((await stat(chunk)).size !== end - start + 1) throw new Error(`Incomplete chunk: ${chunk}`);
        }
      }));
      if (offset) await pipeline(createReadStream(prefix), createWriteStream(path + '.part'));
      else await writeFile(path + '.part', '');
      for (let i = 0; i < count; i++) await appendFile(path + '.part', await readFile(path + `.chunk-${i}`));
      if ((await stat(path + '.part')).size !== expectedSize) throw new Error(`Incomplete file: ${path}`);
      await rename(path + '.part', path);
      for (let i = 0; i < count; i++) await unlink(path + `.chunk-${i}`);
      if (offset) await unlink(prefix);
      return { bytes: expectedSize, sha256: await hash(path) };
    }
    const r = await fetch(url, { signal: AbortSignal.timeout(600000) });
    if (!r.ok || !r.body) throw new Error(`${r.status} downloading ${path}`);
    await pipeline(Readable.fromWeb(r.body), createWriteStream(path + '.part'));
    if (expectedSize && (await stat(path + '.part')).size !== expectedSize) throw new Error(`Incomplete file: ${path}`);
    await rename(path + '.part', path);
  }
  return { bytes: (await stat(path)).size, sha256: await hash(path) };
}
for (const repo of process.argv.includes('--images-only') ? [] : ['segmind/tiny-sd', 'segmind/small-sd']) {
  const info = await json(`https://huggingface.co/api/models/${repo}?blobs=true`);
  if (info.cardData?.license !== 'creativeml-openrail-m') throw new Error(`Review license for ${repo}`);
  const entry = { repo, revision: info.sha, license: info.cardData.license, files: [] };
  for (const f of info.siblings.filter(f => /^(model_index.json|README.md|scheduler\/|tokenizer\/|text_encoder\/|unet\/|vae\/)/.test(f.rfilename))) {
    if (!/\.(json|txt|bin|safetensors|md)$/.test(f.rfilename)) continue;
    const path = join(root, 'models', repo.split('/')[1], f.rfilename);
    console.log(`Downloading ${repo}/${f.rfilename} (${Math.round((f.size || 0)/1e6)} MB)`);
    const result = await download(`https://huggingface.co/${repo}/resolve/${info.sha}/${f.rfilename}`, path, f.size);
    if (f.lfs?.sha256 && result.sha256 !== f.lfs.sha256) throw new Error(`Hash mismatch: ${path}`);
    entry.files.push({ file: f.rfilename, ...result });
  }
  manifest.models.push(entry);
  await writeFile(join(root, 'manifest.json'), JSON.stringify(manifest, null, 2));
}
const dataset = 'huggan/smithsonian-butterfly-lowres';
const info = await json(`https://huggingface.co/api/datasets/${dataset}`);
if (info.cardData?.license !== 'cc0-1.0') throw new Error('Review dataset license');
const data = await json(`https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(dataset)}&config=default&split=train&offset=0&length=20`);
for (const item of data.rows) {
  const split = item.row_idx < 16 ? 'train' : 'holdout';
  for (const [field, style] of [['image', 'photo'], ['sketch_pix2pix', 'sketch']]) {
    const name = `${String(item.row_idx).padStart(3, '0')}.jpg`;
    const path = join(root, 'images', style, split, name);
    const asset = item.row[field];
    const result = await download(asset.src, path);
    const caption = style === 'sketch' ? 'oshsketch style, a butterfly specimen with spread wings' : 'a photograph of a butterfly specimen with spread wings';
    await writeFile(path.replace(/\.jpg$/, '.txt'), caption + '\n');
    manifest.images.push({ dataset, revision: info.sha, license: 'CC0-1.0', row: item.row_idx, sourceId: item.row.id, field, split, style, width: asset.width, height: asset.height, file: path.slice(root.length + 1), caption, ...result });
  }
}
await writeFile(join(root, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Ready: ${manifest.models.length} model bundles, ${manifest.images.length} images, captions and SHA-256 manifest in ${root}`);
