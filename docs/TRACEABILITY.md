# Traceability — FR / LH → tab → test

Each implemented FR or LH gets one line: requirement → where it lives in the v6 mock-up → test (suite file, group name). Areas append their own rows.

## W6 Help & i18n

| FR / LH | Requirement | Tab / place | Test (platform-src/tests/c0-help-content.js) |
|---|---|---|---|
| FR-160 | Guided tours in Help (dispatcher day, customer booking, driver delivery, QA deviation + platform introduction); spotlight, Next/Back, Esc, keyboard | Help → "Guided tours"; "▶" in the page header of the tour start screen; "Tour" link in articles (70-tours.js) | `tours: start from the list, spotlight, next / back, last step, Esc ends, keyboard, role without access`; `tours: popover texts follow the page language` (de, en, kk) |
| FR-17 | Keyboard and screen readers: help links, tabs and "?" react to Enter/Space, `aria-label`, focus ring, tour dialog is focusable and labelled | 00-framework.js (keydown handler, `role=button tabindex=0` on help links), app.css help block | `help: search … keyboard on articles`; `tours: …` |
| FR-134 | Navigation as links, skip link, non-colour status cues — described in help; context "?" in the header | Help → "Keyboard, languages, design and links"; header "?" | `context help: "?" opens the article of the current screen / tab` |
| FR-135 / FR-170 | RU/DE/EN complete, KK titles + key articles, KK fallback marker on untranslated bodies | all help files; marker in 00-framework.js | `help: every article has title and purpose …`; `help: texts of all articles … (ru/de/en/kk)`; `help: KK shows the marker …` |
| FR-132 | One source for screen names: article titles carry the old screen numbers in brackets, `screen`/`tab` fields resolve against NAV | 20-ops.js, 25-ops2.js | `help: keys are unique; screen, tab and related keys all resolve` |
| FR-14 / FR-137 | Roles matrix and role descriptions (11 roles) in Help | Help → "Roles and permissions" (10-start.js) | `help: opens from the top bar … roles matrix` (60-foundation.js) |
| FR-175 | Links and history — documented as mock-up limitation | Help → "Keyboard, languages, design and links" | — (documentation only) |
| FR-41 / FR-126 / FR-154 | Express approval described: where to find it, 3 signatures | Help → "Where is express?" (+ diagram `express`) | `help: process diagrams render as SVG …` |
