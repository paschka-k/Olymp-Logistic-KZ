// FR-208 · one screenshot per key screen and project (viewport × colour scheme), compared with tools/ci/visual-baseline/.
// The page clock is paused at the demo's business instant (FR-206 default today), so the header clock, the telemetry
// interval and "Live" stamps cannot move between runs; the version / build line is masked (it changes with every commit).
const { test, expect } = require('@playwright/test');
const SCREENS = ['dashboard', 'orders', 'dispatch', 'routes', 'fleet', 'billing'];
for (const id of SCREENS) {
  test(id, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-18T09:29:00Z') });
    await page.clock.pauseAt(new Date('2026-10-18T09:30:00Z')); // paused before the page loads: no timer ever fires
    await page.goto('/platform/en.html', { waitUntil: 'load' });
    await page.evaluate(s => {
      S.simOn = false;
      go(s);
    }, id);
    await page.evaluate(() => document.fonts.ready.then(() => true));
    await expect(page).toHaveScreenshot(id + '.png', { mask: [page.locator('.ver')] });
  });
}
