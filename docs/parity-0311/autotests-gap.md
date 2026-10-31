# Autotest coverage map: 0.3.11 suite (757 scenarios) vs v6 suite (platform-src/tests)

Date: 2026-10-31. Read-only audit, no code changed. Sources: `releases/0.3.11/tests.html` (run in the built-in browser against `releases/0.3.11/platform.html`; row data in `docs/parity-0311/autotests-0311.tsv`), v6 sources `platform-src/tests/*.js` (457 `group(...)` calls in 55 files), v6 globals read live from `platform/index.html`.

Legend: **COVERED** = a v6 group asserts the same behaviour (v6 file + group named in Appendix A); **PARTIAL** = v6 asserts part of it (what is missing is in the detail tables); **MISSING** = no v6 test; **N/A** = concept does not exist in v6 (reason given).

Method notes. (1) 0.3.11 names many scenarios per record (`Место #1..#22`, `Город #1..#23`): they are kept as separate scenarios in the counts, but v6 walks all records in one group (`f1-data-integrity.js`), so one v6 group covers a whole range. (2) COVERED was decided from the v6 group titles plus spot reads of the group bodies (f1, f4, 61, 70, 81, 87, e2, a0); a COVERED row means "a group with this subject exists", not that every sub-assertion of the 0.3.11 body was compared line by line. (3) v6 seed differs from the 0.3.11 seed (7 trucks / 7 drivers / 17 partners / 10 forecast cities / 3 fines / 306 places vs 4 / 13 / 22 / 23 / 5 / 22), so per-record counts are never ported literally; the v6 equivalent is "every record satisfies the rule".

## 0. Totals

| status | scenarios | share |
|---|---:|---:|
| COVERED | 583 | 77.0 % |
| PARTIAL | 117 | 15.5 % |
| MISSING | 30 | 4.0 % |
| N/A | 27 | 3.6 % |
| **total** | **757** | 100 % |

## 1. Summary per module (155 modules)

| # | module | 0.3.11 count | covered | partial | missing | n/a | new file |
|---:|---|---:|---:|---:|---:|---:|---|
| 1 | Навигация | 18 | 18 | 0 | 0 | 0 |  |
| 2 | Языки | 9 | 9 | 0 | 0 | 0 |  |
| 3 | Фильтр хабов | 2 | 2 | 0 | 0 | 0 |  |
| 4 | Данные · ТС | 5 | 1 | 4 | 0 | 0 | h1 |
| 5 | Данные · SSCC | 32 | 32 | 0 | 0 | 0 |  |
| 6 | Данные · рейс | 22 | 22 | 0 | 0 | 0 |  |
| 7 | Данные · срок | 22 | 22 | 0 | 0 | 0 |  |
| 8 | Данные · штрафы | 5 | 5 | 0 | 0 | 0 |  |
| 9 | Данные · персонал | 13 | 13 | 0 | 0 | 0 |  |
| 10 | Данные · погода | 23 | 10 | 0 | 13 | 0 | h1 |
| 11 | Автопарк | 6 | 5 | 1 | 0 | 0 | h1 |
| 12 | Термостатус | 5 | 5 | 0 | 0 | 0 |  |
| 13 | Отчёты | 12 | 3 | 9 | 0 | 0 | h7 |
| 14 | Диспетчер | 3 | 3 | 0 | 0 | 0 |  |
| 15 | Загрузка | 2 | 2 | 0 | 0 | 0 |  |
| 16 | Симуляция | 3 | 3 | 0 | 0 | 0 |  |
| 17 | Погода | 2 | 2 | 0 | 0 | 0 |  |
| 18 | Безопасность | 2 | 2 | 0 | 0 | 0 |  |
| 19 | Документы РК | 2 | 2 | 0 | 0 | 0 |  |
| 20 | Качество | 1 | 1 | 0 | 0 | 0 |  |
| 21 | Персонал | 3 | 1 | 2 | 0 | 0 | h4 |
| 22 | Поиск | 25 | 25 | 0 | 0 | 0 |  |
| 23 | FR-01 Сканер | 2 | 2 | 0 | 0 | 0 |  |
| 24 | FR-02 Архив | 2 | 2 | 0 | 0 | 0 |  |
| 25 | FR-17 Клавиатура | 2 | 2 | 0 | 0 | 0 |  |
| 26 | FR-17 Доступность | 1 | 1 | 0 | 0 | 0 |  |
| 27 | FR-03 Track & trace | 2 | 2 | 0 | 0 | 0 |  |
| 28 | FR-04 ZPL | 1 | 1 | 0 | 0 | 0 |  |
| 29 | FR-05 FEFO | 2 | 2 | 0 | 0 | 0 |  |
| 30 | FR-06 Сверка | 2 | 2 | 0 | 0 | 0 |  |
| 31 | FR-11 Go/No-Go | 2 | 2 | 0 | 0 | 0 |  |
| 32 | FR-12 Документы | 3 | 3 | 0 | 0 | 0 |  |
| 33 | FR-07 Штрафы | 2 | 2 | 0 | 0 | 0 |  |
| 34 | FR-08 Тахограф | 2 | 2 | 0 | 0 | 0 |  |
| 35 | FR-09 Подбор ТС | 2 | 0 | 2 | 0 | 0 | h4 |
| 36 | FR-10 Сроки | 2 | 2 | 0 | 0 | 0 |  |
| 37 | FR-13 Казахский | 3 | 3 | 0 | 0 | 0 |  |
| 38 | FR-16 Погода | 2 | 2 | 0 | 0 | 0 |  |
| 39 | FR-11 Диспетчер | 1 | 1 | 0 | 0 | 0 |  |
| 40 | Данные · партнёры | 22 | 22 | 0 | 0 | 0 |  |
| 41 | Данные · контакты | 22 | 0 | 22 | 0 | 0 | h1 |
| 42 | Партнёры | 5 | 2 | 3 | 0 | 0 | h4 |
| 43 | FR-24 SLA | 1 | 1 | 0 | 0 | 0 |  |
| 44 | FR-32 Хаб | 1 | 0 | 1 | 0 | 0 | h4 |
| 45 | FR-31 Справочник | 1 | 1 | 0 | 0 | 0 |  |
| 46 | FR-26 Договоры | 1 | 1 | 0 | 0 | 0 |  |
| 47 | FR-25 Качество | 2 | 2 | 0 | 0 | 0 |  |
| 48 | FR-20 Мощность | 1 | 1 | 0 | 0 | 0 |  |
| 49 | FR-19 GDP | 2 | 2 | 0 | 0 | 0 |  |
| 50 | FR-29 Тариф | 1 | 1 | 0 | 0 | 0 |  |
| 51 | FR-28 Полис | 1 | 0 | 1 | 0 | 0 | h4 |
| 52 | Передача | 5 | 5 | 0 | 0 | 0 |  |
| 53 | FR-30 Портал | 1 | 1 | 0 | 0 | 0 |  |
| 54 | FR-21 Загрузка | 1 | 1 | 0 | 0 | 0 |  |
| 55 | FR-21 Документы | 1 | 1 | 0 | 0 | 0 |  |
| 56 | FR-21 Track & trace | 1 | 1 | 0 | 0 | 0 |  |
| 57 | Сервис | 3 | 1 | 2 | 0 | 0 | h4 |
| 58 | FR-27 Заявка | 3 | 3 | 0 | 0 | 0 |  |
| 59 | FR-22 Покрытие | 2 | 2 | 0 | 0 | 0 |  |
| 60 | FR-23 Рефсервис | 1 | 0 | 1 | 0 | 0 | h4 |
| 61 | FR-33 Контакты | 3 | 3 | 0 | 0 | 0 |  |
| 62 | FR-33 Авария | 1 | 0 | 1 | 0 | 0 | h3 |
| 63 | FR-33 Диспетчер | 1 | 0 | 1 | 0 | 0 | h3 |
| 64 | FR-34 Цвета | 3 | 3 | 0 | 0 | 0 |  |
| 65 | Навигация DE | 17 | 17 | 0 | 0 | 0 |  |
| 66 | Навигация EN | 17 | 17 | 0 | 0 | 0 |  |
| 67 | Fragenkatalog · данные | 1 | 1 | 0 | 0 | 0 |  |
| 68 | Fragenkatalog · города | 24 | 23 | 1 | 0 | 0 | h1 |
| 69 | Fragenkatalog · сеть | 1 | 1 | 0 | 0 | 0 |  |
| 70 | Fragenkatalog · кольца | 9 | 9 | 0 | 0 | 0 |  |
| 71 | Fragenkatalog · парк | 3 | 1 | 1 | 1 | 0 | h1 |
| 72 | Fragenkatalog · экономика | 8 | 5 | 1 | 2 | 0 | h1 |
| 73 | Исходные данные | 13 | 9 | 2 | 2 | 0 | h7 |
| 74 | FR-35…51 | 1 | 0 | 1 | 0 | 0 | h1 |
| 75 | FR-41 Экспресс | 3 | 3 | 0 | 0 | 0 |  |
| 76 | FR-37 Справочник | 1 | 1 | 0 | 0 | 0 |  |
| 77 | Планирование | 1 | 1 | 0 | 0 | 0 |  |
| 78 | v5 · парк | 4 | 3 | 0 | 0 | 1 |  |
| 79 | FR-39 Термостатус | 2 | 2 | 0 | 0 | 0 |  |
| 80 | FR-40 Термохрон | 1 | 1 | 0 | 0 | 0 |  |
| 81 | FR-43 Мороз | 1 | 1 | 0 | 0 | 0 |  |
| 82 | FR-44 Окно склада | 1 | 1 | 0 | 0 | 0 |  |
| 83 | FR-51 ДОПОГ | 1 | 0 | 1 | 0 | 0 | h3 |
| 84 | FR-45 Партнёры | 1 | 0 | 1 | 0 | 0 | h1 |
| 85 | Затраты | 5 | 1 | 3 | 1 | 0 | h1, h7 |
| 86 | Затраты · дизель | 3 | 1 | 1 | 1 | 0 | h7 |
| 87 | Затраты · сервис | 2 | 2 | 0 | 0 | 0 |  |
| 88 | Затраты · учёт | 2 | 2 | 0 | 0 | 0 |  |
| 89 | Затраты · свой/внешний | 2 | 1 | 1 | 0 | 0 | h7 |
| 90 | Затраты · водители | 1 | 1 | 0 | 0 | 0 |  |
| 91 | Водитель · экосистема | 1 | 1 | 0 | 0 | 0 |  |
| 92 | Водитель · FR | 1 | 0 | 1 | 0 | 0 | h5 |
| 93 | FR-57 Скан SSCC | 1 | 1 | 0 | 0 | 0 |  |
| 94 | FR-58 Термохрон | 1 | 1 | 0 | 0 | 0 |  |
| 95 | FR-59 Исключение | 1 | 1 | 0 | 0 | 0 |  |
| 96 | FR-52 Смена | 1 | 1 | 0 | 0 | 0 |  |
| 97 | FR-53 Путевой лист | 1 | 1 | 0 | 0 | 0 |  |
| 98 | FR-55/56 Маршрут | 1 | 0 | 1 | 0 | 0 | h5 |
| 99 | FR-60 Возвраты | 1 | 1 | 0 | 0 | 0 |  |
| 100 | FR-61 Топливо | 1 | 1 | 0 | 0 | 0 |  |
| 101 | FR-63 Сообщения | 1 | 0 | 0 | 1 | 0 | h5 |
| 102 | FR-62 Инцидент | 2 | 1 | 1 | 0 | 0 | h5 |
| 103 | FR-67 Офлайн | 1 | 1 | 0 | 0 | 0 |  |
| 104 | FR-65 Конец смены | 1 | 1 | 0 | 0 | 0 |  |
| 105 | FR-66 Профиль | 1 | 0 | 1 | 0 | 0 | h5 |
| 106 | Водитель · ePOD | 1 | 1 | 0 | 0 | 0 |  |
| 107 | Водитель → диспетчер | 1 | 0 | 1 | 0 | 0 | h5 |
| 108 | Производители | 7 | 4 | 3 | 0 | 0 | h2 |
| 109 | Водитель · языки | 4 | 4 | 0 | 0 | 0 |  |
| 110 | Автопарк · показ | 3 | 1 | 2 | 0 | 0 | h4 |
| 111 | Журнал исправлений | 1 | 1 | 0 | 0 | 0 |  |
| 112 | Загрузка · типы ТС | 16 | 11 | 4 | 0 | 1 | h2 |
| 113 | Входящие | 14 | 13 | 0 | 0 | 1 |  |
| 114 | Справка | 11 | 7 | 3 | 0 | 1 | h8 |
| 115 | Покрытие связи | 12 | 10 | 1 | 0 | 1 | h5 |
| 116 | Вёрстка | 1 | 0 | 0 | 0 | 1 |  |
| 117 | Версии и дата (FR-74/76) | 5 | 2 | 2 | 0 | 1 | h3 |
| 118 | Загрузка · согласованность | 5 | 1 | 3 | 1 | 0 | h2 |
| 119 | Подбор ТС · симуляция | 8 | 6 | 2 | 0 | 0 | h2 |
| 120 | Предложение и договор | 3 | 3 | 0 | 0 | 0 |  |
| 121 | Портал: бронирование v2 | 14 | 12 | 1 | 0 | 1 | h6 |
| 122 | Соответствие языка / Language match | 4 | 2 | 0 | 1 | 1 | h8 |
| 123 | FR-84 Симуляция только в демо | 3 | 3 | 0 | 0 | 0 |  |
| 124 | FR-131 Изменения других пользователей | 3 | 2 | 0 | 0 | 1 |  |
| 125 | FR-134 Доступность | 2 | 1 | 0 | 1 | 0 | h8 |
| 126 | FR-133 Навигация и таблицы | 2 | 2 | 0 | 0 | 0 |  |
| 127 | FR-81/82/85/89 Приватность | 7 | 4 | 1 | 0 | 2 | h4 |
| 128 | FR-71/78/83 Живые данные | 6 | 5 | 0 | 0 | 1 |  |
| 129 | FR-91…100 Рейсы и Go/No-Go | 7 | 5 | 2 | 0 | 0 | h3 |
| 130 | FR-101…106 Холодовая цепь и тревоги | 8 | 6 | 0 | 0 | 2 |  |
| 131 | Доставка · ePOD и связь (FR-107…113) | 10 | 6 | 2 | 0 | 2 | h5 |
| 132 | Lane J · затраты, ЕСУТД, GDP | 7 | 6 | 1 | 0 | 0 | h4 |
| 133 | FR-118…127 Ресурсы, персонал, партнёры | 13 | 9 | 2 | 0 | 2 | h4, h6 |
| 134 | FR-132 Одна навигация | 6 | 1 | 1 | 3 | 1 | h4, h8 |
| 135 | FR-137 Права из backend | 3 | 2 | 1 | 0 | 0 | h8 |
| 136 | FR-135 Справочник мест, казахский, системные тексты | 11 | 5 | 5 | 0 | 1 | h1, h3 |
| 137 | FR-139…157 Подбор ТС и погрузка | 8 | 7 | 1 | 0 | 0 | h2 |
| 138 | BUG-31 / FR-175 История, заголовки, ссылки | 8 | 6 | 1 | 1 | 0 | h8 |
| 139 | BUG-32 Экспресс на экране 02 | 3 | 3 | 0 | 0 | 0 |  |
| 140 | Справка: схемы и анимации | 6 | 6 | 0 | 0 | 0 |  |
| 141 | FR-159 / FR-160 Учёт и туры | 6 | 4 | 2 | 0 | 0 | h8 |
| 142 | FR-158 Реестр ТС: столбцы, виды, CSV | 2 | 2 | 0 | 0 | 0 |  |
| 143 | FR-173 Формы для существующих API | 2 | 1 | 1 | 0 | 0 | h3 |
| 144 | Логотипы производителей · экран 04 | 4 | 2 | 2 | 0 | 0 | h2 |
| 145 | Плановые значения · проверка перед запуском | 2 | 1 | 1 | 0 | 0 | h7 |
| 146 | Партнёр · демо-аккаунт и самостоятельная регистрация GDP | 3 | 3 | 0 | 0 | 0 |  |
| 147 | Новые записи · производители, ТС, водители | 3 | 2 | 1 | 0 | 0 | h4 |
| 148 | Дежурства · график эскалаций | 3 | 3 | 0 | 0 | 0 |  |
| 149 | Переключатель дизайна · Olymp ↔ Kökzhol | 2 | 1 | 0 | 1 | 0 | h8 |
| 150 | Иконки навигации · Olymp duotone / Kökzhol tile | 2 | 1 | 1 | 0 | 0 | h8 |
| 151 | Договоры и ЭЦП · FR-149 | 8 | 6 | 0 | 1 | 1 | h6 |
| 152 | FR-163 Номера | 4 | 0 | 0 | 0 | 4 |  |
| 153 | Портал · вес, плательщик, сообщения, БИН (FR-185…190) | 7 | 5 | 2 | 0 | 0 | h6 |
| 154 | Страхование и прайс-листы · FR-153 / FR-148 | 8 | 7 | 1 | 0 | 0 | h6 |
| 155 | BUG-37 · Демо в двух вкладках | 1 | 0 | 0 | 0 | 1 |  |
| | **total** | **757** | **583** | **117** | **30** | **27** | |

## 1a. Proposed new v6 test files (h1 .. h8)

Counts are the 0.3.11 scenarios that are PARTIAL or MISSING and are routed to the file (one new v6 `group` usually covers several scenarios, so the number of v6 groups will be lower; the h1 scenario count is inflated by per-record scenarios, the column distinct checks is the real size).

