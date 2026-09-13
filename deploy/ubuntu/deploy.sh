#!/usr/bin/env bash
# ============================================================
# ALO Education ERP — Ubuntu deployment script
# Idempotent: safe to rerun. Builds on the Ubuntu target.
# ============================================================
set -Eeuo pipefail

APP_NAME="alo-education"
APP_DIR="/opt/alo-education"
APP_USER="alo"
APP_GROUP="alo"
SERVICE_NAME="alo-education.service"
NODE_MAJOR=22

log()  { echo "[deploy] $*"; }
fail() { echo "[deploy][ERROR] $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "Run with sudo: sudo bash deploy.sh"

# ── 1. Install Node.js 22 (if missing) ──────────────────────
if ! command -v node >/dev/null 2>&1; then
  log "Installing Node.js ${NODE_MAJOR}.x ..."
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  chmod a+r /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
fi
log "Node.js: $(node -v)  npm: $(npm -v)"

# ── 2. Create service user (no shell login) ─────────────────
if ! id "$APP_USER" >/dev/null 2>&1; then
  log "Creating system user: $APP_USER"
  useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER"
fi

# ── 3. Install Caddy (if missing) ───────────────────────────
if ! command -v caddy >/dev/null 2>&1; then
  log "Installing Caddy ..."
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi
log "Caddy: $(caddy version 2>&1 | head -1)"

# ── 4. Deploy / refresh application code ────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
log "Source: $PROJECT_ROOT"

install -d -o "$APP_USER" -g "$APP_GROUP" -m 0755 "$APP_DIR"

# Copy application files (exclude dev-only artifacts)
rsync -a --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='tests' \
  --exclude='remediation-baseline-*' \
  --exclude='remediation-work' \
  --exclude='download' \
  --exclude='skills' \
  --exclude='upload' \
  --exclude='*.log' \
  --exclude='tsc-errors.txt' \
  --exclude='dev.log' \
  "$PROJECT_ROOT"/ "$APP_DIR"/

chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"

# ── 5. Install production dependencies & build on Ubuntu ────
log "Installing dependencies (npm ci) ..."
sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && npm ci --omit=dev 2>/dev/null || npm ci"

log "Building (prisma generate + next build) ..."
sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && npm run build"

# ── 6. Apply migrations ─────────────────────────────────────
log "Running prisma migrate deploy ..."
sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && npx prisma migrate deploy"

log "Running prisma db seed ..."
sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && npx prisma db seed || true"

# ── 7. Install systemd unit ─────────────────────────────────
log "Installing systemd unit ..."
install -m 0644 "$SCRIPT_DIR/alo-education.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

# ── 8. Install Caddy config ─────────────────────────────────
log "Installing Caddyfile ..."
install -m 0644 "$SCRIPT_DIR/Caddyfile" /etc/caddy/Caddyfile
systemctl enable caddy || true
systemctl reload caddy 2>/dev/null || systemctl restart caddy

# ── 9. (Re)start application ─────────────────────────────────
log "Starting $SERVICE_NAME ..."
systemctl restart "$SERVICE_NAME"
sleep 3

# ── 10. Smoke test ──────────────────────────────────────────
log "Smoke testing ..."
if curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then
  log "✓ Health check passed"
else
  fail "Health check failed — inspect: journalctl -u $SERVICE_NAME -n 100"
fi

log "Done. Next steps:"
log "  1. Edit /etc/caddy/Caddyfile (replace alo.example.com with your domain)"
log "  2. systemctl reload caddy"
log "  3. Caddy will provision TLS automatically once DNS resolves"
log "  4. Tail logs: journalctl -u $SERVICE_NAME -f"
