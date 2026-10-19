# Olymp Logistic · Kazakhstan

Concept materials for KDL Olymp's in-house distribution logistics in Kazakhstan (KombiMED, Oct 2026).
All pages are self-contained HTML — no build step. All data is simulated.

| File | Content |
|---|---|
| `index.html` | Landing page |
| `platform/` | **Platform mock-up v6 in the Kökzhol brand** — `index.html` (RU), `de.html`, `en.html`, `kk.html`: 12 menu items with tabs, role switch in the top bar, portals and apps one click away in the sidebar (customer / partner portal, driver app, public form, help), hubs Astana · Almaty · Karaganda · Shymkent · **Atyrau-West (cross-dock)**, real manufacturer logos (`platform/assets/`), full help RU/DE/EN (KK titles + core articles), all functions of the source platform `Olymp-Logistic-Platform` v0.3.9 ported (workstreams W1–W6, see `docs/INTEGRATION-PLAN.md`, `docs/TRACEABILITY.md`). Version block in the sidebar is bumped on every push. **Generated** from `platform-src/v6/` by `node platform-src/build-v6.mjs`; CI rebuilds on push. Browser-only mock-up, fictitious data |
| `platform/tests.html` | v6 test suite (17 files, 136 scenario groups, 4 languages) — `node platform-src/build-v6.mjs` assembles it from `platform-src/tests/`; CI runs it with Playwright |
| `platform/legacy/` | Latest online demo of the source platform `Olymp-Logistic-Platform` (updated by its `scripts/publish_preview.sh`) |
| `releases/<version>/` | **Frozen releases** of the source platform (e.g. `releases/0.3.9/` = state of 16.10.2026) — listed in `releases/releases.json` |
| `versions.html` | **Version chooser**: current v6 preview, frozen platform releases, earlier mock-ups (DE · RU · EN) |
| `platform-v5.3.html` (+ `-de`, `-en`) | Platform mock-up **v5.3** — v5 + new screen 17 "Goods receipt" (hub inbound list, ramp windows, dwell clock, Standgeld → Costs, gate cold-chain check). **Generated** from `platform-src/` (`node platform-src/build.mjs`, see `platform-src/README.md`); CI rebuilds it on push |
| `platform-v5.html` (+ `-de`, `-en`) | Platform mock-up v5 — 17 screens, real 4-vehicle fleet, new "Costs" screen, driver app RU/KZ/DE/EN (FR-52…70), 19 manufacturers with logo badges, FR-35…51 implemented |
| `platform-v4.html` (+ `-de`, `-en`) | Platform mock-up v4 — 16 screens incl. "Baseline data" (question catalogue validation, rings, volumes, target fleet, express approval, launch path, FR-35…51) |
| `platform-v3.html` (+ `-de`, `-en`) | Platform mock-up v3 — 15 screens |
| `tests.html` | 493 automated UI/data tests + change requests FR-01…51 (runs against v5) |
| `platform-v2.html` | Platform mock-up v2 — 12 screens, alarm simulation |
| `workflow.html` | Project & operational process workflow |
| `platform-v1.html` | Platform mock-up v1 |

## Update GitHub Pages (no expiring links)
1. Download the site zip from the chat and save it in `C:\_Projects` (e.g. `C:\_Projects\github-pages.zip`).
2. PowerShell:
   ```powershell
   cd C:\_Projects
   Expand-Archive -Force .\github-pages.zip .\_olymp_site_tmp
   powershell -ExecutionPolicy Bypass -File (Get-ChildItem .\_olymp_site_tmp -Recurse -Filter update-from-zip.ps1 | Select-Object -First 1).FullName
   ```
   Copies into `C:\_Projects\Olymp-Logistic-KZ`, commits, pushes; CI runs `tests.html` (timeout 30 min).

## Hosting: dev2.kombi-med.com (password-protected)
Same server, key and pattern as `KombiMED_Site_2026` (nginx vhost, Let's Encrypt, noindex, GitHub Actions rsync).

### One-time
1. **DNS:** A record `dev2.kombi-med.com → 167.233.237.203`.
2. **Server setup from Windows** (key `%USERPROFILE%\.ssh\kombimed_deploy_key`, as for dev.kombi-med.com):
   ```powershell
   cd <unzipped folder>
   powershell -ExecutionPolicy Bypass -File .\deploy\deploy-from-windows.ps1 -Setup -User olymp
   ```
   Creates `/srv/olymp-kz/site`, asks for the password (Basic Auth), gets the certificate, installs the vhost.
3. **GitHub repo** `paschka-k/Olymp-Logistic-KZ` (private), branches `main` + `dev`.
   Secrets `SSH_KEY`, `SSH_KNOWN_HOSTS` — same values as in `KombiMED_Site_2026`.

### Updates
- Push to `dev` → `.github/workflows/deploy-dev2.yml` uploads and checks for 401.
- Or without GitHub: `powershell -ExecutionPolicy Bypass -File .\deploy\deploy-from-windows.ps1`

### Remove
```bash
rm -f /etc/nginx/sites-enabled/dev2.kombi-med.com && systemctl reload nginx
rm -rf /srv/olymp-kz /etc/nginx/.htpasswd-olymp-kz
```
