#!/bin/bash
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
# ALO Education — Restart Script
PM2_NAME="site-edu"

echo "Restarting $PM2_NAME..."
pm2 restart "$PM2_NAME" --update-env
pm2 save

sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3015/api/stats")
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Restart successful (HTTP $HTTP_STATUS)"
else
  echo "❌ Restart failed (HTTP $HTTP_STATUS)"
  pm2 logs "$PM2_NAME" --lines 20
fi
