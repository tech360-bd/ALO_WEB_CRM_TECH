#!/bin/bash
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
