#!/bin/bash
# ALO Education — Production Deployment Script
# Server: 103.231.239.79 | User: aloedu | Path: /home/aloedu/apps/site-edu
# PM2: site-edu | Port: 3015

set -e

APP_DIR="/home/aloedu/apps/site-edu"
PM2_NAME="site-edu"
PORT=3015

echo "═══════════════════════════════════════════"
echo "  ALO Education — Production Deployment"
echo "═══════════════════════════════════════════"
echo "App Dir: $APP_DIR"
echo "PM2:     $PM2_NAME"
echo "Port:    $PORT"
echo ""

# Step 1: Navigate to app directory
cd "$APP_DIR" || { echo "ERROR: App directory not found"; exit 1; }

# Step 2: Pull latest code (if git repo)
if [ -d ".git" ]; then
  echo "[1/8] Pulling latest code..."
  git pull origin main
fi

# Step 3: Install dependencies
echo "[2/8] Installing dependencies..."
bun install --production

# Step 4: Generate Prisma Client
echo "[3/8] Generating Prisma Client..."
bunx prisma generate

# Step 5: Push schema to database
echo "[4/8] Pushing schema to MySQL..."
bunx prisma db push

# Step 6: Run seeds (idempotent)
echo "[5/8] Running database seeds..."
bun run prisma/seed.ts
bun run prisma/seed-public.ts
bun run prisma/seed-expanded.ts
bun run prisma/seed-mega.ts
bun run prisma/seed-counselor.ts
bun run prisma/seed-ai-agents.ts
bun run prisma/seed-employee-access.ts
bun run prisma/seed-partner-portal.ts
bun run prisma/seed-homepage.ts
bun run prisma/seed-marketing.ts
bun run prisma/seed-hr-appmanager.ts
bun run prisma/seed-enterprise-ai.ts
bun run prisma/seed-omnichannel.ts

# Step 7: Build production
echo "[6/8] Building production..."
bun run build

# Step 8: Restart PM2
echo "[7/8] Restarting PM2..."
pm2 restart "$PM2_NAME" --update-env 2>/dev/null || pm2 start "bun run start" --name "$PM2_NAME" --update-env
pm2 save

# Step 9: Health check
echo "[8/8] Health check..."
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/stats")
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Health check passed (HTTP $HTTP_STATUS)"
else
  echo "❌ Health check failed (HTTP $HTTP_STATUS)"
  echo "Check logs: pm2 logs $PM2_NAME"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════"
echo "URL:       https://aloeducation.com"
echo "PM2:       pm2 status $PM2_NAME"
echo "Logs:      pm2 logs $PM2_NAME"
echo "Health:    curl http://127.0.0.1:$PORT/api/stats"
echo "═══════════════════════════════════════════"
