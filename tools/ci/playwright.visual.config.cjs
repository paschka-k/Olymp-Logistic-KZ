// FR-208 · visual regression of key v6 screens at 1440 / 768 / 375 px, light and dark (prefers-color-scheme).
//   tools/ci/node_modules/.bin/playwright test -c tools/ci/playwright.visual.config.cjs [--update-snapshots=all]
// Baselines live in tools/ci/visual-baseline/<project>/<screen>.png. They must come from the CI runner (fonts and
// anti-aliasing differ per OS): the UI-tests workflow writes them when none are committed, or on workflow_dispatch with
// update_visual = true, and uploads them as the artifact "visual-baseline" to commit.
const path = require('path');
const { defineConfig } = require('@playwright/test');
const root = path.resolve(__dirname, '..', '..');
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, tablet: { width: 768, height: 1024 }, mobile: { width: 375, height: 812 } };
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: 'visual.spec.cjs',
  snapshotPathTemplate: '{testDir}/visual-baseline/{projectName}/{arg}{ext}',
  outputDir: path.join(root, 'visual-results', 'output'),
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  timeout: 60000,
  reporter: [['list'], ['html', { outputFolder: path.join(root, 'visual-results', 'report'), open: 'never' }]],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, threshold: 0.2, animations: 'disabled', caret: 'hide', scale: 'css' } },
  use: { baseURL: 'http://localhost:8090', deviceScaleFactor: 1, locale: 'en-GB', timezoneId: 'Asia/Aqtobe' },
  webServer: { command: 'python3 -m http.server 8090', cwd: root, url: 'http://localhost:8090/platform/en.html', reuseExistingServer: true, timeout: 30000 },
  projects: Object.entries(VIEWPORTS).flatMap(([name, viewport]) =>
    ['light', 'dark'].map(colorScheme => ({ name: `${name}-${viewport.width}-${colorScheme}`, use: { viewport, colorScheme } })),
  ),
});
