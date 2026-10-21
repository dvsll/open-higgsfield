// Shared helpers for concept mockups. Everything "generated" is faked client-side.
const K = (() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Single-select chip groups: <div class="chips" data-g="name">; multi-select with data-multi.
  function chips(onChange = () => {}) {
    $$('.chips[data-g]').forEach(g => g.addEventListener('click', e => {
      const c = e.target.closest('.chip'); if (!c || c.disabled) return;
      if (g.dataset.multi !== undefined) c.classList.toggle('on');
      else g.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c));
      onChange(g.dataset.g, c.dataset.v, c);
    }));
  }
  const chip = g => $(`.chips[data-g="${g}"] .chip.on`)?.dataset.v;

  // Step tabs: .nav button[data-s] toggles [data-p] panels.
  function steps(onGo = () => {}) {
    const go = s => {
      $$('.nav button').forEach(b => b.classList.toggle('on', b.dataset.s === s));
      $$('[data-p]').forEach(p => p.classList.toggle('hidden', !p.dataset.p.split(' ').includes(s)));
      onGo(s);
    };
    $$('.nav button').forEach(b => b.onclick = () => go(b.dataset.s));
    return go;
  }

  // Fake render overlay inside `host` (position:relative). Resolves when done.
  function render(host, msgs, ms = 2500, sub = '') {
    let ov = $('.ov', host);
    if (!ov) { ov = document.createElement('div'); ov.className = 'ov'; ov.innerHTML = '<div class="ovt"></div><div class="prog"><i></i></div><div class="note ovs"></div>'; host.append(ov); }
    ov.style.display = 'flex';
    return new Promise(res => {
      const t0 = performance.now();
      (function tick() {
        const p = Math.min(1, (performance.now() - t0) / ms);
        $('.prog i', ov).style.width = p * 100 + '%';
        $('.ovt', ov).textContent = msgs[Math.min(msgs.length - 1, Math.floor(p * msgs.length))];
        $('.ovs', ov).textContent = sub || `step ${Math.round(p * 30)}/30 · open weights · Comfy API`;
        if (p < 1) requestAnimationFrame(tick); else { ov.style.display = 'none'; res(); }
      })();
    });
  }

  // Before/after wipe: `after` is clipped from the left at the handle position.
  function wipe(box, after, start = 50) {
    let h = $('.wipe', box);
    if (!h) { h = document.createElement('div'); h.className = 'wipe'; box.append(h); }
    const set = p => { h.style.left = p + '%'; after.style.clipPath = `inset(0 0 0 ${p}%)`; };
    h.onpointerdown = e => {
      h.setPointerCapture(e.pointerId);
      h.onpointermove = ev => { const b = box.getBoundingClientRect(); set(Math.min(100, Math.max(0, (ev.clientX - b.left) / b.width * 100))); };
    };
    h.onpointerup = () => h.onpointermove = null;
    set(start);
    return { set, show: v => { h.style.display = v ? '' : 'none'; if (!v) after.style.clipPath = 'none'; } };
  }

  function toast(t) {
    const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.append(d);
    setTimeout(() => d.style.opacity = 0, 1800); setTimeout(() => d.remove(), 2200);
  }
  function say(list, text, me) {
    const d = document.createElement('div'); d.className = 'msg' + (me ? ' me' : ''); d.textContent = text; list.append(d); list.scrollTop = 1e9; return d;
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function loop(fn) { const t0 = performance.now(); (function f(now) { fn((now - t0) / 1000); requestAnimationFrame(f); })(t0); }
  function canvas(el, w, h) { el.width = w; el.height = h; return el.getContext('2d', { willReadFrequently: true }); }

  // ---- colour helpers ----
  const rgb = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
  const dim = (c, k) => hex(rgb(c).map(v => v * k));

  // ---- procedural "footage" painter ----
  // o: {sky:[top,bottom], ground, horizon, light, pal:[4 building colours], night, sun:{x,y,c}, buildings, trees,
  //     people, road, water(0..1), snow, hills, tint, extra(g,W,H,t)}
  const DEF = { sky: ['#5d9be0', '#cfe3f2'], ground: '#6b6a66', horizon: .62, light: 1, pal: ['#b5735a', '#d8c9a8', '#8fa3b5', '#c99b6d'], buildings: true, trees: true, people: 1, road: true };
  function paint(g, o, t = 0) {
    o = { ...DEF, ...Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) };
    const W = g.canvas.width, H = g.canvas.height, hz = H * o.horizon, L = o.light, s = Math.min(W, H) / 360;
    const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, o.sky[0]); sky.addColorStop(1, o.sky[1]);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    if (o.night) { g.fillStyle = '#fff'; for (let i = 0; i < 50; i++) g.fillRect((i * 97.3) % W, (i * 53.7) % (hz * .7), 1.5, 1.5); }
    if (o.sun) { g.fillStyle = o.sun.c || '#fff6d0'; g.beginPath(); g.arc(o.sun.x * W, o.sun.y * H, 16 * s, 0, 7); g.fill(); }
    if (o.clouds !== false && !o.night) { g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 3; i++) { const x = ((i * .37 + t * .01 + (o.cloudDx || 0)) % 1.2 - .1) * W, y = hz * (.15 + i * .12); g.beginPath(); g.ellipse(x, y, 40 * s, 10 * s, 0, 0, 7); g.ellipse(x + 20 * s, y - 6 * s, 24 * s, 10 * s, 0, 0, 7); g.fill(); } }
    if (o.hills) { g.fillStyle = dim(o.hill || '#5f8f55', L); g.beginPath(); g.moveTo(0, hz); for (let x = 0; x <= W; x += 10) g.lineTo(x, hz - (Math.sin(x / W * 6) * .5 + .7) * 40 * s); g.lineTo(W, hz); g.fill(); }
    g.fillStyle = dim(o.ground, L); g.fillRect(0, hz, W, H - hz);
    if (o.road) { g.fillStyle = dim('#4a4a4c', L); g.beginPath(); g.moveTo(W * .4, hz); g.lineTo(W * .6, hz); g.lineTo(W * 1.1, H); g.lineTo(-W * .1, H); g.fill();
      g.fillStyle = dim('#d8d2a0', L); for (let i = 0; i < 5; i++) { const k = i / 5, y = hz + (H - hz) * k * k; g.fillRect(W / 2 - 1.5 * s * (1 + k * 3), y, 3 * s * (1 + k * 3), 8 * s * (1 + k * 2)); } }
    if (o.buildings) [[.03, .19, .53, 0], [.23, .14, .39, 1], [.72, .17, .47, 2], [.9, .13, .33, 3]].forEach(([x, w, h, ci]) => {
      x *= W; w *= W; h *= H; const y = hz - h;
      g.fillStyle = dim(o.pal[ci], L); g.fillRect(x, y, w, h);
      for (let r = 0; r < Math.floor(h / (32 * s)); r++) for (let k = 0; k < Math.floor(w / (28 * s)); k++) {
        g.fillStyle = o.night && ((r * 7 + k * 3 + ci) % 5 < 2) ? '#ffd27a' : dim('#2c3440', L); g.fillRect(x + 8 * s + k * 28 * s, y + 10 * s + r * 32 * s, 14 * s, 18 * s);
      }
    });
    if (o.trees) { const x = W * .58; g.fillStyle = dim('#5a3d26', L); g.fillRect(x, hz - 70 * s, 8 * s, 70 * s); g.fillStyle = dim(o.leaf || '#3f7a3a', L); g.beginPath(); g.arc(x + 4 * s, hz - 82 * s, 30 * s, 0, 7); g.fill(); }
    if (o.snow) { g.fillStyle = 'rgba(245,248,252,.85)'; g.fillRect(0, hz, W, H - hz); }
    for (let i = 0; i < (o.people || 0); i++) walker(g, ((t * .12 + i * .45) % 1.15 - .07) * W, H * (.8 + i * .05), s * (1 + i * .15), L, o.walkerCol);
    if (o.extra) o.extra(g, W, H, t, s);
    if (o.water > 0) {
      const top = H - o.water * (H - hz * .7);
      g.fillStyle = o.night ? 'rgba(30,50,90,.85)' : 'rgba(70,110,130,.82)'; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) g.lineTo(x, top + Math.sin(x / 30 + t * 2) * 3 * s * (o.turb || 1)); g.lineTo(W, H); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const y = top + 12 * s + i * 14 * s; g.beginPath(); g.moveTo(((i * 77 + t * 30) % W), y); g.lineTo(((i * 77 + t * 30) % W) + 30 * s, y); g.stroke(); }
    }
    if (o.snow) { g.fillStyle = '#fff'; for (let i = 0; i < 80; i++) { g.fillRect((i * 53.1 + Math.sin(t + i) * 10) % W, (i * 31.7 + t * 40) % H, 2 * s, 2 * s); } }
    if (o.night) { [.15, .45, .8].forEach(x => { const r = g.createRadialGradient(x * W, hz, 0, x * W, hz, 90 * s); r.addColorStop(0, 'rgba(255,190,90,.4)'); r.addColorStop(1, 'rgba(255,190,90,0)'); g.fillStyle = r; g.fillRect(x * W - 90 * s, hz - 90 * s, 180 * s, 180 * s); }); }
    if (o.tint) { g.globalCompositeOperation = 'multiply'; g.fillStyle = o.tint; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
  }
  function walker(g, x, y, s, L = 1, col = '#d24b3c') {
    const st = Math.sin(x / 9);
    g.fillStyle = 'rgba(0,0,10,.25)'; g.beginPath(); g.ellipse(x, y + 38 * s, 16 * s, 4 * s, 0, 0, 7); g.fill();
    g.strokeStyle = dim('#283a66', L); g.lineWidth = 7 * s; g.beginPath(); g.moveTo(x, y + 8 * s); g.lineTo(x - st * 8 * s, y + 38 * s); g.moveTo(x, y + 8 * s); g.lineTo(x + st * 8 * s, y + 38 * s); g.stroke();
    g.fillStyle = dim(col, L); g.fillRect(x - 9 * s, y - 26 * s, 18 * s, 36 * s);
    g.fillStyle = dim('#e6b38f', L); g.beginPath(); g.arc(x, y - 34 * s, 9 * s, 0, 7); g.fill();
  }
  // Named looks reused across mockups.
  const LOOKS = {
    day: {},
    golden: { sky: ['#f3a35b', '#ffd9a0'], tint: '#ffd9b8', sun: { x: .2, y: .5, c: '#ffb35a' } },
    night: { sky: ['#05081a', '#1b2348'], night: true, light: .45, tint: '#9aa3d8' },
    snow: { sky: ['#cdd6e0', '#eef2f6'], snow: true, tint: '#eef2ff', clouds: false },
    neon: { sky: ['#12061f', '#3a0f4a'], night: true, light: .5, pal: ['#3a1050', '#102a50', '#501030', '#0a3a40'], tint: '#e0b0ff' },
    mars: { sky: ['#c1572e', '#f0a070'], ground: '#a0482a', buildings: false, road: false, trees: false, hills: true, hill: '#8a3a22', clouds: false, tint: '#ffd0b0' },
    flood: { water: .55 },
    pastel: { sky: ['#bfe3f2', '#fdf0f6'], pal: ['#ffb3c1', '#ffd6a5', '#bde0fe', '#caffbf'], ground: '#cdb4db', tint: '#fff6fb' },
    noir: { sky: ['#222', '#777'], pal: ['#555', '#888', '#444', '#999'], ground: '#555', tint: '#bbb' },
  };
  return { $, $$, chips, chip, steps, render, wipe, toast, say, sleep, loop, canvas, paint, walker, LOOKS, mix, dim, rgb, hex };
})();
// Also usable as an ES-module side-effect import.
globalThis.K = K;
