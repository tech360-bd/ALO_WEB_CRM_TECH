#!/usr/bin/env bash
# LEGACY / NOT USED FOR CURRENT PRODUCTION
# Historical VPS diagnostics; not a Hostinger readiness check.
echo "Use node scripts/validate-deployment-config.mjs for repository checks; host runtime remains externally verified." >&2
exit 1
# Canonical ALO health check for PM2/cPanel and optional systemd/Ubuntu use.
# Usage: bash scripts/health-check.sh [--public] [--systemd] [URL]
set -Eeuo pipefail

LOCAL_URL="${HEALTH_URL:-http://127.0.0.1:3044/api/health}"
PUBLIC_URL="${PUBLIC_HEALTH_URL:-https://aloeducation.com/api/health}"
TIMEOUT="${HEALTH_TIMEOUT:-10}"
CHECK_SYSTEMD=0
CHECK_PUBLIC=0
for arg in "$@"; do
  case "$arg" in
    --public) CHECK_PUBLIC=1 ;;
    --systemd) CHECK_SYSTEMD=1 ;;
    http://*|https://*) LOCAL_URL="$arg" ;;
    *) echo "Usage: $0 [--public] [--systemd] [URL]" >&2; exit 2 ;;
  esac
done

fail() { echo "[health][FAIL] $*" >&2; exit 1; }

echo "=== ALO Health Check ==="
if [[ "$CHECK_SYSTEMD" == "1" ]]; then
  command -v systemctl >/dev/null 2>&1 || fail "systemctl is unavailable for --systemd"
  systemctl is-active --quiet "${HEALTH_SYSTEMD_SERVICE:-alo-education.service}" || fail "systemd service is not active"
fi

RESP="$(curl -fsS --max-time "$TIMEOUT" "$LOCAL_URL" 2>/dev/null)" || fail "HTTP probe failed: $LOCAL_URL"
printf '%s\n' "$RESP" | python3 -m json.tool 2>/dev/null | head -n 30 || true
printf '%s' "$RESP" | grep -q '"status":"ok"' || fail "status not ok: $RESP"
printf '%s' "$RESP" | grep -q '"connected":true' || fail "database not connected"
echo "✓ Local health OK"

if [[ "$CHECK_PUBLIC" == "1" ]]; then
  PUBLIC_RESP="$(curl -fsS --max-time "$TIMEOUT" "$PUBLIC_URL" 2>/dev/null)" || fail "public HTTP probe failed: $PUBLIC_URL"
  printf '%s' "$PUBLIC_RESP" | grep -q '"status":"ok"' || fail "public status not ok: $PUBLIC_RESP"
  echo "✓ Public health OK"
fi

echo "=== Health check passed ==="
