render();
/* FR-198: the performance budget (tools/ci/perf-budget.cjs) reads the start time from this mark */
try { performance.mark('v6-ready'); } catch (_) { /* no Performance API */ }
