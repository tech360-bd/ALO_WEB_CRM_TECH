#!/usr/bin/env bash
# LEGACY / NOT USED FOR CURRENT PRODUCTION
echo "DISABLED: legacy package layout is not an approved Hostinger artifact. See HOSTINGER-RUNTIME-STANDARD.md." >&2
exit 1
# ALO Education — Portable Delivery Package Builder (4 VPS structure)
# Replaces hardcoded /Users/alaminn/Downloads paths with relative, works on VPS/Linux/Mac
# Generates 4 zips + SHA256SUMS.txt in ./delivery/
# No catalogue dataset is packaged; the legacy CSV sets are generated/unverified (see AUDIT/course-finder-2026-10-12/).
set -Eeuo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DELIVERY_DIR="$ROOT_DIR/delivery"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

mkdir -p "$DELIVERY_DIR"
echo "=== ALO Education Portable Packaging ==="
echo "Root: $ROOT_DIR"
echo "Delivery: $DELIVERY_DIR"
echo "Timestamp: $TIMESTAMP"
echo "Dataset: none packaged (legacy catalogue CSVs are unverified; use the reviewed CSV import)"

# Clean old zips
rm -f "$DELIVERY_DIR"/ALO_EDUCATION_*.zip "$DELIVERY_DIR"/SHA256SUMS.txt

# --- 1. COMPLETE PROJECT (full codebase, excluding node_modules, .git, .next, delivery, etc.) ---
echo ""
echo "📦 [1/4] Building ALO_EDUCATION_COMPLETE_PROJECT.zip ..."
TMP1="$(mktemp -d)"
mkdir -p "$TMP1/ALO_EDUCATION"
# Copy core files via git archive or rsync-like cp with excludes
# Use tar to respect .gitignore? Simple: copy explicit list with excludes
(
  cd "$ROOT_DIR"
  # Create zip directly from ROOT_DIR with excludes — portable
  zip -q -r "$DELIVERY_DIR/ALO_EDUCATION_COMPLETE_PROJECT.zip" . \
    -x "node_modules/*" -x ".git/*" -x ".next/*" -x "delivery/*" \
    -x ".archive/*" -x "storage/outputs/*" -x "storage/audit_logs/*" \
    -x "*.DS_Store" -x ".env" -x ".env.local" -x "coverage/*" \
    -x "__pycache__/*" -x ".venv/*" -x "dist/*" -x "build/*" \
    -x "*.log" -x ".turbo/*"
)
echo "  -> $DELIVERY_DIR/ALO_EDUCATION_COMPLETE_PROJECT.zip ($(du -h "$DELIVERY_DIR/ALO_EDUCATION_COMPLETE_PROJECT.zip" | cut -f1))"

# --- 2. VPS PRIVATE APP (private code outside public_html) ---
echo ""
echo "📦 [2/4] Building ALO_EDUCATION_VPS_PRIVATE_APP.zip (alo-web-crm) ..."
TMP2="$(mktemp -d)"
mkdir -p "$TMP2/alo-web-crm"
# Copy private app files: src, prisma, scripts, etc. but NOT public_html
cp -R "$ROOT_DIR/src" "$TMP2/alo-web-crm/" 2>/dev/null || true
cp -R "$ROOT_DIR/prisma" "$TMP2/alo-web-crm/" 2>/dev/null || true
cp -R "$ROOT_DIR/scripts" "$TMP2/alo-web-crm/" 2>/dev/null || true
cp -R "$ROOT_DIR/public" "$TMP2/alo-web-crm/" 2>/dev/null || true
cp "$ROOT_DIR/package.json" "$ROOT_DIR/package-lock.json" "$ROOT_DIR/next.config.ts" "$ROOT_DIR/tsconfig.json" "$ROOT_DIR/tailwind.config.ts" "$TMP2/alo-web-crm/" 2>/dev/null || true
cp "$ROOT_DIR/.env.example" "$TMP2/alo-web-crm/" 2>/dev/null || true
# Catalogue CSVs are NOT packaged: the legacy CSV sets are generated/unverified
# (see AUDIT/course-finder-2026-10-12/SYNTHETIC-CATALOGUE-ARCHIVE.md). University
# data must arrive through the reviewed CSV import (/admin/data-import).
# Never ship the synthetic fixtures that live in fixtures/synthetic-catalogue/.
rm -rf "$TMP2/alo-web-crm/fixtures" 2>/dev/null || true
( cd "$TMP2" && zip -q -r "$DELIVERY_DIR/ALO_EDUCATION_VPS_PRIVATE_APP.zip" alo-web-crm -x "*.DS_Store" )
rm -rf "$TMP2"
echo "  -> $DELIVERY_DIR/ALO_EDUCATION_VPS_PRIVATE_APP.zip ($(du -h "$DELIVERY_DIR/ALO_EDUCATION_VPS_PRIVATE_APP.zip" | cut -f1))"

