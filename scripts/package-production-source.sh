#!/usr/bin/env bash
# ============================================================
# PRODUCTION SOURCE PACKAGE builder (documented Hostinger artifact)
#
# Per HOSTINGER-RUNTIME-STANDARD.md the deployment source of truth
# is the git branch; this zip is the portable hand-over artifact
# for the same content: exactly the files needed to provision,
# build and run the platform from a clean extraction, per the
# documented clean-install procedure.
#
# Output: ALO-EDUCATION-PRODUCTION-SOURCE-<sha8>-<date>.zip
# The zip is deterministic from the CURRENT git HEAD + committed
# working tree (falls back to tracked files at HEAD).
# ============================================================
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
SHA8=$(git rev-parse --short=8 HEAD)
DATE=$(date +%Y%m%d)
OUT="/home/user/ALO-EDUCATION-PRODUCTION-SOURCE-${SHA8}-${DATE}.zip"

# ---- scope (production source of truth) ----
DIRS=(src prisma public scripts tests .github cron)
ROOT_FILES=(
  package.json package-lock.json .npmrc .nvmrc .node-version
  tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs
  eslint.config.mjs vitest.config.ts playwright.config.ts components.json
  server.js vercel.json .gitignore .dockerignore
  Dockerfile docker-compose.yml nginx.conf
  .env.example .env.production.example
)
DOCS=(
  README.md ARCHITECTURE.md DATABASE.md API_DOCUMENTATION.md AI_ARCHITECTURE.md
  CRM_DOCUMENTATION.md DEPLOYMENT.md SECURITY.md TESTING.md worklog.md
  HOSTINGER-RUNTIME-STANDARD.md DEPLOYMENT_ENTRYPOINT_MATRIX.md
  HOSTINGER-DEPLOYMENT-GUIDE.md VIDEO_ECOSYSTEM_AUDIT.md
  FINAL-FILE-INVENTORY.csv
)
# include any FINAL-*.md / EVIDENCE manifests at root
EXTRA_DOCS=$(ls FINAL-*.md 2>/dev/null || true)
SCOPE=("${DIRS[@]}")
for f in "${ROOT_FILES[@]}" "${DOCS[@]}" ${EXTRA_DOCS}; do
  [ -f "$f" ] && SCOPE+=("$f")
done

echo "Packaging ${#SCOPE[@]} pathspecs from $(git rev-parse HEAD)..."
rm -f "$OUT"
# Require a clean tree so the zip is exactly HEAD content (the git branch is
# the deployment source of truth; the zip is the portable mirror of it).
if [ -n "$(git status --porcelain -- "${SCOPE[@]}")" ]; then
  echo "ERROR: working tree has uncommitted changes in scope — commit first." >&2
  git status --porcelain -- "${SCOPE[@]}" | head -20 >&2
  exit 1
fi
git archive --format=zip -o "$OUT" HEAD -- "${SCOPE[@]}"

echo "---- package summary ----"
FILES=$(python3 -c "import zipfile;print(len(zipfile.ZipFile('$OUT').namelist()))")
SIZE=$(du -h "$OUT" | cut -f1)
echo "file: $OUT"
echo "entries: $FILES"
echo "size: $SIZE"
echo "sha256: $(sha256sum "$OUT" | cut -d' ' -f1)"
