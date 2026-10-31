/* v6 base layer (loaded before core.js, see build-v6.mjs): UI language and the inline text tuple T(ru, de, en, kk). */
const LANG = '@@LANG@@';
const LI = { ru: 0, de: 1, en: 2, kk: 3 }[LANG];
/* a missing 4th argument (no Kazakh text yet) falls back to RU. An EMPTY one is deliberate: Kazakh puts the relation after the number ("5 сағ 43 мин кейін", not RU "через ..."), so '' stays '' (audit item 23.2 checked and not changed) */
const T = (...a) => (a[LI] != null ? a[LI] : a[0]);
