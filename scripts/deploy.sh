#!/bin/bash
# ALO Education — Production Deployment Script (Node.js standalone)
# Deprecated: Use GitHub Actions .github/workflows/deploy-production.yml for production.
# This script is for manual VPS deployment via SSH if GitHub Actions is unavailable.
# Target: /root/alo-github-main-new, PORT 3044, HOSTNAME 0.0.0.0

set -euo pipefail

APP_DIR="/root/alo-github-main-new"
PM2_NAME="alo-education"
PORT=3044

echo "═══════════════════════════════════════════"
echo "  ALO Education — Manual VPS Deployment"
echo "═══════════════════════════════════════════"
echo "App Dir: $APP_DIR"
echo "PM2:     $PM2_NAME"
echo "Port:    $PORT"
echo "Note: Prefer GitHub Actions deploy-production.yml"
echo ""

cd "$APP_DIR" || { echo "ERROR: App directory not found"; exit 1; }

if [ -d ".git" ]; then
  echo "[1/7] Fetching latest code (exact SHA)..."
  git fetch origin --prune
  # Checkout exact commit — not git pull origin main (which moves)
  TARGET_SHA=$(git rev-parse origin/main)
  git checkout --force "$TARGET_SHA"
  echo "Checked out $TARGET_SHA"
fi

echo "[2/7] Installing dependencies (npm ci)..."
npm ci

echo "[3/7] Generating Prisma Client..."
npx --yes prisma@6.19.3 generate

echo "[4/7] Building production (standalone)..."
npm run build
test -f .next/standalone/server.js || { echo "ERROR: .next/standalone/server.js missing"; exit 1; }

echo "[5/7] Restarting PM2..."
pm2 describe "$PM2_NAME" >/dev/null 2>&1 && pm2 reload "$PM2_NAME" --update-env || pm2 start ecosystem.config.cjs --env production
pm2 save

echo "[6/7] Verifying PM2..."
pm2 describe "$PM2_NAME" | grep -E "status|script path|cwd|exec cwd" | head -n 20

echo "[7/7] Health check..."
sleep 3
curl -fsS "http://127.0.0.1:$PORT/api/health" 2>&1 | head -n 30 || {
  echo "Health failed — check pm2 logs"
  pm2 logs "$PM2_NAME" --lines 50 2>&1 | tail -n 50
  exit 1
}
echo "✅ Health passed"

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════"
echo "URL:       https://aloeducation.com"
echo "PM2:       pm2 status $PM2_NAME"
echo "Logs:      pm2 logs $PM2_NAME"
echo "Health:    curl http://127.0.0.1:$PORT/api/health"
echo "═══════════════════════════════════════════"
