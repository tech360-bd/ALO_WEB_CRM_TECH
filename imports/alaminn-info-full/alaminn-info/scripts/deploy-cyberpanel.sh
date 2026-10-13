#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  Alaminn.info — CyberPanel / OpenLiteSpeed / MariaDB deploy script
#  Target: ALO Education server (Ubuntu 22.04, aloedu user)
# ═══════════════════════════════════════════════════════════════════
#
#  WHAT THIS DOES (in order):
#    1.  Pre-flight checks (root/sudo, .env present, Node 20+, MariaDB up)
#    2.  Swap Prisma schema to MySQL provider (schema.mysql.prisma)
#    3.  Install production npm dependencies
#    4.  Generate Prisma client for MySQL
#    5.  Push schema to MariaDB (creates all tables)
#    6.  Seed the database with initial content (first deploy only)
#    7.  Build Next.js standalone production bundle
#    8.  Copy static assets + public into the standalone tree
#    9.  Restart the systemd service (zero-downtime-ish, ~5s blip)
#   10.  Health-check the app on 127.0.0.1:3000
#
#  USAGE:
#    sudo bash scripts/deploy-cyberpanel.sh            # full deploy
#    sudo bash scripts/deploy-cyberpanel.sh --no-seed  # skip seeding
#    sudo bash scripts/deploy-cyberpanel.sh --build-only
#
#  PREREQUISITES (see README-CYBERPANEL-OLS.md):
#    • Node.js 20+ installed
#    • MariaDB database created (deploy/mariadb-init.sql run)
#    • .env file present with DATABASE_URL=mysql://...
#    • systemd service installed (deploy/alaminn-info.service)
#    • OpenLiteSpeed vhost configured (deploy/ols-vhost.conf)
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────
APP_DIR="/home/aloedu/alaminn.info"
APP_USER="aloedu"
SERVICE_NAME="alaminn-info"
HEALTH_URL="http://127.0.0.1:3000/api/health"
HEALTH_TIMEOUT=30   # seconds to wait for healthy response

# ── Flags ───────────────────────────────────────────────────────────
SEED=1
BUILD_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --no-seed)     SEED=0 ;;
    --build-only)  BUILD_ONLY=1 ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

# ── Helpers ─────────────────────────────────────────────────────────
log()  { echo -e "\033[1;34m▶\033[0m $*"; }
ok()   { echo -e "\033[1;32m✓\033[0m $*"; }
warn() { echo -e "\033[1;33m⚠\033[0m $*" >&2; }
die()  { echo -e "\033[1;31m✗\033[0m $*" >&2; exit 1; }

# ── 0. Pre-flight ───────────────────────────────────────────────────
log "Pre-flight checks"

# Must run as root (for systemd) OR as the app user with sudo for systemctl
if [[ $BUILD_ONLY -eq 0 && $EUID -ne 0 ]]; then
  die "Run with sudo (or as root). For build-only use --build-only."
fi

[[ -d "$APP_DIR" ]] || die "App dir not found: $APP_DIR"
[[ -f "$APP_DIR/.env" ]] || die ".env not found in $APP_DIR — create it from .env.production.example"
cd "$APP_DIR"

# Node 20+?
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)
[[ "$NODE_MAJOR" -ge 20 ]] || die "Node.js 20+ required (found $(node -v 2>/dev/null || echo 'none')). Install: https://github.com/nodesource/distributions"

# .env must contain a mysql:// DATABASE_URL
if ! grep -q '^DATABASE_URL="mysql://' .env; then
  die ".env DATABASE_URL must be a mysql:// URL for MariaDB. Found: $(grep DATABASE_URL .env || echo 'DATABASE_URL not set')"
fi
ok "Pre-flight passed (Node $(node -v))"

# ── 1. Swap Prisma schema to MySQL ──────────────────────────────────
log "Activating MariaDB Prisma schema"
if [[ ! -f prisma/schema.mysql.prisma ]]; then
  die "prisma/schema.mysql.prisma not found. Ensure the full repo is deployed."
