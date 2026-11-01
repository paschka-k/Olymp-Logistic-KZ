# Манифест требований

Источник: `2026-11-01-brief.md`. Строку из этого списка может снять **только пользователь**.

| ID | Из брифа (дословно) | Статус | Основание | Где |
|----|---------------------|--------|-----------|-----|
| R01 | «FR-191 Per-language build: The build keeps only the page language of every `T(ru, de, en, kk)` tuple.» | done | — | spec Истории (метка Rxx) → T02 → 7d024bb |
| R02 | «FR-192 Lazy screen modules: Core + one chunk per menu area, loaded on first visit; single-file build kept for offline demos.» | in-ticket | — | spec Истории (метка Rxx) → T09 |
| R03 | «FR-193 Partial re-render: Render only the region that changed (main, drawer, top bar); keep focus and scroll position.» | done | — | spec Истории (метка Rxx) → T01 → 9584ebb |
| R04 | «FR-194 Live-tick budget: The tick updates only `data-live` nodes (position, temperature, ETA); full render only on user action; < 4 ms per tick.» | done | — | spec Истории (метка Rxx) → T01 → 9584ebb |
| R05 | «FR-195 Virtualised long tables: Windowing / paging for collection points (600+), audit log, readings, inbound lists.» | in-ticket | — | spec Истории (метка Rxx) → T05 |
| R06 | «FR-197 Lazy demo data: Generate data per area on first use, memoised and seeded; time to interactive < 1.5 s.» | done | — | spec Истории (метка Rxx) → T04 → a948667 |
| R07 | «FR-211 Command palette: Ctrl+K combines global search, navigation and actions.» | in-ticket | — | spec Истории (метка Rxx) → T06 |
| R08 | «FR-212 Remembered preferences: Language, hub filter, saved views, last tab and theme remembered per viewer in the browser.» | done | — | spec Истории (метка Rxx) → T03 → ea6fa2d |
| R09 | «FR-213 Uniform empty, loading and error states: Every list has the same states with a next-step action.» | in-ticket | — | spec Истории (метка Rxx) → T03, T08 |
| R10 | «FR-214 Undo instead of confirm: Reversible actions show an "Undo" toast for 10 s.» | in-ticket | — | spec Истории (метка Rxx) → T03, T08 |
| R11 | «FR-216 Role home pages: Each role first sees its 4–6 most important tiles (dispatcher, warehouse, driver, finance, customer, partner).» | in-ticket | — | spec Истории (метка Rxx) → T07 |
| R12 | «FR-217 Notification centre: Alarms, inbox and tasks in one list: read / unread, snooze, assign.» | in-ticket | — | spec Истории (метка Rxx) → T06 |
| R13 | «FR-222 Demo scenario presets: "Normal day", "Winter storm", "Peak season", "West route" reset all data consistently.» | in-ticket | — | spec Истории (метка Rxx) → T07 |
