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
# ============================================================
# ALO Education ERP — restore script
# Usage: sudo bash restore.sh /var/backups/alo-education/<TS>/
# Stops the service, restores DB + .env, restarts.
# ============================================================
set -Eeuo pipefail

APP_DIR="/opt/alo-education"
APP_USER="alo"
SERVICE_NAME="alo-education.service"
SRC_DIR="${1:-}"

log()  { echo "[restore] $*"; }
fail() { echo "[restore][ERROR] $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "Run with sudo"
[[ -n "$SRC_DIR" ]] || fail "Usage: sudo bash restore.sh <backup-dir>"
[[ -d "$SRC_DIR" ]] || fail "Backup dir not found: $SRC_DIR"

log "Stopping service ..."
systemctl stop "$SERVICE_NAME" 2>/dev/null || true

# 1. Restore DB
if [[ -f "$SRC_DIR/database.sql" ]]; then
  log "Restoring MySQL database dump ..."
  : "${DB_NAME:?Set DB_NAME before restore}"
  : "${DB_USER:?Set DB_USER before restore}"
  : "${DB_HOST:=localhost}"
  mysql --host="$DB_HOST" --user="$DB_USER" "$DB_NAME" < "$SRC_DIR/database.sql"
fi

# 2. Restore .env
if [[ -f "$SRC_DIR/.env" ]]; then
  log "Restoring .env ..."
  cp "$SRC_DIR/.env" "$APP_DIR/.env"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  chmod 0600 "$APP_DIR/.env"
fi

# 3. (Optional) restore migrations
if [[ -f "$SRC_DIR/migrations.tar.gz" ]]; then
  log "Restoring migrations ..."
  tar xzf "$SRC_DIR/migrations.tar.gz" -C "$APP_DIR/prisma"
fi

# 4. (Optional) restore full source
if [[ -f "$SRC_DIR/app-source.tar.gz" ]]; then
  read -r -p "Restore full source code? This will overwrite current code. [y/N] " yn
  if [[ "$yn" =~ ^[Yy]$ ]]; then
    log "Restoring application source ..."
    tar xzf "$SRC_DIR/app-source.tar.gz" -C "$(dirname "$APP_DIR")"
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
  fi
fi

log "Starting service ..."
systemctl start "$SERVICE_NAME"
sleep 3

if curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then
  log "✓ Health check passed"
else
  fail "Health check failed — inspect: journalctl -u $SERVICE_NAME -n 100"
fi

log "Restore complete."
