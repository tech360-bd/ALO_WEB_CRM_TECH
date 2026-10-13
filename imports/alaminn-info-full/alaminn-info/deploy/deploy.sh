#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Alaminn.info — redeploy script
# Target: Ubuntu 22.04 LTS production server
# App:    /var/www/alaminn-info  (Bun + Nginx + MariaDB)
# ─────────────────────────────────────────────────────────────────
# Usage (as aloedu or via sudo -u aloedu):
#   bash deploy/deploy.sh             # standard redeploy
#   bash deploy/deploy.sh --seed      # also run prisma seed (idempotent)
#   bash deploy/deploy.sh --no-build  # skip next build (just deps + restart)
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/alaminn-info"
APP_USER="aloedu"
BUN_BIN="/home/$APP_USER/.bun/bin/bun"
APP_PORT="3001"
SERVICE="alaminn-info"

cd "$APP_DIR"

# ── Parse flags ───────────────────────────────────────────────────
DO_SEED=0
DO_BUILD=1
for arg in "$@"; do
  case "$arg" in
    --seed)     DO_SEED=1 ;;
    --no-build) DO_BUILD=0 ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

# ── Sanity checks ─────────────────────────────────────────────────
if [[ ! -x "$BUN_BIN" ]]; then
  echo "ERROR: Bun not found at $BUN_BIN"
  echo "       Install with: curl -fsSL https://bun.sh/install | bash"
  exit 1
fi
if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo "ERROR: $APP_DIR/package.json not found."
  echo "       Did you upload the project to $APP_DIR?"
  exit 1
fi

echo "→ Working directory: $APP_DIR"
echo "→ Bun:               $BUN_BIN ($("$BUN_BIN" --version))"
echo "→ Build:             $([ $DO_BUILD -eq 1 ] && echo 'yes' || echo 'skip')"
echo "→ Seed:              $([ $DO_SEED -eq 1 ] && echo 'yes' || echo 'skip')"

# ── 1. Install deps ───────────────────────────────────────────────
echo "→ [1/5] Installing dependencies..."
"$BUN_BIN" install --frozen-lockfile || "$BUN_BIN" install

# ── 2. Generate Prisma client ─────────────────────────────────────
echo "→ [2/5] Generating Prisma client..."
"$BUN_BIN" run db:generate

# ── 3. Push schema to database ────────────────────────────────────
echo "→ [3/5] Pushing Prisma schema to database..."

# Swap Prisma schema provider based on the DATABASE_URL found in .env.
# Prisma auto-loads .env at runtime, but the shell does NOT export it, so we
# grep it out explicitly. If production uses MariaDB/MySQL (mysql:// URL),
# we swap in prisma/schema.mysql.prisma (provider="mysql" with explicit
# @db.* column types so long text is not truncated to VARCHAR(191)). If the
# URL is `file:` (SQLite — local dev), the default schema.prisma is already
# correct and is left in place. This mirrors the swap that
# scripts/deploy-cyberpanel.sh performs and fixes the bug where deploy.sh
# ran `prisma db push` against the SQLite schema even though .env pointed
# at MariaDB.
DATABASE_URL="$(grep -E '^DATABASE_URL=' .env 2>/dev/null | head -n1 | sed -E 's/^DATABASE_URL=//; s/^"(.*)"$/\1/' || true)"
if [[ "$DATABASE_URL" == mysql://* ]]; then
  echo "  [deploy] Detected MySQL DATABASE_URL — swapping to schema.mysql.prisma"
  cp -f prisma/schema.mysql.prisma prisma/schema.prisma
elif [[ "$DATABASE_URL" == file:* ]]; then
  echo "  [deploy] Detected SQLite DATABASE_URL — keeping default schema.prisma"
else
  echo "  [deploy] Warning: DATABASE_URL not found in .env (or unrecognized format). Using current schema.prisma as-is."
fi

"$BUN_BIN" run db:push

# ── 3b. Optional seed ─────────────────────────────────────────────
if [[ $DO_SEED -eq 1 ]]; then
  echo "→ [3b] Seeding database (idempotent)..."
  "$BUN_BIN" run db:seed
fi

# ── 4. Build ──────────────────────────────────────────────────────
if [[ $DO_BUILD -eq 1 ]]; then
  echo "→ [4/5] Building Next.js (standalone)..."
  "$BUN_BIN" run build
fi

# ── 5. Restart service ────────────────────────────────────────────
echo "→ [5/5] Restarting $SERVICE..."
sudo systemctl restart "$SERVICE"
sleep 2
sudo systemctl is-active --quiet "$SERVICE" && echo "  ✓ $SERVICE is running" || {
  echo "  ✗ $SERVICE failed to start — check: journalctl -u $SERVICE -n 50"
  exit 1
}

# ── Health check ──────────────────────────────────────────────────
echo "→ Health check: http://127.0.0.1:$APP_PORT/api/health"
sleep 2
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$APP_PORT/api/health" || echo 000)"
if [[ "$HTTP_CODE" == "200" ]]; then
  echo "  ✓ Health check passed (HTTP 200)"
else
  echo "  ✗ Health check FAILED (HTTP $HTTP_CODE)"
  echo "    Tail logs: journalctl -u $SERVICE -n 50"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DEPLOY COMPLETE — https://alaminn.info"
echo "═══════════════════════════════════════════════════════════════"
