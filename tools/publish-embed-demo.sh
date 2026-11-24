#!/usr/bin/env bash
# Publishes the built customer-portal demo to the neutral GitHub Pages repo paschka-k/kz-demo, which the Kökzhol marketing site
# embeds (assets/kz-preview.js, ?embed=customer). Public Kökzhol material never names the group companies, so the published copy
# lives under a neutral repo name and URL (https://paschka-k.github.io/kz-demo/), carries noindex, and its commits use the GitHub
# noreply address instead of the author's mail. Only the language pages, the service worker and assets/ are copied (no tests, no legacy).
# Usage: bash tools/publish-embed-demo.sh [git-ref]     (default origin/main, after CI committed "build: regenerate …")
set -euo pipefail
REF="${1:-origin/main}"
DEST_REPO="${KZ_DEMO_REPO:-paschka-k/kz-demo}"
NAME="${KZ_DEMO_NAME:-paschka-k}"
MAIL="${KZ_DEMO_MAIL:-66836251+paschka-k@users.noreply.github.com}"
ROOT="$(git rev-parse --show-toplevel)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

git -C "$ROOT" fetch -q origin
SRC_SHA="$(git -C "$ROOT" rev-parse --short "$REF")"
mkdir -p "$WORK/out"
git -C "$ROOT" archive "$REF" platform/index.html platform/en.html platform/de.html platform/kk.html platform/sw.js platform/assets \
  | tar -x -C "$WORK/out" --strip-components=1

# noindex: the page is an iframe target, not content to rank; its script source still carries internal names
for f in "$WORK"/out/{index,en,de,kk}.html; do
  grep -q 'name="robots"' "$f" || sed -i '0,/<meta charset="utf-8">/s//<meta charset="utf-8">\n<meta name="robots" content="noindex,nofollow">/' "$f"
done
touch "$WORK/out/.nojekyll"
cat > "$WORK/out/README.md" <<'EOF'
# Kökzhol · customer portal demo

Static build of the Kökzhol customer portal demo, embedded by the Kökzhol website as a preview
(`?embed=customer`). Simulated data only. Generated — do not edit here.
EOF

# the published copy must not show a banned name anywhere a person or crawler reads without running the scripts
if grep -RIl -i -E 'olymp|kombimed' "$WORK/out/README.md" "$WORK/out/assets" >/dev/null 2>&1; then
  echo "banned name in README or assets:"; grep -RIl -i -E 'olymp|kombimed' "$WORK/out/README.md" "$WORK/out/assets"; exit 1
fi
for f in "$WORK"/out/{index,en,de,kk}.html; do
  head -c 4000 "$f" | grep -i -q -E 'olymp|kombimed' && { echo "banned name in the <head> of $f"; exit 1; }
done

git clone -q "https://github.com/$DEST_REPO.git" "$WORK/repo"
find "$WORK/repo" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$WORK/out/." "$WORK/repo/"
cd "$WORK/repo"
git add -A
if git diff --cached --quiet; then echo "kz-demo already up to date ($SRC_SHA)"; exit 0; fi
git -c user.name="$NAME" -c user.email="$MAIL" commit -q -m "Publish demo build $SRC_SHA"
git branch -M main
git push -q origin main
echo "published $SRC_SHA to https://github.com/$DEST_REPO -> https://${DEST_REPO%%/*}.github.io/${DEST_REPO#*/}/"
