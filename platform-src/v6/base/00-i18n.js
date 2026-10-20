/* v6 base layer (loaded before core.js, see build-v6.mjs): UI language and the inline text tuple T(ru, de, en, kk). */
const LANG = '@@LANG@@';
const LI = { ru: 0, de: 1, en: 2, kk: 3 }[LANG];
const T = (...a) => (a[LI] != null ? a[LI] : a[0]);
