# Границы и правила проекта

## Правила проекта (для каждого исполнителя)
- Исходники — `platform-src/`; `platform/*.html` — результат `node platform-src/build-v6.mjs` (в коммит попадают оба). НЕ запускать несколько сборок в один `platform/`: исполнитель собирает в свою папку `--out D:\_wt_<тикет>\out` или в `platform/`, если он единственный; никогда не править `platform/*.html` руками.
- Код — один общий скрипт (все файлы склеены по имени NNN-…). Глобальные `S, go, ACT, T, render, KIT, LT, LF, XP, DRAWERS, toast` остаются глобальными: тесты вызывают их через `w.eval`.
- Тесты — только `platform-src/tests/*.js` (стиль `group(...)`, `ev`, `assert`, `eq`); новые — файлы `i1…`. Не ослаблять чужие тесты: менять только те, чьё поведение изменилось, с комментарием `// FR-xxx:`.
- Прогон: статический сервер `node <скретч>/serve.cjs <корень> <порт>` (порт — свой на тикет), страница `http://127.0.0.1:<порт>/platform/tests.html?suite=<имена>&retries=1`; `node` запускать из `C:\_Projects\Olymp-Logistic-KZ`. Браузер — своя вкладка/CDP headless Chrome; чужие вкладки не трогать.
- Тексты интерфейса — на 4 языках (`T(ru,de,en,kk)` или `LT` ключи); латиницу в RU не добавлять; в product-коде нет `eval`.
- Коммит на тикет: заголовок «<что>», трейлер `Requirements: R##`, `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Не пушить, не поднимать `VERSION`.
- ЭКРАННЫЕ имена и функции — по `notes.md`; новые имена из этого файла использовать ровно как написано.

## Границы, решённые в спецификации (имена — контракт)

| Единица | Владеет | Предоставляет | Скрывает |
|---|---|---|---|
| Сборка `build-v6.mjs` (+ `tools/build/*.mjs`) | вырезание языка, split | `stripLangs(src, lang)`; флаг `--split` → `platform/split/<lang>/` | сканер вызовов `T(` |
| Рендер `core.js` + `base/45-region.js` | области, тик | `renderRegion('main'\|'drawer'\|'topbar'\|'toast')`, `render()` (полный), `liveUpdate()` | порядок обёрток render |
| Живые узлы | `data-live="<ключ>"` | `liveBind(key, fn)` | выбор узлов тика |
| Окно списков `base/50-vlist.js` | окно строк | `KIT.vlist({id, rows, rowH, cols, ...})`, `vlistCount(id)` | расчёт окна |
| Ленивые данные `base/42-lazy.js` | `S` геттеры | `lazy(name, fn)`, `lazyForce(name)` | порядок сидов |
| Состояния `base/30-kit.js` | KIT | `KIT.state(kind, {title, hint, action})` kind ∈ empty\|loading\|error\|nofilter | вёрстка |
| Предпочтения `base/46-prefs.js` | localStorage | `PREFS.get(k, def)`, `PREFS.set(k, v)`, `PREFS.enabled` | try/catch, iframe-защита |
| Отмена `base/47-undo.js` | тост | `toastUndo(msg, undoFn, {ms: 10000, audit})`; реестр действий: флаг `undo` | таймеры |
| Палитра `screens/shell/0xx-palette.js` | диалог | `openPalette()`, источники `paletteSources` | ранжирование |
| Уведомления `screens/shell/0xx-notify.js` | наложение | `NC.list(filter)`, `NC.read(key)`, `NC.snooze(key, ms)`, `NC.assign(key, user)`, `S.nc` | источники |
| Стартовые роли `screens/dashboard/0xx-role-home.js` | плитки | `ROLE_HOME[role] = [{id, kpi, route, perm}]` | |
| Сценарии `screens/shell/0xx-scenarios.js` | пресеты | `SCENARIOS`, `applyScenario(id)` (= `demoReset(id)`) | |

Если исполнитель вынужден отступить от имени — фиксирует отклонение в `interfaces.md` строкой «Что построено».

## Что построено
(заполняется по ходу тикетов)

### T02 (сборка языков)
- `stripLangs(src, lang, stats?, {hq?, comments?})` и `async verifyStrip(before, after, lang, parse?)` — `platform-src/tools-build/strip-langs.mjs`. Флаги сборки: `--keep-langs` (без вырезания, для диагностики), `--strip-help` (вырезание HQ, выключено: тесты c0-help-content читают полные кортежи).
- Сервер тестов должен иметь корнем корень репозитория (тесты i2 грузят `../platform-src/tools-build/strip-langs.mjs`).
- Бюджет: `page_kb` 3100, perf raw 3100 / gzip 1000. Вес: ru 3,09 MB (−25,3 %), de −27,6 %, en −27,9 %, kk −25,7 %.

### T01 (render-regions-live) — построено

- `renderRegion(name)` (`base/45-region.js`): перерисовывает регион `topbar|side|main|…`; `REGION_COUNT[name]` — счётчик перерисовок (для тестов).
- `liveBind(key, fn(node))`, `liveUpdate(root?)`: узлы с `data-live` обновляются точечно без пересборки страницы.
- `actionRegion(name)`; в `ACTION_DEFS` / `registerAction` поле `region` (`'all'` по умолчанию, `'main'`, `'topbar'`); диспетчер `ACT` для объявленного региона вызывает `renderRegion`, а не `render()`. Объявлено: `stab`→main, `tbMore`→topbar. Остальные ≈95 ACT по-прежнему `'all'`.
- `regionHook('before'|'after', prio, fn)` — хуки вокруг перерисовки региона (баннер использует их).
- Оговорка: внутри ACT с объявленным регионом DOM сразу после `render()` ещё старый; `toast()` всё ещё делает полный `render()`.
- Тик `liveTick`: медиана 0,10 мс (бюджет 4 мс); перерисовка региона 13–21 мс.
