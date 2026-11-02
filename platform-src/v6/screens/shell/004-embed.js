/* Embed mode (?embed=customer): the customer portal inside an iframe of the marketing site. Starts in the customer role on its home screen, hides the
   operator chrome (top bar tools, role switch, portal links, sign-out) through html[data-embed], marks the data as a simulation and tells the host page
   to close on Escape (postMessage 'kz-embed'). The host picks the language by the bundle it loads (index = ru, en, de, kk). */
(() => {
  const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : ''), mode = q.get('embed');
  if (mode !== 'customer') return;
  globalThis.EMBED = mode;
  document.documentElement.dataset.embed = mode;
  const host = () => { try { if (window.parent === window) return null; return (location.ancestorOrigins && location.ancestorOrigins[0]) || (document.referrer ? new URL(document.referrer).origin : '*'); } catch (_) { return '*'; } };
  const tell = action => { const o = host(); if (o) try { window.parent.postMessage({ type: 'kz-embed', action }, o); } catch (_) { /* detached */ } };
  const open = () => !!(S.drawer || S.diag || S.sideOpen || S.kbd || S.tbMore);
  /* capture phase: the shell's own Escape handler closes a drawer first, so the state is read before it runs */
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !open()) tell('close'); }, true);
  const shellOverlays0 = globalThis.shellOverlays;
  globalThis.shellOverlays = () => (shellOverlays0 ? shellOverlays0() : '') + `<div class="embed-demo" role="note" data-test="embed-demo">${esc(LT('shell.embed_demo'))}</div>`;
  document.addEventListener('DOMContentLoaded', () => {
    if (S.role !== 'customer') ACT.setRole({ v: 'customer' });
    if (S.route === 'forbidden' || !canSee(S.route)) go(homeRoute());
    tell('ready');
  });
})();
