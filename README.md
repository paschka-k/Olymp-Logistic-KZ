# Olymp Logistic · Kazakhstan

Concept materials for KDL Olymp's in-house distribution logistics in Kazakhstan (KombiMED, Oct 2026).
All pages are self-contained HTML — no build step. All data is simulated.

| File | Content |
|---|---|
| `index.html` | Landing page |
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
