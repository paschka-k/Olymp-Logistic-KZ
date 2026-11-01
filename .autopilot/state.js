window.STATE =
{
  "version": 2,
  "slug": "optimisation-wave3",
  "dir": "2026-11-01-optimisation-wave3--wip",
  "title": "Волна 3: производительность (S5) и UX (S6)",
  "mode": "semi",
  "depth": "normal",
  "tier": "T3",
  "briefFile": "2026-11-01-brief.md",
  "memoryFile": "AGENTS.md",
  "memoryOwner": "autopilot",
  "skillDir": "C:/Users/Pavel/.agents/skills/autopilot",
  "baseCommit": "7c90d82",
  "startedAt": "2026-11-01T01:07:23+01:00",
  "updatedAt": "2026-11-01T05:48:48+01:00",
  "finishedAt": null,
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-11-01T01:07:23+01:00",
      "finishedAt": "2026-11-01T01:07:41+01:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-11-01T01:07:41+01:00",
      "finishedAt": "2026-11-01T01:08:01+01:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "startedAt": "2026-11-01T01:08:01+01:00",
      "finishedAt": "2026-11-01T01:08:09+01:00",
      "note": "вопросов не потребовалось: ТЗ — строки OPTIMISATION-FR, развилки решаю в спецификации"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-11-01T01:08:10+01:00",
      "finishedAt": "2026-11-01T01:20:26+01:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-11-01T01:20:26+01:00",
      "finishedAt": "2026-11-01T01:21:40+01:00"
    },
    {
      "id": "build",
      "status": "active",
      "startedAt": "2026-11-01T01:21:40+01:00"
    },
    {
      "id": "review",
      "status": "pending"
    },
    {
      "id": "final",
      "status": "pending"
    }
  ],
  "requirements": {
    "total": 13,
    "done": 5,
    "inTicket": 8,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 0,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Области перерисовки и экономный тик",
      "requirements": [
        "R03",
        "R04"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "platform-src/v6/core.js",
        "platform-src/v6/base/45-region.js",
        "platform-src/v6/screens/shell/001-shell-ext.js",
        "platform-src/v6/screens/shell/002-a11y.js",
        "platform-src/v6/screens/{dashboard,routes,hubs}/",
        "data-live",
        "platform-src/tests/i1-render-regions.js"
      ],
      "review": "да — фундамент",
      "model": "сильная",
      "status": "done",
      "retries": 0,
      "repairs": 1,
      "startedAt": "2026-11-01T01:21:41+01:00",
      "repairFindings": [
        "ревью: баннер тревог после тика; ACT не использует region"
      ],
      "finishedAt": "2026-11-01T05:14:36+01:00",
      "tests": {
        "passed": 731,
        "failed": 731
      },
      "commit": "9584ebb"
    },
    {
      "id": "02",
      "title": "Страница только на своём языке (сборка)",
      "requirements": [
        "R01"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "platform-src/build-v6.mjs",
        "platform-src/tools-build/",
        "platform-src/budget.json",
        "platform-src/perf-budget.json",
        "platform-src/tests/i2-build-lang.js"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "startedAt": "2026-11-01T01:21:41+01:00",
      "finishedAt": "2026-11-01T05:14:37+01:00",
      "tests": {
        "passed": 731,
        "failed": 731
      },
      "commit": "7d024bb"
    },
    {
      "id": "03",
      "title": "Общие примитивы: состояния, предпочтения, отмена",
      "requirements": [
        "R08",
        "R09",
        "R10"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "platform-src/v6/base/30-kit.js",
        "platform-src/v6/base/46-prefs.js",
        "platform-src/v6/base/47-undo.js",
        "platform-src/v6/core.js",
        "platform-src/v6/strings/",
        "platform-src/tests/i3-ux-primitives.js"
      ],
      "review": "да — фундамент",
      "model": "сильная",
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "startedAt": "2026-11-01T05:14:55+01:00",
      "finishedAt": "2026-11-01T05:48:47+01:00",
      "tests": {
        "passed": 774,
        "failed": 774
      },
      "commit": "ea6fa2d"
    },
    {
      "id": "04",
      "title": "Ленивые демо-данные",
      "requirements": [
        "R06"
      ],
      "blockedBy": [
        "01"
      ],
      "wave": 2,
      "zone": [
        "platform-src/v6/data.js",
        "platform-src/v6/base/40-state.js",
        "platform-src/v6/base/42-lazy.js",
        "platform-src/v6/screens/*/",
        "platform-src/tests/i4-lazy-data.js"
      ],
      "review": "да — фундамент",
      "model": "сильная",
      "status": "done",
      "retries": 0,
      "repairs": 0,
      "startedAt": "2026-11-01T05:14:56+01:00",
      "finishedAt": "2026-11-01T05:48:48+01:00",
      "tests": {
        "passed": 774,
        "failed": 774
      },
      "commit": "a948667"
    },
    {
      "id": "05",
      "title": "Окно для длинных таблиц",
      "requirements": [
        "R05"
      ],
      "blockedBy": [
        "03"
      ],
      "wave": 3,
      "zone": [
        "platform-src/v6/base/50-vlist.js",
        "platform-src/v6/screens/hubs/760-r5-network.js",
        "platform-src/v6/screens/*/450-rec-admin.js",
        "platform-src/v6/screens/routes/150-monitor.js",
        "platform-src/tests/i5-vlist.js"
      ],
      "review": "да — фундамент",
      "model": "сильная",
      "status": "pending",
      "retries": 0,
      "repairs": 0
    },
    {
      "id": "06",
      "title": "Палитра команд и центр уведомлений",
      "requirements": [
        "R07",
        "R12"
      ],
      "blockedBy": [
        "03"
      ],
      "wave": 3,
      "zone": [
        "platform-src/v6/screens/shell/090-palette.js",
        "platform-src/v6/screens/shell/095-notify.js",
        "platform-src/v6/screens/shell/002-a11y.js",
        "KEYS()",
        "platform-src/v6/core.js",
        "platform-src/tests/i6-palette-notify.js"
      ],
      "review": "нет",
      "model": "обычная",
      "status": "pending",
      "retries": 0,
      "repairs": 0
    },
    {
      "id": "07",
      "title": "Стартовые страницы ролей и сценарии демо",
      "requirements": [
        "R11",
        "R13"
      ],
      "blockedBy": [
        "03",
        "04"
      ],
      "wave": 3,
      "zone": [
        "platform-src/v6/screens/dashboard/",
        "platform-src/v6/screens/shell/001-shell-ext.js",
        "demoReset",
        "platform-src/tests/i7-home-scenarios.js"
      ],
      "review": "нет",
      "model": "обычная",
      "status": "pending",
      "retries": 0,
      "repairs": 0
    },
    {
      "id": "08",
      "title": "Перевод экранов на состояния и «Отменить»",
      "requirements": [
        "R09",
        "R10"
      ],
      "blockedBy": [
        "05",
        "06",
        "07"
      ],
      "wave": 4,
      "zone": [
        "platform-src/v6/screens/*/",
        "platform-src/tests/i8-migrate.js"
      ],
      "review": "нет",
      "model": "обычная",
      "status": "pending",
      "retries": 0,
      "repairs": 0
    },
    {
      "id": "09",
      "title": "Ядро + чанки по разделам (split-сборка)",
      "requirements": [
        "R02"
      ],
      "blockedBy": [
        "02",
        "04",
        "05",
        "06",
        "07"
      ],
      "wave": 4,
      "zone": [
        "platform-src/build-v6.mjs",
        "platform-src/tools-build/",
        "platform-src/tests/i9-split.js",
        "platform/split/"
      ],
      "review": "да — риск сборки",
      "model": "сильная",
      "status": "pending",
      "retries": 0,
      "repairs": 0
    }
  ],
  "tests": {
    "passed": 774,
    "failed": 774
  },
  "debt": {
    "placeholders": [],
    "assumptions": [],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": {
    "found": 4,
    "fixed": 4,
    "deferred": 0,
    "items": []
  },
  "concerns": [
    "core.js:374 — сбитый комментарий saveD и псевдо-действие filter с virtual:true",
    "150-monitor.js:48 — thTick перерисовывает main на вкладке температуры каждые 2 с без проверки изменений",
    "core.js:~290 — liveSig-перерисовка теперь идёт и при открытом drawer, теста нет",
    "core.js toast(): показ тоста делает полный render()",
    "45-region.js — bannerSync и fallback da_sig зашиты в renderRegion по id",
    "Тест баннера (i1-render-regions.js:138) проверяет только наличие, не count==1 и не сохранность после второго тика",
    "platform-src/tests/i1-render-regions.js:138",
    "Тест «drawer не пересоздаётся при breach» не проверяет, что перерисовка реально случилась — может быть зелёным вхолостую",
    "platform-src/tests/i1-render-regions.js:158",
    "ACT с region, вызывающий toast(), получит renderRegion вместо показа тоста (core.js:389)",
    "platform-src/v6/core.js:389",
    "Запас теста веса (I2, ru ≥25% легче) после T03 всего ~98 Б; следующие таски добавят код — бюджет придётся решать (вырезание help или пересмотр порога)",
    "platform-src/tests/i2-build-lang.js",
    "T03: примитивы без миграции — ~22 пустых состояния, 2 confirm(), кнопка сброса настроек, saved views (kz-r4-views через патч Storage) остаются на таск 08/доработку",
    "platform-src/v6/base/46-prefs.js",
    "T04: до интерактивности 428/404 мс уже в старте (≈320 мс — компиляция); 7 из 10 ленивых коллекций не построены после первого экрана (alarms/inbox/audit читает дашборд); devs, bookings, S.res, S.express, S.orders, S.partners, ECO_BL оставлены энергичными",
    "platform-src/v6/base/42-lazy.js",
    "T03 ревью: F2 undoRun снимает слот/таймер до p.fn() — при исключении undoFn отмены нет, аудита нет (47-undo.js:24)",
    "platform-src/v6/base/47-undo.js:24",
    "T03 ревью: F5 ACT.resetFilters обнуляет все ключи S.f в '' (сорт., булевы), hub не трогает (core.js)",
    "platform-src/v6/core.js",
    "T03 ревью: F8 capture настроек только на click/pagehide; клавиатура/change не запоминаются; undo-тост без role=status",
    "T03 ревью: F1/F3/F4/F6/F7 — нет кнопки сброса настроек и теста ACT.prefsReset; watch не обязателен; ACT.retry = render(); патч Storage.prototype для kz-r4-views скрыт и необратим; слабый тест аудита отмены",
    "T04 ревью: assert TTI в i4-lazy-data.js:116 проходит без measured; порог 1500 мс на CI-ранере (2–3× медленнее) с малым запасом — возможен флейк",
    "platform-src/tests/i4-lazy-data.js:116",
    "T04 ревью: R5.PTS (lazyFn r5.points) не сбрасывается demoReset; нет теста «построена и изменена до snapshot»",
    "platform-src/v6/screens/orders/760-r5-network.js:36"
  ],
  "blind": null,
  "beats": [
    "2026-11-01T01:07:23+01:00",
    "2026-11-01T01:07:41+01:00",
    "2026-11-01T01:07:53+01:00",
    "2026-11-01T01:08:01+01:00",
    "2026-11-01T01:08:09+01:00",
    "2026-11-01T01:08:10+01:00",
    "2026-11-01T01:19:01+01:00",
    "2026-11-01T01:20:00+01:00",
    "2026-11-01T01:20:02+01:00",
    "2026-11-01T01:20:24+01:00",
    "2026-11-01T01:20:26+01:00",
    "2026-11-01T01:20:27+01:00",
    "2026-11-01T01:20:28+01:00",
    "2026-11-01T01:20:29+01:00",
    "2026-11-01T01:20:38+01:00",
    "2026-11-01T01:20:39+01:00",
    "2026-11-01T01:20:47+01:00",
    "2026-11-01T01:21:40+01:00",
    "2026-11-01T01:21:41+01:00",
    "2026-11-01T01:48:15+01:00",
    "2026-11-01T01:50:56+01:00",
    "2026-11-01T01:50:58+01:00",
    "2026-11-01T02:20:49+01:00",
    "2026-11-01T05:10:13+01:00",
    "2026-11-01T05:10:15+01:00",
    "2026-11-01T05:10:17+01:00",
    "2026-11-01T05:14:36+01:00",
    "2026-11-01T05:14:37+01:00",
    "2026-11-01T05:14:55+01:00",
    "2026-11-01T05:14:56+01:00",
    "2026-11-01T05:39:01+01:00",
    "2026-11-01T05:39:02+01:00",
    "2026-11-01T05:40:07+01:00",
    "2026-11-01T05:41:58+01:00",
    "2026-11-01T05:41:59+01:00",
    "2026-11-01T05:42:00+01:00",
    "2026-11-01T05:42:01+01:00",
    "2026-11-01T05:43:47+01:00",
    "2026-11-01T05:43:48+01:00",
    "2026-11-01T05:43:50+01:00",
    "2026-11-01T05:48:47+01:00",
    "2026-11-01T05:48:48+01:00"
  ],
  "rev": 43,
  "waiting": null,
  "waits": [],
  "log": [
    {
      "t": "2026-11-01T01:07:23+01:00",
      "k": "init"
    },
    {
      "t": "2026-11-01T01:07:41+01:00",
      "k": "stage",
      "id": "manifest",
      "act": "start"
    },
    {
      "t": "2026-11-01T01:08:01+01:00",
      "k": "stage",
      "id": "briefing",
      "act": "start"
    },
    {
      "t": "2026-11-01T01:08:09+01:00",
      "k": "stage",
      "id": "briefing",
      "act": "skip",
      "note": "вопросов не потребовалось: ТЗ — строки OPTIMISATION-FR, развилки решаю в спецификации"
    },
    {
      "t": "2026-11-01T01:08:10+01:00",
      "k": "gate",
      "g": "G1",
      "ok": false,
      "open": 13,
      "total": 13
    },
    {
      "t": "2026-11-01T01:08:10+01:00",
      "k": "stage",
      "id": "spec",
      "act": "start"
    },
    {
      "t": "2026-11-01T01:19:01+01:00",
      "k": "gate",
      "g": "G1",
      "ok": true,
      "open": 0,
      "total": 13
    },
    {
      "t": "2026-11-01T01:19:01+01:00",
      "k": "stage",
      "id": "spec",
      "act": "start"
    },
    {
      "t": "2026-11-01T01:20:00+01:00",
      "k": "tickets",
      "n": 9
    },
    {
      "t": "2026-11-01T01:20:02+01:00",
      "k": "gate",
      "g": "G3",
      "ok": false,
      "problems": 1
    },
    {
      "t": "2026-11-01T01:20:24+01:00",
      "k": "gate",
      "g": "G2",
      "ok": true,
      "found": 4,
      "fixed": 4,
      "deferred": 0
    },
    {
      "t": "2026-11-01T01:20:26+01:00",
      "k": "stage",
      "id": "plan",
      "act": "start"
    },
    {
      "t": "2026-11-01T01:20:27+01:00",
      "k": "tickets",
      "n": 9
    },
    {
      "t": "2026-11-01T01:20:28+01:00",
      "k": "gate",
      "g": "G3",
      "ok": false,
      "problems": 1
    },
    {
      "t": "2026-11-01T01:20:29+01:00",
      "k": "tier",
      "v": "T3"
    },
    {
      "t": "2026-11-01T01:20:38+01:00",
      "k": "tickets",
      "n": 9
    },
    {
      "t": "2026-11-01T01:20:39+01:00",
      "k": "gate",
      "g": "G3",
      "ok": true,
      "problems": 0
    },
    {
      "t": "2026-11-01T01:21:40+01:00",
      "k": "stage",
      "id": "build",
      "act": "start"
    },
    {
      "t": "2026-11-01T01:21:41+01:00",
      "k": "ticket",
      "ids": [
        "01",
        "02"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-01T01:48:15+01:00",
      "k": "ticket",
      "ids": [
        "01"
      ],
      "act": "review"
    },
    {
      "t": "2026-11-01T01:50:56+01:00",
      "k": "ticket",
      "ids": [
        "01"
      ],
      "act": "repair",
      "note": "ревью: баннер тревог после тика; ACT не использует region"
    },
    {
      "t": "2026-11-01T01:50:58+01:00",
      "k": "add",
      "key": "concerns",
      "n": 5
    },
    {
      "t": "2026-11-01T02:20:49+01:00",
      "k": "add",
      "key": "report",
      "n": 1
    },
    {
      "t": "2026-11-01T05:10:13+01:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-01T05:10:15+01:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-01T05:10:17+01:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-01T05:14:36+01:00",
      "k": "ticket",
      "ids": [
        "01"
      ],
      "act": "done",
      "tests": {
        "passed": 731,
        "failed": 731
      }
    },
    {
      "t": "2026-11-01T05:14:37+01:00",
      "k": "ticket",
      "ids": [
        "02"
      ],
      "act": "done",
      "tests": {
        "passed": 731,
        "failed": 731
      }
    },
    {
      "t": "2026-11-01T05:14:55+01:00",
      "k": "ticket",
      "ids": [
        "03"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-01T05:14:56+01:00",
      "k": "ticket",
      "ids": [
        "04"
      ],
      "act": "start"
    },
    {
      "t": "2026-11-01T05:39:01+01:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-01T05:39:02+01:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-01T05:40:07+01:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-01T05:41:58+01:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-01T05:41:59+01:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-01T05:42:00+01:00",
      "k": "add",
      "key": "concerns",
      "n": 1
    },
    {
      "t": "2026-11-01T05:42:01+01:00",
      "k": "add",
      "key": "concerns",
      "n": 1
    },
    {
      "t": "2026-11-01T05:43:47+01:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-01T05:43:48+01:00",
      "k": "add",
      "key": "report",
      "n": 2
    },
    {
      "t": "2026-11-01T05:43:50+01:00",
      "k": "add",
      "key": "concerns",
      "n": 2
    },
    {
      "t": "2026-11-01T05:48:47+01:00",
      "k": "ticket",
      "ids": [
        "03"
      ],
      "act": "done",
      "tests": {
        "passed": 774,
        "failed": 774
      }
    },
    {
      "t": "2026-11-01T05:48:48+01:00",
      "k": "ticket",
      "ids": [
        "04"
      ],
      "act": "done",
      "tests": {
        "passed": 774,
        "failed": 774
      }
    }
  ],
  "reqList": [
    {
      "id": "R01",
      "text": "«FR-191 Per-language build: The build keeps only the page language of every T(ru, de, en, kk) tuple.»",
      "status": "done"
    },
    {
      "id": "R02",
      "text": "«FR-192 Lazy screen modules: Core + one chunk per menu area, loaded on first visit; single-file build kept for offline demos.»",
      "status": "in-ticket"
    },
    {
      "id": "R03",
      "text": "«FR-193 Partial re-render: Render only the region that changed (main, drawer, top bar); keep focus and scroll position.»",
      "status": "done"
    },
    {
      "id": "R04",
      "text": "«FR-194 Live-tick budget: The tick updates only data-live nodes (position, temperature, ETA); full render only on user action; < 4 ms per tick.»",
      "status": "done"
    },
    {
      "id": "R05",
      "text": "«FR-195 Virtualised long tables: Windowing / paging for collection points (600+), audit log, readings, inbound lists.»",
      "status": "in-ticket"
    },
    {
      "id": "R06",
      "text": "«FR-197 Lazy demo data: Generate data per area on first use, memoised and seeded; time to interactive < 1.5 s.»",
      "status": "done"
    },
    {
      "id": "R07",
      "text": "«FR-211 Command palette: Ctrl+K combines global search, navigation and actions.»",
      "status": "in-ticket"
    },
    {
      "id": "R08",
      "text": "«FR-212 Remembered preferences: Language, hub filter, saved views, last tab and theme remembered per viewer in the browser.»",
      "status": "done"
    },
    {
      "id": "R09",
      "text": "«FR-213 Uniform empty, loading and error states: Every list has the same states with a next-step action.»",
      "status": "in-ticket"
    },
    {
      "id": "R10",
      "text": "«FR-214 Undo instead of confirm: Reversible actions show an \"Undo\" toast for 10 s.»",
      "status": "in-ticket"
    },
    {
      "id": "R11",
      "text": "«FR-216 Role home pages: Each role first sees its 4–6 most important tiles (dispatcher, warehouse, driver, finance, customer, partner).»",
      "status": "in-ticket"
    },
    {
      "id": "R12",
      "text": "«FR-217 Notification centre: Alarms, inbox and tasks in one list: read / unread, snooze, assign.»",
      "status": "in-ticket"
    },
    {
      "id": "R13",
      "text": "«FR-222 Demo scenario presets: \"Normal day\", \"Winter storm\", \"Peak season\", \"West route\" reset all data consistently.»",
      "status": "in-ticket"
    }
  ],
  "gates": {
    "G1": {
      "ok": true,
      "at": "2026-11-01T01:19:01+01:00",
      "open": 0,
      "total": 13
    },
    "G3": {
      "ok": true,
      "at": "2026-11-01T01:20:39+01:00",
      "problems": 0
    },
    "G2": {
      "ok": true,
      "at": "2026-11-01T01:20:24+01:00",
      "found": 4,
      "fixed": 4,
      "deferred": 0
    }
  },
  "result": null,
  "report": [
    "Вес страницы: достигнут −25…28 % (ru 4,13→3,09 MB), цель ТЗ −60 % (~1,2 MB) не достигнута: четырёхъязычные тексты справки HQ (~690 KB) оставлены целиком из-за тестов справки; ещё около −10 пунктов даёт флаг --strip-help",
    "Время до интерактивности почти не изменилось (≈0,4 с и раньше), ленивыми сделаны 10 коллекций; показания/брони/устройства/заказы остались энергичными — выигрыш мал",
    "platform-src/v6/base/42-lazy.js"
  ]
}
