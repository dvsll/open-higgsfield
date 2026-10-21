// Browser client for shared/runtime/serve.py. Works in both apps; when the local runtime
// isn't running (e.g. the page is opened as a static file), `online` stays false and apps
// fall back to their placeholders.
const OSH = (() => {
  let online = false, info = null;
  async function health() {
    try {
      const r = await fetch('/api/health', { cache: 'no-store' });
      info = await r.json(); online = !!(info.comfyui && info.proxy);
    } catch (e) { online = false; info = null; }
    return { online, info };
  }
  async function post(name, body) {
    const r = await fetch('/api/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ error: r.statusText }));
    if (!r.ok || j.error) throw new Error(j.error || r.statusText);
    return j;
  }
  return {
    health,
    get online() { return online; },
    keyframe: (prompt, seed = 1, size = {}) => post('keyframe', { prompt, seed, ...size }),   // -> {url, seconds}
    shot: (keys, prompt, duration, seed = 1) => post('shot', { keys, prompt, duration, seed }), // keys: [{image:url, t}] -> {url, seconds, frames}
  };
})();
