#!/bin/zsh

set +e

ROOT="$(pwd)"
PARENT="$(dirname "$ROOT")"
STAMP="$(date +%Y%m%d-%H%M%S)"
NEW="$PARENT/ALO-EDUCATION-CLEAN-$STAMP"
REPORT="$NEW/_AUDIT"

echo "============================================================"
echo " ALO EDUCATION — FULL PROJECT AUDIT + CLEAN PROJECT BUILD"
echo "============================================================"
echo "SOURCE : $ROOT"
echo "TARGET : $NEW"
echo ""

mkdir -p "$NEW" "$REPORT"

echo "===== 01. SOURCE INFORMATION ====="

{
  echo "ALO EDUCATION PROJECT AUDIT"
  echo "Generated: $(date)"
  echo "Source: $ROOT"
  echo "Target: $NEW"
  echo ""
  echo "Node: $(node -v 2>/dev/null)"
  echo "NPM: $(npm -v 2>/dev/null)"
  echo "Git: $(git --version 2>/dev/null)"
  echo ""
} > "$REPORT/PROJECT-INFO.txt"

echo "===== 02. COMPLETE FILE INVENTORY ====="

find "$ROOT" \
  -path "$ROOT/.git" -prune -o \
  -path "$ROOT/node_modules" -prune -o \
  -path "$ROOT/.next" -prune -o \
  -path "$ROOT/test-results" -prune -o \
  -type f -print \
  > "$REPORT/ALL-FILES.txt"

echo "Total source files:"
wc -l "$REPORT/ALL-FILES.txt"

echo "===== 03. COMPLETE DIRECTORY INVENTORY ====="

find "$ROOT" \
  -path "$ROOT/.git" -prune -o \
  -path "$ROOT/node_modules" -prune -o \
  -path "$ROOT/.next" -prune -o \
  -type d -print \
  > "$REPORT/ALL-DIRECTORIES.txt"

echo "Total directories:"
wc -l "$REPORT/ALL-DIRECTORIES.txt"

echo "===== 04. FILE TYPES ====="

