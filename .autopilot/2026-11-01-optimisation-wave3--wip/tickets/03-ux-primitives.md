# 03 — Общие примитивы: состояния, предпочтения, отмена

**Требования:** R08, R09, R10
**Зависит от:** 01
**Зона:** `platform-src/v6/base/30-kit.js` · `platform-src/v6/base/46-prefs.js` · `platform-src/v6/base/47-undo.js` · `platform-src/v6/core.js` (подключение предпочтений: язык, фильтр хаба, последняя вкладка, тема, сохранённые виды) · `platform-src/v6/strings/` · `platform-src/tests/i3-ux-primitives.js`
**Волна:** 2
**Ревью:** да — фундамент
**Модель:** сильная

## Что должно заработать

Общие примитивы: состояния, предпочтения, отмена: см. критерии. Контекст кода — `notes.md`, границы и имена — `interfaces.md`.

## Из брифа, дословно

> «FR-212 Remembered preferences: Language, hub filter, saved views, last tab and theme remembered per viewer in the browser.»
> «FR-213 Uniform empty, loading and error states: Every list has the same states with a next-step action.»
> «FR-214 Undo instead of confirm: Reversible actions show an "Undo" toast for 10 s.»

## Разделы спецификации

История 21–28 (R08, R08.1, R08.2, R09, R09.1, R10, R10.1, R10.2).

## Критерии приёмки

- [ ] `KIT.state(kind, {title, hint, action})` для empty/loading/error/nofilter, 4 языка, a11y-роли; «ничего не найдено по фильтру» даёт кнопку «Сбросить фильтры»
- [ ] `PREFS.get/set` над ключом `kokzhol.v6.prefs`; восстанавливает язык, фильтр хаба, сохранённые виды, последнюю вкладку и тему; try/catch, битый JSON игнорируется; сброс в настройках
- [ ] В iframe тест-раннера (`self !== top` или `?nopref=1`) настройки не читаются и не пишутся; `kz-r4-views` получает ту же защиту; старые тесты не загрязняются
- [ ] `toastUndo(msg, undoFn, {ms:10000, audit})`: тост «Отменить» 10 с; по таймеру действие окончательное; повторная отмена невозможна; тост переживает смену экрана до таймера
- [ ] Отмена пишет в журнал аудита запись «отмена» (хэш-цепочка проходит проверку), ничего не удаляет
- [ ] Реестр действий принимает флаг `undo`
- [ ] Группы `i3-ux-primitives.js` зелёные на 4 языках; шарды без новых падений
