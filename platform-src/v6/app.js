if (typeof a11yInstall === 'function') a11yInstall();   // FR-215 / FR-218: outermost render wrapper (screens/002-a11y.js)
render();
/* FR-198: the performance budget (tools/ci/perf-budget.cjs) reads the start time from this mark */
try { performance.mark('v6-ready'); } catch (_) { /* no Performance API */ }
