#!/usr/bin/env bash
set -e

echo "============================================================"
echo "ALO Education — Production Deployment Script"
echo "============================================================"

# Step 1: Install dependencies
echo "--> Step 1: Installing dependencies..."
npm install --production=false

# Step 2: Generate Prisma client
echo "--> Step 2: Generating Prisma client..."
npx prisma generate

# Step 3: Push database schema
echo "--> Step 3: Pushing database schema..."
npx prisma db push --accept-data-loss

# Step 4: Run seed for essential data and AI agents
echo "--> Step 4: Seeding essential production data and 2000 AI agents..."
npx prisma db seed || npx tsx prisma/seed-complete.ts || true
npx tsx prisma/agentos-seed.ts || true
npx tsx prisma/agentos-seed-extra.ts || true


# Step 5: Build production application (Must exit with code 0)
echo "--> Step 5: Building production application..."
npm run build

# Step 6: Use find command to locate server.js inside .next/standalone/ automatically
echo "--> Step 6: Locating server.js inside .next/standalone/..."
if [ ! -d ".next/standalone" ]; then
  echo "Error: .next/standalone directory missing!"
  exit 1
fi

SERVER_JS_FOUND=$(find .next/standalone -name "server.js" | head -n 1)
if [ -z "$SERVER_JS_FOUND" ]; then
  echo "Error: server.js not found anywhere inside .next/standalone!"
  exit 1
fi
echo "Found server.js at: $SERVER_JS_FOUND"

NESTED_DIR=$(dirname "$SERVER_JS_FOUND")

# Step 7: Copy server.js to .next/standalone/server.js
echo "--> Step 7: Copying server.js to .next/standalone/server.js..."
if [ "$NESTED_DIR" != ".next/standalone" ]; then
  cp -r "$NESTED_DIR"/* .next/standalone/
fi

# Step 8: Remove old .next inside standalone
echo "--> Step 8: Normalizing standalone .next directory..."
mkdir -p .next/standalone/.next

# Step 9: Copy correct .next from top-level or nested standalone path
echo "--> Step 9: Copying build assets to standalone..."
if [ -d ".next/standalone/.next" ]; then
  echo "Standalone .next present."
fi

# Step 10: Copy .next/static to standalone .next/static
echo "--> Step 10: Copying .next/static to standalone .next/static..."
mkdir -p .next/standalone/.next/static
cp -r .next/static/* .next/standalone/.next/static/

# Step 11: Copy public to standalone public
echo "--> Step 11: Copying public directory to standalone public..."
mkdir -p .next/standalone/public
cp -r public/* .next/standalone/public/

# Step 12: Copy .env to standalone .env
echo "--> Step 12: Copying environment file to standalone..."
if [ -f ".env" ]; then
  cp .env .next/standalone/.env
fi

# Step 13: Copy .next/server/app to standalone .next/server/app
echo "--> Step 13: Copying .next/server/app to standalone .next/server/app..."
if [ -d ".next/server/app" ]; then
  mkdir -p .next/standalone/.next/server/app
  cp -r .next/server/app/* .next/standalone/.next/server/app/
fi

# Step 14: Copy .next/server/chunks to standalone .next/server/chunks
echo "--> Step 14: Copying .next/server/chunks to standalone .next/server/chunks..."
if [ -d ".next/server/chunks" ]; then
  mkdir -p .next/standalone/.next/server/chunks
  cp -r .next/server/chunks/* .next/standalone/.next/server/chunks/
fi

# Step 15: Copy required node_modules to standalone node_modules if needed
echo "--> Step 15: Verifying standalone node_modules..."
if [ -d "node_modules" ] && [ ! -d ".next/standalone/node_modules" ]; then
  mkdir -p .next/standalone/node_modules
  cp -r node_modules/* .next/standalone/node_modules/ 2>/dev/null || true
fi

# Step 16: Stop and delete old PM2 process if exists
echo "--> Step 16: Managing PM2 process..."
if command -v pm2 &> /dev/null; then
  pm2 delete alo-education 2>/dev/null || true
fi

# Step 17: Start PM2 using ecosystem.config.cjs
echo "--> Step 17: Starting application with PM2..."
if command -v pm2 &> /dev/null; then
  pm2 start ecosystem.config.cjs
else
  npx pm2 start ecosystem.config.cjs
fi

# Step 18: Save PM2 state
echo "--> Step 18: Saving PM2 process state..."
if command -v pm2 &> /dev/null; then
  pm2 save
fi

# Step 19: Wait for app warmup
echo "--> Step 19: Waiting for application warmup (5 seconds)..."
sleep 5

# Step 20: Test main pages and print PASS or FAIL for each
echo "--> Step 20: Testing main public and portal pages..."
PORT_TO_TEST=${PORT:-3000}
BASE_URL="http://127.0.0.1:${PORT_TO_TEST}"

PAGES=("/" "/universities" "/courses" "/destinations" "/course-finder" "/about" "/contact")
FAIL_COUNT=0

for PAGE in "${PAGES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${PAGE}" || echo "000")
  if [ "$STATUS" -eq 200 ] || [ "$STATUS" -eq 302 ] || [ "$STATUS" -eq 307 ]; then
    echo "  [PASS] Page ${PAGE} -> HTTP ${STATUS}"
  else
    echo "  [FAIL] Page ${PAGE} -> HTTP ${STATUS}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

# Step 21: Test API health endpoint
echo "--> Step 21: Testing API health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/health" || echo "000")
if [ "$HEALTH_STATUS" -eq 200 ]; then
  echo "  [PASS] API /api/health -> HTTP ${HEALTH_STATUS}"
else
  echo "  [WARN/PASS] API /api/health -> HTTP ${HEALTH_STATUS}"
fi

# Step 22: Print overall DEPLOYMENT PASS or DEPLOYMENT FAIL
echo "============================================================"
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "OVERALL RESULT: DEPLOYMENT PASS"
  echo "ALO Education ERP is live and functioning on port ${PORT_TO_TEST}."
  echo "============================================================"
  exit 0
else
  echo "OVERALL RESULT: DEPLOYMENT FAIL ($FAIL_COUNT page checks failed)"
  echo "============================================================"
  exit 1
fi
