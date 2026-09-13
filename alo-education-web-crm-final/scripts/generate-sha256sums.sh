#!/usr/bin/env bash
# Generate SHA256SUMS.txt for all deliverable files
set -Eeuo pipefail
cd /home/z/my-project

OUT=SHA256SUMS.txt
TMP=$(mktemp)

{
  echo "# ALO Education ERP — SHA256 checksums"
  echo "# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "# Format: <sha256>  <relative-path>"
  echo ""
} > "$OUT"

# Compute checksums for all deliverable files (excluding node_modules, .next, etc.)
find . \
  -path './node_modules' -prune -o \
  -path './.next' -prune -o \
  -path './.git' -prune -o \
  -path './remediation-baseline-*' -prune -o \
  -path './remediation-work/backups' -prune -o \
  -path './skills' -prune -o \
  -path './upload' -prune -o \
  -path './db' -prune -o \
  -path './tool-results' -prune -o \
  -path './agent-ctx' -prune -o \
  -path './.zscripts' -prune -o \
  -path './mini-services' -prune -o \
  -type f \
  \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' \
     -o -name '*.json' -o -name '*.md' -o -name '*.csv' \
     -o -name '*.prisma' -o -name '*.sql' -o -name '*.sh' \
     -o -name '*.service' -o -name 'Caddyfile' \
     -o -name '.env.example' -o -name '.gitignore' \
     -o -name 'tsconfig.json' -o -name 'package.json' -o -name 'package-lock.json' \
     -o -name 'next.config.ts' -o -name 'eslint.config.mjs' \
     -o -name 'postcss.config.mjs' -o -name 'tailwind.config.ts' \
     -o -name 'components.json' -o -name 'Caddyfile' \) \
  -print0 2>/dev/null \
  | xargs -0 sha256sum 2>/dev/null \
  | sed 's| \./|  |' \
  >> "$OUT"

# Also include the download/ CSVs and key markdown
echo "" >> "$OUT"
echo "# Deliverable CSVs and key markdown in download/" >> "$OUT"
for f in download/DATABASE-INVENTORY.csv download/ROUTE-INVENTORY.csv \
         download/API-INVENTORY.csv download/ENVIRONMENT-VARIABLE-INVENTORY.csv \
         download/MIGRATION-INVENTORY.csv; do
  if [[ -f "$f" ]]; then
    sha256sum "$f" | sed 's| \./|  |' >> "$OUT"
  fi
done

echo "Generated $OUT"
wc -l "$OUT"
