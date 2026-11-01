# 07 — Стартовые страницы ролей и сценарии демо

**Требования:** R11, R13
**Зависит от:** 03, 04
**Зона:** `platform-src/v6/screens/dashboard/` (новый файл role-home) · `platform-src/v6/screens/shell/001-shell-ext.js` (`demoReset`, сценарии) · `platform-src/tests/i7-home-scenarios.js`
**Волна:** 3
**Ревью:** нет
**Модель:** обычная

## Что должно заработать

Стартовые страницы ролей и сценарии демо: см. критерии. Контекст кода — `notes.md`, границы и имена — `interfaces.md`.

## Из брифа, дословно

> «FR-216 Role home pages: Each role first sees its 4–6 most important tiles (dispatcher, warehouse, driver, finance, customer, partner).»
> «FR-222 Demo scenario presets: "Normal day", "Winter storm", "Peak season", "West route" reset all data consistently.»

## Разделы спецификации

История 29–30 (R11, R11.1), 34–36 (R13…R13.2).

## Критерии приёмки

- [ ] `ROLE_HOME[role]` для всех 11 ролей: 4–6 плиток с KPI/переходами и правами; `homeRoute()` ведёт на стартовую роли; плитка без доступа не показывается; у каждой роли ≥ 4 плиток (тест)
- [ ] Есть ссылка на полный дашборд
- [ ] `SCENARIOS` + `applyScenario(id)`: «Обычный день» (= по умолчанию), «Зимняя буря», «Пик сезона», «Западный маршрут» согласованно сбрасывают рейсы, погоду, тревоги, хабы, финансы
- [ ] Сброс закрывает drawer, возвращает на стартовую роли, настройки R08 сохраняются; повтор даёт те же данные (сид)
- [ ] Группы `i7-home-scenarios.js` зелёные на 4 языках