fi
# Back up the SQLite schema (so local dev can restore it if needed)
cp -f prisma/schema.prisma prisma/schema.sqlite.prisma.bak 2>/dev/null || true
# Activate the MySQL schema
cp -f prisma/schema.mysql.prisma prisma/schema.prisma
ok "schema.prisma is now MySQL/MariaDB (SQLite backup at prisma/schema.sqlite.prisma.bak)"

# ── 2. Install dependencies ─────────────────────────────────────────
log "Installing production dependencies"
# Use npm ci for reproducible installs (requires package-lock.json)
if [[ -f package-lock.json ]]; then
  npm ci --omit=dev || npm install --omit=dev
else
  npm install --omit=dev
fi
ok "Dependencies installed"

# ── 3. Generate Prisma client ───────────────────────────────────────
log "Generating Prisma client (MySQL)"
npx prisma generate
ok "Prisma client generated"

# ── 4. Push schema to MariaDB ───────────────────────────────────────
log "Pushing schema to MariaDB (creates/updates tables)"
npx prisma db push --accept-data-loss
ok "Database schema applied"

# ── 5. Seed (optional, first deploy) ────────────────────────────────
if [[ $SEED -eq 1 ]]; then
  log "Seeding database with initial content"
  # The seed script populates projects, articles, resources, admin user, etc.
  # It is idempotent (upserts), so re-running is safe but will not duplicate.
  if npx tsx prisma/seed.ts 2>&1; then
    ok "Database seeded"
  else
    warn "Seed step reported errors — if this is a re-deploy, existing data is intact."
    warn "For a fresh DB this needs investigation. Continuing build..."
  fi
else
  warn "Skipping seed (--no-seed)"
fi

# ── 6. Build Next.js standalone ─────────────────────────────────────
log "Building Next.js production bundle (standalone)"
npm run build
ok "Build complete"

# ── 7. Stage static assets into standalone tree ─────────────────────
log "Staging static assets"
# The build script in package.json already copies .next/static and public
# into .next/standalone, but we re-run here to be safe across Next versions.
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true
# The standalone server needs the .env for runtime env vars
cp .env .next/standalone/.env 2>/dev/null || true
ok "Standalone tree ready at .next/standalone/"

# ── 8. Restart service (skip if --build-only) ───────────────────────
if [[ $BUILD_ONLY -eq 1 ]]; then
  warn "Build-only mode — skipping service restart."
  ok "Done. Restart manually with: sudo systemctl restart $SERVICE_NAME"
  exit 0
fi

log "Reloading systemd & restarting $SERVICE_NAME"
# Fix ownership so the aloedu user can read the standalone tree
chown -R "$APP_USER":"$APP_USER" "$APP_DIR/.next/standalone"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR/.next/static"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR/public"

systemctl daemon-reload
systemctl restart "$SERVICE_NAME"
ok "Service restarted"

# ── 9. Health check ─────────────────────────────────────────────────
log "Health check (waiting up to ${HEALTH_TIMEOUT}s for 200)"
for i in $(seq 1 "$HEALTH_TIMEOUT"); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  if [[ "$CODE" == "200" ]]; then
    ok "App is healthy (HTTP 200 on $HEALTH_URL)"
    echo ""
    echo "  ═══════════════════════════════════════════════════════════"
    echo "  DEPLOY COMPLETE — alaminn.info is live"
    echo "  ═══════════════════════════════════════════════════════════"
    echo "  • Service:  systemctl status $SERVICE_NAME"
    echo "  • Logs:     journalctl -u $SERVICE_NAME -f"
    echo "  • App:      http://127.0.0.1:3000  (via OLS → https://alaminn.info)"
    echo ""
    exit 0
  fi
  sleep 1
done

die "App did not become healthy within ${HEALTH_TIMEOUT}s (last code: $CODE).
     Check logs: journalctl -u $SERVICE_NAME -n 50"
