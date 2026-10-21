/**
 * Download the models in models.json into a ComfyUI models/ folder (skips files that exist).
 *   npm run models -- --models-dir "C:/path/to/ComfyUI/models" [--only shot_ltxv] [--dry-run]
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parseArgs } from "node:util";

type Model = { file: string; size_gb: number; used_by: string; license: string; url: string };

const { values } = parseArgs({ options: { "models-dir": { type: "string" }, only: { type: "string" }, "dry-run": { type: "boolean" } } });
const root = values["models-dir"];
if (!root) {
  console.error('usage: npm run models -- --models-dir "<ComfyUI>/models" [--only <workflow>] [--dry-run]');
  process.exit(1);
}
const { models } = JSON.parse(readFileSync(new URL("./models.json", import.meta.url), "utf8")) as { models: Model[] };

for (const m of models.filter((m) => !values.only || m.used_by === values.only)) {
  const dst = join(root, m.file);
  if (existsSync(dst)) { console.log(`have  ${m.file}`); continue; }
  console.log(`get   ${m.file}  (${m.size_gb} GB, ${m.license})`);
  if (values["dry-run"]) continue;
  mkdirSync(dirname(dst), { recursive: true });
  const res = await fetch(m.url);
  if (!res.ok || !res.body) throw new Error(`${m.url}: HTTP ${res.status}`);
  const total = Number(res.headers.get("content-length") || 0);
  let done = 0;
  const body = Readable.fromWeb(res.body as any);
  body.on("data", (c: Buffer) => { done += c.length; process.stdout.write(`\r      ${(done / 1e9).toFixed(2)}/${(total / 1e9).toFixed(2)} GB`); });
  await pipeline(body, createWriteStream(dst + ".part"));
  renameSync(dst + ".part", dst);
  process.stdout.write("\n");
}
