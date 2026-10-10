#!/usr/bin/env bash
# DEPLOYMENT OWNERSHIP QUARANTINE — no environment override is supported.
# GitHub Actions is CI-only; main eligibility never authorizes this legacy path.
_alo_branch="$(git -C "$(dirname "$0")" branch --show-current 2>/dev/null)" || _alo_branch=""
if [ "$_alo_branch" != "main" ]; then
  echo "BLOCKED: production operations require the main branch; current branch is unauthorized or unknown." >&2
  exit 1
fi
echo "DISABLED: legacy deployment/recovery is not an approved Hostinger production mechanism. No changes performed." >&2
exit 1
# Historical implementation below is unreachable; preserved as audit evidence.
# ALO Education — safe exact-commit rollback
#
# Usage:
#   sudo PRODUCTION_APP_DIR=/root/alo-github-main bash scripts/rollback.sh <40-char-good-sha>
#
# The deployment workflow records .deploy-prev-commit. If no SHA is supplied,
# this script uses that file. It never resets the database, runs migrations,
# deletes uploads, or replaces .env/storage/uploads.
set -Eeuo pipefail

APP_DIR="${PRODUCTION_APP_DIR:-/root/alo-github-main}"
PM2_NAME="${PM2_NAME:-alo-education}"
APP_PORT="${APP_PORT:-3044}"
TARGET_SHA="${1:-}"

fail() { echo "[rollback][ERROR] $*" >&2; exit 1; }

[[ -d "$APP_DIR/.git" ]] || fail "Git checkout not found: $APP_DIR"
cd "$APP_DIR"

if [[ -z "$TARGET_SHA" ]]; then
  [[ -f .deploy-prev-commit ]] || fail "No SHA supplied and .deploy-prev-commit is missing"
  TARGET_SHA="$(cat .deploy-prev-commit)"
fi
[[ "$TARGET_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "Rollback target must be a 40-character lowercase commit SHA"
git cat-file -e "$TARGET_SHA^{commit}" 2>/dev/null || fail "Commit is not available locally: $TARGET_SHA"

CURRENT_SHA="$(git rev-parse HEAD)"
echo "Rolling back $PM2_NAME from $CURRENT_SHA to $TARGET_SHA"
[[ -f .env ]] || fail ".env is missing; refusing to continue"

# Preserve VPS-only files: checkout only tracked code, never git clean/reset -fdx.
git checkout --force "$TARGET_SHA"
npm ci
npx prisma generate
NODE_OPTIONS="--max-old-space-size=4096" npm run build
test -f .next/standalone/server.js || fail "Standalone server.js missing after rollback build"

if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  PORT="$APP_PORT" HOSTNAME=0.0.0.0 NODE_ENV=production pm2 start ecosystem.config.cjs --name "$PM2_NAME" --env production
fi
pm2 save

for _ in $(seq 1 30); do
  if curl -fsS --max-time 5 "http://127.0.0.1:$APP_PORT/api/health" | grep -q '"status":"ok"'; then
    echo "[rollback] PASS: $TARGET_SHA is serving on $APP_PORT"
    exit 0
  fi
  sleep 2
done

pm2 logs "$PM2_NAME" --lines 100 --nostream || true
fail "Rollback health check failed on port $APP_PORT"
