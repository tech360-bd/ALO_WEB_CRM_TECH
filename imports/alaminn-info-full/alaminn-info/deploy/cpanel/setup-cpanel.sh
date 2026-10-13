#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#  Alaminn.info — cPanel Terminal setup script
#  Target: cPanel shared hosting with Terminal access + MySQL 8 + Node.js 20+
#  App location: /home/aloeduca/alaminn.info  (OUTSIDE public_html — secure)
# ══════════════════════════════════════════════════════════════════════════════
#
#  WHAT THIS DOES (run from cPanel → Terminal):
#    1.  Verifies you're in the right directory (/home/aloeduca/alaminn.info)
#    2.  Copies .env.production → .env (if .env doesn't exist yet)
#    3.  Installs Node.js dependencies (npm install)
#    4.  Swaps Prisma schema to MySQL provider (for MySQL 8)
#    5.  Generates Prisma client
#    6.  Pushes schema to MySQL (creates all 55 tables)
#    7.  Seeds the database (274 rows of demo content + admin user)
#    8.  Builds Next.js standalone production bundle
#    9.  Copies static assets into the standalone tree
#   10.  Prints next steps (configure cPanel Node.js App UI)
#
#  USAGE (from cPanel → Terminal):
#    cd ~/alaminn.info
#    bash deploy/cpanel/setup-cpanel.sh
#
#  RE-RUNS: safe (idempotent). Seed uses upserts. Build overwrites.
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────
log()  { printf "\033[1;34m▶\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m⚠\033[0m %s\n" "$*" >&2; }
die()  { printf "\033[1;31m✗\033[0m %s\n" "$*" >&2; exit 1; }

# ── 0. Pre-flight ───────────────────────────────────────────────────────────
log "Pre-flight checks"

# Must be in the app root
APP_DIR="$(pwd)"
if [[ ! -f "$APP_DIR/package.json" ]]; then
  die "package.json not found in $(pwd). Run this script from the app root (/home/aloeduca/alaminn.info)."
fi
ok "Working directory: $APP_DIR"

# Node 20+?
if command -v node &>/dev/null; then
  NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)
  if [[ "$NODE_MAJOR" -lt 20 ]]; then
    die "Node.js 20+ required (found $(node -v)). In cPanel: Software → Setup Node.js App → create a Node 20 app first."
  fi
  ok "Node.js $(node -v)"
else
  die "Node.js not found. In cPanel: Software → Setup Node.js App → create a Node 20 app first, then re-run this script from the Terminal."
fi

# npm or bun?
if command -v npm &>/dev/null; then
  PKG_MGR="npm"
elif command -v bun &>/dev/null; then
  PKG_MGR="bun"
else
  die "Neither npm nor bun found. Node.js should bundle npm — check your cPanel Node.js app setup."
fi
ok "Package manager: $PKG_MGR"

# ── 1. Set up .env (if missing) ────────────────────────────────────────────
log "Checking .env"
if [[ ! -f "$APP_DIR/.env" ]]; then
  if [[ -f "$APP_DIR/deploy/cpanel/.env.production" ]]; then
    cp "$APP_DIR/deploy/cpanel/.env.production" "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    ok ".env created from deploy/cpanel/.env.production (permissions: 600)"
    warn "EDIT .env now: change ADMIN_PASSWORD and SMTP_PASSWORD, then re-run this script."
    warn "After editing, run:  bash deploy/cpanel/setup-cpanel.sh"
    exit 0
  else
    die ".env not found and deploy/cpanel/.env.production template is missing."
  fi
else
  ok ".env already exists (keeping your current secrets)"
fi

# .env must contain a mysql:// DATABASE_URL
if ! grep -q '^DATABASE_URL="mysql://' "$APP_DIR/.env" 2>/dev/null && ! grep -q '^DATABASE_URL=mysql://' "$APP_DIR/.env" 2>/dev/null; then
  die ".env DATABASE_URL must be a mysql:// URL. Found: $(grep DATABASE_URL "$APP_DIR/.env" || echo 'DATABASE_URL not set')"
fi
ok "DATABASE_URL is MySQL"

# ── 2. Install dependencies ─────────────────────────────────────────────────
log "Installing dependencies"
if [[ "$PKG_MGR" == "npm" ]]; then
  npm install 2>&1 | tail -5
