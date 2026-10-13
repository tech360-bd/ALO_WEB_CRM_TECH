#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#  Alaminn.info — cPanel redeploy script
#  Run this AFTER uploading new code (via git pull, rsync, or FTP).
# ══════════════════════════════════════════════════════════════════════════════
#  Usage (from cPanel → Terminal):
#    cd ~/alaminn.info
#    bash deploy/cpanel/redeploy.sh             # standard redeploy
#    bash deploy/cpanel/redeploy.sh --no-seed   # skip database seed
#    bash deploy/cpanel/redeploy.sh --no-build  # just restart the app
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

log()  { printf "\033[1;34m▶\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m⚠\033[0m %s\n" "$*" >&2; }
die()  { printf "\033[1;31m✗\033[0m %s\n" "$*" >&2; exit 1; }

APP_DIR="$(pwd)"
[[ -f "$APP_DIR/package.json" ]] || die "Run from the app root (~/alaminn.info)."

DO_SEED=0
DO_BUILD=1
for arg in "$@"; do
  case "$arg" in
    --seed)     DO_SEED=1 ;;
    --no-seed)  DO_SEED=0 ;;
    --no-build) DO_BUILD=0 ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

PKG_MGR="npm"
command -v bun &>/dev/null && PKG_MGR="bun"

log "Redeploy — build: $([ $DO_BUILD -eq 1 ] && echo yes || echo skip), seed: $([ $DO_SEED -eq 1 ] && echo yes || echo skip)"

# 1. Install deps
if [[ $DO_BUILD -eq 1 ]]; then
  log "Installing dependencies"
  if [[ "$PKG_MGR" == "npm" ]]; then
    npm install 2>&1 | tail -3
  else
    bun install 2>&1 | tail -3
  fi
  ok "Dependencies installed"
fi

# 2. Generate Prisma client
if [[ $DO_BUILD -eq 1 ]]; then
  log "Generating Prisma client"
  if [[ "$PKG_MGR" == "npm" ]]; then
    npx prisma generate
  else
    bunx prisma generate
  fi
  ok "Prisma client generated"
fi

# 3. Push schema
if [[ $DO_BUILD -eq 1 ]]; then
  log "Pushing schema to MySQL"
  if [[ "$PKG_MGR" == "npm" ]]; then
    npx prisma db push --accept-data-loss
  else
    bunx prisma db push --accept-data-loss
  fi
  ok "Schema applied"
fi

# 4. Seed (optional)
if [[ $DO_SEED -eq 1 ]]; then
  log "Seeding database"
  if [[ "$PKG_MGR" == "npm" ]]; then
    npx tsx prisma/seed.ts 2>&1 | tail -5
  else
    bun run prisma/seed.ts 2>&1 | tail -5
  fi
  ok "Seed complete"
fi

# 5. Build
if [[ $DO_BUILD -eq 1 ]]; then
  log "Building Next.js standalone (2-5 minutes)"
  if [[ "$PKG_MGR" == "npm" ]]; then
    npm run build 2>&1 | tail -10
  else
    bun run build 2>&1 | tail -10
  fi
  log "Staging static assets"
  cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
  cp -r public .next/standalone/ 2>/dev/null || true
  ok "Build complete"
fi

# 6. Restart via cPanel (if possible) — otherwise instruct manual restart
log "Restarting app"
if command -v passenger-config &>/dev/null; then
  passenger-config restart-app "$APP_DIR" 2>/dev/null && ok "App restarted via Passenger" || warn "Passenger restart failed — restart from cPanel UI"
else
  warn "Cannot restart from Terminal. Go to: cPanel → Software → Setup Node.js App → Restart"
fi

echo ""
ok "Redeploy complete. Visit https://alaminn.info to verify."
echo "  • Admin: https://alaminn.info/admin/login"
echo "  • Health: https://alaminn.info/api/health"