| file | PARTIAL | MISSING | scenarios | distinct checks (v6 asserts to write) | modules (scenarios) |
|---|---:|---:|---:|---:|---|
| `platform-src/tests/h1-data-seed-integrity.js` | 33 | 17 | 50 | 14 | Данные · ТС (4); Данные · погода (13); Автопарк (1); Данные · контакты (22); Fragenkatalog · города (1); Fragenkatalog · парк (2); Fragenkatalog · экономика (3); FR-35…51 (1); FR-45 Партнёры (1); Затраты (1); FR-135 Справочник мест, казахский, системные тексты (1) |
| `platform-src/tests/h2-load-ship-vehicle.js` | 15 | 1 | 16 | 15 | Производители (3); Загрузка · типы ТС (4); Загрузка · согласованность (4); Подбор ТС · симуляция (2); FR-139…157 Подбор ТС и погрузка (1); Логотипы производителей · экран 04 (2) |
| `platform-src/tests/h3-dispatch-gonogo-safety.js` | 12 | 0 | 12 | 9 | FR-33 Авария (1); FR-33 Диспетчер (1); FR-51 ДОПОГ (1); Версии и дата (FR-74/76) (2); FR-91…100 Рейсы и Go/No-Go (2); FR-135 Справочник мест, казахский, системные тексты (4); FR-173 Формы для существующих API (1) |
| `platform-src/tests/h4-resources-partners.js` | 19 | 0 | 19 | 18 | Персонал (2); FR-09 Подбор ТС (2); Партнёры (3); FR-32 Хаб (1); FR-28 Полис (1); Сервис (2); FR-23 Рефсервис (1); Автопарк · показ (2); FR-81/82/85/89 Приватность (1); Lane J · затраты, ЕСУТД, GDP (1); FR-118…127 Ресурсы, персонал, партнёры (1); FR-132 Одна навигация (1); Новые записи · производители, ТС, водители (1) |
| `platform-src/tests/h5-driver-app-delivery.js` | 8 | 1 | 9 | 9 | Водитель · FR (1); FR-55/56 Маршрут (1); FR-63 Сообщения (1); FR-62 Инцидент (1); FR-66 Профиль (1); Водитель → диспетчер (1); Покрытие связи (1); Доставка · ePOD и связь (FR-107…113) (2) |
| `platform-src/tests/h6-portal-commercial.js` | 5 | 1 | 6 | 5 | Портал: бронирование v2 (1); FR-118…127 Ресурсы, персонал, партнёры (1); Договоры и ЭЦП · FR-149 (1); Портал · вес, плательщик, сообщения, БИН (FR-185…190) (2); Страхование и прайс-листы · FR-153 / FR-148 (1) |
| `platform-src/tests/h7-economics-reports.js` | 17 | 3 | 20 | 12 | Отчёты (9); Исходные данные (4); Затраты (3); Затраты · дизель (2); Затраты · свой/внешний (1); Плановые значения · проверка перед запуском (1) |
| `platform-src/tests/h8-shell-i18n-help.js` | 8 | 7 | 15 | 14 | Справка (3); Соответствие языка / Language match (1); FR-134 Доступность (1); FR-132 Одна навигация (3); FR-137 Права из backend (1); BUG-31 / FR-175 История, заголовки, ссылки (2); FR-159 / FR-160 Учёт и туры (2); Переключатель дизайна · Olymp ↔ Kökzhol (1); Иконки навигации · Olymp duotone / Kökzhol tile (1) |

## 2. Data-set checks (modules `Данные · …`, `Fragenkatalog · …`, `Исходные данные`)

0.3.11 validates the v5 demo data set one record per scenario: `Данные · ТС` 5, `· SSCC` 32, `· рейс` 22, `· срок` 22, `· штрафы` 5, `· персонал` 13, `· погода` 23, `· партнёры` 22, `· контакты` 22 = 166 scenarios. v6 replaced them by 10 walking groups in `f1-data-integrity.js` (plates, SSCC, load-vs-truck, shelf life, fines, staff plan, weather, partners, manufacturers, rings) plus `f4-economics.js` (baseline volumes, rings and fleet, economics). Result: 127 of the 166 data scenarios are COVERED, 26 PARTIAL (4 plate region, 22 contact structure) and 13 MISSING (weather cities without a forecast). The checks below are missing; every global was read live from the running v6 page (`S.trucks` 7, `S.drivers` 7, `S.partners` 17, `S.res.fines` 3, `WEATHER.WX` 10 keys, `KZMAP.CITY` 23, `LOCS` 21, places 306 in 16 loads).

