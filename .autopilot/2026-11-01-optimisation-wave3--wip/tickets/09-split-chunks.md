# 09 — Ядро + чанки по разделам (split-сборка)

**Требования:** R02
**Зависит от:** 02, 04, 05, 06, 07
**Зона:** `platform-src/build-v6.mjs` · `platform-src/tools-build/` · `platform-src/tests/i9-split.js` · `platform/split/` (результат)
**Волна:** 4
**Ревью:** да — риск сборки
**Модель:** сильная

## Что должно заработать

Ядро + чанки по разделам (split-сборка): см. критерии. Контекст кода — `notes.md`, границы и имена — `interfaces.md`.

## Из брифа, дословно

> «FR-192 Lazy screen modules: Core + one chunk per menu area, loaded on first visit; single-file build kept for offline demos.»

## Разделы спецификации

История 3–6 (R02, R02.1, R02.2, R02.3).

## Критерии приёмки

- [ ] `node platform-src/build-v6.mjs --split` пишет `platform/split/<lang>/`: ядро + `area-<id>.js`; чанк грузится один раз при первом заходе в раздел
- [ ] Граф зависимостей файлов (`addTab/DRAWERS/ACT/HOOKS`) проверяется на сборке: зависимые файлы идут в ядро или к владельцу, нарушение валит сборку
- [ ] Сбой загрузки чанка показывает `KIT.state("error")` с «Повторить», остальное работает
- [ ] Основные `platform/{index,de,en,kk}.html` не изменились по поведению; смоук-тест открывает каждый раздел split-сборки
- [ ] `i9-split.js` зелёные; шарды зелёные; `sw.js` не ломает split
