#!/usr/bin/env bash
# Build a self-contained, checksummed delivery package for the verified
# university catalogue + 13-month coverage work.
#
#   ./scripts/verified-catalogue/build-delivery-package.sh
#
# Output: delivery/verified-catalogue-<date>/ + .zip + .zip.sha256
# The package never contains credentials, .env files, node_modules or the
# SQLite scratch database.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${1:-$(date -u +%Y-%m-%d)}"
OUT="$ROOT/delivery/verified-catalogue-$STAMP"
PKG="verified-catalogue-$STAMP"

rm -rf "$OUT"
mkdir -p "$OUT"/{source/lib,source/scripts,source/api,source/prisma,data,reports,docs}

cd "$ROOT"

# ---- source -----------------------------------------------------------------
cp src/lib/verified-catalogue/*.ts "$OUT/source/lib/"
cp scripts/verified-catalogue/*.ts scripts/verified-catalogue/*.sh "$OUT/source/scripts/"
cp -r src/app/api/university-catalogue "$OUT/source/api/"
cp prisma/migrations/20261029120000_verified_catalogue_monthly_coverage/migration.sql "$OUT/source/prisma/"
cp tsconfig.verified-catalogue-check.json "$OUT/source/"

# ---- data -------------------------------------------------------------------
cp data/verified-2027/dataset.json data/verified-2027/README.md "$OUT/data/"

# ---- reports ----------------------------------------------------------------
cp -r reports/verified-catalogue/. "$OUT/reports/" 2>/dev/null || true

# ---- docs -------------------------------------------------------------------
cp docs/VERIFIED-CATALOGUE-2027.md "$OUT/docs/" 2>/dev/null || true
cp ALO_VERIFIED_CATALOGUE_DELIVERY_2026-10-29.md "$OUT/" 2>/dev/null || true

# ---- manifest ---------------------------------------------------------------
python3 - "$OUT" "$PKG" <<'PY'
import hashlib, json, os, sys
out, pkg = sys.argv[1], sys.argv[2]
files = []
for base, _dirs, names in os.walk(out):
    for name in sorted(names):
        path = os.path.join(base, name)
        rel = os.path.relpath(path, out)
        if rel.startswith('SHA256SUMS') or rel.endswith('.zip') or rel.endswith('.zip.sha256'):
            continue
        digest = hashlib.sha256(open(path, 'rb').read()).hexdigest()
        files.append({'path': rel, 'bytes': os.path.getsize(path), 'sha256': digest})
manifest = {'package': pkg, 'fileCount': len(files), 'totalBytes': sum(f['bytes'] for f in files), 'files': files}
open(os.path.join(out, 'MANIFEST.json'), 'w').write(json.dumps(manifest, indent=2) + '\n')
with open(os.path.join(out, 'SHA256SUMS'), 'w') as handle:
    for f in files:
        handle.write(f"{f['sha256']}  {f['path']}\n")
print(f"{len(files)} files, {manifest['totalBytes']} bytes")
PY

# ---- zip + integrity --------------------------------------------------------
cd "$ROOT/delivery"
rm -f "$PKG.zip" "$PKG.zip.sha256"
zip -qr "$PKG.zip" "$PKG" -x '*.DS_Store'
sha256sum "$PKG.zip" > "$PKG.zip.sha256"
(cd "$ROOT/delivery" && sha256sum -c "$PKG.zip.sha256")
echo "Package: $ROOT/delivery/$PKG.zip"
cat "$ROOT/delivery/$PKG.zip.sha256"
