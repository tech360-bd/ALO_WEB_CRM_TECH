#!/bin/bash
# ALO Education — Rollback Script
APP_DIR="/home/aloedu/apps/site-edu"
BACKUP_DIR="/home/aloedu/apps/site-edu-backup"
PM2_NAME="site-edu"

echo "ALO Education — Rollback"
echo "═════════════════════════════"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ No backup found at $BACKUP_DIR"
  echo "Cannot rollback."
  exit 1
fi

echo "Stopping PM2..."
pm2 stop "$PM2_NAME"

echo "Swapping directories..."
mv "$APP_DIR" "${APP_DIR}-failed-$(date +%Y%m%d%H%M%S)"
mv "$BACKUP_DIR" "$APP_DIR"

echo "Restarting PM2..."
cd "$APP_DIR"
pm2 restart "$PM2_NAME" --update-env
pm2 save

sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3015/api/stats")
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Rollback successful (HTTP $HTTP_STATUS)"
else
  echo "❌ Rollback failed (HTTP $HTTP_STATUS)"
  pm2 logs "$PM2_NAME" --lines 20
fi
