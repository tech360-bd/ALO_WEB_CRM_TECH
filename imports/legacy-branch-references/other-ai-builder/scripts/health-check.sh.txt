#!/bin/bash
# ALO Education — Health Check Script
PORT=3015

echo "ALO Education — Health Check"
echo "═════════════════════════════"

# Check PM2 process
PM2_STATUS=$(pm2 jlist 2>/dev/null | grep -o '"name":"site-edu"' | head -1)
if [ -n "$PM2_STATUS" ]; then
  echo "✅ PM2 process: site-edu running"
else
  echo "❌ PM2 process: site-edu NOT running"
  exit 1
fi

# Check HTTP
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT")
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ HTTP: $HTTP_STATUS (port $PORT)"
else
  echo "❌ HTTP: $HTTP_STATUS (port $PORT)"
  exit 1
fi

# Check API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/api/stats")
if [ "$API_STATUS" = "200" ]; then
  echo "✅ API: /api/stats returns $API_STATUS"
else
  echo "❌ API: /api/stats returns $API_STATUS"
fi

# Check database
DB_CHECK=$(curl -s "http://127.0.0.1:$PORT/api/stats" | grep -o '"counts"')
if [ -n "$DB_CHECK" ]; then
  echo "✅ Database: Connected and responding"
else
  echo "❌ Database: No response"
fi

# Check public assets
LOGO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/logo.svg")
if [ "$LOGO_STATUS" = "200" ]; then
  echo "✅ Public assets: logo.svg accessible"
else
  echo "❌ Public assets: logo.svg returns $LOGO_STATUS"
fi

echo ""
echo "═════════════════════════════"
echo "Health check complete."