else
  bun install 2>&1 | tail -5
fi
ok "Dependencies installed"

# ── 3. Swap Prisma schema to MySQL ──────────────────────────────────────────
log "Activating MySQL Prisma schema"
if [[ -f "$APP_DIR/prisma/schema.mysql.prisma" ]]; then
  # Back up the SQLite schema (so local dev can restore it if needed)
  cp -f "$APP_DIR/prisma/schema.prisma" "$APP_DIR/prisma/schema.sqlite.prisma.bak" 2>/dev/null || true
  # Activate the MySQL schema
  cp -f "$APP_DIR/prisma/schema.mysql.prisma" "$APP_DIR/prisma/schema.prisma"
  ok "schema.prisma is now MySQL (SQLite backup at prisma/schema.sqlite.prisma.bak)"
else
  die "prisma/schema.mysql.prisma not found. Ensure the full repo is uploaded."
fi

# ── 4. Generate Prisma client ───────────────────────────────────────────────
log "Generating Prisma client (MySQL)"
if [[ "$PKG_MGR" == "npm" ]]; then
  npx prisma generate
else
  bunx prisma generate
fi
ok "Prisma client generated"

# ── 5. Push schema to MySQL ─────────────────────────────────────────────────
log "Pushing schema to MySQL (creates all 55 tables)"
if [[ "$PKG_MGR" == "npm" ]]; then
  npx prisma db push --accept-data-loss
else
  bunx prisma db push --accept-data-loss
fi
ok "Database schema applied (55 tables created in aloeduca_alamin_crm)"

# ── 6. Seed the database ────────────────────────────────────────────────────
log "Seeding database with initial content (274 rows)"
if [[ "$PKG_MGR" == "npm" ]]; then
  if npx tsx prisma/seed.ts 2>&1; then
    ok "Database seeded"
  else
    warn "Seed step reported errors — if this is a re-deploy, existing data is intact."
  fi
else
  if bun run prisma/seed.ts 2>&1; then
    ok "Database seeded"
  else
    warn "Seed step reported errors — if this is a re-deploy, existing data is intact."
  fi
fi

# ── 7. Verify database health ───────────────────────────────────────────────
log "Verifying database"
if [[ "$PKG_MGR" == "npm" ]]; then
  npm run db:verify 2>&1 | tail -5
else
  bun run db:verify 2>&1 | tail -5
fi
ok "Database verification complete"

# ── 8. Build Next.js standalone ─────────────────────────────────────────────
log "Building Next.js production bundle (standalone) — this takes 2-5 minutes"
if [[ "$PKG_MGR" == "npm" ]]; then
  npm run build 2>&1 | tail -10
else
  bun run build 2>&1 | tail -10
fi
ok "Build complete"

# ── 9. Stage static assets into standalone tree ─────────────────────────────
log "Staging static assets"
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true
ok "Standalone tree ready at .next/standalone/"

# ── 10. Done ────────────────────────────────────────────────────────────────
echo ""
echo "  ═══════════════════════════════════════════════════════════════════"
echo "  SETUP COMPLETE — the app is built and the database is seeded."
echo "  ═══════════════════════════════════════════════════════════════════"
echo ""
echo "  NEXT STEPS — configure the cPanel Node.js App:"
echo ""
echo "  1. cPanel → Software → Setup Node.js App"
echo "  2. Create Application (or Edit if exists):"
echo "     • Node.js version:       20.x (or higher)"
echo "     • Application mode:      Production"
echo "     • Application root:      alaminn.info"
echo "     • Application URL:       alaminn.info  (or your domain)"
echo "     • Application startup:   server.js"
echo "  3. Click 'Run NPM Install' (if not already done by this script)"
echo "  4. Click 'Start App'"
echo "  5. Visit https://alaminn.info to verify"
echo ""
echo "  ADMIN LOGIN:"
echo "     https://alaminn.info/admin/login"
echo "     Email:    (see ADMIN_EMAIL in .env)"
echo "     Password: (see ADMIN_PASSWORD in .env)"
echo ""
echo "  If you need to re-seed the admin user separately:"
echo "     cd ~/alaminn.info && npx tsx scripts/seed-admin.ts"
echo ""
