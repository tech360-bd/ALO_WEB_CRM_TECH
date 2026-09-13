#!/usr/bin/env bash
# Final complete packaging script for ALO Education deliverables
set -Eeuo pipefail

WORKSPACE_DIR="/Users/alaminn/Downloads/workspace-39fb1a01-5f16-4a6f-ab7d-88429dec6466 (9)"
DOWNLOADS_DIR="/Users/alaminn/Downloads"

echo "=== PACKAGING ALO EDUCATION COMPLETE DEVELOPMENT PROJECT ZIP ==="

cd "$WORKSPACE_DIR"

# Master Project Root Packaging
rm -f "$DOWNLOADS_DIR/ALO_EDUCATION_COMPLETE_PROJECT.zip"
rm -rf /tmp/ALO_EDUCATION
mkdir -p /tmp/ALO_EDUCATION

echo "📋 Copying project files under ALO_EDUCATION root folder..."
cp -R src public prisma scripts tests \
  package.json package-lock.json next.config.ts tsconfig.json tailwind.config.ts \
  postcss.config.mjs components.json eslint.config.mjs vitest.config.ts \
  playwright.config.ts .env.example .gitignore README.md DEPLOYMENT-GUIDE.md \
  SUPER_ADMIN_USER_GUIDE.md STUDENT_PORTAL_USER_GUIDE.md PARTNER_PORTAL_USER_GUIDE.md \
  COUNSELOR_USER_GUIDE.md FINANCE_USER_GUIDE.md HR_MANAGER_USER_GUIDE.md \
  MARKETING_MANAGER_USER_GUIDE.md VISA_OFFICER_USER_GUIDE.md \
  SECURITY_GUIDE.md SECURITY-AUDIT.md TROUBLESHOOTING_GUIDE.md Caddyfile \
  PRE_VERIFICATION_SNAPSHOT.md FILE_MANIFEST.csv API_INVENTORY.csv PAGE_ROUTE_INVENTORY.csv \
  DATABASE_MODEL_INVENTORY.csv TEST_INVENTORY.csv ENVIRONMENT_VARIABLE_INVENTORY.csv \
  PROVIDER_INTEGRATION_MATRIX.csv PERMISSION_INVENTORY.csv FINAL-AUDIT-REPORT.md \
  deploy docs storage /tmp/ALO_EDUCATION/

echo "📦 Packaging ALO_EDUCATION_COMPLETE_PROJECT.zip..."
cd /tmp
zip -q -r "$DOWNLOADS_DIR/ALO_EDUCATION_COMPLETE_PROJECT.zip" ALO_EDUCATION \
  -x "ALO_EDUCATION/storage/outputs/*" -x "ALO_EDUCATION/storage/audit_logs/*"
rm -rf /tmp/ALO_EDUCATION

# Calculate SHA256 for the single final ZIP only
echo "📝 Calculating SHA256 checksum..."
cd "$DOWNLOADS_DIR"
shasum -a 256 ALO_EDUCATION_COMPLETE_PROJECT.zip > "$WORKSPACE_DIR/SHA256SUMS.txt"
cp "$WORKSPACE_DIR/SHA256SUMS.txt" "$DOWNLOADS_DIR/SHA256SUMS.txt"

echo "=== PACKAGING COMPLETE ==="
cat "$WORKSPACE_DIR/SHA256SUMS.txt"
