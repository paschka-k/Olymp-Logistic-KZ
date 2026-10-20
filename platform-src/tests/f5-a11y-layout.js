  /* ---- R6 · 0.3.9 parity, accessibility and layout: the layout suite (frontend/tests-ui/suite-layout.js, run by scripts/ui_suite.py over
     17 screens × 390 / 1024 / 1500 px in RU / EN, 114 checks) and FR-134 / FR-34 scenarios (594–597, 315–317, 206). Same rules, on the v6
     screens and tabs in all four languages: accessible names, unique ids, valid ARIA states, alt texts, no nested controls, keyboard
     reachability and activation, a live region for messages, level cues that do not rely on colour, text contrast of the status chips,
     reduced motion, no sideways scroll and no "one letter per line" cells at 1024 and 1500 px. ---- */
  /* 0.3.9 suite-layout.js a11y rules (axe-core serious / critical equivalent) on a v6 window */
  const r6A11yScan = (w, opt) => {   // eslint-disable-line no-unused-vars
    const d = w.document, fails = [], o = opt || {};
    const vis = el => { if (!el || !el.isConnected) return false; const s = w.getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const lab = el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + (el.dataset && el.dataset.act ? '[' + el.dataset.act + ']' : '') + ' «' + (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30) + '»';
    const name = el => {
      const lb = el.getAttribute('aria-labelledby'); if (lb) return lb.split(/\s+/).map(id => (d.getElementById(id) || {}).textContent || '').join(' ').trim();
      const own = (el.getAttribute('aria-label') || '').trim() || (el.getAttribute('title') || '').trim(); if (own) return own;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) { if (el.type === 'hidden') return 'hidden'; if (el.labels && el.labels.length) return [...el.labels].map(l => l.textContent).join(' ').trim(); if (/^(button|submit|reset)$/.test(el.type)) return el.value; return (el.getAttribute('placeholder') || '').trim() && o.placeholderOk ? el.getAttribute('placeholder') : ''; }
      return ((el.textContent || '') + ' ' + [...el.querySelectorAll('img[alt]')].map(i => i.alt).join(' ')).trim();
    };
    const inter = [...d.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="option"], input, select, textarea')].filter(el => vis(el) && !el.closest('[inert],[aria-hidden="true"]'));
    inter.filter(el => !name(el)).slice(0, 5).forEach(el => fails.push('control without accessible name: ' + lab(el) + ' ' + el.outerHTML.slice(0, 90)));
    const ids = new Map(); for (const el of d.querySelectorAll('[id]')) ids.set(el.id, (ids.get(el.id) || 0) + 1);
    const dup = [...ids].filter(([, c]) => c > 1).map(([id]) => id); if (dup.length) fails.push('duplicate ids: ' + dup.slice(0, 6).join(', '));
    if (!/^(ru|de|en|kk)$/.test(d.documentElement.lang)) fails.push('html lang: ' + d.documentElement.lang);
    if (d.querySelectorAll('main').length !== 1) fails.push('expected one <main>: ' + d.querySelectorAll('main').length);
    for (const el of d.querySelectorAll('[aria-pressed],[aria-expanded],[aria-selected]')) for (const at of ['aria-pressed', 'aria-expanded', 'aria-selected']) { const v = el.getAttribute(at); if (v !== null && !/^(true|false|mixed)$/.test(v)) fails.push('invalid ' + at + '="' + v + '" on ' + lab(el)); }
    for (const el of d.querySelectorAll('[aria-controls]')) if (el.getAttribute('aria-expanded') === 'true' && !d.getElementById(el.getAttribute('aria-controls'))) fails.push('aria-controls points nowhere: ' + lab(el));
    for (const img of d.querySelectorAll('img')) if (!img.hasAttribute('alt') && vis(img)) fails.push('image without alt: ' + img.src.slice(-60));
    for (const svg of d.querySelectorAll('svg[role="img"]')) if (!svg.getAttribute('aria-label') && !svg.querySelector('title')) fails.push('svg role=img without name');
    for (const el of d.querySelectorAll('button button, a[href] button, button a[href], a[href] a[href]')) { fails.push('nested interactive: ' + lab(el)); break; }
    for (const el of d.querySelectorAll('[role="tab"]')) if (!el.closest('[role="tablist"]')) { fails.push('tab outside a tablist: ' + lab(el)); break; }
    return fails;
  };
  const r6ScreensTabs = (ev, fn) => { for (const id of ev('navItems().map(n => n[0])').concat(['help'])) { ev(`go('${id}')`); const tabs = ev(`tabsOf('${id}').map(t => t.key)`); if (!tabs.length) fn(id); else for (const t of tabs) { ev(`setTab('${id}','${t}')`); fn(id + '/' + t); } } };
  for (const lang of LANGS) await group('[' + lang + '] a11y: every screen, tab and the load drawer — controls have accessible names, unique ids, valid ARIA states, alt texts, no nested controls (0.3.9 layout suite a11y rules)', lang, async (g, ev, w) => {
    const bad = [];
    r6ScreensTabs(ev, where => r6A11yScan(w).forEach(f => bad.push(where + ': ' + f)));
    ev("go('orders');setTab('orders','orders');ACT.open({id:S.loads[0].id})");
    for (const t of [...w.document.querySelectorAll('.drawer-tabs .tab')].map(e => e.dataset.v)) { ev(`ACT.tab({v:'${t}'})`); r6A11yScan(w).forEach(f => bad.push('drawer/' + t + ': ' + f)); }
    ev('closeDrawer()');
    for (const role of ['customer', 'partner', 'driver']) { ev(`ACT.setRole({v:'${role}'})`); r6ScreensTabs(ev, where => r6A11yScan(w).forEach(f => bad.push(role + ' ' + where + ': ' + f))); }
    ev("ACT.setRole({v:'admin'})");
    assert(!bad.length, bad.length + ' findings, first: ' + bad.slice(0, 3).join(' | '));
  });
  await group('a11y keyboard: menu items are focusable links, Enter / Space activate menu items and tabs, aria-current follows, skip link targets <main>, focus ring styled (0.3.9 FR-134 / FR-17)', 'ru', async (g, ev, w) => {
    const d = w.document, key = (el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    const items = [...d.querySelectorAll('.sidebar .nav-item')]; eq(items.length, 13, 'items');
    assert(items.every(e => e.tabIndex === 0 && e.getAttribute('role') === 'link'), 'every menu item is a focusable link');
    let it = d.querySelector('.sidebar .nav-item[data-v="fleet"]'); it.focus(); key(it, 'Enter'); eq(ev('S.route'), 'fleet', 'Enter on a menu item navigates');
    eq(d.querySelector('.nav-item[aria-current="page"]').dataset.v, 'fleet', 'aria-current moved');
    it = d.querySelector('.sidebar .nav-item[data-v="routes"]'); key(it, ' '); eq(ev('S.route'), 'routes', 'Space on a menu item navigates');
    const tabs = [...d.querySelectorAll('.pill-tabs [role="tab"]')]; assert(tabs.length >= 2 && tabs.every(t => t.tabIndex === 0), 'tabs are focusable');
    assert(d.querySelector('.pill-tabs').getAttribute('role') === 'tablist', 'tablist');
    const t2 = tabs[1]; key(t2, 'Enter'); eq(ev("curTab('routes').key"), t2.dataset.v, 'Enter on a tab switches the tab');
    eq(d.querySelector('.pill-tabs [aria-selected="true"]').dataset.v, t2.dataset.v, 'aria-selected follows');
    const skip = d.querySelector('a.skip'); assert(skip && skip.getAttribute('href') === '#main-content' && d.getElementById('main-content').tagName === 'MAIN', 'skip link → <main id=main-content>');
    const css = [...d.styleSheets].flatMap(s => { try { return [...s.cssRules].map(r => r.cssText); } catch (_) { return []; } }).join('\n');
    for (const sel of ['.nav-item:focus-visible', '.pill-tab:focus-visible', '.btn:focus-visible']) assert(css.includes(sel), 'focus ring for ' + sel);
    /* a native button is not clicked twice by the Enter handler */
    let n = 0; const b = d.createElement('button'); b.dataset.act = 'go'; b.dataset.v = 'dashboard'; b.setAttribute('tabindex', '0'); b.addEventListener('click', () => n++); d.querySelector('#main-content').appendChild(b); key(b, 'Enter'); eq(n, 0, 'Enter handler leaves native buttons to the browser');
    clean(w, 'keyboard');
  });
  await group('a11y messages and motion: toasts land in a polite live region, the search is a labelled combobox, reduced motion stops the live pulse and the menu slide (0.3.9 FR-134 / FR-17)', 'en', async (g, ev, w) => {
    const d = w.document; ev("toast('R6 live region check')");
    const live = d.querySelector('[role="status"][aria-live="polite"]'); assert(live && /R6 live region check/.test(live.textContent), 'toast inside the live region');
    ev("S.toast = null; render()"); assert(d.querySelector('[role="status"][aria-live="polite"]'), 'live region stays when empty');
    const gs = d.getElementById('gsearch'); assert(gs.getAttribute('role') === 'combobox' && gs.getAttribute('aria-controls'), 'search is a combobox');
    assert((gs.getAttribute('aria-label') || '').length > 3, 'search has an accessible name: ' + gs.getAttribute('aria-label'));
    ev("gsInput('1847')"); eq(d.getElementById('gsearch').getAttribute('aria-expanded'), 'true', 'expanded while results show');
    const css = [...d.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch (_) { return []; } }).filter(r => r.media && /prefers-reduced-motion:\s*reduce/.test(r.media.mediaText)).map(r => r.cssText).join('\n');
    assert(/\.live-dot\.on\s*\{[^}]*animation[^;}]*\bnone\b/.test(css), 'live pulse off with reduced motion');
    assert(/\.sidebar\s*\{[^}]*transition[^;}]*\bnone\b/.test(css), 'menu slide off with reduced motion');
  });
  const r6Rgb = s => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(s); return m ? [+m[1], +m[2], +m[3]] : null; };
  const r6Lum = c => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const r6Ratio = (a, b) => { const x = r6Lum(a), y = r6Lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  await group('levels and colours: Go green / No-Go red with the words Go / No-Go, watch yellow, the alarms button red; status chips keep ≥ 4.5:1 text contrast in both designs (0.3.9 FR-34 / FR-134)', 'ru', async (g, ev, w) => {
    const d = w.document;
    ev("go('orders');setTab('orders','docs')");
    const rows = [...d.querySelectorAll('.dk-gate')]; assert(rows.length >= 9, 'gate controls ' + rows.length);
    for (const r of rows) {
      const c = r.querySelector('.chip'), pass = r.dataset.pass === '1';
      assert(pass ? /\b(green|yellow)\b/.test(c.className) : /\bred\b/.test(c.className), r.dataset.gate + ': colour ' + c.className);
      eq(c.textContent.trim(), pass ? 'Go' : 'No-Go', r.dataset.gate + ': word next to the colour');
    }
    const al = d.querySelector('[data-alarms]'); const bg = r6Rgb(w.getComputedStyle(al).backgroundColor); assert(/\bred\b/.test(al.className) && bg[0] > bg[1] + 40, 'alarms button red: ' + bg);
    for (const des of ['kokzhol', 'olymp']) {
      ev(`S.design = '${des}'; document.documentElement.dataset.design = '${des}'; render()`);
      const probe = d.createElement('div'); probe.innerHTML = ['green', 'yellow', 'red', 'blue', 'gray', 'purple', 'orange'].map(k => `<span class="chip ${k}">Go No-Go</span>`).join(''); d.querySelector('#main-content').appendChild(probe);
      for (const c of probe.querySelectorAll('.chip')) {
        const cs = w.getComputedStyle(c), fg = r6Rgb(cs.color), b = r6Rgb(cs.backgroundColor); assert(fg && b, des + ' ' + c.className + ': colours');
        const r = r6Ratio(fg, b); assert(r >= 4.5, des + ' ' + c.className + ': contrast ' + r.toFixed(2) + ' < 4.5');
      }
      probe.remove();
      const body = w.getComputedStyle(d.querySelector('#main-content')), page = r6Rgb(w.getComputedStyle(d.body).backgroundColor) || [255, 255, 255];
      assert(r6Ratio(r6Rgb(body.color), page) >= 4.5, des + ': body text contrast');
    }
  });
  const r6Sideways = (w, where) => { const de = w.document.documentElement, m = w.document.querySelector('main'); assert(de.scrollWidth <= de.clientWidth + 1, where + ': page scrolls sideways ' + de.scrollWidth); assert(m.scrollWidth <= m.clientWidth + 1, where + ': main scrolls sideways ' + m.scrollWidth); };
  const r6Squeezed = (w, where) => {
    const bad = [];
    for (const c of w.document.querySelectorAll('#main-content td, #main-content th, #main-content [style*="grid-template-columns"] > *')) {
      const t = (c.textContent || '').replace(/\s+/g, ' ').trim(); if (!/[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]{4,}/.test(t) || !c.offsetParent) continue;
      const b = c.getBoundingClientRect(), lh = parseFloat(w.getComputedStyle(c).lineHeight) || 18; if (b.width < 30 && b.height > lh * 4) bad.push(t.slice(0, 20) + ' ' + Math.round(b.width) + '×' + Math.round(b.height));
    }
    assert(!bad.length, where + ': cells one letter per line: ' + bad.slice(0, 3).join(' | '));
  };
  for (const lang of ['ru', 'en']) for (const px of [1024, 1500]) await group('[' + lang + '] layout ' + px + ' px: every screen and tab fits without sideways scroll and no table cell collapses to one letter per line (0.3.9 layout suite)', lang, async (g, ev, w) => {
    w.frameElement.style.cssText = `display:block;position:absolute;left:-10000px;top:0;width:${px}px;height:900px;border:0`; await new Promise(r => setTimeout(r, 30)); eq(w.innerWidth, px, 'frame width');
    r6ScreensTabs(ev, where => { r6Sideways(w, where); r6Squeezed(w, where); });
    clean(w, 'layout ' + px);
  });
  await group('layout meta: the detectors fire on the faults they are for — a 3 000 px wide block, a r6Squeezed table cell, an unnamed control, a duplicate id (0.3.9 layout suite meta tests)', 'en', async (g, ev, w) => {
    w.frameElement.style.cssText = 'display:block;position:absolute;left:-10000px;top:0;width:1316px;height:900px;border:0'; await new Promise(r => setTimeout(r, 30));   // the harness hides frames (display:none → no layout)
    ev("go('fleet')"); const d = w.document, m = d.querySelector('#main-content'), x = d.createElement('div');   // query <main> after go(): render() replaces it
    x.style.cssText = 'width:3000px;height:4px'; m.appendChild(x);
    let hit = ''; try { r6Sideways(w, 'meta'); } catch (e) { hit = e.message; } assert(/sideways/.test(hit), 'wide block not detected'); x.remove();
    const tb = d.createElement('table'); tb.innerHTML = '<tr><td style="width:12px;max-width:12px;word-break:break-all">Temperature</td><td style="width:2000px"></td></tr>'; tb.style.cssText = 'width:100%;table-layout:fixed'; m.appendChild(tb);
    hit = ''; try { r6Squeezed(w, 'meta'); } catch (e) { hit = e.message; } assert(/one letter per line/.test(hit), 'r6Squeezed cell not detected'); tb.remove();
    const i = d.createElement('input'); i.id = 'gsearch'; m.appendChild(i);
    const f = r6A11yScan(w).join(' | '); assert(/without accessible name/.test(f) && /duplicate ids: .*gsearch/.test(f), 'a11y rules not firing: ' + f); i.remove();
    eq(r6A11yScan(w).length, 0, 'clean again after removing the faults');
  });
