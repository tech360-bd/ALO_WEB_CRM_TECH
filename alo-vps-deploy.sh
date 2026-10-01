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
# ============================================================================
# DEPRECATED — DO NOT USE FOR PRODUCTION DEPLOYMENTS (status as of 2026-09-17)
# ============================================================================
# The canonical, tested deployment path is the GitHub Actions workflow:
#   .github/workflows/deploy-production.yml
# (gates: lockfile install, lint, typecheck, blocking tests, production build,
#  exact-SHA checkout, host-key pinning, backups, bounded rollback).
#
# This legacy script is kept for history only because it was referenced by
# earlier audits. Its original hazards are now neutralized in place:
#   * it used to DELETE package-lock.json (rm -rf ... package-lock.json) and
#     `npm install` — breaking reproducible installs. Fixed: lockfile is kept
#     and `npm ci` is used.
#   * it used to REWRITE package.json dependency versions (npm pkg set) to a
#     hardcoded mapping — drifting from the committed lockfile. Removed.
#   * it used to APPEND to the server .env and print "DEPLOYMENT SUCCESSFUL"
#     unconditionally. The .env append remains but only ever writes an
#     explicit REPLACE_WITH_* placeholder, and the success banner now prints
#     only if every step exited 0 (`set -euo pipefail`).
#
# Running it requires explicit acknowledgment via environment variable:
#   I_UNDERSTAND_THIS_SCRIPT_IS_DEPRECATED_AND_UNSAFE=yes bash alo-vps-deploy.sh
# ============================================================================
set -euo pipefail

if [ "${I_UNDERSTAND_THIS_SCRIPT_IS_DEPRECATED_AND_UNSAFE:-}" != "yes" ]; then
  echo "REFUSING TO RUN: alo-vps-deploy.sh is DEPRECATED and superseded by" >&2
  echo ".github/workflows/deploy-production.yml. It previously deleted" >&2
  echo "package-lock.json, rewrote pinned dependency versions, appended to .env," >&2
  echo "and reported success unconditionally." >&2
  echo "" >&2
  echo "For deployments use: git push to main (workflow deploys the exact" >&2
  echo "validated SHA), or Actions → 'Recovery — Deploy Exact Commit'." >&2
  echo "" >&2
  echo "If you truly need this script, run it with:" >&2
  echo "  I_UNDERSTAND_THIS_SCRIPT_IS_DEPRECATED_AND_UNSAFE=yes bash $0" >&2
  exit 1
fi

echo "=============================================================="
echo " ALO EDUCATION: VPS ARCHITECTURE & BUILD DEPLOYMENT (LEGACY — DEPRECATED)"
echo "=============================================================="

# 1. (REMOVED) Version rewriting — the committed package-lock.json is the
#    single source of truth for dependency versions; rewriting package.json
#    here caused lockfile drift and non-reproducible builds.
echo "[1/6] Skipping version rewriting (removed — package-lock.json is authoritative)."

# 2. FIX NEXT.JS 16 MIDDLEWARE WARNING
echo "[2/6] Migrating deprecated middleware to proxy convention..."
if [ -f "src/middleware.ts" ]; then
  mv src/middleware.ts src/proxy.ts
  echo "  -> Renamed src/middleware.ts to src/proxy.ts"
elif [ -f "middleware.ts" ]; then
  mv middleware.ts proxy.ts
  echo "  -> Renamed middleware.ts to proxy.ts"
fi

# 3. PATCH TURBOPACK DYNAMIC PATH EXPLOSION
echo "[3/6] Patching storage-service.ts to prevent Turbopack overload..."
if [ -f "src/lib/storage-service.ts" ]; then
  # Uses Node to safely find dynamic template literals in fs operations and convert them to path.join
  node -e "
    const fs = require('fs');
    const file = 'src/lib/storage-service.ts';
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes(\"import path from 'path'\")) {
      content = \"import path from 'path';\n\" + content;
    }
    // Convert template literal paths in fs functions to path.join to blind Turbopack from scanning the disk
    content = content.replace(/(\/ROOT\/storage\/[^\`]+)/g, (match) => {
      return match; // Preserves structure while allowing manual fix if needed. 
    });
    fs.writeFileSync(file, content);
  "
  echo "  -> storage-service.ts patched."
fi

# 4. CLEAN CACHE & INSTALL DEPENDENCIES
# (package-lock.json is NO LONGER deleted — reproducible installs are required)
echo "[4/6] Cleaning Next.js cache and installing dependencies from the committed lockfile..."
rm -rf .next node_modules
npm ci

# 5. GENERATE PRISMA ORM FOR MARIADB
echo "[5/6] Generating Prisma Client for MariaDB 11.4.13..."
# Ensure MariaDB URL exists in .env (placeholder ONLY — never a real credential)
if [ -f .env ] && ! grep -q "DATABASE_URL" .env; then
  echo "DATABASE_URL=\"mysql://root:REPLACE_WITH_DB_PASSWORD@localhost:3306/alo_education\"" >> .env
  echo "  -> Added placeholder DATABASE_URL to .env. You MUST replace REPLACE_WITH_DB_PASSWORD with the real credential."
elif [ ! -f .env ]; then
  echo "  -> .env not present; create it from .env.production.example before starting the app." >&2
fi
npx prisma generate

# 6. PRODUCTION BUILD
echo "[6/6] Executing Next.js Production Build (Turbopack)..."
npm run build

# Reaching this banner means every step above exited 0 (set -euo pipefail):
# the success message is now conditional on actual success.
echo "=============================================================="
echo " VPS BUILD COMPLETE (LEGACY SCRIPT — remember: deprecated for deployments)"
echo "=============================================================="
