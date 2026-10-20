/* FR-199 · String tables per language. The texts of migrated areas live in platform-src/v6/strings/<lang>/<table>.json
   (flat { "area.key": "text" }); build-v6.mjs embeds ONLY the current language (the build fails when the four languages do not
   have the same keys, or when DE / EN contain Cyrillic). Usage:
     LT('core.dashboard')              the text in the UI language
     LT('nav.badge', 3, 'x')           "{0}" / "{1}" are replaced by the arguments (no string concatenation across languages)
   T(ru, de, en, kk) stays as a bridge for areas that are not migrated yet; tools/i18n/migrate.mjs moves an area over file by
   file (see docs/I18N.md). A key that is missing at runtime is returned as "⟦key⟧" and counted in LT_MISS (test g4 asserts it
   stays empty on every screen). KK entries machine-translated and not yet reviewed (FR-220) are listed in STRINGS_MT; open the
   page with ?kkreview=1 to see them marked. */
const STRINGS = /*@@STRINGS@@*/ {};
const STRINGS_MT = /*@@STRINGS_MT@@*/ {};
const LT_MISS = [];
const LREVIEW = LANG === 'kk' && /[?&]kkreview=1\b/.test((typeof location !== 'undefined' && location.search) || '');
const LT = (key, ...a) => {
  let s = STRINGS[key];
  if (s == null) {
    LT_MISS.push(key);
    return '⟦' + key + '⟧';
  }
  if (a.length) s = s.replace(/\{(\d+)\}/g, (m, i) => (a[i] != null ? a[i] : m));
  return LREVIEW && STRINGS_MT[key] ? s + ' [MT]' : s;
};
