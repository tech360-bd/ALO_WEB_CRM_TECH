#!/bin/bash
# ALO Education — Full Deployment Check Script
# Usage: bash scripts/full-deploy-check.sh
# Output: PASS / WARN / FAIL for each check

set -euo pipefail

PROJECT_DIR="/home/z/my-project"
PASS=0
WARN=0
FAIL=0

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

check() {
  local name="$1"
  local result="$2"
  if [ "$result" = "PASS" ]; then
    echo -e "${GREEN}[PASS]${NC} $name"
    PASS=$((PASS + 1))
  elif [ "$result" = "WARN" ]; then
    echo -e "${YELLOW}[WARN]${NC} $name"
    WARN=$((WARN + 1))
  else
    echo -e "${RED}[FAIL]${NC} $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "============================================"
echo "  ALO EDUCATION — DEPLOYMENT CHECK"
echo "============================================"
echo ""

# 1. Project folder
[ -d "$PROJECT_DIR/src" ] && check "Project folder" "PASS" || check "Project folder" "FAIL"

# 2. package.json
[ -f "$PROJECT_DIR/package.json" ] && check "package.json" "PASS" || check "package.json" "FAIL"

# 3. Prisma schema
[ -f "$PROJECT_DIR/prisma/schema.prisma" ] && check "Prisma schema" "PASS" || check "Prisma schema" "FAIL"

# 4. .env file
[ -f "$PROJECT_DIR/.env" ] && check ".env file" "PASS" || check ".env file" "FAIL"

# 5. MySQL (check if mysql client exists or DATABASE_URL set)
if command -v mysql &>/dev/null || [ -n "${DATABASE_URL:-}" ]; then
  check "MySQL available" "PASS"
else
  check "MySQL (not installed in dev)" "WARN"
fi

# 6. npm/bun dependencies
[ -d "$PROJECT_DIR/node_modules" ] && check "Dependencies installed" "PASS" || check "Dependencies" "FAIL"

# 7. Prisma generate
[ -d "$PROJECT_DIR/node_modules/.prisma/client" ] && check "Prisma client generated" "PASS" || check "Prisma client generated" "FAIL"

# 8. Database connectivity
cd "$PROJECT_DIR" && bun run -e "const {db}=require('./src/lib/db'); db.\$queryRaw\`SELECT 1\`.then(()=>{console.log('DB OK');process.exit(0)}).catch(()=>{console.error('DB FAIL');process.exit(1)})" 2>/dev/null && check "Database connectivity" "PASS" || check "Database connectivity" "WARN"

# 9. Production build
[ -d "$PROJECT_DIR/.next/standalone" ] && check "Production build" "PASS" || check "Production build" "FAIL"

# 10. PM2 config
[ -f "$PROJECT_DIR/ecosystem.config.cjs" ] && check "PM2 config" "PASS" || check "PM2 config" "FAIL"

# 11. Caddy config
[ -f "$PROJECT_DIR/Caddyfile" ] && check "Caddy config" "PASS" || check "Caddy config" "FAIL"

# 12. Health endpoint
[ -f "$PROJECT_DIR/src/app/api/health/route.ts" ] && check "Health endpoint" "PASS" || check "Health endpoint" "FAIL"

# 13. Redis integration
[ -f "$PROJECT_DIR/src/lib/redis.ts" ] && check "Redis integration" "PASS" || check "Redis integration" "FAIL"

# 14. n8n integration
[ -f "$PROJECT_DIR/src/lib/n8n.ts" ] && check "n8n integration" "PASS" || check "n8n integration" "FAIL"

# 15. Middleware (RBAC)
[ -f "$PROJECT_DIR/src/middleware.ts" ] && check "Middleware (RBAC)" "PASS" || check "Middleware (RBAC)" "FAIL"

# 16. .gitignore
[ -f "$PROJECT_DIR/.gitignore" ] && check ".gitignore" "PASS" || check ".gitignore" "FAIL"

# 17. .env in git
cd "$PROJECT_DIR" && git ls-files --error-unmatch .env 2>/dev/null && check ".env NOT in git (SECURITY ISSUE)" "FAIL" || check ".env not tracked in git" "PASS"

# 18. API routes count
APIS=$(find "$PROJECT_DIR/src/app/api" -name "route.ts" | wc -l)
[ "$APIS" -gt 100 ] && check "API routes ($APIS)" "PASS" || check "API routes ($APIS)" "WARN"

# 19. View components
VIEWS=$(find "$PROJECT_DIR/src/components/alo/views" -name "*.tsx" | wc -l)
[ "$VIEWS" -gt 50 ] && check "View components ($VIEWS)" "PASS" || check "View components ($VIEWS)" "WARN"

# 20. Prisma models
MODELS=$(grep -c "^model " "$PROJECT_DIR/prisma/schema.prisma")
[ "$MODELS" -gt 100 ] && check "Prisma models ($MODELS)" "PASS" || check "Prisma models ($MODELS)" "WARN"

# 21. Mini-services
MINI=$(ls "$PROJECT_DIR/mini-services/" 2>/dev/null | grep -v node_modules | grep -v .gitkeep | wc -l)
[ "$MINI" -ge 3 ] && check "Mini-services ($MINI)" "PASS" || check "Mini-services ($MINI)" "FAIL"

# 22. Storage pools
[ -f "$PROJECT_DIR/src/lib/storage-service.ts" ] && check "Storage service" "PASS" || check "Storage service" "FAIL"

# 23. CRM automation engine
[ -f "$PROJECT_DIR/src/lib/crm-automation.ts" ] && check "CRM automation engine" "PASS" || check "CRM automation engine" "FAIL"

# 24. WhatsApp outbound sender
[ -f "$PROJECT_DIR/src/lib/whatsapp/outbound-sender.ts" ] && check "WhatsApp outbound sender" "PASS" || check "WhatsApp outbound sender" "FAIL"

# 25. Student migration center
[ -f "$PROJECT_DIR/src/components/alo/views/student-migration-center.tsx" ] && check "Student migration center" "PASS" || check "Student migration center" "FAIL"

# 26. .env.production
[ -f "$PROJECT_DIR/.env.production" ] && check ".env.production" "PASS" || check ".env.production" "FAIL"

# 27. MySQL schema
[ -f "$PROJECT_DIR/prisma/schema.mysql.prisma" ] && check "MySQL schema" "PASS" || check "MySQL schema" "FAIL"

echo ""
echo "============================================"
echo "  SUMMARY"
echo "============================================"
echo -e "PASS: ${GREEN}$PASS${NC}"
echo -e "WARN: ${YELLOW}$WARN${NC}"
echo -e "FAIL: ${RED}$FAIL${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}DEPLOYMENT STATUS: NOT READY${NC}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "${YELLOW}DEPLOYMENT STATUS: READY WITH WARNINGS${NC}"
  exit 0
else
  echo -e "${GREEN}DEPLOYMENT STATUS: READY${NC}"
  exit 0
fi
