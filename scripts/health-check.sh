#!/usr/bin/env bash
# ALO Education — Health Check (local 3044 + public https)
# Usage: bash scripts/health-check.sh [--public]
set -euo pipefail

LOCAL_URL="http://127.0.0.1:3044/api/health"
PUBLIC_URL="https://aloeducation.com/api/health"
TIMEOUT=10

echo "=== ALO Health Check ==="
echo "Local: $LOCAL_URL"
if curl -fsS --max-time $TIMEOUT "$LOCAL_URL" 2>&1 | python3 -m json.tool 2>&1 | head -n 30; then
  echo "✓ Local health OK"
else
  echo "✗ Local health FAILED"
  echo "Trying verbose..."
  curl -i --max-time $TIMEOUT "$LOCAL_URL" 2>&1 | head -n 50 || true
  pm2 describe alo-education 2>&1 | grep -E "status|uptime|memory|script path" | head -n 20 || pm2 list 2>&1 | head -n 20 || true
  ss -lntp 2>/dev/null | grep -E "3044" | head -n 10 || netstat -lntp 2>/dev/null | head -n 20 || true
  exit 1
fi

if [[ "${1:-}" == "--public" ]]; then
  echo "Public: $PUBLIC_URL"
  if curl -fsS --max-time $TIMEOUT "$PUBLIC_URL" 2>&1 | python3 -m json.tool 2>&1 | head -n 30; then
    echo "✓ Public health OK"
  else
    echo "✗ Public health FAILED (may be DNS/Caddy/Nginx)"
    curl -i --max-time $TIMEOUT "$PUBLIC_URL" 2>&1 | head -n 50 || true
    exit 1
  fi
fi

echo "=== Health check passed ==="
