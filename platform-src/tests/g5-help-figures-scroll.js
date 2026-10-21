  /* ---- 6.4.1: help figures are geometrically clean in every language and step (labels inside their boxes, no overlapping boxes,
     nothing outside the picture, no unstyled black shapes); inner scroll boxes (sidebar, help menu …) keep their position across re-renders ---- */
  const show = async (w, h) => { w.frameElement.style.cssText = `display:block;position:absolute;left:-10000px;top:0;width:1316px;height:${h}px;border:0`; await new Promise(r => setTimeout(r, 120)); };
  const figCheck = () => {
    const out = [], host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:0;top:0;width:1060px;background:#fff;z-index:99999';
    document.body.appendChild(host);
    const SH = ':scope > rect, :scope > polygon, :scope > path';
    const inside = (a, b, tol) => a.x >= b.x - tol && a.y >= b.y - tol && a.x + a.width <= b.x + b.width + tol && a.y + a.height <= b.y + b.height + tol;
    const area = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
    for (const id of Object.keys(HELP.visuals)) {
      const n = HELP.hv.defs[id].steps.length;
      for (let i = 0; i < n; i++) {
        S.hv = S.hv || {}; S.hv[id] = { i, run: false };
        host.innerHTML = HELP.visuals[id]();
        host.querySelectorAll('svg').forEach(svg => {
          const vb = svg.viewBox.baseVal;
          const boxes = [...svg.querySelectorAll('g.hv-bx, g.hv-box')].filter(g => g.querySelector(SH) && !g.closest('.hv-mv'));
          const bb = boxes.map(g => g.querySelector(SH).getBBox());
          boxes.forEach((g, k) => {
            const sh = g.querySelector(SH);
            if (/rgb\(0, 0, 0\)/.test(getComputedStyle(sh).fill)) out.push(id + ' #' + (i + 1) + ': black shape "' + g.textContent.slice(0, 24) + '"');
            g.querySelectorAll(':scope > text').forEach(t => { if (t.textContent.trim() && !inside(t.getBBox(), bb[k], 1.5)) out.push(id + ' #' + (i + 1) + ': label outside its box "' + t.textContent.slice(0, 30) + '"'); });
          });
          for (let a = 0; a < boxes.length; a++) for (let c = a + 1; c < boxes.length; c++) {
            if (inside(bb[a], bb[c], 0) || inside(bb[c], bb[a], 0)) continue;   // a frame around other boxes
            if (area(bb[a], bb[c]) > 4) out.push(id + ' #' + (i + 1) + ': boxes overlap "' + boxes[a].textContent.slice(0, 18) + '" × "' + boxes[c].textContent.slice(0, 18) + '"');
          }
          svg.querySelectorAll('g.hv-bx, g.hv-box, text, g.hv-tag').forEach(e => {
            if (e.closest('.hv-mv') || e.closest('[style*="transform"]') || e.closest('[transform]')) return;   // rotated or moving parts are checked by eye
            const b = e.getBBox(); if (!b.width) return;
            if (b.x < vb.x - 1 || b.y < vb.y - 1 || b.x + b.width > vb.x + vb.width + 1 || b.y + b.height > vb.y + vb.height + 1) out.push(id + ' #' + (i + 1) + ': outside the picture "' + (e.textContent || '').slice(0, 24) + '"');
          });
        });
      }
    }
    host.remove();
    return [...new Set(out)];
  };
  for (const lang of LANGS) await group('[' + lang + '] help figures 6.4.1: every step of every figure has its labels inside their boxes, no overlapping boxes, nothing cut off, no black shapes', lang, async (g, ev, w) => {
    await show(w, 760);   // the harness hides its frames; SVG boxes have no geometry without layout
    const bad = ev('(' + figCheck.toString() + ')()');
    assert(ev("document.querySelector('.sidebar').clientHeight") > 0, 'frame is laid out');
    assert(!bad.length, bad.length + ' problems: ' + bad.slice(0, 6).join(' | '));
  });
  await group('help figure "A shipment from start to finish" 6.4.1: drawn with the figure kit, Go/No-Go is a coloured diamond, every step highlights one node', 'en', async (g, ev, w) => {
    ev("ACT.helpGo({k:'start'})"); const d = w.document, pl = () => d.querySelector('.hp[data-player=shipflow]');
    assert(pl().querySelector('svg.hvk-svg'), 'player draws on the kit');
    const dia = pl().querySelector('.hv-bx polygon'); assert(dia, 'Go/No-Go diamond'); assert(!/rgb\(0, 0, 0\)/.test(w.getComputedStyle(dia).fill), 'diamond is not black');
    for (let k = 0; k < 7; k++) { ev(`ACT.hvGo({id:'pl:shipflow', v:${k}})`); eq(pl().querySelectorAll('.pl-on').length, 1, 'one active node at step ' + (k + 1)); }
    assert(/No-Go/.test(pl().textContent) && /Go/.test(pl().textContent), 'Go and No-Go labels');
  });
  await group('sidebar keeps its scroll position across re-renders (clock tick, language links and version at the bottom stay reachable)', 'ru', async (g, ev, w) => {
    const sb = () => w.document.querySelector('.sidebar');
    await show(w, 420); ev('render()');
    const max = sb().scrollHeight - sb().clientHeight; assert(max > 40, 'sidebar scrolls in a low window: ' + max);
    sb().scrollTop = max; ev('render()'); assert(Math.abs(sb().scrollTop - max) <= 1, 'kept after render: ' + sb().scrollTop + ' / ' + max);
    ev("toast('x')"); assert(Math.abs(sb().scrollTop - max) <= 1, 'kept after a toast');
    ev("go('fleet')"); assert(Math.abs(sb().scrollTop - max) <= 1, 'kept after changing the screen');
    ev("ACT.helpGo({k:'start'})"); const hn = w.document.querySelector('.help-nav');
    if (hn && hn.scrollHeight > hn.clientHeight + 20) { hn.scrollTop = 80; ev('render()'); eq(w.document.querySelector('.help-nav').scrollTop, 80, 'help menu keeps its position'); }
  });
