// Shared left sidebar for every demo workflow: app switcher, mood board, cast & places.
// Project-level state (look, strength) lives in localStorage 'osh-project' so it follows you between apps.
const SHELL = (() => {
  // Each workflow lists the media types it can open.
  const APPS = [['director', 'Director', 'director.html', ['shot', 'keyframe']], ['edit', 'Edit Anything', 'edit.html', ['keyframe', 'frame']]];
  const TYPES = { shot: 'Shot', keyframe: 'Keyframe', frame: 'Frame' };
  const ELEMENTS = [
    { id: 'mia', ic: '👧', n: 'Mia', d: 'girl, 10, yellow raincoat', kind: 'cast' },
    { id: 'bolt', ic: '🤖', n: 'Bolt', d: 'small boxy robot', kind: 'cast' },
    { id: 'yard', ic: '🏚', n: 'Junkyard', d: 'dusk, scrap piles', kind: 'place' },
    { id: 'street', ic: '🏙', n: 'Street', d: 'empty, lamplit', kind: 'place' },
    { id: 'room', ic: '🛏', n: "Mia's room", d: 'desk, lamp, window', kind: 'place' },
  ];
  const css = `
#shared{display:flex;flex-direction:column;gap:12px}
#shared .apps{display:flex;border:1px solid var(--line);border-radius:10px;padding:3px;gap:2px}
#shared .apps a{flex:1;text-align:center;padding:6px 4px;border-radius:7px;color:var(--dim);text-decoration:none;font-size:12px;font-weight:500;cursor:pointer}
#shared .apps a.on{background:#26262a;color:var(--txt)}#shared .apps a:not(.on):hover{color:var(--txt)}
#shared .media{border:1px solid var(--line);border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:8px;background:var(--card)}
#shared .media canvas{width:100%;aspect-ratio:16/9;border-radius:7px;display:block;background:#000}
#shared .media .mt{display:flex;align-items:center;gap:6px;font-size:12px}#shared .media .mt b{font-weight:500}
#shared .media .ty{font-size:10px;text-transform:uppercase;letter-spacing:.08em;border:1px solid #3a4462;color:#aab6d8;border-radius:99px;padding:1px 7px}
#shared .media .none{color:var(--faint);font-size:12px;padding:10px 4px;text-align:center}
#shared .openin{display:flex;flex-direction:column;gap:4px}
#shared .openin button{display:flex;align-items:center;justify-content:space-between;gap:6px;border:1px solid var(--line);background:none;border-radius:8px;padding:6px 9px;cursor:pointer;color:var(--txt);font-size:12px}
#shared .openin button:hover:not(:disabled){border-color:var(--acc)}#shared .openin button:disabled{opacity:.4;cursor:default}
#shared .openin small{color:var(--faint)}
#shared .proj{font-size:12px;color:var(--faint);margin-top:-6px}
#shared .sec{font-size:11px;font-weight:500;color:var(--dim);text-transform:uppercase;letter-spacing:.09em;display:flex;align-items:center;gap:8px}
#shared .sec span{margin-left:auto;text-transform:none;letter-spacing:0;color:var(--faint)}
#shared .mood{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
#shared .pin{position:relative;border-radius:7px;overflow:hidden;cursor:pointer;aspect-ratio:3/4;border:2px solid transparent}
#shared .pin.on{border-color:var(--acc)}#shared .pin canvas{width:100%;height:100%;display:block}
#shared .pin i{display:none}
#shared .swatches{display:flex;gap:6px}#shared .swatches b{flex:1;height:8px;border-radius:4px}
#shared input[type=range]{width:100%;accent-color:var(--acc)}
#shared .els{display:flex;flex-direction:column;gap:6px}
#shared .el{display:flex;align-items:center;gap:10px;padding:5px 6px;border-radius:8px;background:var(--card);border:1px solid transparent;cursor:pointer;text-align:left;width:100%}
#shared .el:hover{border-color:var(--line)}#shared .el.on{border-color:var(--acc)}
#shared .el .av{width:30px;height:30px;border-radius:6px;background:#2a2a2e;display:grid;place-items:center;font-size:16px;flex:none}
#shared .el small{display:block;color:var(--faint)}#shared .el .use{margin-left:auto;font-size:11px;color:var(--faint);opacity:0}
#shared .el:hover .use{opacity:1}`;
  let opts, look, str;
  const state = () => SC.get('osh-project') || {};
  function save() { SC.set('osh-project', { ...state(), look: look.id, str }); }
  function mount(o) {
    opts = o; const st = state();
    look = SC.LOOKS.find(l => l.id === st.look) || SC.LOOKS[0]; str = st.str ?? .8;
    const s = document.createElement('style'); s.textContent = css; document.head.append(s);
    const root = document.getElementById('shared');
    root.innerHTML = `<div class="sec">Selected media</div><div class="media"></div><div class="apps">${APPS.map(([id, n, href]) => `<a data-app="${id}" href="${href}" class="${id === o.app ? 'on' : ''}">${n}</a>`).join('')}</div>
      <div class="proj">The Robot in the Junkyard · shared elements</div>
      <div class="sec">Mood board <span class="lk"></span></div><div class="mood"></div><div class="swatches"></div>
      <div><div class="sec" style="margin-bottom:6px">Board strength <span class="sv"></span></div><input type="range" min="0" max="100"></div>
      <div class="sec">Cast & places</div><div class="els"></div>`;
    root.querySelectorAll('.apps a').forEach(a => a.onclick = e => { if (a.dataset.app === o.app) return e.preventDefault(); if (o.onSwitch) { e.preventDefault(); o.onSwitch(a.dataset.app, a.getAttribute('href')); } });
    const r = root.querySelector('input[type=range]'); r.value = str * 100;
    r.oninput = () => { str = r.value / 100; root.querySelector('.sv').textContent = r.value + '%'; o.onLook?.(look, str, false); };
    r.onchange = () => { save(); o.onLook?.(look, str, true); };
    root.querySelector('.sv').textContent = Math.round(str * 100) + '%';
    root.querySelector('.els').innerHTML = ELEMENTS.map(e => `<button class="el" data-id="${e.id}"><span class="av">${e.ic}</span><div>${e.n}<small>${e.d}</small></div><span class="use">${o.useLabel?.(e) || ''}</span></button>`).join('');
    root.querySelectorAll('.el').forEach(b => b.onclick = () => o.onElement?.(ELEMENTS.find(e => e.id === b.dataset.id)));
    drawMood(); o.onLook?.(look, str, false); drawMedia();
    return { look, str };
  }
  function drawMood() {
    const root = document.getElementById('shared'), m = root.querySelector('.mood'); m.innerHTML = '';
    SC.LOOKS.forEach(l => {
      const d = document.createElement('div'); d.className = 'pin' + (l === look ? ' on' : ''); d.innerHTML = `<canvas width="120" height="160"></canvas><i>${l.n}</i>`;d.title = l.n;
      K.paint(d.firstChild.getContext('2d'), { sky: l.sky, pal: l.pal, tint: l.tint, people: 0, horizon: .66 }, 2);
      d.onclick = () => { if (l === look) return; look = l; save(); drawMood(); drawMedia(); opts.onLook?.(look, str, true); }; m.append(d);
    });
    root.querySelector('.swatches').innerHTML = look.sw.map(c => `<b style="background:${c}"></b>`).join('');
    root.querySelector('.lk').textContent = look.n;
  }
  // ---- selected media: what's selected in this app, and which workflows can open it ----
  let media = null;
  function select(m) { const key = m && JSON.stringify([m.type, m.label, m.spec, m.u, m.img]); if (key === select.k) return; select.k = key; media = m; drawMedia(); }
  function drawMedia() {
    const box = document.querySelector('#shared .media'); if (!box) return;
    if (!media) { box.innerHTML = '<div class="none">Select a shot, keyframe or frame to open it in another workflow.</div>'; return; }
    box.innerHTML = `<canvas width="320" height="180"></canvas><div class="mt"><span class="ty">${TYPES[media.type]}</span><b>${media.label}</b></div><div class="openin"></div>`;
    const cv = box.querySelector('canvas'), g = cv.getContext('2d');
    if (media.img) { const im = new Image(); im.onload = () => { const r = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight); g.drawImage(im, (cv.width - im.naturalWidth * r) / 2, (cv.height - im.naturalHeight * r) / 2, im.naturalWidth * r, im.naturalHeight * r); }; im.src = media.img; }
    else SC.frame(g, media.spec, 2, media.u ?? .3, look, str);
    const list = box.querySelector('.openin');
    APPS.forEach(([id, n, href, types]) => {
      const b = document.createElement('button'), ok = types.includes(media.type), here = id === opts.app;
      b.innerHTML = `<span>${here ? '● ' : ''}${n}</span><small>${here ? 'open here' : ok ? 'open in →' : `can't edit a ${media.type}`}</small>`;
      b.disabled = here || !ok; b.onclick = () => open(id); list.append(b);
    });
  }
  // Hand the selected media to another workflow.
  function open(app) {
    const a = APPS.find(x => x[0] === app); if (!media || !a[3].includes(media.type)) return;
    if (opts.beforeOpen) opts.beforeOpen(app, media);
    SC.set('osh-handoff', { ...media, from: opts.app });
    location.href = a[2] + '?from=' + opts.app;
  }
  // Highlight elements in use (e.g. chips on in the generator, regions selected in Edit).
  function mark(ids) { document.querySelectorAll('#shared .el').forEach(b => b.classList.toggle('on', ids.includes(b.dataset.id))); }
  return { mount, mark, select, open, ELEMENTS, APPS };
})();
