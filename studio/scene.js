// Shared placeholder "renderer" for the demos: draws a keyframe spec, including edits made in Edit Anything.
// Needs ../shared/lib/kit.js and ../shared/styleboard/looks.js loaded first.
const SC = (() => {
  const LOOKS = STYLEBOARD.looks;
  const SP = o => ({ mia: true, bolt: true, scene: 'yard', scale: 1, ...o });
  const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
  const COLORS = { red: '#d64545', blue: '#3a6fd8', green: '#3f9b55', yellow: '#e9c46a', gold: '#d4a017', pink: '#ff7ab0', purple: '#8a5cd6', orange: '#f08a3c', black: '#222', white: '#eee', silver: '#c0c6cc' };
  const colorIn = t => { for (const k in COLORS) if (t.includes(k)) return COLORS[k]; };

  function mia(g, x, y, s, e = '') {
    if (/remove|erase|delete/.test(e)) return;
    const suit = /astronaut|space/.test(e), knight = /knight|armou?r/.test(e), coat = colorIn(e) || '#e9c46a', st = Math.sin(x / 9);
    g.fillStyle = 'rgba(0,0,10,.25)'; g.beginPath(); g.ellipse(x, y + 38 * s, 16 * s, 4 * s, 0, 0, 7); g.fill();
    g.strokeStyle = suit ? '#ddd' : knight ? '#8a9098' : '#283a66'; g.lineWidth = 7 * s; g.beginPath(); g.moveTo(x, y + 8 * s); g.lineTo(x - st * 8 * s, y + 38 * s); g.moveTo(x, y + 8 * s); g.lineTo(x + st * 8 * s, y + 38 * s); g.stroke();
    g.fillStyle = suit ? '#f2f2f2' : knight ? '#9aa1a8' : coat; g.fillRect(x - 9 * s, y - 26 * s, 18 * s, 36 * s);
    if (suit) { g.fillStyle = '#ccc'; g.fillRect(x - 14 * s, y - 24 * s, 6 * s, 24 * s); g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(x, y - 34 * s, 13 * s, 0, 7); g.fill(); g.fillStyle = '#ffb347'; g.beginPath(); g.arc(x + 2 * s, y - 34 * s, 8 * s, 0, 7); g.fill(); }
    else if (knight) { g.fillStyle = '#9aa1a8'; g.beginPath(); g.arc(x, y - 34 * s, 10 * s, 0, 7); g.fill(); g.fillStyle = '#333'; g.fillRect(x - 6 * s, y - 36 * s, 12 * s, 2 * s); }
    else { g.fillStyle = '#e6b38f'; g.beginPath(); g.arc(x, y - 34 * s, 9 * s, 0, 7); g.fill(); g.fillStyle = '#5b3a22'; g.fillRect(x - 9 * s, y - 44 * s, 18 * s, 6 * s); }
  }
  function robot(g, x, y, s, eyes, e = '') {
    if (/remove|erase|delete/.test(e)) return;
    if (/bigger|giant|huge/.test(e)) s *= 1.6;
    const body = /rust/.test(e) ? '#8a4a2a' : colorIn(e) || '#8d949c', dark = K.dim(body, .78);
    eyes = eyes || /glow|eyes|light/.test(e);
    g.fillStyle = body; g.fillRect(x - 14 * s, y - 30 * s, 28 * s, 24 * s); g.fillStyle = dark; g.fillRect(x - 10 * s, y - 6 * s, 20 * s, 20 * s);
    g.fillStyle = eyes ? '#7ff' : '#333'; g.beginPath(); g.arc(x - 6 * s, y - 19 * s, 3.5 * s, 0, 7); g.arc(x + 6 * s, y - 19 * s, 3.5 * s, 0, 7); g.fill();
    if (/hat|crown/.test(e)) { g.fillStyle = '#d4a017'; g.beginPath(); g.moveTo(x - 10 * s, y - 30 * s); g.lineTo(x - 10 * s, y - 40 * s); g.lineTo(x - 4 * s, y - 34 * s); g.lineTo(x, y - 42 * s); g.lineTo(x + 4 * s, y - 34 * s); g.lineTo(x + 10 * s, y - 40 * s); g.lineTo(x + 10 * s, y - 30 * s); g.fill(); }
    if (eyes) { const r = g.createRadialGradient(x, y - 19 * s, 0, x, y - 19 * s, 70 * s); r.addColorStop(0, 'rgba(120,255,255,.3)'); r.addColorStop(1, 'rgba(120,255,255,0)'); g.fillStyle = r; g.fillRect(x - 70 * s, y - 90 * s, 140 * s, 140 * s); }
  }

  // Draws spec `sp` at pose `u`; returns hit boxes (canvas px) for Edit Anything.
  function frame(g, sp, t, u, look = LOOKS[0], str = .8) {
    { const p = (sp.edits || {}).place || ''; const sc = /junkyard/i.test(p) ? 'yard' : /street/i.test(p) ? 'street' : /room|bedroom/i.test(p) ? 'room' : null; if (sc) sp = { ...sp, scene: sc, edits: { ...sp.edits, place: '' } }; }
    const E = sp.edits || {}, L = { ...look, tint: K.mix('#ffffff', look.tint, str) };
    let base;
    if (sp.scene === 'yard') base = { ...L, buildings: false, road: false, trees: false, hills: true, hill: '#5c5852', ground: '#6e655a', people: 0, ...(sp.night ? { sky: ['#141a30', '#2b2f4a'], light: .5 } : {}) };
    else if (sp.scene === 'street') base = { ...L, people: 0, night: sp.night || u > .6 };
    else base = { sky: sp.night ? ['#1a1d33', '#2b2f4a'] : sp.dawn ? ['#ffd6a0', '#fff1d6'] : ['#ffe2b0', '#fff4dc'], ground: '#7a5c48', horizon: .7, buildings: false, road: false, trees: false, clouds: false, people: 0, tint: L.tint };
    const pl = E.place || '', sky = E.sky || '';
    if (/mars/.test(pl)) Object.assign(base, K.LOOKS.mars);
    if (/moon/.test(pl)) Object.assign(base, { sky: ['#000', '#111'], ground: '#8a8a8a', buildings: false, road: false, trees: false, hills: true, hill: '#666', clouds: false, tint: '#ffffff' });
    if (/snow|winter/.test(pl)) Object.assign(base, { snow: true });
    if (/beach/.test(pl)) Object.assign(base, { ground: '#ecd9a0', water: .15, buildings: false, road: false });
    if (/flood|water/.test(pl)) Object.assign(base, { water: .4 });
    if (/forest|jungle/.test(pl)) Object.assign(base, { ground: '#3f6b35', hills: true, hill: '#2f5a2a', buildings: false, trees: true, leaf: '#2f6b2a' });
    if (/sunset|golden|dusk/.test(sky)) Object.assign(base, { sky: ['#f0805d', '#ffd29a'] });
    if (/night|star|dark/.test(sky)) Object.assign(base, { sky: ['#05081a', '#1b2348'], night: true });
    if (/storm|cloud|rain/.test(sky)) Object.assign(base, { sky: ['#3a4250', '#7a8290'], clouds: true });
    if (/aurora/.test(sky)) Object.assign(base, { sky: ['#03101a', '#0b2a3a'], night: true });
    if (/clear|blue/.test(sky)) Object.assign(base, { sky: ['#5d9be0', '#cfe3f2'] });
    const Wc = g.canvas.width, Hc = g.canvas.height, k0 = Math.min(Wc, Hc) / 360, s = sp.scale * (1 + u * .12), cx = Wc * .5 + (sp.carry ? (u - .5) * Wc * .3 : 0) + (sp.dx || 0) * Wc;
    const box = { horizon: Hc * (base.horizon || .62) };
    K.paint(g, { ...base, extra: (g, W, H, tt, k) => {
      if (/aurora/.test(sky)) { for (let i = 0; i < 3; i++) { g.strokeStyle = `rgba(80,255,170,${.25 - i * .06})`; g.lineWidth = 18 * k; g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, H * (.12 + i * .07) + Math.sin(x / 60 + tt * .5 + i) * 12 * k); g.stroke(); } }
      if (sp.scene === 'room' && !pl) { g.fillStyle = '#4b3a30'; g.fillRect(W * .1, H * .55, W * .35, H * .15); g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(W * .8, H * .3, 10 * k, 0, 7); g.fill(); }
      if (sp.mia) { const x = cx - (sp.carry || !sp.bolt ? 0 : 30 * k * s), y = H * .72, sc = k * s; mia(g, x, y, sc, E.mia); box.mia = { x: x - 16 * sc, y: y - 46 * sc, w: 32 * sc, h: 86 * sc }; }
      if (sp.bolt) { const x = !sp.mia ? cx : cx + (sp.carry ? (u > .5 ? -7 : 7) * k * s : 30 * k * s), y = !sp.mia ? H * .75 : H * (sp.carry ? .62 : .82), sc = k * s * (sp.carry ? .5 : .6) * (/bigger|giant|huge/.test(E.bolt || '') ? 1.6 : 1); robot(g, x, y, sc / (/bigger|giant|huge/.test(E.bolt || '') ? 1.6 : 1), sp.eyes && u > .2, E.bolt); box.bolt = { x: x - 16 * sc, y: y - 32 * sc, w: 32 * sc, h: 48 * sc }; }
    } }, t);
    return box;
  }
  function mute(g) { const w = g.canvas.width, h = g.canvas.height, d = g.getImageData(0, 0, w, h), p = d.data; for (let i = 0; i < p.length; i += 4) { const l = p[i] * .3 + p[i + 1] * .59 + p[i + 2] * .11; p[i] = p[i] * .3 + l * .7; p[i + 1] = p[i + 1] * .3 + l * .7; p[i + 2] = p[i + 2] * .3 + l * .7; } g.putImageData(d, 0, 0); }
  // Local storage wrappers (can be unavailable).
  const get = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  // The one generic placeholder for anything without a real image yet.
  function blank(g, label = 'no image') {
    const W = g.canvas.width, H = g.canvas.height, k = Math.min(W, H) / 360;
    g.fillStyle = '#151517'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#1c1c1f'; g.lineWidth = 1;
    for (let x = -H; x < W; x += 14 * k + 4) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H, 0); g.stroke(); }
    const w = 44 * k, h = 30 * k, cx = W / 2, cy = H / 2 - (label ? 8 * k : 0);
    g.strokeStyle = '#3a3a40'; g.lineWidth = Math.max(1, 1.5 * k); g.strokeRect(cx - w / 2, cy - h / 2, w, h);
    g.beginPath(); g.moveTo(cx - w / 2 + 4 * k, cy + h / 2 - 5 * k); g.lineTo(cx - 4 * k, cy); g.lineTo(cx + 4 * k, cy + 6 * k); g.lineTo(cx + 10 * k, cy + 1 * k); g.lineTo(cx + w / 2 - 4 * k, cy + h / 2 - 5 * k); g.stroke();
    if (label && H > 60) { g.fillStyle = '#4a4a52'; g.font = `${Math.max(9, 12 * k)}px Inter, system-ui, sans-serif`; g.textAlign = 'center'; g.fillText(label, cx, cy + h / 2 + 18 * k); g.textAlign = 'left'; }
  }
  return { LOOKS, SP, same, frame, blank, mute, get, set };
})();
