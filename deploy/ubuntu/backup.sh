#!/usr/bin/env bash
# ============================================================
# ALO Education ERP — backup script
# Backs up: MySQL DB, .env, current application code
# Usage: sudo bash backup.sh [output_dir]
# Default output: /var/backups/alo-education/YYYYMMDD-HHMMSS/
# ============================================================
set -Eeuo pipefail

APP_DIR="/opt/alo-education"
APP_USER="alo"
BACKUP_ROOT="${1:-/var/backups/alo-education}"
TS="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_ROOT/$TS"

log()  { echo "[backup] $*"; }
fail() { echo "[backup][ERROR] $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "Run with sudo: sudo bash backup.sh"

install -d -o root -g root -m 0750 "$DEST"

# 1. MySQL database dump. Credentials must come from MYSQL_PWD or ~/.my.cnf.
DB_NAME="${DB_NAME:-aloeduca_alo_education}"
DB_USER="${DB_USER:-aloeduca_ALO_final_web_crm}"
DB_HOST="${DB_HOST:-localhost}"
log "Backing up MySQL database $DB_NAME ..."
mysqldump \
  --host="$DB_HOST" \
  --user="$DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  "$DB_NAME" > "$DEST/database.sql"
chmod 0640 "$DEST/database.sql"

# 2. .env (sensitive — keep perms tight)
if [[ -f "$APP_DIR/.env" ]]; then
  log "Backing up .env ..."
  cp "$APP_DIR/.env" "$DEST/.env"
  chmod 0600 "$DEST/.env"
fi

# 3. Prisma migrations (small, text-only)
if [[ -d "$APP_DIR/prisma/migrations" ]]; then
  log "Backing up migrations ..."
  tar czf "$DEST/migrations.tar.gz" -C "$APP_DIR/prisma" migrations
fi

# 4. Application source (excluding node_modules / .next)
log "Backing up application source ..."
tar czf "$DEST/app-source.tar.gz" \
  --exclude='node_modules' \
  --exclude='.next' \
  -C "$(dirname "$APP_DIR")" \
  "$(basename "$APP_DIR")"

# 5. Manifest
{
  echo "# ALO Education backup manifest"
  echo "timestamp=$TS"
  echo "hostname=$(hostname)"
  echo "node=$(node -v 2>/dev/null || echo 'n/a')"
  echo "app_dir=$APP_DIR"
  echo "files:"
  (cd "$DEST" && ls -la)
} > "$DEST/MANIFEST.txt"

# 6. Retention (keep last 14 backups)
log "Pruning old backups (keeping 14) ..."
ls -1dt "$BACKUP_ROOT"/*/ 2>/dev/null | tail -n +15 | xargs -r rm -rf

log "Backup complete: $DEST"
