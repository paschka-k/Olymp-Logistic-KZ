# 01 — Области перерисовки и экономный тик

**Требования:** R03, R04
**Зависит от:** —
**Зона:** `platform-src/v6/core.js` · `platform-src/v6/base/45-region.js` · `platform-src/v6/screens/shell/001-shell-ext.js` · `platform-src/v6/screens/shell/002-a11y.js` (только хуки рендера) · `platform-src/v6/screens/{dashboard,routes,hubs}/` (только `data-live`) · `platform-src/tests/i1-render-regions.js`
**Волна:** 1
**Ревью:** да — фундамент
**Модель:** сильная

## Что должно заработать

Области перерисовки и экономный тик: см. критерии. Контекст кода — `notes.md`, границы и имена — `interfaces.md`.

## Из брифа, дословно

> «FR-193 Partial re-render: Render only the region that changed (main, drawer, top bar); keep focus and scroll position.»
> «FR-194 Live-tick budget: The tick updates only `data-live` nodes (position, temperature, ETA); full render only on user action; < 4 ms per tick.»

## Разделы спецификации

История 7–11 (R03, R03.1, R03.2, R04, R04.1).

## Критерии приёмки

- [ ] `renderRegion(name)` для main/drawer/topbar/toast работает, `render()` остаётся полным и синхронным, все пять обёрток render сохранены
- [ ] Ввод в поле фильтра/поиска не теряет фокус и каретку при перерисовке main; прокрутка main и drawer сохраняется
- [ ] Открытый drawer не закрывается и не теряет фокус-ловушку при `renderRegion("main")`
- [ ] Объявление области у действий (`ACTION_DEFS.region`, по умолчанию `main`); смена вкладки и фильтры не перерисовывают шапку и боковую панель
- [ ] Позиция, температура, ETA и живой бейдж помечены `data-live`; `liveTick()` обновляет только их и не вызывает `render()` (счётчик render за 10 тиков = 0)
- [ ] Замер тика < 4 мс в тесте с включённой симуляцией; значение записывается в `perf-budget.json`
- [ ] Группы `i1-render-regions.js` зелёные на 4 языках; затронутые старые тесты исправлены с комментарием `// FR-193/194`
