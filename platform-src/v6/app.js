bindActions(); // FR-202: audit rules of the named actions wrap their handlers once every screen has registered its ACT entries
S.schemaProblems = schemaCheck(); // FR-202: typed state model, checked at startup (tests assert the list is empty)
if (S.schemaProblems.length) console.error('state schema:', S.schemaProblems.slice(0, 10));
if (typeof a11yInstall === 'function') a11yInstall();   // FR-215 / FR-218: outermost render wrapper (screens/002-a11y.js)
render();
/* FR-198: the performance budget (tools/ci/perf-budget.cjs) reads the start time from this mark */
try { performance.mark('v6-ready'); } catch (_) { /* no Performance API */ }
