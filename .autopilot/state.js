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
  "baseCommit": null,
  "startedAt": "2026-11-01T01:07:23+01:00",
  "updatedAt": "2026-11-01T01:20:39+01:00",
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
      "status": "active",
      "startedAt": "2026-11-01T01:20:26+01:00"
    },
    {
      "id": "build",
      "status": "pending"
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
    "done": 0,
    "inTicket": 13,
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
      "status": "pending",
      "retries": 0,
      "repairs": 0
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
      "status": "pending",
      "retries": 0,
      "repairs": 0
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
      "status": "pending",
      "retries": 0,
      "repairs": 0
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
      "status": "pending",
      "retries": 0,
      "repairs": 0
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
  "tests": null,
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
  "concerns": [],
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
    "2026-11-01T01:20:39+01:00"
  ],
  "rev": 17,
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
    }
  ],
  "reqList": [
    {
      "id": "R01",
      "text": "«FR-191 Per-language build: The build keeps only the page language of every T(ru, de, en, kk) tuple.»",
      "status": "in-ticket"
    },
    {
      "id": "R02",
      "text": "«FR-192 Lazy screen modules: Core + one chunk per menu area, loaded on first visit; single-file build kept for offline demos.»",
      "status": "in-ticket"
    },
    {
      "id": "R03",
      "text": "«FR-193 Partial re-render: Render only the region that changed (main, drawer, top bar); keep focus and scroll position.»",
      "status": "in-ticket"
    },
    {
      "id": "R04",
      "text": "«FR-194 Live-tick budget: The tick updates only data-live nodes (position, temperature, ETA); full render only on user action; < 4 ms per tick.»",
      "status": "in-ticket"
    },
    {
      "id": "R05",
      "text": "«FR-195 Virtualised long tables: Windowing / paging for collection points (600+), audit log, readings, inbound lists.»",
      "status": "in-ticket"
    },
    {
      "id": "R06",
      "text": "«FR-197 Lazy demo data: Generate data per area on first use, memoised and seeded; time to interactive < 1.5 s.»",
      "status": "in-ticket"
    },
    {
      "id": "R07",
      "text": "«FR-211 Command palette: Ctrl+K combines global search, navigation and actions.»",
      "status": "in-ticket"
    },
    {
      "id": "R08",
      "text": "«FR-212 Remembered preferences: Language, hub filter, saved views, last tab and theme remembered per viewer in the browser.»",
      "status": "in-ticket"
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
  "result": null
}
