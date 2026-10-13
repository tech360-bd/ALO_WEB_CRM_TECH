#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# Alaminn.info — One-time server setup script
# Target: Ubuntu 22.04 LTS
# Stack:  Bun + Nginx + MariaDB + systemd
# App:    /var/www/alaminn-info  (port 127.0.0.1:3001)
# ─────────────────────────────────────────────────────────────────
# Usage:
#   sudo bash deploy/install.sh
# ─────────────────────────────────────────────────────────────────
# This script is IDEMPOTENT: safe to re-run. It will:
#   1. Install Bun (for user aloedu)
#   2. Install + start Nginx
#   3. Install + start MariaDB
#   4. Create MariaDB DB (alaminn_info) + user (alaminn_app)
#   5. Create /var/www/alaminn-info owned by aloedu
#   6. Copy nginx config + systemd service
#   7. Generate AUTH_SECRET
#   8. Write /var/www/alaminn-info/.env from template
#   9. Request Let's Encrypt SSL via certbot (interactive)
#  10. Print next steps
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Constants ─────────────────────────────────────────────────────
APP_USER="aloedu"
APP_GROUP="aloedu"
APP_DIR="/var/www/alaminn-info"
APP_PORT="3001"
DB_NAME="alaminn_info"
DB_USER="alaminn_app"
DOMAIN="alaminn.info"
DOMAIN_WWW="www.alaminn.info"
BUN_INSTALL_USER="aloedu"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
red()    { printf "\033[31m%s\033[0m\n" "$*"; }
green()  { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
blue()   { printf "\033[34m%s\033[0m\n" "$*"; }
step()   { printf "\n\033[1;34m→ %s\033[0m\n" "$*"; }

# ── Pre-flight: must be root ──────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  red "This script must be run as root (use sudo)."
  exit 1
fi

# ── Ensure aloedu user exists ─────────────────────────────────────
step "1/10  Ensure system user '$APP_USER'"
if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
  green "  ✓ Created user $APP_USER"
else
  yellow "  • User $APP_USER already exists — skipping"
fi

# ── Install Bun for aloedu ────────────────────────────────────────
step "2/10  Install Bun (runtime) for $APP_USER"
BUN_BIN="/home/$APP_USER/.bun/bin/bun"
if [[ -x "$BUN_BIN" ]]; then
  yellow "  • Bun already installed at $BUN_BIN"
else
  sudo -u "$APP_USER" bash -c 'curl -fsSL https://bun.sh/install | bash'
  green "  ✓ Bun installed at $BUN_BIN"
fi
BUN_VERSION="$(sudo -u "$APP_USER" "$BUN_BIN" --version 2>/dev/null || echo 'unknown')"
blue "    Bun version: $BUN_VERSION"

# ── Install Nginx ─────────────────────────────────────────────────
step "3/10  Install Nginx"
if command -v nginx &>/dev/null; then
  yellow "  • Nginx already installed"
else
  apt-get update -y
  DEBIAN_FRONTEND=noninteractive apt-get install -y nginx libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static
  green "  ✓ Nginx installed"
fi
systemctl enable --now nginx
systemctl is-active --quiet nginx && green "  ✓ Nginx running" || red "  ✗ Nginx failed to start"

# ── Install MariaDB ───────────────────────────────────────────────
step "4/10  Install MariaDB"
if command -v mariadb &>/dev/null || command -v mysql &>/dev/null; then
  yellow "  • MariaDB already installed"
else
  DEBIAN_FRONTEND=noninteractive apt-get install -y mariadb-server
  green "  ✓ MariaDB installed"
fi
systemctl enable --now mariadb
systemctl is-active --quiet mariadb && green "  ✓ MariaDB running" || red "  ✗ MariaDB failed to start"

# ── Create DB + user (interactive password) ───────────────────────
step "5/10  Create MariaDB database '$DB_NAME' + user '$DB_USER'"
read -s -p "  Enter MariaDB password for app user '$DB_USER' (32+ chars): " DB_PASS
echo ""
read -s -p "  Confirm password: " DB_PASS_CONFIRM
echo ""
if [[ "$DB_PASS" != "$DB_PASS_CONFIRM" ]]; then
  red "  ✗ Passwords do not match. Aborting."
  exit 1
fi
if [[ ${#DB_PASS} -lt 12 ]]; then
  red "  ✗ Password too short (min 12 chars). Aborting."
  exit 1
fi
mariadb <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost'  IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'127.0.0.1';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL
green "  ✓ Database + user created (password saved only to .env)"

# ── App directory ─────────────────────────────────────────────────
step "6/10  Create app directory $APP_DIR"
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_GROUP" "$APP_DIR"
green "  ✓ Directory ready (owned by $APP_USER)"

# ── Generate AUTH_SECRET + write .env ─────────────────────────────
step "7/10  Generate AUTH_SECRET + write $APP_DIR/.env"
AUTH_SECRET="$(openssl rand -hex 32)"
ADMIN_PASS="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 20)"
ENV_FILE="$APP_DIR/.env"
cat > "$ENV_FILE" <<ENV
# ── Alaminn.info production environment ─────────────────────────
# Generated by deploy/install.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# OWNER: $APP_USER  |  PATH: $APP_DIR  |  PORT: $APP_PORT

# Runtime
NODE_ENV=production
PORT=$APP_PORT

# Database (MariaDB on 127.0.0.1:3306)
DATABASE_URL="mysql://$DB_USER:$DB_PASS@127.0.0.1:3306/$DB_NAME"

# Auth
AUTH_SECRET=$AUTH_SECRET
SESSION_TTL_SEC=28800

# Admin bootstrap (first-run only — change after first login)
# NOTE: scripts/seed-admin.ts reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME
# directly (not the ADMIN_BOOTSTRAP_* variants), so those are the names we
# write here to keep install.sh consistent with the seed script.
ADMIN_EMAIL=admin@$DOMAIN
ADMIN_PASSWORD=$ADMIN_PASS
ADMIN_NAME="Al Aminn"

# Public URL
NEXT_PUBLIC_SITE_URL=https://$DOMAIN

# Email (SMTP) — set after you provision an SMTP account
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="Al Aminn <hello@$DOMAIN>"
EMAIL_REPLY_TO="hello@$DOMAIN"
# RESEND_API_KEY=

# Redis (optional, for queue/job caching — leave blank for in-memory)
REDIS_URL=
ENV
chmod 600 "$ENV_FILE"
chown "$APP_USER:$APP_GROUP" "$ENV_FILE"
green "  ✓ .env written (chmod 600, owned by $APP_USER)"
blue "    ADMIN_EMAIL=admin@$DOMAIN"
blue "    ADMIN_PASSWORD=$ADMIN_PASS  (save this — needed for first login)"
blue "    ADMIN_NAME=\"Al Aminn\""

# ── Nginx config ──────────────────────────────────────────────────
step "8/10  Install Nginx config"
NGINX_SRC="$SCRIPT_DIR/nginx-alaminn-info.conf"
NGINX_DST="/etc/nginx/sites-available/alaminn-info"
NGINX_LINK="/etc/nginx/sites-enabled/alaminn-info"
cp "$NGINX_SRC" "$NGINX_DST"
# Remove default site if it conflicts on port 80
rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_DST" "$NGINX_LINK"
if nginx -t; then
  systemctl reload nginx
  green "  ✓ Nginx reloaded with alaminn-info config"
else
  red "  ✗ Nginx config test failed — check $NGINX_DST"
fi

# ── systemd service ───────────────────────────────────────────────
step "9/10  Install systemd service"
SERVICE_SRC="$SCRIPT_DIR/alaminn-info.service"
SERVICE_DST="/etc/systemd/system/alaminn-info.service"
cp "$SERVICE_SRC" "$SERVICE_DST"
systemctl daemon-reload
systemctl enable alaminn-info
green "  ✓ Service installed + enabled (will start after first deploy)"

# ── SSL via Let's Encrypt (interactive) ───────────────────────────
step "10/10 Let's Encrypt SSL (certbot)"
if command -v certbot &>/dev/null; then
  yellow "  • certbot already installed"
else
  DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx
fi
read -p "  Request SSL now for $DOMAIN + $DOMAIN_WWW? [y/N]: " DO_SSL
if [[ "${DO_SSL:-N}" =~ ^[Yy]$ ]]; then
  certbot --nginx -d "$DOMAIN" -d "$DOMAIN_WWW" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect || yellow "  ⚠ certbot did not complete — run manually later"
else
  yellow "  • Skipping SSL. Run: sudo certbot --nginx -d $DOMAIN -d $DOMAIN_WWW"
fi

# ── Done — next steps ─────────────────────────────────────────────
cat <<EOF

$(green "═══════════════════════════════════════════════════════════════")
$(green "  INSTALLATION COMPLETE — next steps")
$(green "═══════════════════════════════════════════════════════════════")

  1. As $APP_USER, upload the project to $APP_DIR:
       sudo -u $APP_USER bash -c 'cp -r /path/to/extracted/* $APP_DIR/'

  2. Install deps + push schema + build:
       sudo -u $APP_USER bash -c 'cd $APP_DIR && $BUN_BIN install && $BUN_BIN run db:generate && $BUN_BIN run db:push && $BUN_BIN run db:seed && $BUN_BIN run build'

  3. Start the app:
       sudo systemctl start alaminn-info
       sudo systemctl status alaminn-info

  4. Verify locally:
       curl -s http://127.0.0.1:$APP_PORT/api/health

  5. Verify publicly:
       https://$DOMAIN/api/health
       https://$DOMAIN/admin            (login with admin@$DOMAIN / \$ADMIN_PASS from .env)

  6. Save these credentials:
       ADMIN_EMAIL=admin@$DOMAIN
       ADMIN_PASSWORD=$ADMIN_PASS
       ADMIN_NAME="Al Aminn"
       (also in $APP_DIR/.env)

  Logs:     journalctl -u alaminn-info -f
  Reload:   sudo systemctl restart alaminn-info

EOF