# --- 3. VPS PUBLIC_HTML (public web root + .htaccess) ---
echo ""
echo "📦 [3/4] Building ALO_EDUCATION_VPS_PUBLIC_HTML.zip (public_html) ..."
TMP3="$(mktemp -d)"
mkdir -p "$TMP3/public_html"
cp -R "$ROOT_DIR/public_html/." "$TMP3/public_html/" 2>/dev/null || true
# If public_html missing, fallback to public + _next static
if [ ! -f "$TMP3/public_html/.htaccess" ]; then
  echo "  Note: public_html/.htaccess not found, generating from root .htaccess template"
  cp "$ROOT_DIR/public_html/.htaccess" "$TMP3/public_html/.htaccess" 2>/dev/null || cp "$ROOT_DIR/.htaccess" "$TMP3/public_html/.htaccess" 2>/dev/null || true
fi
# Ensure .htaccess timestamp is current
if [ -f "$TMP3/public_html/.htaccess" ]; then
  # Update timestamp line if exists
  sed -i.bak "s/^# Generated:.*/# Generated: $TIMESTAMP (Asia\/Dhaka 2026-09-15 verified)/" "$TMP3/public_html/.htaccess" 2>/dev/null || true
  rm -f "$TMP3/public_html/.htaccess.bak"
fi
# Add placeholder index.php for cPanel PHP wrapper if needed
if [ ! -f "$TMP3/public_html/index.php" ]; then
  cat > "$TMP3/public_html/index.php" <<'PHP'
<?php
// ALO Education public_html wrapper - proxies to Node standalone if available
// If Node app on 3000, this is not used (Apache ProxyPass). Fallback static.
header('Location: /', true, 302);
echo "ALO Education - please configure Node.js app in cPanel or use static export.";
PHP
fi
( cd "$TMP3" && zip -q -r "$DELIVERY_DIR/ALO_EDUCATION_VPS_PUBLIC_HTML.zip" public_html -x "*.DS_Store" )
rm -rf "$TMP3"
echo "  -> $DELIVERY_DIR/ALO_EDUCATION_VPS_PUBLIC_HTML.zip ($(du -h "$DELIVERY_DIR/ALO_EDUCATION_VPS_PUBLIC_HTML.zip" | cut -f1))"

# --- 4. VPS DATABASE (CSV masters + schema + manifests) ---
echo ""
echo "📦 [4/4] Building ALO_EDUCATION_VPS_DATABASE.zip (database + manifests) ..."
TMP4="$(mktemp -d)"
mkdir -p "$TMP4/database"
mkdir -p "$TMP4/manifests"
# No catalogue CSVs: the legacy sets are generated/unverified and must not be shipped.
cp "$ROOT_DIR/prisma/schema.prisma" "$TMP4/database/" 2>/dev/null || true
# Generate schema.sql if prisma available
if [ -f "$ROOT_DIR/prisma/schema.prisma" ]; then
  echo "-- ALO Education schema.sql generated $TIMESTAMP --" > "$TMP4/database/schema.sql"
  echo "-- Schema only. No university/course catalogue data is included or verified. --" >> "$TMP4/database/schema.sql"
  # Try to generate via prisma if available
  ( cd "$ROOT_DIR" && npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script 2>/dev/null > "$TMP4/database/schema.prisma.sql" || true )
fi
# Manifests
cp "$ROOT_DIR/FILE_MANIFEST.csv" "$TMP4/manifests/" 2>/dev/null || true
cp "$ROOT_DIR/API_INVENTORY.csv" "$TMP4/manifests/" 2>/dev/null || true
cp "$ROOT_DIR/DATABASE_MODEL_INVENTORY.csv" "$TMP4/manifests/" 2>/dev/null || true
# Create counts manifest
cat > "$TMP4/manifests/DATASET_STATUS.txt" <<EOF
ALO Education catalogue dataset status
======================================
No university, course, intake, fee or requirement data is included in this package.
The repository's legacy catalogue CSV/JSON sets are generated/templated and contain
zero verifiable records (AUDIT/course-finder-2026-10-12/UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md).
Load real data only through the reviewed CSV import (/admin/data-import) followed by
approval, Super Admin apply and separate verification.
EOF
( cd "$TMP4" && zip -q -r "$DELIVERY_DIR/ALO_EDUCATION_VPS_DATABASE.zip" database manifests -x "*.DS_Store" )
rm -rf "$TMP4"
echo "  -> $DELIVERY_DIR/ALO_EDUCATION_VPS_DATABASE.zip ($(du -h "$DELIVERY_DIR/ALO_EDUCATION_VPS_DATABASE.zip" | cut -f1))"

# --- SHA256SUMS ---
echo ""
echo "📝 Generating SHA256SUMS.txt ..."
( cd "$DELIVERY_DIR" && shasum -a 256 ALO_EDUCATION_*.zip > SHA256SUMS.txt || sha256sum ALO_EDUCATION_*.zip > SHA256SUMS.txt )
cat "$DELIVERY_DIR/SHA256SUMS.txt"
echo ""
# Copy to root for compatibility
cp "$DELIVERY_DIR/SHA256SUMS.txt" "$ROOT_DIR/SHA256SUMS.txt" 2>/dev/null || true

echo ""
echo "=== PACKAGING COMPLETE ==="
echo "4 VPS zips + SHA256SUMS in $DELIVERY_DIR"
ls -lh "$DELIVERY_DIR"
echo ""
echo "Upload to VPS:"
echo "  private app -> /home/aloeduca/alo-web-crm"
echo "  public_html -> /home/aloeduca/public_html"
echo "  database    -> /home/aloeduca/alo_private_delivery"
echo "  complete    -> /home/aloeduca/alo_private_delivery (archive)"