find "$ROOT" \
  -path "$ROOT/.git" -prune -o \
  -path "$ROOT/node_modules" -prune -o \
  -path "$ROOT/.next" -prune -o \
  -type f -print \
  | awk '
  {
    n=$0
    sub(/^.*\//,"",n)
    if (n !~ /\./) ext="[NO_EXTENSION]"
    else {
      sub(/^.*\./,"",n)
      ext="." ext
    }
    count[ext]++
  }
  END {
    for (e in count) print count[e], e
  }' \
  | sort -rn \
  > "$REPORT/FILE-TYPES.txt"

echo "===== 05. TOP-LEVEL STRUCTURE ====="

find "$ROOT" -maxdepth 2 \
  -not -path "$ROOT/.git*" \
  -not -path "$ROOT/node_modules*" \
  -not -path "$ROOT/.next*" \
  -print \
  | sort \
  > "$REPORT/TOP-LEVEL-STRUCTURE.txt"

echo "===== 06. PACKAGE / BUILD CONFIG ====="

{
  echo "===== package.json ====="
  if [ -f package.json ]; then
    cat package.json
  else
    echo "MISSING package.json"
  fi

  echo ""
  echo "===== lockfiles ====="
  ls -lah package-lock.json yarn.lock pnpm-lock.yaml bun.lockb 2>/dev/null

  echo ""
  echo "===== Next.js ====="
  grep -n '"next"' package.json 2>/dev/null

  echo ""
  echo "===== Prisma ====="
  find prisma -maxdepth 3 -type f -print 2>/dev/null
} > "$REPORT/BUILD-CONFIG.txt"

echo "===== 07. SOURCE CODE INVENTORY ====="

{
  echo "===== APP ROUTES ====="
  find src/app -type f -print 2>/dev/null | sort

  echo ""
  echo "===== API ROUTES ====="
  find src/app/api -type f -print 2>/dev/null | sort

  echo ""
  echo "===== COMPONENTS ====="
  find src/components -type f -print 2>/dev/null | sort

  echo ""
  echo "===== LIBRARY ====="
  find src/lib -type f -print 2>/dev/null | sort

  echo ""
  echo "===== HOOKS ====="
  find src/hooks -type f -print 2>/dev/null | sort

  echo ""
  echo "===== CRON ====="
  find src/cron -type f -print 2>/dev/null | sort

  echo ""
  echo "===== TESTS ====="
  find tests -type f -print 2>/dev/null | sort
} > "$REPORT/SOURCE-INVENTORY.txt"

echo "===== 08. PUBLIC ASSETS ====="

find public -type f -print 2>/dev/null \
  | sort \
  > "$REPORT/PUBLIC-ASSETS.txt"

echo "===== 09. DATABASE / PRISMA ====="

{
  echo "===== PRISMA FILES ====="
  find prisma -type f -print 2>/dev/null | sort

  echo ""
  echo "===== DATABASE MODELS ====="
  grep -n '^model ' prisma/schema.prisma 2>/dev/null

  echo ""
  echo "===== ENUMS ====="
  grep -n '^enum ' prisma/schema.prisma 2>/dev/null

  echo ""
  echo "===== MIGRATIONS ====="
  find prisma/migrations -maxdepth 2 -type f -print 2>/dev/null | sort

  echo ""
  echo "===== SQL FILES ====="
  find . \
    -path './.git' -prune -o \
    -path './node_modules' -prune -o \
    -path './.next' -prune -o \
    -type f \( -name '*.sql' -o -name '*.sqlite' -o -name '*.db' \) \
    -print \
    2>/dev/null \
    | sort
} > "$REPORT/DATABASE-INVENTORY.txt"

echo "===== 10. ENVIRONMENT FILES ====="

find "$ROOT" \
  -path "$ROOT/.git" -prune -o \
  -path "$ROOT/node_modules" -prune -o \
  -path "$ROOT/.next" -prune -o \
  -type f \( \
    -name '.env' \
    -o -name '.env.local' \
    -o -name '.env.production' \
    -o -name '.env.example' \
    -o -name '.env.*' \
  \) \
  -print \
  2>/dev/null \
  | sort \
  > "$REPORT/ENV-FILES.txt"

echo "NOTE: Secret values are NOT copied into reports."

echo "===== 11. DEPLOYMENT FILES ====="

find "$ROOT" \
  -path "$ROOT/.git" -prune -o \
  -path "$ROOT/node_modules" -prune -o \
  -path "$ROOT/.next" -prune -o \
  -type f \( \
    -name 'Dockerfile*' \
    -o -name 'docker-compose*.yml' \
    -o -name 'docker-compose*.yaml' \
    -o -name 'ecosystem*.js' \
    -o -name 'ecosystem*.cjs' \
    -o -name 'ecosystem*.mjs' \
    -o -name 'server.js' \
    -o -name 'deploy.sh' \
    -o -name 'start*.sh' \
    -o -name 'Caddyfile' \
    -o -name 'nginx*.conf' \
  \) \
  -print \
  2>/dev/null \
  | sort \
  > "$REPORT/DEPLOYMENT-INVENTORY.txt"

echo "===== 12. DOCUMENTATION ====="

find "$ROOT" \
  -path "$ROOT/.git" -prune -o \
  -path "$ROOT/node_modules" -prune -o \
  -path "$ROOT/.next" -prune -o \
  -type f \( \
    -name '*.md' \
    -o -name '*.txt' \
    -o -name '*.pdf' \
  \) \
  -print \
  2>/dev/null \
  | sort \
  > "$REPORT/DOCUMENTATION-INVENTORY.txt"

echo "===== 13. SUSPICIOUS / TEMP FILES ====="

find "$ROOT" \
  -path "$ROOT/.git" -prune -o \
  -path "$ROOT/node_modules" -prune -o \
  -path "$ROOT/.next" -prune -o \
  -type f \( \
    -name '*.tmp' \
    -o -name '*.bak' \
    -o -name '*.old' \
    -o -name '*.orig' \
    -o -name '*~' \
    -o -name '.DS_Store' \
  \) \
  -print \
  2>/dev/null \
  | sort \
  > "$REPORT/SUSPICIOUS-FILES.txt"

echo "===== 14. DUPLICATE FILE CONTENT HASHES ====="

find "$ROOT" \
  -path "$ROOT/.git" -prune -o \
  -path "$ROOT/node_modules" -prune -o \
  -path "$ROOT/.next" -prune -o \
  -type f \
  -print0 2>/dev/null \
  | xargs -0 shasum -a 256 2>/dev/null \
  | sort -k1,1 \
  > "$REPORT/SHA256-ALL-FILES.txt"

awk '
{
  hash=$1
  file=$2
  if (hash == last) {
    if (!printed) {
      print "DUPLICATE GROUP:"
      print previous
      printed=1
    }
    print file
  } else {
    printed=0
  }
  previous=file
  last=hash
}' "$REPORT/SHA256-ALL-FILES.txt" \
  > "$REPORT/DUPLICATE-FILES.txt"

echo "===== 15. GIT STATUS ====="

git status --short > "$REPORT/GIT-STATUS.txt" 2>/dev/null || true

echo "===== 16. GIT DELETED FILES ====="

git status --short 2>/dev/null \
  | awk '$1 ~ /D/ || $2 ~ /D/ {print}' \
  > "$REPORT/GIT-DELETED-FILES.txt"

echo "===== 17. GIT MODIFIED FILES ====="

git status --short 2>/dev/null \
  | awk '$1 ~ /M/ || $2 ~ /M/ {print}' \
  > "$REPORT/GIT-MODIFIED-FILES.txt"

echo "===== 18. GIT UNTRACKED FILES ====="

git status --short 2>/dev/null \
  | awk '$1 == "??" {print}' \
  > "$REPORT/GIT-UNTRACKED-FILES.txt"

echo "===== 19. CHECK IMPORTANT FILES ====="

{
  for f in \
    package.json \
    tsconfig.json \
    next.config.js \
    next.config.mjs \
    next.config.ts \
    middleware.ts \
    src/middleware.ts \
    proxy.ts \
    src/proxy.ts \
    prisma/schema.prisma \
    ecosystem.config.cjs \
    ecosystem.config.js \
    server.js \
    .env.example
  do
    if [ -e "$ROOT/$f" ]; then
      echo "PASS  $f"
    else
      echo "MISSING  $f"
    fi
  done
} > "$REPORT/IMPORTANT-FILES-CHECK.txt"

echo "===== 20. CREATE CLEAN PROJECT ====="

echo "Copying source/config/data while excluding rebuildable caches..."

rsync -a \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='test-results/' \
  --exclude='.turbo/' \
  --exclude='.cache/' \
  --exclude='coverage/' \
  --exclude='.DS_Store' \
  "$ROOT/" "$NEW/" \
  > "$REPORT/RSYNC.log" 2>&1

echo "===== 21. REMOVE OLD AUDIT FROM COPIED TARGET IF ANY ====="

rm -rf "$NEW/_AUDIT"
mkdir -p "$NEW/_AUDIT"

cp -a "$REPORT/." "$NEW/_AUDIT/" 2>/dev/null || true

echo "===== 22. CHECK CLEAN PROJECT ====="

{
  echo "CLEAN PROJECT"
  echo "Location: $NEW"
  echo ""
  echo "package.json:"
  test -f "$NEW/package.json" && echo "PASS" || echo "FAIL"

  echo "Prisma:"
  test -f "$NEW/prisma/schema.prisma" && echo "PASS" || echo "NOT PRESENT"

  echo "src:"
  test -d "$NEW/src" && echo "PASS" || echo "FAIL"

  echo "public:"
  test -d "$NEW/public" && echo "PASS" || echo "NOT PRESENT"

  echo "components:"
  test -d "$NEW/src/components" && echo "PASS" || echo "NOT PRESENT"

  echo "API:"
  test -d "$NEW/src/app/api" && echo "PASS" || echo "NOT PRESENT"

  echo "Tests:"
  test -d "$NEW/tests" && echo "PASS" || echo "NOT PRESENT"
} > "$REPORT/CLEAN-PROJECT-CHECK.txt"

echo "===== 23. TARGET INVENTORY ====="

find "$NEW" \
  -path "$NEW/.git" -prune -o \
  -path "$NEW/node_modules" -prune -o \
  -path "$NEW/.next" -prune -o \
  -type f -print \
  | sort \
  > "$REPORT/CLEAN-PROJECT-FILES.txt"

echo "===== 24. CREATE MANIFEST ====="

{
  echo "ALO EDUCATION CLEAN PROJECT MANIFEST"
  echo "===================================="
  echo ""
  echo "SOURCE:"
  echo "$ROOT"
  echo ""
  echo "TARGET:"
  echo "$NEW"
  echo ""
  echo "SOURCE FILE COUNT:"
  wc -l < "$REPORT/ALL-FILES.txt"
  echo ""
  echo "SOURCE DIRECTORY COUNT:"
  wc -l < "$REPORT/ALL-DIRECTORIES.txt"
  echo ""
  echo "TARGET FILE COUNT:"
  wc -l < "$REPORT/CLEAN-PROJECT-FILES.txt"
  echo ""
  echo "IMPORTANT:"
  echo "Existing project was NOT deleted."
  echo "Git reset/clean was NOT executed."
  echo "node_modules/.next were intentionally excluded because they are rebuildable."
  echo "Environment secret values were not intentionally exposed in reports."
} > "$REPORT/CLEAN-PROJECT-MANIFEST.txt"

echo ""
echo "============================================================"
echo " COMPLETE"
echo "============================================================"
echo ""
echo "OLD PROJECT:"
echo "$ROOT"
echo ""
echo "NEW CLEAN PROJECT:"
echo "$NEW"
echo ""
echo "AUDIT:"
echo "$NEW/_AUDIT"
echo ""
echo "NEXT STEP:"
echo "cd \"$NEW\""
echo ""
echo "Then inspect:"
echo "cat _AUDIT/IMPORTANT-FILES-CHECK.txt"
echo "cat _AUDIT/GIT-DELETED-FILES.txt"
echo "cat _AUDIT/DUPLICATE-FILES.txt"
echo "cat _AUDIT/CLEAN-PROJECT-MANIFEST.txt"
echo ""
echo "NO OLD PROJECT WAS DELETED."
echo "============================================================"
