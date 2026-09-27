#!/usr/bin/env bash
# ============================================================
# ALO Education ERP — health-check script
# Suitable for cron (every minute) or manual run.
# Exit codes: 0 healthy | 1 unhealthy
# ============================================================
set -Eeuo pipefail

URL="${1:-http://127.0.0.1:3044/api/health}"
SERVICE="alo-education.service"

log()  { echo "[health] $*"; }
fail() { echo "[health][FAIL] $*" >&2; exit 1; }

# 1. Service is active
systemctl is-active --quiet "$SERVICE" || fail "service not active: $SERVICE"

# 2. HTTP endpoint returns 200
RESP=$(curl -fsS --max-time 5 "$URL" 2>/dev/null) || fail "HTTP probe failed: $URL"

# 3. JSON status = ok
echo "$RESP" | grep -q '"status":"ok"' || fail "status not ok: $RESP"

# 4. Database connected
echo "$RESP" | grep -q '"connected":true' || fail "database not connected"

log "OK: $(echo "$RESP" | head -c 200)"
exit 0
