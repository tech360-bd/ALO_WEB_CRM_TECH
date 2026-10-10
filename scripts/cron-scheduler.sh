#!/usr/bin/env bash
# ALO Education — Cron Scheduler Entrypoint
# Production crontab: */5 * * * * /path/to/scripts/cron-scheduler.sh >> /var/log/alo-cron.log 2>&1
set -euo pipefail
APP_URL="${ALO_APP_URL:-http://localhost:3044}"
LOG_PREFIX="[alo-cron $(date -u +%Y-%m-%dT%H:%M:%SZ)]"
HEALTH=$(curl -s -m 10 "${APP_URL}/api/health" 2>/dev/null || echo '{"status":"down"}')
STATUS=$(echo "$HEALTH" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).status||'unknown')}catch{console.log('parse-error')}})" 2>/dev/null || echo "parse-error")
if [ "$STATUS" != "ok" ]; then echo "${LOG_PREFIX} ERROR: App not healthy (${STATUS}). Skipping."; exit 1; fi
echo "${LOG_PREFIX} App healthy. Triggering scheduler..."
RESP=$(curl -s -m 120 -X POST "${APP_URL}/api/automation/schedule" -H "Content-Type: application/json" -H "X-Cron-Secret: ${ALO_CRON_SECRET:-no-secret}" -d "{\"trigger\":\"cron\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" 2>/dev/null || echo '{"error":"request-failed"}')
echo "$RESP" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);if(j.error){console.log('${LOG_PREFIX} ERROR:',j.error);process.exit(2)}console.log('${LOG_PREFIX} OK | executed:',j.executed||0,'| escalated:',j.escalated||0,'| rate:',j.automationRate||'N/A')}catch(e){console.log('${LOG_PREFIX} PARSE ERROR:',d.slice(0,200));process.exit(3)}})"