| # | missing data check | 0.3.11 scenarios | v6 globals to assert on | notes |
|---:|---|---|---|---|
| 1 | Plate region code belongs to the truck hub city (01 Astana, 02 Almaty, 09 Karaganda ...) | 22-25 (ТС #1-#4: region 02 Almaty) | `S.trucks[].plate` (suffix), `S.trucks[].hub`, `HUBS[hub].city`, `REGOF` (a function in v6: check its signature before use) | v6 seed: t1 `123 ABC 01` hub AST, t2 `456 DEF 02` hub ALA, t5 `654 MNO 09` hub AST (region 09 = Karaganda but hub AST) - this check would flag t5 as a data inconsistency to be decided by the owner |
| 2 | Every network city has a 7-day forecast (or an explicit documented fallback) with risk 0-3 | 121-133 (Город #11-#23) | `KZMAP.CITY` (23) vs `Object.keys(WEATHER.WX)` (10: AST KAR ALA SHY ATY KOS AKT KHR ORA AKU), `WEATHER.cityHub(key)`, `WEATHER.risk(day)` | DATA GAP, not only a test gap: 13 cities (Kokshetau, Petropavl, Pavlodar, Zhezkazgan, Taldykorgan, Taraz, Turkistan, Kyzylorda, Semey, Oskemen, Aksu, Kaskelen, Saryagash) have no forecast; `cityHub` falls back to AST |
| 3 | Partner contact structure: name, role, phone, mobile, masked variants; 3 managers per partner | 254-275 (Партнёр #1-#22) | `partnerContacts(p)` -> `[{id,role,name,tel,mob,telM,mobM}]` | f1 only checks `length >= 2` and a `+7` pattern. v6 seed has exactly 2 contacts per partner, 0.3.11 had 3: decide the target (2 or 3) and assert `name`, `role`, `tel`, `mob` non-empty and `telM`/`mobM` matching `+7 7•• ••• •• NN` |
| 4 | Partner contract end `until` is MM.YYYY and the 3-month expiry reminder list equals the partners expiring within 3 months of the demo date | FR-26 (284), 232-253 (contract part) | `S.partners[].until`, `RES.TODAY`, `RES.daysTo` | 87-res-partners.js tests renewal, not the seed; add seed format and the reminder list consistency |
| 5 | Partner directory contains carriers (GarantA, KazExpress, KazGen, SpezAvto in 0.3.11) | 431 (FR-45) | `S.partners.filter(p=>p.type==='lp')` | DATA GAP: v6 names are PL-01..PL-08, PL-10 (no PL-09); assert >= 2 `lp` partners with tier silver or better and the id sequence is unique |
| 6 | Driver weekly / daily hours stay inside the limits | staff scenarios 98-110 (hours part of the 14-day plan) | `S.drivers[].week`, `S.drivers[].onDuty`, `RES.LIM` (cont 4.5, day 9, week 56, year 1814), `RES.driverBlocks(d)` | f1 staff group checks plan codes and dates, not the numeric hours |
| 7 | Fine records carry article, positive integer amount, status from the fine state machine | 93-97 (extra checks beyond the waybill link) | `S.res.fines[]` {article, amount, status}, `RES.FINE_ST` | cheap structural check next to the existing waybill check |
| 8 | Every load driver has a licence category valid for the truck class (C / CE) and valid at the ETA | 49-70 (рейс), 424 | `S.loads[].driver`, `S.drivers[].lic`, `S.drivers[].docs[type=lic].to`, `S.trucks[].cap` | f0-shell-parity.js checks category C/CE only for running trips; extend to all assigned loads |
| 9 | Baseline: temperature split per city, 2-8 C about 77 %, shipments per month / 6 | 378 | `ECO_BL.BLC[].t`, `ECO_BL.BLD` | f4 checks `t.length === 3` only |
| 10 | Baseline: outsourcing 290.4 M tenge/year (G25), express surcharge 88.7 M (T140), express 8.3 % of weight (A2) | 392-394 | `ECO_BL.BLD`, `ECO_BL.BLV` (express row), `ECO_VOF` | f4 asserts 36,3 % only |
| 11 | Fleet ageing: JAC south ring reaches 200 000 km in < 18 months (FR-50) | 391 | `RES.warranty(truck)`, `ECO_RINGS[S].km * per`, `S.trucks[].km` | warranty forecast is tested generically in 80-res-fleet-staff.js, not on the seed |
| 12 | Round-3 requests (FR-35..51) list consistent with the baseline screen | 413 | `S.eco`, docs/TRACEABILITY.md ids | optional |
| 13 | Diesel statistics: 8 weekly values per truck and overrun flag > 8 % | 437-438 | `S.diesel` | seed check for the cost screen |
| 14 | Place label data: every place has manufacturer logo/name resolvable in `MFRS` (logo asset exists) | 484-486 | `MFRS[x].logo`, `assets/` file names | f1 checks the registry link, not the logo file |
| 15 | Location directory: four language names, KATO, coordinates, hub | 665 | `LOCS` (v6: {n, hub, km}, 21 entries), `KZMAP.CITY` (4 names + lat/lon, 23 entries) | v6 LOCS has no KATO / id; decide whether the contract exists before testing (90-rec-records.js tests the KATO validator only) |

Already covered by f1/f4 (no new test needed): plate format and uniqueness; SSCC 18 digits + GS1 check digit + unique + order/load link + `ssccFromScan`; load vs truck zone / ADR truck / ADR driver / known driver; no expired line and the FEFO list equals lines < 90 days; fines vs waybill (driver, truck, time window); 14-day plan from next Monday with known codes and absences; forecast cities 7 days, min <= max, risk 0-3, serving hub; partner tier/type/SLA/blocked reason/phone pattern; manufacturer registry; rings density/volume/payload; baseline Σ 64 249 kg, kg/week = kg/month / 4.33, m3 at 164 kg/m3, Semey/Oskemen to Astana, 118.6 M with VAT 16 %, 83.0 M saving, MRP 4 325, IT 4.8 M + 90 000, 2.6x return leg, V-12 9 366 kg, V-21 49 500.

## 3. Detail tables: PARTIAL and MISSING scenarios per module

### Данные · ТС

5 scenarios: 1 covered, 4 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 22-25 (4) | ТС #k: госномер в формате РК, регион 02 (Алматы) | PARTIAL | Plate is a KZ plate AND its region code is the registration region of the truck's hub city | S.trucks[].plate region suffix (01 Astana, 02 Almaty, 09 Karaganda ...) vs S.trucks[].hub / HUBS[hub].city; use the region table behind REGOF (function, check its signature first) | f1-data-integrity.js: data: fleet plates are KZ format, unique, every truck at a hub | `h1-data-seed-integrity.js` |

### Данные · погода

23 scenarios: 10 covered, 0 partial, 13 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 121-133 (13) | Город #k: прогноз на 7 дней, уровни риска 0–3 | MISSING | Network city has a 7-day forecast with risk level 0-3 (0.3.11: 23 cities) | DATA GAP: KZMAP.CITY has 23 cities, WEATHER.WX only 10 (AST KAR ALA SHY ATY KOS AKT KHR ORA AKU); 13 cities fall back to hub AST. Either extend WEATHER.WX or assert 'every KZMAP.CITY resolves to a forecast or a documented hub fallback' via WEATHER.cityHub(key) / WEATHER.WX | f1-data-integrity.js checks only the 10 cities of WEATHER.WX | `h1-data-seed-integrity.js` |

### Автопарк

6 scenarios: 5 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 167 (1) | FR-38: в автопарке 4 ТС — 2 HOWO T5G, 2 JAC N120, 1 с активным холодом | PARTIAL | S.trucks fleet composition: models, one with active cooling (0.3.11: 4 trucks 2 HOWO 2 JAC) | v6 seed has 7 trucks (t1..t7, Reefer/Van/Tent); assert fleet size, S.trucks.filter(unit).length >= 1 and baseline fleet ECO_BL.BLF vs S.trucks classes | b0-eco-economics.js / f4-economics.js: baseline target fleet 4 (ECO_BL.BLF) | `h1-data-seed-integrity.js` |

### Отчёты

12 scenarios: 3 covered, 9 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 142-150 (9) | Отчёт по водителям #k: строка с рейсами, км и пунктуальностью | PARTIAL | Driver report: one row per driver with trips, km and punctuality | Reports > drivers report (screens/reports/610-eco-reports.js, 611-eco-reports-ext.js ontime): rows = S.drivers.length, trips/km/on-time cells numeric, no NaN | b1-eco-reports-ext.js: reports: driver report follows the fine register (attribution, open amounts) | `h7-economics-reports.js` |

### Персонал

3 scenarios: 1 covered, 2 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 169 (1) | Дежурный Н. Абенов — кандидат, но все 3 ТС Астаны заняты | PARTIAL | Duty officer is a candidate for an urgent trip but every truck of the hub is busy -> reasons shown | RES.urgent(hub,{...}).trucks[].why / .drivers[]; busy trucks listed with a reason | e2-mirror-res.js: R2 S5/S6/S7 staff urgent trip | `h4-resources-partners.js` |
| 171 (1) | Срочный рейс без свободной ТС → субподряд (GarantA / KazExpress) | PARTIAL | No free truck -> recommendation to subcontract (GarantA / KazExpress) | RES.urgent(hub,...) with all trucks of the hub on a running load: result carries the 'subcontractor' recommendation text (screens/drivers/320-staff.js) and the Partners tab link | 80-res-fleet-staff.js: R6 staff urgent trip U-n | `h4-resources-partners.js` |

### FR-09 Подбор ТС

2 scenarios: 0 covered, 2 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 223-224 (2) | Алматы: нет свободной машины → субподряд | PARTIAL | Hub has no free truck (Almaty / Astana) -> subcontract recommendation | RES.urgent(hub) with the hub's trucks blocked: assert u.trucks all not ok and the 'subcontractor' hint (320-staff.js) is rendered on drivers > staff | e2-mirror-res.js / 80-res-fleet-staff.js: RES.urgent pair | `h4-resources-partners.js` |

### Данные · контакты

22 scenarios: 0 covered, 22 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 254-275 (22) | Партнёр #k: 3 менеджера с именем, телефоном и мобильным | PARTIAL | Every partner has 3 managers with name, phone and mobile | partnerContacts(p): >= 2 (v6 seed has 2, not 3), each with non-empty name, role, tel and mob (+ masked telM / mobM) | f1-data-integrity.js: partners contacts (>= 2 with a +7 phone) | `h1-data-seed-integrity.js` |

### Партнёры

5 scenarios: 2 covered, 3 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 276 (1) | Экран показывает 22 партнёра (FR-45) и KPI по уровням | PARTIAL | Partners screen shows all partners and KPI per tier (gold/silver/bronze/blocked) | Dispatch > partners tab: row count = S.partners.length (17), KPI tiles per tier equal S.partners tier counts | 87-res-partners.js: city-group filter, full table columns | `h4-resources-partners.js` |
| 277 (1) | Фильтр «Blocked» показывает 2 партнёра с причиной блокировки | PARTIAL | Filter 'Blocked' shows the blocked partners with their reason | Partners tab filter value 'blocked' -> rows = S.partners.filter(tier=blocked) (2), reason (p.block) visible | 87-res-partners.js (blocked partner row) | `h4-resources-partners.js` |
| 280 (1) | Фильтр «Сервис» — 8 мастерских | PARTIAL | Filter 'Service' shows the 8 workshops | Partners tab type filter 'ws' -> rows = S.partners.filter(type=ws) (8) | 87-res-partners.js: full table columns | `h4-resources-partners.js` |

### FR-32 Хаб

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 282 (1) | Фильтр хаба «Алматы» показывает только партнёров зоны «Юг» (после P86) | PARTIAL | Hub filter 'Almaty' on Partners shows only partners of the south zone | S.hubView='ALA' on the partners tab: every visible row has HUBS-zone/city of the south (p.city -> hub via KZMAP/LOCS hub) | 61-shell-ext.js: hub filter narrows lists | `h4-resources-partners.js` |

### FR-28 Полис

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 290 (1) | PL-01: полис ответственности перевозчика указан | PARTIAL | PL-01 carrier liability policy is shown | Handover candidate / act: p.ins (INS_POLICY global) printed on the act; assert S.partners.find(PL-01).ins non-empty and visible in the handover drawer | 87-res-partners.js: handover act | `h4-resources-partners.js` |

### Сервис

3 scenarios: 1 covered, 2 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 305 (1) | Bronze-сервис вызывается только по согласованию | PARTIAL | Bronze service is called only by agreement | Partners tab > service on route: Bronze workshop row has the 'by agreement' flag (p.tier='bronze') and Call is gated | 87-res-partners.js: service on route, Call service | `h4-resources-partners.js` |
| 306 (1) | Заблокированный сервис (Павлодар) не предлагается на R-106 | PARTIAL | Blocked service (Pavlodar) is not offered on the trip | Service-on-route list excludes S.partners with tier 'blocked' (PW-08) | 87-res-partners.js: service on route | `h4-resources-partners.js` |

### FR-23 Рефсервис

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 309 (1) | Костанай на R-106: мобильный выезд Gold-рефсервиса ≤ 4 ч | PARTIAL | Reefer mobile call-out of a Gold ref-service <= 4 h on the cold trip | Service-on-route for a chilled trip in the west: partner with reefer=true, tier gold, response time p.resp <= 4 (S.partners[].reefer / .resp) | 87-res-partners.js: service on route | `h4-resources-partners.js` |

### FR-33 Авария

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 313 (1) | Симуляция «Поломка V01»: инструкция и контакты сервиса Караганды | PARTIAL | Breakdown V01 simulation: instruction and Karaganda service contacts | ACT sim 'breakdown' -> playbook text + partnerContacts of the Karaganda service partner (screens/routes/150-monitor.js, MIRROR_SIMS) | d0-v6-parity.js: security breakdown simulation | `h3-dispatch-gonogo-safety.js` |

### FR-33 Диспетчер

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 314 (1) | Диспетчер: рефсервис на маршруте R-103 (2–8 °C) с контактами | PARTIAL | Dispatcher shows a ref-service on the route of a 2-8 C trip with contacts | Trip detail aside (74-ops-dashboard.js) for a chilled load: partner service list with partnerContacts count | 87-res-partners.js: service on route | `h3-dispatch-gonogo-safety.js` |

### Fragenkatalog · города

24 scenarios: 23 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 378 (1) | Темп. отправки в месяц 40 / 6 / 6 (с Макинском), 2–8 °C ≈ 77 % | PARTIAL | Temperature shipments per month / 6 (with Makinsk), 2-8 C about 77 % | ECO_BL.BLC[].t (3-way split) summed and weighted: assert share of 2-8 C ~ 77 % and shipments/6 from ECO_BL.BLD | f4-economics.js: baseline volumes (temperature split per city) | `h1-data-seed-integrity.js` |

### Fragenkatalog · парк

3 scenarios: 1 covered, 1 partial, 1 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 390 (1) | Каждое кольцо закреплено за моделью из плана | PARTIAL | Each ring is assigned to a vehicle model of the plan | ECO_BL.BLR[].veh resolves to an ECO_BL.BLF entry (find by startsWith) - f4 uses F[0] as silent fallback; assert the match exists | f4-economics.js: rings load fits the planned vehicle | `h1-data-seed-integrity.js` |
| 391 (1) | FR-50: JAC N120 на юге исчерпывает 200 000 км < 18 мес. (R114) | MISSING | FR-50: JAC N120 in the south exhausts 200 000 km in < 18 months (R114) | RES.warranty(truck) (80-res-fleet-staff.js tests the forecast generically) fed with ECO_RINGS[S].km*per: assert months < 18 for the south ring vehicle; also ECO_BL.BLF km/year | - | `h1-data-seed-integrity.js` |

### Fragenkatalog · экономика

8 scenarios: 5 covered, 1 partial, 2 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 392 (1) | Экспресс: 36,3 % бюджета при 8,3 % веса (A2) | PARTIAL | Express: 36.3 % of the budget at 8.3 % of the weight (A2) | ECO_BL.BLV express row: weight share 8.3 % missing from f4 (only 36,3 % checked) | f4-economics.js: baseline economics (36,3 % express share) | `h1-data-seed-integrity.js` |
| 393 (1) | Аутсорсинг 290,4 млн ₸/год (G25) | MISSING | Outsourcing 290.4 M tenge/year (G25) | ECO_BL.BLD outsourcing total (grep fk in 615-eco-baseline-data.js); b0 'cost model' checks cost+5 % only | - | `h1-data-seed-integrity.js` |
| 394 (1) | Надбавка экспресса 88,7 млн ₸/год (T140) | MISSING | Express surcharge 88.7 M tenge/year (T140) | ECO_BL.BLD / ECO_BL.BLV express surcharge value | - | `h1-data-seed-integrity.js` |

### Исходные данные

13 scenarios: 9 covered, 2 partial, 2 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 400 (1) | Раздел открывается: 8 KPI, 5 вкладок (запросы — на странице тестов) | PARTIAL | Section opens: 8 KPI and 5 tabs | screens/settings/620-eco-baseline.js: KPI tile count and tab count (v6 has six views); assert KPI tiles = 8 | d0-v6-parity.js: baseline own sidebar section with permission, badge and all six views | `h7-economics-reports.js` |
| 401 (1) | Все находки со ссылкой на вопрос | PARTIAL | Every finding carries a link to its question | ECO_BL findings: each has a question id (Q/V-nn) and the link opens the question row | b0-eco-economics.js: baseline: 150 questions | `h7-economics-reports.js` |
| 402 (1) | Фильтр «Критично» показывает только критичные находки | MISSING | Filter 'Critical' shows only critical findings | Baseline screen filter value 'crit' -> every visible finding has level 3; count equals ECO_BL findings with crit flag | - | `h7-economics-reports.js` |
| 405 (1) | Бейдж меню = число критичных находок | MISSING | Menu badge = number of critical findings | Sidebar baseline link badge text = count of critical findings (d0 checks badge exists, not its value) | - | `h7-economics-reports.js` |

### FR-35…51

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 413 (1) | Список запросов раунда 3 синхронен с платформой (ID и статусы), в «Исходных данных» его больше нет | PARTIAL | Round-3 request list is in sync with the platform (IDs and statuses) | Requests list (FR-35..51) ids + status vs docs/TRACEABILITY.md / S.eco; no duplicates in the baseline screen | b0-eco-economics.js: baseline: 150 questions, FR-49 open until all KDL questions clarified | `h1-data-seed-integrity.js` |

### FR-51 ДОПОГ

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 430 (1) | Рейс с ДОПОГ показывает ответственного | PARTIAL | A trip with ADR shows the ADR-responsible person | partner/ops field resp (S.partners[].resp, ADR_DRV) in trip detail aside: ADR trip -> responsible name is rendered | d0-v6-parity.js: R1-c D6 trip detail shows the ADR driver | `h3-dispatch-gonogo-safety.js` |

### FR-45 Партнёры

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 431 (1) | GarantA, KazExpress, KazGen, SpezAvto в справочнике | PARTIAL | Carriers GarantA, KazExpress, KazGen, SpezAvto are in the partner directory | DATA GAP: v6 S.partners has no such names (17 partners: PW-01..08, PL-01..08, PL-10); assert at least 2 carrier-type partners (type 'lp') with tier >= silver instead | f1-data-integrity.js: partners | `h1-data-seed-integrity.js` |

### Затраты

5 scenarios: 1 covered, 3 partial, 1 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 432 (1) | Раздел открывается: 6 KPI и 6 вкладок | PARTIAL | Costs section opens with 6 KPI and 6 tabs | Billing screen (screens/billing/600-eco-costmodel.js): KPI tile count = 6, tab bar length = 6 | b0-eco-economics.js: [lang] W5 tabs render | `h7-economics-reports.js` |
| 433 (1) | Сводка: ≥ 18 позиций, итог = сумма позиций | PARTIAL | Summary has >= 18 items and total = sum of items | ECO cost model summary rows >= 18 and sum(rows) = total cell | b0-eco-economics.js: cost model bottom-up categories | `h7-economics-reports.js` |
| 434 (1) | Своё дешевле аутсорсинга 24,2 млн ₸/мес | PARTIAL | Own transport is cheaper than outsourcing by 24.2 M tenge/month | cost model own-vs-outsourcing delta value | b0-eco-economics.js: cost model | `h7-economics-reports.js` |
| 435 (1) | Позиции-допущения помечены | MISSING | Assumption items are marked | Summary rows flagged as assumptions have the assumption tag (ECO source column) | - | `h1-data-seed-integrity.js` |

### Затраты · дизель

3 scenarios: 1 covered, 1 partial, 1 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 437 (1) | 4 ТС со статистикой 8 недель | PARTIAL | Diesel: 4 trucks with 8-week statistics | diesel what-if table (S.diesel): one row per truck of the fleet with 8 weekly values | b1-eco-reports-ext.js: six KPI tiles with 8-week sparklines | `h7-economics-reports.js` |
| 438 (1) | V02: перерасход > 8 % отмечен | MISSING | V02: fuel overrun > 8 % is flagged | S.diesel rows: truck with overrun > 8 % carries the flag class; test against a seeded overrun | - | `h7-economics-reports.js` |

### Затраты · свой/внешний

2 scenarios: 1 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 444 (1) | 7 перевозок, у каждой выбран более дешёвый вариант | PARTIAL | 7 transports, each with the cheaper variant chosen | S.costs own-vs-external rows: every row picks min(own, external); count rows | b0-eco-economics.js: own vs external | `h7-economics-reports.js` |

### Водитель · FR

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 450 (1) | FR-52…FR-70: 19 запросов, 16 реализовано | PARTIAL | FR-52..70: 19 requests, 16 implemented | Driver app admin panel change-request table: 19 rows, 16 implemented | 88-res-staff-app.js: panel 'Change requests' | `h5-driver-app-delivery.js` |

### FR-55/56 Маршрут

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 456 (1) | Таймер вождения, 3 точки, ожидание окна в Алматы, KazAvtoZhol | PARTIAL | Driving timer, 3 points, waiting for the Almaty window, KazAvtoZhol | Driver app route tab: RES.driveState timer + stop list of the bound trip (3 points) + window-wait text (screens/drivers/330-driver-app.js) | 81-res-driver-app.js: driving state | `h5-driver-app-delivery.js` |

### FR-63 Сообщения

1 scenarios: 0 covered, 0 partial, 1 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 459 (1) | Подтверждение сообщения диспетчера → событие | MISSING | FR-63: confirming a dispatcher message in the driver app creates an event | Driver app messages tab: confirm button -> event in the feed (S.da / ACT in 330-driver-app.js) | - | `h5-driver-app-delivery.js` |

### FR-62 Инцидент

2 scenarios: 1 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 460 (1) | Задержка +30 мин → новое ETA у диспетчера | PARTIAL | Delay +30 min gives the dispatcher a new ETA | Driver app incident 'delay 30' -> load.eta shifted by 30 min in S.loads; trip detail shows the new ETA | 81-res-driver-app.js: incidents reach security | `h5-driver-app-delivery.js` |

### FR-66 Профиль

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 464 (1) | Профиль: ДОПОГ отсутствует, заработок по J46 | PARTIAL | Profile: ADR missing, earnings by J46 | Driver app profile tab: ADR row when docs lack 'adr', earnings figure from RES.LIM / ECO_CP rates | 81-res-driver-app.js: Kazakh UI and 4 languages (FR-66) | `h5-driver-app-delivery.js` |

### Водитель → диспетчер

1 scenarios: 0 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 466 (1) | Диспетчер видит ленту приложения (5 событий) и переходит в приложение | PARTIAL | Dispatcher sees the driver-app feed (5 events) and jumps to the app | Dispatch/trip feed: S.da events of the bound trip rendered, link opens the driver shell | 88-res-staff-app.js: panels | `h5-driver-app-delivery.js` |

### Производители

7 scenarios: 4 covered, 3 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 484 (1) | Строки мест R-103 с логотипами, Beckman Coulter и Werfen | PARTIAL | Place rows of a trip show manufacturer logos (Beckman Coulter, Werfen) | Shipments tab place rows: img[src*=logo] per MFRS[x].logo for the West trip; ids exist in MFRS | 71-ops-ship.js / d0-v6-parity.js | `h2-load-ship-vehicle.js` |
| 485 (1) | Этикетка места: логотип и производитель в шапке | PARTIAL | Place label shows logo and manufacturer in the header | Label drawer header contains MFRS[mfr].name and the logo element | 71-ops-ship.js: GS1-128 label | `h2-load-ship-vehicle.js` |
| 486 (1) | Поиск: результат с логотипом производителя | PARTIAL | Search result row shows the manufacturer logo | Search results (R1 shell: goods rows) include MFRS logo/badge of the line | f0-shell-parity.js: search | `h2-load-ship-vehicle.js` |

### Автопарк · показ

3 scenarios: 1 covered, 2 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 491 (1) | Кнопка «Показать расширенный парк» даёт ≥ 9 ТС с термоконтролем и без | PARTIAL | Button 'Show extended fleet' gives >= 9 trucks, with and without thermo control | RES.fleetAll() length >= 9 after toggle (S.fleetExt / ACT), classes with and without cooling | 86-res-fleet-ext.js: P4 fleet KPIs by class, demo fleets never join S.trucks | `h4-resources-partners.js` |
| 493 (1) | Повторное нажатие возвращает реальный парк 4 ТС | PARTIAL | Pressing the toggle again returns the real fleet of 4 | toggle twice -> RES.fleetAll() equals S.trucks (7 in v6) | 86-res-fleet-ext.js | `h4-resources-partners.js` |

### Загрузка · типы ТС

16 scenarios: 11 covered, 4 partial, 0 missing, 1 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 497 (1) | По умолчанию V02 (факт): расчёт как в v5.2 — 4 + 14 мест, 8 / 18 паллет, 50,4 м³ | PARTIAL | Default own truck V02: 4 + 14 places, pallets, 50.4 m3 as in v5.2 | West trip default plan: places per zone, pallets and volume 50.4 m3 (also f1 rings check 50.4 m3) | 70-ops-load.js: vehicle type card | `h2-load-ship-vehicle.js` |
| 502 (1) | 7,5 т · 2 зоны: перегородка слишком близко — зона 2–8 °C перегружена | PARTIAL | 7.5 t 2 zones: bulkhead too close, the 2-8 C zone overloaded | vehicle type card: 7.5 t 2 zones, bulkhead at minimum -> checks list a level-3 zone overload | 70-ops-load.js: bulkhead | `h2-load-ship-vehicle.js` |
| 504 (1) | Подбор ТС пересчитывается: +З-2297 (2 пал.) → рекомендация 10 т · 1 зона | PARTIAL | Adding order Z-2297 (2 pallets) changes the recommendation to 10 t 1 zone | tick an extra order -> recommendation re-computed (RECOMMEND in 210-ops-load.js), assert type id changes | 70-ops-load.js: vehicle match | `h2-load-ship-vehicle.js` |
| 507 (1) | Глобальные тревоги и диспетчер считают по фактической ТС V02 | PARTIAL | Global alarms and dispatcher compute with the actual truck, not the plan | alarms/dispatcher load card use the actual S.loads[].truck while a different plan type is saved | 70-ops-load.js: parity pass | `h2-load-ship-vehicle.js` |

### Справка

11 scenarios: 7 covered, 3 partial, 0 missing, 1 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 528 (1) | «Как устроена платформа»: разделение 17 экранов и «Учёт и администрирование», схема со связями | PARTIAL | Article 'How the platform is built' with the diagram of links | HELP article 'structure' exists (key listed in c0) - assert it embeds the platform diagram figure | c0-help-content.js: articles complete | `h8-shell-i18n-help.js` |
| 532 (1) | Каждая страница нижнего меню имеет ссылку «Справка» на существующую статью | PARTIAL | Every bottom-menu / records page has a Help link to an existing article | every page route in screens (records pages) has HELP key via CTX map; assert resolve | c0-help-content.js: context help falls back to the screen | `h8-shell-i18n-help.js` |
| 533 (1) | Портал клиента: короткая справка без экранов операций | PARTIAL | Customer portal gets a short help without operations screens | ACT.setRole({v:'customer'}) then open help: article list excludes operations screens | c0-help-content.js: access line | `h8-shell-i18n-help.js` |

### Покрытие связи

12 scenarios: 10 covered, 1 partial, 0 missing, 1 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 541 (1) | Приложение водителя: на маршруте — «через … нет связи … Аксу-Аюлы – Мойынты» | PARTIAL | Driver app route shows 'in N min no coverage' with the stretch names | Driver app route tab: text built from RES.tripWindows / RES.deadWindow for the bound trip contains the first dead-zone stretch name | 81-res-driver-app.js: offline queue | `h5-driver-app-delivery.js` |

### Версии и дата (FR-74/76)

5 scenarios: 2 covered, 2 partial, 0 missing, 1 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 552-553 (2) | DE: дата рабочего дня и сообщение о конфликте переведены | PARTIAL | Working-day date in DE / EN (conflict message part is N/A) | header date text per language from CLOCK (core.js) - f0-ci checks ru/de/en NOW but not the header string | f0-ci-infra.js: deterministic clock in [lang] | `h3-dispatch-gonogo-safety.js` |

### Загрузка · согласованность

5 scenarios: 1 covered, 3 partial, 1 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 554 (1) | Свежее демо-состояние: отмечено = нарисовано = посчитано (V02) | PARTIAL | Fresh state: ticked = drawn = counted (V02) | West trip: n ticked orders = n drawn places in the SVG = sum in the summary tiles = sum in the bars | 70-ops-load.js: loading diagram by chambers | `h2-load-ship-vehicle.js` |
| 555 (1) | Все варианты ТС (3,5–12,5 т), 1 / 2 термозоны, без термоконтроля, перегородка ± — схема и итоги совпадают | MISSING | All vehicle variants (3.5-12.5 t, thermo zones, no control, bulkhead +/-): diagram and totals agree | loop CATALOGUE types x zones: compare drawn places (SVG rects) with calc totals (screens/orders/210-ops-load.js) | - | `h2-load-ship-vehicle.js` |
| 556 (1) | Отметка заказа сразу перерисовывает схему, плитки и полосы | PARTIAL | Ticking an order redraws diagram, tiles and bars at once | ACT toggle order -> SVG place count, summary tiles and bars all change in the same tick | 70-ops-load.js: orders table + R1 L3 ticking | `h2-load-ship-vehicle.js` |
| 564 (1) | Полная передача: все заказы заблокированы, схема свободна, 0 / 18, ничего не отмечено | PARTIAL | Full handover: all orders locked, empty diagram, nothing ticked | after a full handover of the load: every order row disabled, SVG has no places, summary zero | 70-ops-load.js: orders table partner hand-over locked | `h2-load-ship-vehicle.js` |

### Подбор ТС · симуляция

8 scenarios: 6 covered, 2 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 557 (1) | Груз R-106 помещается только в 7,5 т и больше; рекомендовано — дешевле за паллету, подходящие выше | PARTIAL | R-106 fits only 7.5 t and up; recommended = cheaper per pallet, fitting ones ranked above | vehicle match rows: first fitting type is cheaper per pallet than other fitting types (cost per pallet field) | 70-ops-load.js: vehicle match smallest fitting recommended | `h2-load-ship-vehicle.js` |
| 559 (1) | Слишком высокий груз: З-2281 180 см в кузове 175 см — в симуляции, полосе, виде сбоку и проверках | PARTIAL | Too high cargo: Z-2281 180 cm in 175 cm body - in simulation, bar, side view and checks | order height > body height raises a check in simulation, in the bars and in the side view (CoG view) | 70-ops-load.js: orders table height | `h2-load-ship-vehicle.js` |

### Портал: бронирование v2

14 scenarios: 12 covered, 1 partial, 0 missing, 1 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 575 (1) | Страхование: премия ≈ 0,15 % (мин. 3 000 ₸) без НДС; BUG-30: в € и $ по курсу НБ РК с датой — в цене и в обра… | PARTIAL | Insurance premium about 0.15 % (min 3 000 tenge) without VAT; EUR / USD at the NBK rate with date in price and sample | INS global (rate, min) and S.fx: premium = max(3000, 0.15 % x value); sample contract shows fx date | a0-por-portals.js: booking with insurance, fx | `h6-portal-commercial.js` |

### Соответствие языка / Language match

4 scenarios: 2 covered, 0 partial, 1 missing, 1 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 584 (1) | RU: все маршруты — без ключей i18n и английских подписей | MISSING | RU: every route has no i18n keys and no English labels | 62-language-audit.js only runs de/en; add [ru] loop: no 'core.' / 'key.' style tokens and no Latin-only labels in menu, tabs, buttons | - | `h8-shell-i18n-help.js` |

### FR-134 Доступность

2 scenarios: 1 covered, 0 partial, 1 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 595 (1) | Уровни в метках различимы без цвета: символ ✓ ● ▲ ■ у каждой метки уровня | MISSING | Levels are distinguishable without colour: symbol per level (checkmark, dot, triangle, square) | every .tag level chip carries a glyph character; f5 'levels and colours' checks colour classes only | - | `h8-shell-i18n-help.js` |

### FR-81/82/85/89 Приватность

7 scenarios: 4 covered, 1 partial, 0 missing, 2 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 599 (1) | Справочник: у водителя нет штрафов, персонала, затрат и телефонов; у аудитора штрафы есть, телефонов нет | PARTIAL | Driver has no fines, staff, costs, phones; auditor sees fines but no phones | per-role matrix on visible screens + masked phone for auditor (ROLE_PERMS pii:read absent) | 60-foundation.js: roles permissions follow the platform matrix | `h4-resources-partners.js` |

### FR-91…100 Рейсы и Go/No-Go

7 scenarios: 5 covered, 2 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 612 (1) | FR-91: отзыв выпуска — без выпуска 409, неверная причина 422; после выпуска R-106 «Отозвать выпуск» снимает д… | PARTIAL | Revoke release: without release refused, wrong reason refused, after release it withdraws the permission | ACT revoke release: no release -> error, reason from REVOKE list validated (REVOKE global), success clears load.release | 72-ops-docs.js: override release / withdrawn release blocks again | `h3-dispatch-gonogo-safety.js` |
| 614 (1) | FR-100: KPI «тревоги» считают все открытые тревоги, список — не больше 20 | PARTIAL | KPI 'alarms' counts all open alarms, the list shows at most 20 | dashboard KPI value = S.alarms open count even when the list is capped (v6 cap is 9) | 74-ops-dashboard.js: alarms (<= 9) and risks (<= 6) | `h3-dispatch-gonogo-safety.js` |

### Доставка · ePOD и связь (FR-107…113)

10 scenarios: 6 covered, 2 partial, 0 missing, 2 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 627 (1) | Шаг «подпись»: ФИО и должность получателя, подпись пальцем → ePOD; ФИО не попадает в журнал аудита | PARTIAL | Signature step takes name and position, ePOD created, the name is not written to the audit log | audit entries of the ePOD action contain no consignee name (S.audit text scan) | 81-res-driver-app.js: signature required | `h5-driver-app-delivery.js` |
| 628 (1) | Запись ePOD: время устройства и сервера, SHA-256 подписи и фото, хэш-проверка совпадает | PARTIAL | ePOD record: device and server time, SHA-256 of signature and photo, hash check matches | S.da ePOD record fields (sha256 in 330-driver-app.js): recompute hash of stored signature/photo and compare | 81-res-driver-app.js: delivery flow -> ePOD | `h5-driver-app-delivery.js` |

### Lane J · затраты, ЕСУТД, GDP

7 scenarios: 6 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 639 (1) | FR-117: передача партнёру — логгер, температура и пломба на приёме и при ePOD записаны | PARTIAL | Partner handover records logger, temperature and seal at receipt and at ePOD | handover record fields (S.handovers[].logger/temp/seal) set by portal steps; assert both receipt and ePOD entries | 87-res-partners.js: handover portal steps | `h4-resources-partners.js` |

### FR-118…127 Ресурсы, персонал, партнёры

13 scenarios: 9 covered, 2 partial, 0 missing, 2 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 648 (1) | FR-122: штраф по ТС без назначения в момент нарушения — «не определён», уведомление 409 | PARTIAL | Fine for a truck with no assignment at the violation time -> 'not determined', notify refused | RES.fineAssign on a fine whose time is outside every waybill: drv empty, ACT notify returns an error | b0-eco-economics.js: R6 fines | `h4-resources-partners.js` |
| 652 (1) | FR-127: тендер во «Входящих» → лид CRM с № и сроком; второй лид с тем же БИН → тот же клиент | PARTIAL | A second lead with the same BIN joins the same customer | S.leads with equal BIN -> same S.customers id (screens/orders/505-r2-crm.js) | a0-por-portals.js: CRM public request becomes a lead | `h6-portal-commercial.js` |

### FR-132 Одна навигация

6 scenarios: 1 covered, 1 partial, 3 missing, 1 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 656 (1) | RU: в боковом меню нет двух пунктов с одинаковым названием; группа 2 без «Диспетчер / Термостатус / Автопарк … | MISSING | RU: no two sidebar entries with the same label | assert the label list of #side-nav is unique per language (10-navigation checks counts only) | - | `h8-shell-i18n-help.js` |
| 657-658 (2) | DE: no duplicate sidebar labels | MISSING | [de | en] no duplicate sidebar labels | - | `h8-shell-i18n-help.js` |
| 661 (1) | Вкладки: «Реестр ТС» на экране «Автопарк» — один заголовок h1, номер 10, кнопка «+ Транспортное средство» | PARTIAL | Fleet registry tab has one h1, number 10 and the '+ Vehicle' button | fleet > registry tab: querySelectorAll(h1).length = 1, button[data-act=...] 'new vehicle' | f5-a11y-layout.js: landmarks one main and h1 | `h4-resources-partners.js` |

### FR-137 Права из backend

3 scenarios: 2 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 662 (1) | Матрица ролей и прав в справке = rbac.py (35 прав, администратор 32) | PARTIAL | Help matrix equals the permission source (35 permissions, admin 32) | ROLE_PERMS (role-perms.json) vs help matrix rows: counts equal and admin set size | 60-foundation.js / c0-help-content.js: permission x role matrix | `h8-shell-i18n-help.js` |

### FR-135 Справочник мест, казахский, системные тексты

11 scenarios: 5 covered, 5 partial, 0 missing, 1 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 665 (1) | Справочник мест: LOC с id KZ-…, названия ru/kk/de/en, КАТО, координаты, хаб; прогноз WX по id | PARTIAL | Location directory: id KZ-xxx, names ru/kk/de/en, KATO, coordinates, hub | LOCS (21 entries {n,hub,km}) and KZMAP.CITY (4 names + lat/lon): assert 4 names non-empty, KATO field (add), hub in HUBS | 90-rec-records.js: KATO check | `h1-data-seed-integrity.js` |
| 666 (1) | Входящие: «Қарағанды» и «Karaganda» маршрутизируются как «Караганда» (city_id KZ-KAR) | PARTIAL | Inbox routes 'Karaganda' / 'Qaragandy' to the same city | INBOX routing: free text in KK/EN/RU spellings resolve to one city key (screens/dashboard/410-rec-alarms-inbox.js) | 90-rec-records.js: inbox routing opens the matching screen, translit | `h3-dispatch-gonogo-safety.js` |
| 669-671 (3) | DE: BUG-34 демо-сообщения коннекторов переведены (шторм, охрана), без транслитерации | PARTIAL | Demo connector messages (storm, security) are translated in DE / EN / KK (no transliteration) | MIRROR_SIMS / INBOX_SRC demo texts: LT keys exist in the three string tables, no Cyrillic in DE/EN | 90-rec-records.js: inbox translit on DE/EN | `h3-dispatch-gonogo-safety.js` |

### FR-139…157 Подбор ТС и погрузка

8 scenarios: 7 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 676 (1) | FR-143: ранжирование «дешевле всего» — по полной стоимости рейса (топливо, дороги, водитель, порожний возврат) | PARTIAL | Ranking 'cheapest' by full trip cost (fuel, tolls, driver, empty return) | truck finder rows sorted by total cost field; assert each cost component is in the sum | 70-ops-load.js: truck finder how it decides | `h2-load-ship-vehicle.js` |

### BUG-31 / FR-175 История, заголовки, ссылки

8 scenarios: 6 covered, 1 partial, 1 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 686 (1) | history.back() возвращает позицию прокрутки | MISSING | history.back() restores the scroll position | scroll #main-content to y, navigate, history.back(), assert scrollTop (61-shell-ext.js history group asserts screen/tab/record only) | - | `h8-shell-i18n-help.js` |
| 690 (1) | DE: заголовок вкладки на языке страницы | PARTIAL | DE tab title in the page language | document.title in de.html for screen, tab, help article | 61-shell-ext.js: document.title (en only) | `h8-shell-i18n-help.js` |

### FR-159 / FR-160 Учёт и туры

6 scenarios: 4 covered, 2 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 703 (1) | Тур «Отклонение QA» с кнопки «Тур» экрана 09 и тур водителя (вкладки приложения из ссылки) | PARTIAL | Tour 'QA deviation' from the Tour button of screen 09 and the driver tour (tabs from link) | Quality screen button data-act tour -> HELP.tours step 1 on screen; driver tour opens tabs via URL | c0-help-content.js: tours | `h8-shell-i18n-help.js` |
| 704 (1) | Тур клиента «Бронирование» в портале | PARTIAL | Customer tour 'Booking' in the portal | ACT.setRole customer: tour list contains the booking tour and starts | c0-help-content.js: tours, role without access | `h8-shell-i18n-help.js` |

### FR-173 Формы для существующих API

2 scenarios: 1 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 709 (1) | Линии и тарифы: назначение ТС линии (тот же хаб), сохраняется на сервере | PARTIAL | Lines and tariffs: assign a truck to a line (same hub), saved | lines tab: assign vehicle to line, refused for another hub (RES.lineData / ACT in 350-lines.js) | e2-mirror-res.js: R2 lines: planning:admin gates cancel / vehicles / tariffs | `h3-dispatch-gonogo-safety.js` |

### Логотипы производителей · экран 04

4 scenarios: 2 covered, 2 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 711-712 (2) | Шесть карточек с логотипом справа, без наложения на текст, остальные — только бейдж (1500 px) | PARTIAL | Six manufacturer cards with the logo on the right, no overlap with text at 1500 and 1024 px | Shipments tab manufacturer cards: bounding boxes of logo and text do not intersect | f5-a11y-layout.js: layout 1024 / 1500 px every screen | `h2-load-ship-vehicle.js` |

### Плановые значения · проверка перед запуском

2 scenarios: 1 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 715 (1) | FR-174: «Справочники» показывают число непроверенных значений, список из 26 с источником, подтверждение аудир… | PARTIAL | Reference screen shows the number of unverified plan values, the list of 26 with source, confirmation audited | REF unverified list length (26) and the confirm action audited (S.audit); 615-eco-baseline-data.js unverified flags | 90-rec-records.js: reference data FR-174 | `h7-economics-reports.js` |

### Новые записи · производители, ТС, водители

3 scenarios: 2 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 721 (1) | Справочники: кнопки «+ Транспортное средство» и «+ Водитель» ведут в реестры; реестр водителей без персональн… | PARTIAL | Reference buttons '+ Vehicle' and '+ Driver' lead to the registries; driver registry has no personal data | Reference screen: buttons navigate to fleet registry / drivers; drivers table masks IIN / phone | f0-shell-parity.js: drivers / reference data | `h4-resources-partners.js` |

### Переключатель дизайна · Olymp ↔ Kökzhol

2 scenarios: 1 covered, 0 partial, 1 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 727 (1) | Выбор сохраняется в браузере и действует после перезагрузки; ?brand=olymp возвращает | MISSING | Design choice persists after reload; ?brand=olymp returns the default | set design, reload iframe, assert S.design persisted (localStorage) and the URL override (v6 core.js has the Kökzhol lock-up but no ?brand= test) | - | `h8-shell-i18n-help.js` |

### Иконки навигации · Olymp duotone / Kökzhol tile

2 scenarios: 1 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 729 (1) | Kökzhol: плитки по группам (ops/mon/doc/res/fin), белый глиф, активный пункт — белая плитка; кнопки симуляции… | PARTIAL | Kökzhol: tiles by group, white glyph, active item white tile; simulation buttons readable | Kökzhol sidebar: .nav-item[aria-current] computed background is white; group classes ops/mon/doc/res/fin | f0-shell-parity.js: navigation icons (both designs) | `h8-shell-i18n-help.js` |

### Договоры и ЭЦП · FR-149

8 scenarios: 6 covered, 0 partial, 1 missing, 1 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 732 (1) | Кнопка «Подписать ЭЦП (NCALayer)» без NCALayer → понятное сообщение «NCALayer не запущен» | MISSING | Sign with EDS (NCALayer) without NCALayer shows the 'NCALayer not running' message | 230-ops-docs.js docSign mock (200-ops-model.js docSign) and portal contract sign: assert a message when the NCALayer mock is absent | - | `h6-portal-commercial.js` |

### Портал · вес, плательщик, сообщения, БИН (FR-185…190)

7 scenarios: 5 covered, 2 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 744-745 (2) | DE: FR-185 warnings without Cyrillic; FR-190 help article «Bookings – confirm, reject or cancel» | PARTIAL | Help article 'Bookings - confirm, reject or cancel' exists in DE / EN | HELP key for bookings (FR-190) present with DE/EN text without Cyrillic | a0-por-portals.js: renders in 4 languages; c0-help-content.js | `h6-portal-commercial.js` |

### Страхование и прайс-листы · FR-153 / FR-148

8 scenarios: 7 covered, 1 partial, 0 missing, 0 n/a.

| 0.3.11 # | scenario | status | what it asserts (0.3.11) | v6 target (global / function / screen) | covered part in v6 | new file |
|---|---|---|---|---|---|---|
| 753 (1) | Портал: расчёт цены показывает «Прайс-лист клиента» (рамочный · −10 % · дизель 340 / база 300), скидку и топл… | PARTIAL | Portal price shows the customer price-list line (framework, -10 %, diesel 340 / base 300), discount and fuel surcharge, sample shows the same line | price breakdown DOM of the booking form with S.priceLists active: rows list/discount/fuel | a0-por-portals.js: price lists | `h6-portal-commercial.js` |

## Appendix A. COVERED and N/A scenarios with the v6 file / group

Ranges are 0.3.11 scenario numbers. For N/A the reason is given.

| module | # | scenario (first of range) | status | v6 file: group / reason |
|---|---|---|---|---|
| Навигация | 1-18 (18) | Платформа загружается, в меню 17 разделов | COVERED | 10-navigation.js: [lang] 13 menu items, every screen renders (v5 had 17 top-level sections, v6 merged them into 13 menu items + tabs) |
| Языки | 19 (1) | Переключатель RU · DE · EN ведёт на языковые версии | COVERED | 10-navigation.js: language switcher links to all four files |
| Языки | 352-353 (2) | Версия DE без русского текста, 17 разделов | COVERED | 62-language-audit.js: [de |
| Языки | 419-420 (2) | DE: «Исходные данные» — все вкладки без русского текста | COVERED | 62-language-audit.js: [de |
| Языки | 447-448 (2) | DE: «Затраты» — все вкладки без русского текста | COVERED | b0-eco-economics.js: [lang] W5 tabs render without undefined/NaN; 62-language-audit.js |
| Языки | 468-469 (2) | DE: приложение водителя — все вкладки без русского текста | COVERED | 62-language-audit.js / 81-res-driver-app.js: 4 languages, DE/EN without Cyrillic |
| Фильтр хабов | 20 (1) | Хаб «Алматы» скрывает машины Астаны | COVERED | 61-shell-ext.js: [lang] shell: hub filter narrows lists |
| Фильтр хабов | 21 (1) | «Все хабы» возвращает все машины | COVERED | 61-shell-ext.js: hub filter, back to all hubs |
| Данные · ТС | 26 (1) | Госномера не повторяются | COVERED | f1-data-integrity.js: duplicate plates / truck ids |
| Данные · SSCC | 27-48 (22) | Место #k: SSCC — 18 цифр, контрольная цифра GS1 верна | COVERED | f1-data-integrity.js: every place has an 18-digit SSCC with a valid GS1 check digit (306 places walked, wrong check digit refused) |
| Данные · SSCC | 473-482 (10) | Место #k: SSCC — 18 цифр, GS1 верна, срок не истёк | COVERED | f1-data-integrity.js: SSCC 18 digits + shelf life not expired |
| Данные · рейс | 49-70 (22) | Место #k: рейс существует, ТС подходит по режиму и ДОПОГ | COVERED | f1-data-integrity.js: every order of a load fits the assigned truck (zone, ADR truck + driver, known driver) |
| Данные · срок | 71-92 (22) | Место #k: срок годности не истёк к 10.2026 | COVERED | f1-data-integrity.js: shelf life, no line expired at demo date, FEFO list |
| Данные · штрафы | 93-97 (5) | Штраф #k: время попадает в смену водителя по журналу ТС | COVERED | f1-data-integrity.js: fines fall into a waybill of that driver and truck |
| Данные · персонал | 98-110 (13) | Водитель #k: план на 14 дней, допустимые коды | COVERED | f1-data-integrity.js: staff 14-day plan, known codes, absences in plan |
| Данные · погода | 111-120 (10) | Город #k: прогноз на 7 дней, уровни риска 0–3 | COVERED | f1-data-integrity.js: weather, every forecast city has 7 days, risk 0-3, serving hub |
| Автопарк | 134-137 (4) | ТС #k: строка показывает статус страховки и сборов | COVERED | 86-res-fleet-ext.js: P4 fleet: insurance / tax / fees column |
| Автопарк | 168 (1) | Западное кольцо: допуск только у HOWO T5G | COVERED | 86-res-fleet-ext.js: P4 fleet West approval |
| Термостатус | 138-141 (4) | ТС #k: карточка показывает температуры | COVERED | 83-res-thermo.js: P3 thermo chips + readout tiles per truck; d0-v6-parity.js: R1-a T1t chips of every non-service truck |
| Термостатус | 159 (1) | Изотермы показаны с термоконтейнерами, без агрегата | COVERED | d0-v6-parity.js: R1-a T3t passive readouts (thermo containers + isothermal body) |
| Отчёты | 172 (1) | Штраф ШТ-1021 привязан к водителю Е. Тулегенову | COVERED | b0-eco-economics.js: fines import attributes driver by time |
| Отчёты | 173 (1) | При передаче ТС штраф ШТ-1015 у В. Шевченко | COVERED | f1-data-integrity.js: fines (attribution at violation time); 80-res-fleet-staff.js: fines attributed at violation time |
| Отчёты | 174 (1) | Оплата со скидкой 50 % меняет статус | COVERED | b0-eco-economics.js: recharge -> ack -> deduction -> payroll; e2-mirror-res.js: R2 R3 50 % discount |
| Диспетчер | 151 (1) | Рейс R-106 показывает проверки Go / No-Go | COVERED | 72-ops-docs.js: Go/No-Go controls are data-based |
| Диспетчер | 152 (1) | Путевой лист отправляется водителю | COVERED | 81-res-driver-app.js: shift start gates waybill; 73-ops-dispatch.js: Waybills & express tab |
| Диспетчер | 153 (1) | Перенос рейса из-за бурана на 10.10 | COVERED | 73-ops-dispatch.js: replanning moves the ETA with a reason; d0-v6-parity.js: R1-c D15 replan form |
| Загрузка | 154 (1) | Сторонний груз С-0107 вызывает проверку договора | COVERED | 70-ops-load.js: orders table third-party tags; 76-ops-docs.js: document set follows third-party load |
| Загрузка | 155 (1) | Опасный груз помечен «Да · LQ» | COVERED | 70-ops-load.js: LQ / ADR flag in orders table; a0-por-portals.js: LQ-only goods |
| Симуляция | 156 (1) | Тревога «Замерзание» даёт инструкцию на «Обзоре» | COVERED | d0-v6-parity.js: security simulations with playbooks + R1-a T7t; 74-ops-dashboard.js: playbook card |
| Симуляция | 157 (1) | Тревога «Пожар» создаёт инцидент безопасности | COVERED | d0-v6-parity.js: security fire simulation; 50-legacy-tabs.js: security incidents |
| Симуляция | 158 (1) | Сброс тревог убирает инструкции | COVERED | d0-v6-parity.js: reset restores; 74-ops-dashboard.js: playbook card resets |
| Погода | 160-161 (2) | Прогноз на 3 дня скрывает дни 4–7 | COVERED | 84-res-weather.js: P3 weather horizon 3 / 7 switches the columns |
| Безопасность | 162 (1) | Тест тревожной кнопки создаёт инцидент | COVERED | e1-mirror-ops-a.js: ACT.panic() creates a security incident |
| Безопасность | 163 (1) | Инцидент принимается в работу | COVERED | 50-legacy-tabs.js: security incidents accept / escalate / close are audited |
| Документы РК | 164 (1) | «Сформировать все» закрывает комплект | COVERED | 76-ops-docs.js: Documents KZ generate all |
| Документы РК | 165 (1) | Go / No-Go содержит 7 проверок допуска | COVERED | 76-ops-docs.js: gate shows 9 + 2 controls (v6 set is larger than 7) |
| Качество | 166 (1) | Процесс отклонения доходит до решения о товаре | COVERED | 50-legacy-tabs.js: temperature alarm, deviation, QA flow closes it; b1-eco-reports-ext.js: quality linked orders with outcome |
| Персонал | 170 (1) | Требование ДОПОГ исключает водителей без свидетельства | COVERED | e2-mirror-res.js: R2 S5/S6/S7 ADR approval excludes drivers; 80-res-fleet-staff.js: ADR deadlines |
| Поиск | 175-177 (3) | Поиск по PO находит рейс R-106 | COVERED | f0-shell-parity.js: search finds PO / PL / SSCC and points to load and order |
| Поиск | 178-199 (22) | Артикул #k находится в текущей отправке | COVERED | f0-shell-parity.js: search: every article of every current load is found |
| FR-01 Сканер | 200 (1) | Скан GS1 «(00)+SSCC» и Enter открывает этикетку места | COVERED | 71-ops-ship.js: scanner search GS1 (00); 61-shell-ext.js: scanner needs an exact hit |
| FR-01 Сканер | 201 (1) | Нераспознанный скан не открывает этикетку и сообщает об ошибке | COVERED | 61-shell-ext.js: scanner needs an exact hit (unrecognised scan = error) |
| FR-02 Архив | 202-203 (2) | Доставленный рейс R-105 по умолчанию не ищется | COVERED | 71-ops-ship.js: archive hidden by default, 'archive switched on' finds delivered |
| FR-17 Клавиатура | 204 (1) | ↓ и Enter открывают второй результат поиска | COVERED | 61-shell-ext.js: search keyboard moves, Enter opens |
| FR-17 Клавиатура | 205 (1) | Esc закрывает список результатов | COVERED | 61-shell-ext.js: search Esc clears / closes |
| FR-17 Доступность | 206 (1) | Поле поиска: role=combobox и aria-label | COVERED | f5-a11y-layout.js: search is a labelled combobox |
| FR-03 Track & trace | 207-208 (2) | Этикетка показывает историю сканирования места | COVERED | 71-ops-ship.js: track & trace per place follows the load |
| FR-04 ZPL | 209 (1) | ZPL-код этикетки содержит ^XA, GS1-128 (^BC) и SSCC | COVERED | 71-ops-ship.js: GS1-128 label, ZPL encodes AI 00/02/10/17 |
| FR-05 FEFO | 210-211 (2) | Место с коротким сроком отмечено в списке R-106 | COVERED | 70-ops-load.js: FEFO warning; 71-ops-ship.js: FEFO marker |
| FR-06 Сверка | 212-213 (2) | Сверка мест показывает недостачу по З-2290 | COVERED | 70-ops-load.js: SSCC reconciliation, rescan completes |
| FR-11 Go/No-Go | 214 (1) | R-103: истёкшая калибровка логгера даёт «НЕТ» | COVERED | 50-legacy-tabs.js: calibration registry; 72-ops-docs.js: controls data-based |
| FR-11 Go/No-Go | 215 (1) | Проверка «Страховка, налог и техосмотр» и «Места сверены» | COVERED | d0-v6-parity.js: R1 G6/G8 insurance/tax/inspection gate; R1 H8/H9 discrepancy |
| FR-12 Документы | 216-218 (3) | Документ подписывается ЭЦП | COVERED | 76-ops-docs.js: generate -> PDF -> sign -> IS ESF per row |
| FR-07 Штрафы | 219 (1) | Автоимпорт добавляет ШТ-1024 и определяет водителя | COVERED | b0-eco-economics.js: fines import attributes driver by time |
| FR-07 Штрафы | 220 (1) | Напоминание об окончании скидки 50 % | COVERED | e2-mirror-res.js: R2 R3 fines 50 % discount reminder |
| FR-08 Тахограф | 221-222 (2) | Время вождения и остаток в таблице персонала | COVERED | 80-res-fleet-staff.js: W2 staff driving-time blocks 4.5 h / 9 h / 56 h |
| FR-10 Сроки | 225-226 (2) | ДОПОГ Д. Кима истекает через 39 дней | COVERED | 80-res-fleet-staff.js: W2 staff ADR / licence deadlines and course booking |
| FR-13 Казахский | 227-228 (2) | Приложение водителя переключается на KZ | COVERED | 81-res-driver-app.js: Kazakh UI; e2-mirror-res.js: R2 D18 ADR instructions in writing |
| FR-13 Казахский | 467 (1) | Вкладки приложения на KZ | COVERED | 81-res-driver-app.js: Kazakh UI and 4 languages |
| FR-16 Погода | 229-230 (2) | Источники прогноза и закрытия трасс | COVERED | 84-res-weather.js: sources card, stale warning disappears after Refresh |
| FR-11 Диспетчер | 231 (1) | R-103: проверка «Логгер и страховка» блокирует выпуск | COVERED | 72-ops-docs.js / 50-legacy-tabs.js: calibration and insurance gate blocks release |
| Данные · партнёры | 232-253 (22) | Партнёр #k: город в сети, уровень допустим, у Blocked есть причина | COVERED | f1-data-integrity.js: data: partners city, tier, type, Blocked with reason, SLA 0-100 (17 partners) |
| Партнёры | 278 (1) | Фильтр «Главные склады» — только Астана и Алматы | COVERED | 87-res-partners.js: city-group filter (main warehouses) |
| Партнёры | 279 (1) | Фильтр «Города на маршруте» включает Актобе и Костанай, без Атырау (т… | COVERED | 87-res-partners.js: city directory, cities on the route |
| FR-24 SLA | 281 (1) | PW-06 (SLA 89 %) автоматически понижен Silver → Bronze | COVERED | 87-res-partners.js: SLA demotion proposal needs a second person; e4-rules-sla.js: I-13 SLA (v6: proposal + four eyes instead of automatic demotion) |
| FR-31 Справочник | 283 (1) | Караганда снята из точек перевалки → «Города на маршруте» | COVERED | 87-res-partners.js: city directory (Karaganda as route city / transshipment point) |
| FR-26 Договоры | 284 (1) | PW-04: напоминание и продление договора на год | COVERED | 87-res-partners.js: contract renewal needs upload + second approver |
| FR-25 Качество | 285 (1) | Blocked PL-10: снятие блокировки только после закрытия CAPA | COVERED | 50-legacy-tabs.js: blocked partners; unblock only after CAPA closes |
| FR-25 Качество | 286 (1) | Ссылка PL-10 открывает отклонение DEV-0011 в «Качестве» | COVERED | 50-legacy-tabs.js / e2-mirror-res.js: DEV-0011 link from the blocked partner |
| FR-20 Мощность | 287 (1) | R-106 полностью: «Батыс Логистик» — не хватает мощности | COVERED | 87-res-partners.js: handover Full / Partial candidates with price and verdict (capacity) |
| FR-19 GDP | 288 (1) | R-106 полностью: «Қостанай Экспресс» без ДОПОГ / GDP не подходит | COVERED | e2-mirror-res.js: R2 P14 GDP qualification refuses a pharma handover |
| FR-19 GDP | 292 (1) | Частично 2–8 °C: Silver Костанай без GDP исключён | COVERED | e2-mirror-res.js: R2 P14 GDP; 87-res-partners.js: R6 GDP decision |
| FR-29 Тариф | 289 (1) | PL-01: тариф и сравнение со своим рейсом (дешевле, зелёный) | COVERED | 87-res-partners.js: candidates with price and verdict |
| Передача | 291 (1) | Частично без отмеченных мест — подсказка и нет кнопок | COVERED | 87-res-partners.js: handover Full / Partial with SSCC check-list |
| Передача | 293 (1) | Частично только 15–25 °C: Silver Костанай по согласованию | COVERED | 87-res-partners.js: handover Full / Partial, Silver pending until second person approves |
| Передача | 294 (1) | Запрос → «Согласовать» → передано, 2 из 13 мест | COVERED | 87-res-partners.js: Silver handover is pending until a second person approves |
| Передача | 295 (1) | Полная передача остатка R-106 Gold «СтепьЛогистик» с актом и полисом | COVERED | 87-res-partners.js: handover Full with act; portal steps |
| Передача | 300 (1) | R-104: в Шымкенте Silver «Юг Рефтранс» на маршруте | COVERED | 87-res-partners.js: P4 partners route coverage table |
| FR-30 Портал | 296 (1) | Портал партнёра: принять → сканы → ePOD | COVERED | 87-res-partners.js: handover portal steps; a0-por-portals.js: partner portal ePOD |
| FR-21 Загрузка | 297 (1) | Переданные заказы сняты с загрузки своей ТС | COVERED | 70-ops-load.js: parity pass: partner hand-overs set o.handed |
| FR-21 Документы | 298 (1) | Документы РК: акт и ТТН партнёра для R-106 | COVERED | 76-ops-docs.js: document set follows partner handover |
| FR-21 Track & trace | 299 (1) | История места: «Передано партнёру» и события портала | COVERED | d0-v6-parity.js: R1 H7 track & trace shows the partner hand-over |
| Сервис | 301 (1) | R-106: мастерские в Костанае и Актобе на маршруте | COVERED | 87-res-partners.js: service on route |
| FR-27 Заявка | 302 (1) | Вызов сервиса создаёт заявку SR-201 с ETA и сметой | COVERED | 80-res-fleet-staff.js: service request changes availability and slot capacity |
| FR-27 Заявка | 303 (1) | ТС в сервисе: Go/No-Go «Транспорт доступен» = НЕТ | COVERED | d0-v6-parity.js: R1 G6 gate 'Vehicle available' (service / workshop) |
| FR-27 Заявка | 304 (1) | Закрытие заявки возвращает ТС | COVERED | 80-res-fleet-staff.js / 87-res-partners.js: service request close books a cost |
| FR-22 Покрытие | 307-308 (2) | Тараз на R-104 без логистического партнёра (красный) | COVERED | 87-res-partners.js: route coverage table and Create task |
| FR-33 Контакты | 310-312 (3) | Одно нажатие: 3 менеджера партнёра с телефоном и мобильным | COVERED | 87-res-partners.js: contact drawer masks numbers, Call (simulation) is audited, copy (v6: 2 managers, not 3) |
| FR-34 Цвета | 315-317 (3) | Go/No-Go: «ДА» зелёный, «НЕТ» красный | COVERED | f5-a11y-layout.js: levels and colours: Go green / No-Go red, watch yellow, alarms button red |
| Навигация DE | 318-334 (17) | DE: раздел 1 открывается, заголовок = пункт меню | COVERED | f0-shell-parity.js: [lang] navigation: every menu item opens its screen, page title = breadcrumb; 10-navigation.js |
| Навигация EN | 335-351 (17) | EN: раздел 1 открывается, заголовок = пункт меню | COVERED | f0-shell-parity.js: [lang] navigation: every menu item opens its screen, page title = breadcrumb; 10-navigation.js |
| Fragenkatalog · данные | 354 (1) | Лист «По городам»: Σ 64 249 кг/мес, 14 836 кг/нед, 90,7 м³/нед | COVERED | f4-economics.js: baseline volumes (64 249 kg/month) |
| Fragenkatalog · города | 355-377 (23) | Город #k: в справочнике, кг/нед = кг/мес ÷ 4,33, плотность 164 кг/м³ | COVERED | f4-economics.js: baseline volumes loop over 23 cities (kg/week, m3/week at 164 kg/m3) |
| Fragenkatalog · сеть | 379 (1) | P86: Семей и Усть-Каменогорск привязаны к хабу Астана | COVERED | f4-economics.js: Semey and Oskemen served by Astana (P86) |
| Fragenkatalog · кольца | 380-382 (3) | Кольцо R1: Σ плеч P83 = длина кольца | COVERED | f4-economics.js: baseline rings, legs add up to the ring |
| Fragenkatalog · кольца | 383-386 (4) | Кольцо R1: плотность 164 кг/м³, груз ≤ объёма и грузоподъёмности ТС | COVERED | f1-data-integrity.js: rings of the baseline (density, volume, payload); f4-economics.js |
| Fragenkatalog · кольца | 387 (1) | Суточный пробег всех колец ≤ 630 км (70 км/ч × 9 ч, P87) | COVERED | f4-economics.js: <= 630 km per day |
| Fragenkatalog · кольца | 388 (1) | R1: 2 430 км за 6-дневную неделю = 405 км/день | COVERED | f4-economics.js: R1 2 430 km / 6 = 405 km/day |
| Fragenkatalog · парк | 389 (1) | Целевой парк: 4 ТС, 7 водителей (E20/R111) | COVERED | f4-economics.js: target fleet 4 vehicles (7 drivers in v6 seed: f1 staff group) |
| Fragenkatalog · экономика | 395 (1) | Инвестиции 102,3 × 1,16 ≈ 118,6 млн ₸ (H31) | COVERED | f4-economics.js: investment net x VAT 16 % = 118.6 M |
| Fragenkatalog · экономика | 396 (1) | Экономия 6 916 410 ₸/мес ≈ 83,0 млн ₸/год (N77) | COVERED | f4-economics.js: saving 6 916 410 / month = 83.0 M / year |
| Fragenkatalog · экономика | 397 (1) | МРП 4 325: суточные 6 МРП = 25 950 ₸, транспортный налог 9 МРП = 38 9… | COVERED | f4-economics.js: MRP 4 325, per diem 6 MRP, tax 9 MRP |
| Fragenkatalog · экономика | 398 (1) | ИТ: 4 800 000 ₸ разово и 90 000 ₸/мес (H36) | COVERED | f4-economics.js: IT 4.8 M once, 90 000 / month |
| Fragenkatalog · экономика | 399 (1) | Обратное плечо Алматы → Астана в 2,6× тяжелее (B9) | COVERED | f4-economics.js: Almaty -> Astana 2.6x heavier |
| Исходные данные | 403 (1) | V-12: нераспределено 9 366 кг/мес (A1 ↔ лист) | COVERED | f4-economics.js: V-12 finding 9 366 kg |
| Исходные данные | 404 (1) | V-21: недоучёт налогов работодателя 49 500 ₸/мес | COVERED | f4-economics.js: V-21 employer-tax shortfall 49 500 |
| Исходные данные | 406-410 (5) | Вкладка «Сеть и объёмы» открывается | COVERED | d0-v6-parity.js: baseline six views render (every tab opens); b0-eco-economics.js: baseline tabs |
| Исходные данные | 411 (1) | Сеть: 23 города, все есть в справочнике | COVERED | f4-economics.js: 23 cities on the network map |
| Исходные данные | 412 (1) | Сеть: R1, W, A — проверка Σ плеч ✓ | COVERED | f4-economics.js: legs add up to the ring |
| FR-41 Экспресс | 414-416 (3) | 3 подписи → «согласовано · экспресс» | COVERED | 73-ops-dispatch.js: express three signatures approve; rejection and passed deadline create a regular load |
| FR-37 Справочник | 417 (1) | Атырау и Караганда — точки перевалки, Шымкент — город на маршруте | COVERED | 87-res-partners.js: city directory (transshipment points vs route cities) |
| Планирование | 418 (1) | Факторы планирования из Fragenkatalog (F22, E20, B7) | COVERED | e2-mirror-res.js: R2 P10 Planning factors card (7 rows) |
| v5 · парк | 421 (1) | Все рейсы на 4 ТС, у каждой ТС не больше одного активного рейса | COVERED | f0-shell-parity.js: ops on the fleet: one running trip per truck and per driver, category C |
| v5 · парк | 422 (1) | R-103 (R1) идёт на V01 с активным холодом | N/A | v5 demo fixture (R-103 on V01) replaced by the v6 seed; the rule 'cold trip needs a truck with active cooling' is f1-data-integrity.js: every order fits the assigned truck |
| v5 · парк | 423 (1) | R-106 — западное кольцо на HOWO изотерм V02 | COVERED | 70-ops-load.js: West trip (R-106-like) on the isotherm truck |
| v5 · парк | 424 (1) | Водители рейсов имеют категорию C | COVERED | f0-shell-parity.js: drivers of running trips hold category C / CE |
| FR-39 Термостатус | 425-426 (2) | Изотерм V04: термоконтейнеры и логгеры вместо камер | COVERED | 83-res-thermo.js / d0-v6-parity.js: R1-a T1t/T3t isotherm vs active cold |
| FR-40 Термохрон | 427 (1) | Импорт TH-02 показывает отклонение и создаёт DEV-0041 | COVERED | 83-res-thermo.js: thermochron CSV; d0-v6-parity.js: R1-a T11t import -> min/max/avg, excursion -> DEV |
| FR-43 Мороз | 428 (1) | Go/No-Go содержит проверку −45 °C | COVERED | 74-ops-dashboard.js: pre-release checks, frost forecast -45 C is flagged |
| FR-44 Окно склада | 429 (1) | R-104: прибытие 02:10 вне окна 9–17 | COVERED | 75-ops-trips.js: stops and outcomes (outside window) |
| Затраты | 436 (1) | Блок для дашборда: 6 показателей | COVERED | b2-eco-costs-ext.js: costs summary 6-indicator card |
| Затраты · дизель | 439 (1) | Цена 450 ₸/л пересчитывает затраты | COVERED | b0-eco-economics.js: cost model, diesel what-if |
| Затраты · сервис | 440 (1) | КТГ ≥ 0,92 у всех ТС и стоимость замены рейса | COVERED | b2-eco-costs-ext.js: workshop & downtime (availability, TO-1/TO-2) |
| Затраты · сервис | 441 (1) | Сценарий «Поломка · V01» включает простой | COVERED | b2-eco-costs-ext.js: downtime cost card with breakdown scenario |
| Затраты · учёт | 442 (1) | Страховки и налоги по 4 ТС | COVERED | b2-eco-costs-ext.js: insurance idle toggles; fleet 86-res-fleet-ext.js insurance/tax |
| Затраты · учёт | 443 (1) | Зимний простой Запада → рекомендация не снимать с учёта (лизинг) | COVERED | b2-eco-costs-ext.js: insurance idle toggles, registration recommendation (B7) |
| Затраты · свой/внешний | 445 (1) | Разница > 50 % требует 2 подписей | COVERED | b0-eco-economics.js: own vs external: >50 % gap needs two signatures |
| Затраты · водители | 446 (1) | FR-46: 7 водителей, ставки по кольцам | COVERED | b2-eco-costs-ext.js: costs drivers FTE = km / 70 x 1.15 / 1814 |
| Водитель · экосистема | 449 (1) | Телефон: 6 вкладок, лента событий, матрица 12 модулей | COVERED | 88-res-staff-app.js: P4 driver app admin panels 'Ecosystem function coverage' |
| FR-57 Скан SSCC | 451 (1) | Скан 2 мест в Караганде → 2 события «Отправки» | COVERED | 81-res-driver-app.js: delivery flow thermochron -> SSCC -> photo -> signature -> ePOD |
| FR-58 Термохрон | 452 (1) | Считывание термохрона → событие «Качество» и TH-03 в «Термостатусе» | COVERED | 81-res-driver-app.js: thermochron step |
| FR-59 Исключение | 453 (1) | Повреждение → событие в «Качество» | COVERED | 81-res-driver-app.js: exceptions open deviations |
| FR-52 Смена | 454 (1) | Логгер с истёкшей калибровкой блокирует путевой лист | COVERED | 81-res-driver-app.js: shift start gates waybill (logger calibration) |
| FR-53 Путевой лист | 455 (1) | Чек-лист 8/8 + замена логгера → подпись → события «Документы», «Автоп… | COVERED | 81-res-driver-app.js: shift start, checklist, waybill signature |
| FR-60 Возвраты | 457 (1) | 3 возврата принимаются → 44 кг на обратное плечо | COVERED | 81-res-driver-app.js: returns, shift end |
| FR-61 Топливо | 458 (1) | Заправка 180 л → 28,3 л/100 км и запись в «Затратах» | COVERED | 81-res-driver-app.js: fuel (l/100 km) ; b2-eco-costs-ext.js ledger |
| FR-62 Инцидент | 461 (1) | Поломка открывает контакты сервиса Караганды | COVERED | 81-res-driver-app.js: incidents reach security (breakdown, service contacts) |
| FR-67 Офлайн | 462 (1) | Без сети событие в очереди, при сети — синхронизировано | COVERED | 81-res-driver-app.js: offline queue, sync and SMS mode |
| FR-65 Конец смены | 463 (1) | Дефект + завершение → события «Персонал» и «Автопарк» | COVERED | 81-res-driver-app.js: shift end defect -> service draft (80-res-fleet-staff.js) |
| Водитель · ePOD | 465 (1) | 4 шага доставки → ePOD и акт в ленте | COVERED | 81-res-driver-app.js: delivery flow -> ePOD |
| Производители | 470 (1) | Справочник: 7 запрошенных + 6 западных IVD, у каждого логотип и сайт | COVERED | d0-v6-parity.js: ship: manufacturer registry (21 entries, four groups, logos) |
| Производители | 471 (1) | Каждое место ссылается на производителя из справочника | COVERED | f1-data-integrity.js: manufacturers: every order line names a registry manufacturer |
| Производители | 472 (1) | У каждого запрошенного и западного производителя есть место в рейсах | COVERED | f1-data-integrity.js: registry entry with a logo has a demo place |
| Производители | 483 (1) | Отправки: справочник производителей с логотипами | COVERED | 71-ops-ship.js: manufacturer directory with logo badges |
| Водитель · языки | 487 (1) | Приложение водителя: 4 языка RU / KZ / DE / EN | COVERED | 81-res-driver-app.js: 4 languages |
| Водитель · языки | 488-489 (2) | DE: вкладки, этап и ДОПОГ на немецком | COVERED | 81-res-driver-app.js: 4 languages without undefined, DE/EN without Cyrillic |
| Водитель · языки | 490 (1) | В DE/EN телефон без кириллицы | COVERED | 62-language-audit.js: DE/EN no Cyrillic (driver app phone) |
| Автопарк · показ | 492 (1) | Демо-ТС отмечены и не попадают в симуляцию | COVERED | 86-res-fleet-ext.js: demo fleets never join S.trucks |
| Журнал исправлений | 494 (1) | Каждая ошибка: причина, исправление, источник; фильтр по версии | COVERED | 90-rec-records.js: changes page: register filters by type/status/group/date |
| Загрузка · типы ТС | 495 (1) | Свежее демо-состояние: 6 заказов R-106 отмечены, как в v5.2 | N/A | v5.2 'fresh demo state with 6 R-106 orders ticked' is a fixture of the old fleet; v6 70-ops-load.js West trip builds its own state |
| Загрузка · типы ТС | 496 (1) | Каталог: 5 классов 3,5 / 6 / 7,5 / 10 / 12,5 т с паллетами 4 / 6–7 / … | COVERED | 70-ops-load.js: vehicle type card: catalogue + own vehicles |
| Загрузка · типы ТС | 498 (1) | 3,5 т · 1 зона: перегруз паллет и массы, смешанные режимы, ДОПОГ — кр… | COVERED | 70-ops-load.js: bars and checks (overload, mixed regimes, ADR critical) |
| Загрузка · типы ТС | 499 (1) | 1 зона: режим кузова 2–8 °C переводит товар 15–25 °C в термоконтейнеры | COVERED | 70-ops-load.js: vehicle type card body regime |
| Загрузка · типы ТС | 500 (1) | 12,5 т · 2 зоны: всё помещается, перегородка 6 / 9 | COVERED | 70-ops-load.js: bulkhead -/+ with zone split |
| Загрузка · типы ТС | 501 (1) | Перегородка двигается в пределах 4…10 мест, шаг 2 | COVERED | d0-v6-parity.js: load: movable bulkhead, bounds and warning |
| Загрузка · типы ТС | 503 (1) | Подбор ТС: 10 типов каталога и 4 своих ТС, рекомендация — наименьший … | COVERED | 70-ops-load.js: vehicle match: every catalogue type x 1 / 2 zones, smallest fitting recommended |
| Загрузка · типы ТС | 505 (1) | Кнопка в подборе открывает расчёт выбранного типа | COVERED | 70-ops-load.js: click shows the calculation |
| Загрузка · типы ТС | 506 (1) | План ТС для R-106 сохраняется на сервере и виден диспетчеру | COVERED | 70-ops-load.js: plan of the vehicle type is saved (trips:override_load, reason, audited) |
| Загрузка · типы ТС | 508 (1) | Показать сохранённый план возвращает выбор 12,5 т · 2 зоны | COVERED | 70-ops-load.js: vehicle type card show plan |
| Загрузка · типы ТС | 509-510 (2) | DE: экран загрузки с типами ТС и подбором без русского текста | COVERED | 70-ops-load.js: Load & weight tab renders in every language; P1 West trip without Cyrillic in DE/EN |
| Входящие | 511 (1) | Свежее демо-состояние; «Входящие» — в нижнем меню, 17 пунктов с номер… | N/A | Menu structure of v5 (Inbox in the bottom menu, 17 numbered items) does not exist in v6 (13 items) |
| Входящие | 512 (1) | «Обзор» показывает компактный раздел входящих | COVERED | 74-ops-dashboard.js: compact inbox of 5 |
| Входящие | 513 (1) | Ручное сообщение «закрытие дороги» → во входящих и на экране «Погода … | COVERED | 90-rec-records.js: inbox manual add; d0-v6-parity.js: R1-a W4/W6/W8 road messages |
| Входящие | 514 (1) | Закрытие дороги поднимает тревогу рейса на «Обзоре» и в «Диспетчере» | COVERED | d0-v6-parity.js: R1-a W4/W6/W8 risk per trip raised by the inbox |
| Входящие | 515 (1) | Досрочное снятие: закрытие пропадает, сообщение выполнено | COVERED | d0-v6-parity.js: Lift early (trips:write) |
| Входящие | 516 (1) | Ручной штраф (SMS 1414) → «Отчёты»: водитель по рейсу ТС, оспаривание | COVERED | b0-eco-economics.js: R6 fines inbox notice attributed by the trip sheet; e1-mirror-ops.js: R1 inbox effects |
| Входящие | 517 (1) | Демо: тестовые сообщения проходят тот же путь (6 сообщений, все привя… | COVERED | e1-mirror-ops.js: R1 inbox: kind-specific form, effects (road risk, fine, workshop, document, incident) |
| Входящие | 518 (1) | Демо: закрытие Костанай — Актобе даёт тревогу рейсу R-106 (обзор, пог… | COVERED | d0-v6-parity.js: road closure raises the alarm of the trip (overview, weather, Go/No-Go) |
| Входящие | 519 (1) | Демо: статус мобильной мастерской PW-03 обновляет заявку, «выполнено»… | COVERED | e1-mirror-ops.js: R1 inbox effects (workshop) |
| Входящие | 520 (1) | Демо: событие охранного центра — инцидент с эскалацией на «Безопаснос… | COVERED | e1-mirror-ops.js: R1 inbox effects (incident); 85-res-coverage.js: P3 security |
| Входящие | 521 (1) | Принять / выполнено: тендер уходит из открытых | COVERED | e1-mirror-ops.js / 90-rec-records.js: Done on new messages, done hidden by default |
| Входящие | 522 (1) | Интеграции: хаб по категориям, обязательность, сроки ЕСУТД | COVERED | 90-rec-records.js: integrations catalogue; e2-mirror-res.js: ESUTD readiness panel |
| Входящие | 523-524 (2) | DE: «Входящие» и экраны с входящими сообщениями без русского текста | COVERED | 90-rec-records.js: inbox translit on DE/EN; e2 R2 render in 4 languages |
| Справка | 525 (1) | Свежее демо-состояние; группа «Помощь» внизу меню, нумерованных пункт… | N/A | Menu structure of v5 (Help group, 17 numbered items) does not exist in v6 |
| Справка | 526 (1) | Справка описывает все 17 экранов операций по порядку, с номерами и на… | COVERED | c0-help-content.js: every article reachable from a group, keys resolve |
| Справка | 527 (1) | Все страницы «Учёт и администрирование» и портала описаны; ссылки «От… | COVERED | c0-help-content.js: screen, tab and related keys all resolve |
| Справка | 529 (1) | Роли и права: матрица из rbac.py (35 прав × 7 ролей), отмечена ваша р… | COVERED | 60-foundation.js: roles matrix; c0-help-content.js: permission x role matrix |
| Справка | 530 (1) | Поиск фильтрует содержание и статьи; «ничего не найдено»; очистка воз… | COVERED | c0-help-content.js: search over titles and bodies, empty state, clear |
| Справка | 531 (1) | Контекстная ссылка «Справка» с экрана открывает нужную статью (Термос… | COVERED | c0-help-content.js: context help '?' opens the article of the current screen / tab |
| Справка | 534-535 (2) | DE: справка без русского текста, 17 экранов, поиск | COVERED | c0-help-content.js: all articles render without undefined (de |
| Покрытие связи | 536 (1) | Свежее демо-состояние; «Покрытие связи» — в нижнем меню, нумерованных… | N/A | Menu structure of v5 ('Coverage' in the bottom menu) does not exist in v6 |
| Покрытие связи | 537 (1) | Карта: 23 города, 2 хаба, участки окрашены по классам 4G / 3G / 2G / … | COVERED | 85-res-coverage.js: map on the road network, stretches by class, hubs, cities, legend |
| Покрытие связи | 538 (1) | Участок на карте: подробности — классы по операторам, минуты без данн… | COVERED | 85-res-coverage.js: detail aside for stretch |
| Покрытие связи | 539 (1) | R-106: окна без связи с временем от выезда, Бейнеу – Манат, что уйдёт… | COVERED | 85-res-coverage.js: offline windows per trip with ETA confidence |
| Покрытие связи | 540 (1) | Диспетчер: блок «следующие зоны без данных» по выбранному рейсу, ссыл… | COVERED | 74-ops-dashboard.js: trip detail aside dead zones + ETA confidence |
| Покрытие связи | 542 (1) | Офлайн > 30 мин: SMS-режим, события уходят OL1-SMS (MAC, seq), тревог… | COVERED | 82-res-coverage-lines.js: W2 coverage escalation L1/L2/L3; 85-res-coverage.js: OL1 SMS format |
| Покрытие связи | 543 (1) | Сеть вернулась: полная синхронизация без дублей, «доставлено · SMS + … | COVERED | 81-res-driver-app.js: offline queue, sync and SMS mode |
| Покрытие связи | 544 (1) | Симуляции: ожидаемая зона = уровень 1, окно превышено + холодный груз… | COVERED | 82-res-coverage-lines.js: escalation L1/L2/L3 by expected zone, window and cold cargo |
| Покрытие связи | 545 (1) | Диспетчер отправляет короткую инструкцию по SMS (код, без свободного … | COVERED | 85-res-coverage.js: OL1 SMS channel, 6 instructions, gateway queue |
| Покрытие связи | 546-547 (2) | DE: «Покрытие связи» без русского текста | COVERED | 85-res-coverage.js: coverage tabs render in 4 languages, DE/EN without Cyrillic |
| Вёрстка | 548 (1) | Диспетчер: панель рейса не перекрывает ленту приложения водителя при … | N/A | v5 layout bug (trip panel over the driver feed) - v6 layout is different; generic overlap is covered by f5-a11y-layout.js layout meta |
| Версии и дата (FR-74/76) | 549 (1) | Шапка: дата рабочего дня с сервера — Вт 06.10.2026 (демо-сценарий) | COVERED | f0-ci-infra.js: deterministic clock (default today 18.10.2026 14:30) |
| Версии и дата (FR-74/76) | 550 (1) | Go/No-Go: прогноз на дату выезда есть — кнопки «без прогноза» нет | COVERED | 76-ops-docs.js: stale forecast blocks until 'Clear without weather forecast' |
| Версии и дата (FR-74/76) | 551 (1) | Изменение другим пользователем: 409 → экран перезагружен, сообщение, … | N/A | HTTP 409 optimistic-lock conflict needs the 0.3.11 backend; v6 has no server |
| Загрузка · согласованность | 563 (1) | Передача партнёру PL-01: строка заблокирована с тегом, заказ не отмеч… | COVERED | 70-ops-load.js: orders table partner hand-over locked + parity pass handed |
| Подбор ТС · симуляция | 558 (1) | Перегруз передней оси показан с точным превышением — в симуляции и в … | COVERED | 70-ops-load.js: load calc overload with exact excess, centre of gravity front axle |
| Подбор ТС · симуляция | 560 (1) | «Применить как план R-106»: действие load.plan, план виден, кнопка бл… | COVERED | 70-ops-load.js: plan of the vehicle type (load.plan), show plan |
| Подбор ТС · симуляция | 561 (1) | Автопарк: чекбокс «Демо: +2 ТС 3,5 т» — JAC N35 (2–8 °C) и ГАЗель NEX… | COVERED | 86-res-fleet-ext.js: demo fleets never join S.trucks; 70-ops-load.js truck finder demo fleets |
| Подбор ТС · симуляция | 562 (1) | Демо-ТС 3,5 т — кандидаты в подборе ТС, с причинами; чекбокс в подбор… | COVERED | 70-ops-load.js: truck finder demo fleets with reasons |
| Подбор ТС · симуляция | 565-566 (2) | DE: подбор ТС, демо 3,5 т и автопарк без русского текста | COVERED | 70-ops-load.js: renders in every language, DE/EN without Cyrillic |
| Предложение и договор | 567 (1) | Портал клиента: после расчёта цены — «Предложение и образец договора»… | COVERED | a0-por-portals.js: por: offers lock the price; e2-mirror-res.js: one offer / contract sample |
| Предложение и договор | 568 (1) | EN: offer and contract sample without Cyrillic (portal) | COVERED | a0-por-portals.js: all W4 screens render in 4 languages, DE/EN without Cyrillic |
| Предложение и договор | 569 (1) | Бронирование → «Мои бронирования» и диспетчерская: образец по существ… | COVERED | e2-mirror-res.js: R2 P8/P9 My bookings, contract text; a0 booking |
| Портал: бронирование v2 | 570 (1) | BUG-27: списки — только города (без «KDL Olymp»), улица с подсказками… | COVERED | a0-por-portals.js: booking form street directory (prefix / substring / similar), explicit staff review |
| Портал: бронирование v2 | 571 (1) | Груз: 12 категорий GDP/GLP/GMP с режимом и подсказкой; режим подбирае… | COVERED | e2-mirror-res.js: R2 P1/P2 incompatible goods; a0 booking form |
| Портал: бронирование v2 | 572 (1) | BUG-29: вес обязателен, среднее на паллету; > 1 200 кг/пал. блокирует… | COVERED | f0-shell-parity.js: portal booking weight per pallet above 1 200 kg blocks the price |
| Портал: бронирование v2 | 573 (1) | Маршрут: Тараз → Шымкент — прямой рейс ALA-1 (190 км); Шымкент → Тара… | COVERED | a0-por-portals.js: routing never answers 'no line' (FR-155/146) |
| Портал: бронирование v2 | 574 (1) | Опасный груз: раздел свёрнут; UN — 4 цифры; надбавка ДОПОГ строкой це… | COVERED | e2-mirror-res.js: R2 P3 dangerous goods need an ADR departure; a0 booking DG |
| Портал: бронирование v2 | 576 (1) | Бронирование: адрес, груз, ДОПОГ и страховка (с € / $) в «Мои брониро… | COVERED | a0-por-portals.js: customer books with DG, insurance, payer, SMS |
| Портал: бронирование v2 | 577 (1) | FR-151: улицы нет в справочнике → подсказки и «проверка сотрудником»;… | COVERED | a0-por-portals.js: booking form explicit staff review; e2-mirror-res.js: R2 P11 address review four-eyes |
| Портал: бронирование v2 | 578 (1) | FR-150: адрес сохраняется в адресной книге клиента и выбирается при с… | COVERED | a0-por-portals.js: customer books... FR-150 address book |
| Портал: бронирование v2 | 579 (1) | FR-147: цена фиксируется коммерческим предложением (номер, срок) и бр… | COVERED | a0-por-portals.js: offers lock the price for 14 days |
| Портал: бронирование v2 | 580 (1) | BUG-32 / FR-154: экспресс из портала → 3 подписи в «Исходные данные ·… | COVERED | e2-mirror-res.js: R2 D5/P5 portal express -> S.express approval -> booking approved |
| Портал: бронирование v2 | 581-582 (2) | DE: названия мест, улиц и линий на языке страницы (Shymkent, Taraz, A… | COVERED | 62-language-audit.js: names in the UI language; a0-por-portals.js renders in 4 languages |
| Портал: бронирование v2 | 583 (1) | Сброс: снова администратор (изоляция следующих разделов) | N/A | Test-harness step (reset to admin); v6 loads a fresh iframe per group |
| Соответствие языка / Language match | 585-586 (2) | DE: все маршруты — без кириллицы (текст, опции, placeholder, title, a… | COVERED | 62-language-audit.js: [de |
| Соответствие языка / Language match | 587 (1) | Сброс: снова администратор | N/A | Test-harness step (reset to admin) |
| FR-84 Симуляция только в демо | 588 (1) | Демо: кнопки симуляции в меню и метка «СИМУЛЯЦИЯ» на смоделированных … | COVERED | d0-v6-parity.js: sidebar 'Alarm simulation' with SIMULATION chip |
| FR-84 Симуляция только в демо | 589-590 (2) | DE: метка SIMULATION, синхронизация и ссылка пропуска без русского те… | COVERED | d0-v6-parity.js / 83-res-thermo.js: SIMULATION chip + render in 4 languages |
| FR-131 Изменения других пользователей | 591 (1) | Метка «обновлено чч:мм:сс» показывает реальное время последней синхро… | COVERED | d0-v6-parity.js: live telemetry badge with clock |
| FR-131 Изменения других пользователей | 592 (1) | Вторая сессия видит тревожную кнопку без перезагрузки (≤ 10 с) и пока… | N/A | Second browser session sees the alarm via backend polling; v6 has no server (single page state) |
| FR-131 Изменения других пользователей | 593 (1) | Баннер закрывается и не появляется снова для уже известных тревог | COVERED | 61-shell-ext.js: alarm banner dismiss clears |
| FR-134 Доступность | 594 (1) | Пункты меню — ссылки с href (открыть в новой вкладке), ссылка пропуск… | COVERED | f5-a11y-layout.js: a11y keyboard: menu items are focusable links; toasts polite live region |
| FR-133 Навигация и таблицы | 596 (1) | Кнопка меню (aria-expanded, aria-controls) и нижняя панель с 4 раздел… | COVERED | 61-shell-ext.js: bottom bar has 4 screens per role; f5-a11y-layout.js: burger aria |
| FR-133 Навигация и таблицы | 597 (1) | Автопарк: таблица держит ширину колонок (без «одной буквы в строке»),… | COVERED | f5-a11y-layout.js: layout: tables keep column widths |
| FR-81/82/85/89 Приватность | 598 (1) | Водитель: в /state нет затрат, штрафов, SMS-очереди и входящих (ключи… | N/A | Driver /state payload (withheld keys) is a 0.3.11 backend API; v6 equivalent (driver role sees no costs/fines screens) is covered by 60-foundation.js roles |
| FR-81/82/85/89 Приватность | 600 (1) | Только чтение: аудитор не выполняет действия (403), список действий п… | COVERED | f0-shell-parity.js: roles: read-only roles see data but no write actions |
| FR-81/82/85/89 Приватность | 601 (1) | Подписи по бизнес-функции: диспетчер не подписывает «свой / внешний» … | COVERED | b0-eco-economics.js: own vs external two signatures of different functions |
| FR-81/82/85/89 Приватность | 602 (1) | В документе подписи — ссылки на пользователя (u:<id>), имя приходит ч… | N/A | Signature person references via /api/v5/people need the backend |
| FR-81/82/85/89 Приватность | 603 (1) | Контакты партнёра: номера скрыты, при звонке открываются и пишутся в … | COVERED | 87-res-partners.js: contact drawer masks numbers, Call audited (pii) |
| FR-81/82/85/89 Приватность | 604 (1) | Контакты на DE/EN: роли и имена латиницей, номера скрыты | COVERED | 87-res-partners.js: tab renders in 4 languages; 62-language-audit.js names in UI language |
| FR-71/78/83 Живые данные | 605 (1) | FR-83: driver:app только у водителя — администратор получает 403, про… | COVERED | e2-mirror-res.js: R2 D2 non-driver roles see a read-only preview |
| FR-71/78/83 Живые данные | 606 (1) | FR-83: телефон привязан к рейсу R-103 · V01 (из живого слоя), шаги не… | COVERED | 81-res-driver-app.js: role shell, own trip binding |
| FR-71/78/83 Живые данные | 607 (1) | FR-71: заказ и рейс, созданные в демо (R-26-…, ORD-26-…), видны на «Д… | COVERED | 20-dispatch.js: create load, assign; 75-ops-trips.js: new order appears in planning pool |
| FR-71/78/83 Живые данные | 608 (1) | FR-78: «Справочники» — версии, уровень партнёра ждёт второго пользова… | COVERED | 90-rec-records.js: reference data: versions, four-eyes approval |
| FR-71/78/83 Живые данные | 609 (1) | FR-78: новая машина с камерами в «Автопарк» — видна на экране «Автопа… | COVERED | 80-res-fleet-staff.js: new truck needs checklist, becomes plannable; 70-ops-load.js truck finder |
| FR-71/78/83 Живые данные | 617 (1) | Сброс демо после проверок живых данных | N/A | Test-harness step (demo reset) |
| FR-91…100 Рейсы и Go/No-Go | 610-611 (2) | FR-99: план не помещается (3,5 т · 1 зона) — сервер отклоняет; с обос… | COVERED | 70-ops-load.js: plan of the vehicle type needs override and reason, audited |
| FR-91…100 Рейсы и Go/No-Go | 613 (1) | FR-91: выезд демо-рейса без выпуска — 409 с названием проверки; с обо… | COVERED | 72-ops-docs.js: loading -> in_transit refused until released; override with reason, audited |
| FR-91…100 Рейсы и Go/No-Go | 615-616 (2) | DE: обоснование плана и отзыв выпуска без русского текста | COVERED | 72-ops-docs.js / 70-ops-load.js: render in every language, DE/EN without Cyrillic |
| FR-101…106 Холодовая цепь и тревоги | 618 (1) | FR-105: уровень 3 — сначала «Принять», закрытие только с категорией и… | COVERED | 90-rec-records.js: alarms level-3 escalates, needs ack, close needs category + note |
| FR-101…106 Холодовая цепь и тревоги | 619 (1) | FR-105: демо-API как сервер — без категории 422, короткий текст 422, … | N/A | Raw API status codes 422/409 of the demo-API-as-server; the UI rule is covered by 90-rec-records.js alarms and 85-res-coverage.js |
| FR-101…106 Холодовая цепь и тревоги | 620 (1) | FR-101: «Обзор» — тревоги и риски (погода, дороги, загрузка) раздельн… | COVERED | 74-ops-dashboard.js: dashboard alarms and risks separate lists |
| FR-101…106 Холодовая цепь и тревоги | 621 (1) | FR-105: «Тревоги» — решение требует категорию и ≥ 10 символов; уровен… | COVERED | 85-res-coverage.js: P3 security closing a real incident needs category and >= 10 chars |
| FR-101…106 Холодовая цепь и тревоги | 622 (1) | FR-102: датчики камер ТС и загрузка файла термохрона (минуты вне диап… | COVERED | 83-res-thermo.js: temperature log; d0-v6-parity.js: R1-a T11t thermochron |
| FR-101…106 Холодовая цепь и тревоги | 623-624 (2) | DE: закрытие инцидента и списки тревог / рисков без русского текста | COVERED | 90-rec-records.js / 74-ops-dashboard.js: render in every language without Cyrillic in DE/EN |
| FR-101…106 Холодовая цепь и тревоги | 625 (1) | Сброс демо после проверок холодовой цепи | N/A | Test-harness step (demo reset) |
| Доставка · ePOD и связь (FR-107…113) | 626 (1) | Свежее демо; приложение водителя: шаг «фото» — выбор файла, хэш SHA-2… | COVERED | 81-res-driver-app.js: delivery flow photo step |
| Доставка · ePOD и связь (FR-107…113) | 629 (1) | Хранилище объектов: тип по содержимому (SVG / подмена типа → 415), пу… | N/A | Object-store content-type sniffing (415) and empty file (422) is backend behaviour; logo upload limits are covered by e2-mirror-res.js M13 |
| Доставка · ePOD и связь (FR-107…113) | 630 (1) | Покрытие связи: «Измерено по телематике» — модель vs измерено, предло… | COVERED | 82-res-coverage-lines.js: dead zones from telematics gaps need 3 passes and analyst decision |
| Доставка · ePOD и связь (FR-107…113) | 631 (1) | SMS водителю CHKT: срок подтверждения 15 мин виден в очереди | COVERED | 82-res-coverage-lines.js: dispatcher SMS delivery status, timeout and retry |
| Доставка · ePOD и связь (FR-107…113) | 632 (1) | Отслеживание: своя ETA, история событий без персональных данных, темп… | COVERED | a0-por-portals.js: public tracking, no personal data |
| Доставка · ePOD и связь (FR-107…113) | 633-634 (2) | DE: приложение водителя (шаг подписи) и «Измерено по телематике» без … | COVERED | 81-res-driver-app.js / 82-res-coverage-lines.js: render in 4 languages, DE/EN without Cyrillic |
| Доставка · ePOD и связь (FR-107…113) | 635 (1) | Сброс демо после проверок доставки | N/A | Test-harness step (demo reset) |
| Lane J · затраты, ЕСУТД, GDP | 636 (1) | FR-85: исполнение решения «свой / внешний» — при разнице > 50 % тольк… | COVERED | b0-eco-economics.js: own vs external: > 50 % gap needs two signatures |
| Lane J · затраты, ЕСУТД, GDP | 637 (1) | FR-125: заявка в сервис закрывается только с фактической стоимостью (… | COVERED | e2-mirror-res.js: R2 P17 close with actual cost |
| Lane J · затраты, ЕСУТД, GDP | 638 (1) | FR-125: «Затраты» — план / факт по ТС из журнала затрат, импорт выпис… | COVERED | b2-eco-costs-ext.js: plan / actual per vehicle, toll CSV import with de-duplication |
| Lane J · затраты, ЕСУТД, GDP | 640 (1) | FR-114: интеграции — сроки ЕСУТД 01.01.2027 / 01.06.2027 с обратным о… | COVERED | e2-mirror-res.js: R2 integrations ESUTD readiness panel (deadlines with chips) |
| Lane J · затраты, ЕСУТД, GDP | 641-642 (2) | DE: план / факт, исполнение решений и логгер передачи без русского те… | COVERED | b2-eco-costs-ext.js / 87-res-partners.js: render in 4 languages |
| FR-118…127 Ресурсы, персонал, партнёры | 643 (1) | FR-121: продление договора — загрузка договора (SHA-256), ожидание вт… | COVERED | 87-res-partners.js: contract renewal needs upload + second approver |
| FR-118…127 Ресурсы, персонал, партнёры | 644 (1) | FR-121: демо-API как сервер — без договора 422, чужой номер документа… | N/A | Raw API codes 422/404/409; UI rule covered by 87-res-partners.js |
| FR-118…127 Ресурсы, персонал, партнёры | 645 (1) | FR-118: дефект в конце смены → один черновик заявки; вызов сервиса бе… | COVERED | 80-res-fleet-staff.js: service request / draft; e2-mirror-res.js: R2 P17 discard draft |
| FR-118…127 Ресурсы, персонал, партнёры | 646 (1) | FR-120: срочный рейс — занятость ТС из рейсов (без констант), нет ТС … | COVERED | 80-res-fleet-staff.js: R6 staff urgent trip, truck occupancy from running loads |
| FR-118…127 Ресурсы, персонал, партнёры | 647 (1) | FR-120: свободная ТС в хабе → назначение создаёт рейс U-1, он виден в… | COVERED | 80-res-fleet-staff.js: urgent trip U-n is created and visible |
| FR-118…127 Ресурсы, персонал, партнёры | 649 (1) | FR-123/124: оплата → запрос возмещения → подтверждение водителем → уд… | COVERED | b0-eco-economics.js: fines: recharge -> ack -> deduction -> payroll |
| FR-118…127 Ресурсы, персонал, партнёры | 650 (1) | FR-124: уведомление водителю видно только ему, подтверждение с времен… | COVERED | e2-mirror-res.js: R2 R7 fines: Notify driver once, no app account |
| FR-118…127 Ресурсы, персонал, партнёры | 651 (1) | FR-126: экспресс — срок подписи, уведомления подписантам, 3/3 создаёт… | COVERED | 73-ops-dispatch.js: express three signatures create a high-priority load |
| FR-118…127 Ресурсы, персонал, партнёры | 653-654 (2) | DE: «Партнёры», «Персонал», «Отчёты», «Планирование» без русского тек… | COVERED | e2-mirror-res.js / 87-res-partners.js: render in 4 languages |
| FR-118…127 Ресурсы, персонал, партнёры | 655 (1) | Сброс демо после проверок ресурсов и персонала | N/A | Test-harness step (demo reset) |
| FR-132 Одна навигация | 659 (1) | Номера 01–17 уникальны и совпадают в меню, в заголовке экрана (eyebro… | COVERED | 61-shell-ext.js: eyebrow numbers and diagram popover (v6: 13 numbers) |
| FR-132 Одна навигация | 660 (1) | Старые адреса /dispatch, /temperature, /fleet, /summary ведут на вкла… | N/A | Legacy URLs /dispatch /temperature /fleet /summary belong to the v5 router; v6 uses ?s=&t= (deep links covered by 61-shell-ext.js) |
| FR-137 Права из backend | 663 (1) | «Кто может открыть»: Диспетчер (02) — без роли «Водитель»; Приложение… | COVERED | c0-help-content.js: access line (roles, permission, chip) |
| FR-137 Права из backend | 664 (1) | Водитель видит ровно «Приложение водителя» и «Покрытие связи»; другие… | COVERED | 60-foundation.js: roles shells for customer / partner / driver, access refused |
| FR-135 Справочник мест, казахский, системные тексты | 667-668 (2) | DE: входящее сообщение на русском и запись журнала из RU-сессии — без… | COVERED | 90-rec-records.js: inbox translit on DE/EN |
| FR-135 Справочник мест, казахский, системные тексты | 672 (1) | DE: защитная транслитерация DOM отключена — новый кириллический узел … | N/A | DOM transliteration guard of 0.3.11 (TRANSLIT_RULES on mutation) is not used the same way in v6; texts are keyed (g4-architecture.js S4 FR-199) |
| FR-135 Справочник мест, казахский, системные тексты | 673-675 (3) | KK: переключатель языка, меню и «Обзор» на казахском, недостающие тек… | COVERED | f0-shell-parity.js: [kk] Kazakh UI; g4-architecture.js: completed KK texts keyed |
| FR-139…157 Подбор ТС и погрузка | 677 (1) | FR-143: предложения партнёров хаба как кандидаты; FR-142: ограничения… | COVERED | 70-ops-load.js: truck finder restrictions per travel day, ADR and roads |
| FR-139…157 Подбор ТС и погрузка | 678 (1) | FR-139: разделение на две ТС — обе части вместе = отмеченные заказы, … | COVERED | 70-ops-load.js: split over two trucks, cost compared with one bigger truck |
| FR-139…157 Подбор ТС и погрузка | 679 (1) | FR-140: вид сверху и сбоку — центр тяжести, доля передней оси, слева … | COVERED | 70-ops-load.js: centre of gravity facts |
| FR-139…157 Подбор ТС и погрузка | 680 (1) | FR-144: порядок погрузки LIFO (первая строка — последняя точка), печа… | COVERED | 70-ops-load.js: loading sequence LIFO, scan check right / wrong |
| FR-139…157 Подбор ТС и погрузка | 681 (1) | FR-145: взвешивание демо-рейса — перегруз с точным превышением, допус… | COVERED | 70-ops-load.js: departure weighing, exact excess, override with reason |
| FR-139…157 Подбор ТС и погрузка | 682 (1) | FR-157 / FR-141: «Реестр ТС» — профиль и приёмка ТС, расчёт долей осе… | COVERED | 80-res-fleet-staff.js: new truck checklist; load profile calibration validates and computes axle shares |
| FR-139…157 Подбор ТС и погрузка | 683 (1) | FR-142: «Справочники» — ограничения дорог, новая запись ждёт второго … | COVERED | e2-mirror-res.js: R2 reference data road restrictions four-eyes |
| BUG-31 / FR-175 История, заголовки, ссылки | 684 (1) | Заголовок вкладки: «запись · номер экрана и название · Olymp Logistic… | COVERED | 61-shell-ext.js: document.title record, tab, screen number and brand |
| BUG-31 / FR-175 История, заголовки, ссылки | 685 (1) | history.back() / forward(): экран, вкладка и выбранная запись восстан… | COVERED | 61-shell-ext.js: history navigation pushes entries, popstate restores |
| BUG-31 / FR-175 История, заголовки, ссылки | 687 (1) | Прямые ссылки /r/…: отклонение, рейс, статья справки; неизвестный зак… | COVERED | 61-shell-ext.js: deep links ?r=type:id, 403 page for unknown or forbidden records |
| BUG-31 / FR-175 История, заголовки, ссылки | 688 (1) | Прямые ссылки на бронирование и тревогу открывают одну запись; заголо… | COVERED | 61-shell-ext.js: deep links ?booking= ?alarm=; d0 SEL_PARAM |
| BUG-31 / FR-175 История, заголовки, ссылки | 689 (1) | Водитель: ссылка на отклонение и на рейс → 403 без данных; ссылка на … | COVERED | 61-shell-ext.js: 403 page, id sanitising; roles driver redirect |
| BUG-31 / FR-175 История, заголовки, ссылки | 691 (1) | EN: заголовок вкладки на языке страницы | COVERED | 61-shell-ext.js: document.title (en) |
| BUG-32 Экспресс на экране 02 | 692 (1) | Экран 02: раздел «Экспресс» — открытые заявки, подписи по слотам, сро… | COVERED | 73-ops-dispatch.js: Waybills & express tab, badge |
| BUG-32 Экспресс на экране 02 | 693 (1) | Значок в меню у «02» = заявки, ждущие подписи вашей функции | COVERED | e1-mirror-ops.js: R1 dispatcher menu badge = express awaiting my signature |
| BUG-32 Экспресс на экране 02 | 694 (1) | Справка «Где найти экспресс?» со схемой экрана 02 и процесса согласов… | COVERED | c1-help-visuals.js: articles embed the animated figures (dispatchMock on Express) |
| Справка: схемы и анимации | 695-697 (3) | 9 схем встроены в статьи: SVG без внешних ресурсов, подпись шага, ‹ ▶… | COVERED | c1-help-visuals.js: every figure renders every step as SVG; stepper; truck seesaw |
| Справка: схемы и анимации | 698-700 (3) | DE: схемы на языке страницы без кириллицы | COVERED | c1-help-visuals.js: [lang] figures in every language (de en kk) |
| FR-159 / FR-160 Учёт и туры | 701 (1) | Заголовок группы «Учёт и администрирование» открывает обзорную страни… | COVERED | 61-shell-ext.js: records landing page and sidebar group |
| FR-159 / FR-160 Учёт и туры | 702 (1) | Тур «День диспетчера»: старт из справки, подсветка настоящих элементо… | COVERED | c0-help-content.js: tours start from the list, spotlight, next/back, Esc ends |
| FR-159 / FR-160 Учёт и туры | 705-706 (2) | DE: тур на языке страницы | COVERED | c0-help-content.js: tours popover texts follow the page language |
| FR-158 Реестр ТС: столбцы, виды, CSV | 707 (1) | Выбор столбцов, сохранение вида (по пользователю, на сервере), вид по… | COVERED | 80-res-fleet-staff.js: saved views; e2-mirror-res.js: R2 F14/F10 default view |
| FR-158 Реестр ТС: столбцы, виды, CSV | 708 (1) | CSV: ровно видимые столбцы, по строке на ТС, без формул | COVERED | 80-res-fleet-staff.js: CSV of visible columns; g4-architecture.js: XP.csv formula guard |
| FR-173 Формы для существующих API | 710 (1) | Рейс в пути: форма прерывания (тревога + причина ≥ 10) и итог по зака… | COVERED | 75-ops-trips.js: abort trip UI; stops and outcomes |
| Логотипы производителей · экран 04 | 713 (1) | Этикетка места: логотип производителя рядом с названием | COVERED | d0-v6-parity.js / 71-ops-ship.js: label with manufacturer logo |
| Логотипы производителей · экран 04 | 714 (1) | Справочники: загрузка логотипа (PNG ≤ 300 KB) заменяет стандартный, у… | COVERED | e2-mirror-res.js: R2 reference data: manufacturer logo upload PNG / WebP <= 300 KB |
| Плановые значения · проверка перед запуском | 716 (1) | FR-167: страница «Пользователи» — слот без владельца показывает масте… | COVERED | e2-mirror-res.js: R2 users approval-slot wizard |
| Партнёр · демо-аккаунт и самостоятельная регистрация GDP | 717 (1) | Аккаунт partner.pl01 открывает портал партнёра: профиль PL-01 без пер… | COVERED | a0-por-portals.js: partner portal; e2-mirror-res.js: PP8 partner portal GDP form |
| Партнёр · демо-аккаунт и самостоятельная регистрация GDP | 718 (1) | Подача: сертификат (PNG) + ТС + классы + даты → заявка «ждёт проверки… | COVERED | e2-mirror-res.js: R2 PP8 full GDP certificate submission form with server rules |
| Партнёр · демо-аккаунт и самостоятельная регистрация GDP | 719 (1) | Экран 11 «Партнёры»: заявка видна, подтверждение сотрудником делает к… | COVERED | a0-por-portals.js: GDP self-registration approved in CRM; 87-res-partners.js R6 GDP decision |
| Новые записи · производители, ТС, водители | 720 (1) | Справочники → Производители: «+ Новая запись» создаёт производителя (… | COVERED | f0-shell-parity.js: reference data: a new manufacturer entry is active at once, audited |
| Новые записи · производители, ТС, водители | 722 (1) | Водители: «+ Водитель» создаёт запись (ИИН/телефон маскированы в спис… | COVERED | f0-shell-parity.js / e2-mirror-res.js: drivers '+ Driver' name 3-150, masked phone |
| Дежурства · график эскалаций | 723 (1) | Страница «Дежурства» в группе 2: три уровня, покрытие 72 ч, без дежур… | COVERED | 90-rec-records.js: on-call coverage |
| Дежурства · график эскалаций | 724 (1) | Добавить дежурного: номер показан маскированно, статус «действует», а… | COVERED | 90-rec-records.js: on-call add / end slot |
| Дежурства · график эскалаций | 725 (1) | Диспетчер без функции «Руководитель безопасности» видит график, но не… | COVERED | 90-rec-records.js: on-call edit right (FR-166) |
| Переключатель дизайна · Olymp ↔ Kökzhol | 726 (1) | По умолчанию текущий дизайн; переключатель в подвале меню; Kökzhol: т… | COVERED | 60-foundation.js: design switch Olymp / Kökzhol |
| Иконки навигации · Olymp duotone / Kökzhol tile | 728 (1) | Olymp: у каждого пункта меню (17 + учёт + справка) есть иконка, число… | COVERED | f0-shell-parity.js: navigation icons: every menu item carries an SVG glyph, both designs |
| Договоры и ЭЦП · FR-149 | 730 (1) | Портал: раздел «Договоры» в «Мои бронирования» — отправленный рамочны… | COVERED | a0-por-portals.js: contracts draft -> sent -> signed in the portal |
| Договоры и ЭЦП · FR-149 | 731 (1) | Бронирование «в кредит» без подписанного договора → 409 contract_requ… | COVERED | a0-por-portals.js: framework contract enables payment on account |
| Договоры и ЭЦП · FR-149 | 733 (1) | «Подписать (демо)» → статус «Подписан», подписант компания + БИН, дей… | COVERED | a0-por-portals.js: signed contract, framework valid, credit booking |
| Договоры и ЭЦП · FR-149 | 734 (1) | CRM → Клиенты → «Договоры»: сформировать из шаблона (версия, язык) → … | COVERED | e2-mirror-res.js: R2 P17 contracts: void needs a reason, template language |
| Договоры и ЭЦП · FR-149 | 735-736 (2) | DE: раздел договоров и сообщение NCALayer без кириллицы | COVERED | a0-por-portals.js: all W4 screens render in 4 languages |
| Договоры и ЭЦП · FR-149 | 737 (1) | Сброс: снова администратор | N/A | Test-harness step (reset to admin) |
| FR-163 Номера | 738-741 (4) | Номера сценария помечены «сценарий» в обзоре и диспетчере, текст номе… | N/A | Scenario numbers (R-104 vs DB numbers) are a 0.3.11 dual-numbering scheme (FR-163); v6 uses one numbering scheme (LD-2026-nnnnnn) |
| Портал · вес, плательщик, сообщения, БИН (FR-185…190) | 742 (1) | FR-185 API: пример владельца (206+505+300 = 1 011 кг при брутто 905 к… | COVERED | a0-por-portals.js: parity 0.3.11 booking form oversize only warns (1.10) |
| Портал · вес, плательщик, сообщения, БИН (FR-185…190) | 743 (1) | FR-185 форма (RU): предупреждение рядом с полями и на шаге цены — «пр… | COVERED | a0-por-portals.js: parity 0.3.11 booking form oversize only warns |
| Портал · вес, плательщик, сообщения, БИН (FR-185…190) | 746 (1) | FR-186 / FR-189 / FR-187: плательщик (агент), БИН с контрольной цифро… | COVERED | a0-por-portals.js: BIN/IIN check digit; customer books with payer, SMS |
| Портал · вес, плательщик, сообщения, БИН (FR-185…190) | 747 (1) | FR-190: значок «Бронирования» = число заявок «Запрошено» (сервер), ум… | COVERED | 90-rec-records.js: bookings new badge, confirm creates a load |
| Портал · вес, плательщик, сообщения, БИН (FR-185…190) | 748 (1) | FR-189 CRM: ИИН клиента-ИП — только маскированно; неверная контрольна… | COVERED | a0-por-portals.js: por: BIN/IIN check digit, mask |
| Страхование и прайс-листы · FR-153 / FR-148 | 749 (1) | Страница «Страхование грузов» в группе 2: карточка полиса с пометкой … | COVERED | 90-rec-records.js: insurance claims |
| Страхование и прайс-листы · FR-153 / FR-148 | 750 (1) | Открыть страховой случай по отклонению: строка со статусом «открыт» и… | COVERED | 90-rec-records.js: insurance claim needs insured booking; b1-eco-reports-ext.js: quality claim opens with DEV |
| Страхование и прайс-листы · FR-153 / FR-148 | 751 (1) | Шаги статуса с подтверждением: открыт → подан страховщику → урегулиро… | COVERED | 90-rec-records.js: insurance steps with notes |
| Страхование и прайс-листы · FR-153 / FR-148 | 752 (1) | CRM → Клиенты → «Прайс-листы»: действующий список, создать рамочный (… | COVERED | a0-por-portals.js: price lists framework discount, spot discount refused (a0 parity 8.3) |
| Страхование и прайс-листы · FR-153 / FR-148 | 754-755 (2) | DE: страница страхования и прайс-листы без кириллицы; строка прайс-ли… | COVERED | a0-por-portals.js / 90-rec-records.js: render in 4 languages, DE/EN without Cyrillic |
| Страхование и прайс-листы · FR-153 / FR-148 | 756 (1) | Деактивировать прайс-лист → расчёт возвращается к предыдущему списку … | COVERED | a0-por-portals.js: price lists deactivate falls back to line tariff |
| BUG-37 · Демо в двух вкладках | 757 (1) | Бронь из второй вкладки (портал) появляется в списке «Бронирования» и… | N/A | Cross-tab sync (second browser tab) needs the backend; v6 is a single-page state |

## 4. Totals and 0.3.11 failures in this run

Result column values: `OK` x 747, `ОШИБКА` x 10

Failed / not passed scenarios: 10

| # | module | scenario | result | error |
|---:|---|---|---|---|
| 414 | FR-41 Экспресс | 3 подписи → «согласовано · экспресс» | ОШИБКА | EX-0311 · 18 кг · 2–8 °CАлматы → Атырауреагенты 2–8 °C · нужно через 2 дня2 / 3 подписи · до 01.11 16:00Экспресс25 920 ₸ |
| 415 | FR-41 Экспресс | Одна подпись → «1 / 3 подписи» | ОШИБКА | нет 1 / 3 |
| 427 | FR-40 Термохрон | Импорт TH-02 показывает отклонение и создаёт DEV-0041 | ОШИБКА | нет DEV |
| 504 | Загрузка · типы ТС | Подбор ТС пересчитывается: +З-2297 (2 пал.) → рекомендация 10 т · 1 зона | ОШИБКА | рекомендация t75:2 |
| 506 | Загрузка · типы ТС | План ТС для R-106 сохраняется на сервере и виден диспетчеру | ОШИБКА |  |
| 507 | Загрузка · типы ТС | Глобальные тревоги и диспетчер считают по фактической ТС V02 | ОШИБКА | Нет текста: «8 / 18 паллет» |
| 508 | Загрузка · типы ТС | Показать сохранённый план возвращает выбор 12,5 т · 2 зоны | ОШИБКА | Кнопка не найдена: «Показать план» |
| 661 | FR-132 Одна навигация | Вкладки: «Реестр ТС» на экране «Автопарк» — один заголовок h1, номер 10, кнопка «+ Транспортное сре… | ОШИБКА |  |
| 682 | FR-139…157 Подбор ТС и погрузка | FR-157 / FR-141: «Реестр ТС» — профиль и приёмка ТС, расчёт долей осей по геометрии | ОШИБКА | нет элемента |
| 703 | FR-159 / FR-160 Учёт и туры | Тур «Отклонение QA» с кнопки «Тур» экрана 09 и тур водителя (вкладки приложения из ссылки) | ОШИБКА | вкладка «Маршрут» не открыта: #/s/driver?view=route |

Notes on the failures (not investigated, this is a single run on 2026-10-31 in a shared browser pane): 414-416 are the express request EX-0311 (signing deadline 01.11 16:00 is one day after the run date, error 414 is a DOM dump of the express card), 427 the thermochron import TH-02, 504 / 506-508 the vehicle-plan scenarios of module `Загрузка · типы ТС` (state is stored on the shared demo origin, so results may depend on what other sessions did before), 661 / 682 / 703 registry and driver-app tab checks. 9 of the 10 are in modules whose behaviour is covered by v6 groups (`73-ops-dispatch.js` express, `83-res-thermo.js`/`d0-v6-parity.js` thermochron, `70-ops-load.js` plan, `80-res-fleet-staff.js`, `81-res-driver-app.js`); a re-run on a clean browser profile is needed before treating them as 0.3.11 defects. The full run reported 747 / 757 passed.
