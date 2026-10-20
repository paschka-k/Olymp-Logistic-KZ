"""Python twin of tools/run-ui-tests.cjs for machines with Python Playwright only (R6).

  python tools/parity-039/run-tests.py http://localhost:8851/platform/tests.html [N]

Prints passed / failed / runtime, the failures and, with N, the N slowest groups (window.__TESTS.times).
Exit code 1 when a test failed.
"""
import sys
import time

from playwright.sync_api import sync_playwright

url = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1500, 'height': 1000})
    pg.on('pageerror', lambda e: print('PAGE ERROR', e))
    t0 = time.time()
    pg.goto(url)
    pg.wait_for_function('() => window.__TESTS && window.__TESTS.done', timeout=1800000, polling=1000)
    r = pg.evaluate('() => window.__TESTS')
    print(f"UI tests: {r['passed']}/{r['total']} passed, {r['failed']} failed, {time.time() - t0:.0f} s")
    for f in r['failures']:
        print('FAIL', f[:600])
    if len(sys.argv) > 2:
        t = r.get('times') or []
        print(f"groups: {len(t)}, sum {sum(x[1] for x in t) / 1000:.1f} s")
        for n, ms in sorted(t, key=lambda x: -x[1])[:int(sys.argv[2])]:
            print(f'{ms:7.0f} ms  {n[:140]}')
    b.close()
    sys.exit(1 if r['failed'] else 0)
