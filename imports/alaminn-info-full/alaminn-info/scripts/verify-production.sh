#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#  Alaminn.info — Full production verification sequence
# ══════════════════════════════════════════════════════════════════════════════
#
#  PURPOSE
#    Runs the complete pre-deploy / pre-release verification pipeline:
#    dependency install, Prisma client generation, lint, typecheck,
#    tests, and a production build. Stops on the first failing step
#    (set -e) so a green run means every gate passed.
#
#  USAGE
#    bash scripts/verify-production.sh
#    ./scripts/verify-production.sh
#
#  PREREQUISITES
#    - Node.js 20+ on PATH (`node`).
#    - npm 9+ on PATH.
#    - npx on PATH.
#    - Run from anywhere — the script cds into the project root
#      (parent of this script) automatically.
#    - `.env` configured (Prisma needs DATABASE_URL).
#    - Network access for `npm ci` if node_modules is not present.
#
#  EXIT CODES
#    0  All steps passed (lint, typecheck, tests, build).
#    1  Any step failed (the failing step's output is printed above
#       the exit).
#
#  NOTE
#    This is intentionally the canonical script shown in the project
#    worklog — it deliberately does NOT skip any step or add
#    short-circuit logic, so a passing run is a meaningful green
#    light for deployment.
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")/.."
echo "=== Production Verification ==="
echo "1. Node version:"; node --version
echo "2. npm ci..."; npm ci
echo "3. prisma generate..."; npx prisma generate
echo "4. lint..."; npm run lint
echo "5. typecheck..."; npm run typecheck
echo "6. test..."; npm run test
echo "7. build..."; npm run build
echo "=== ALL CHECKS PASSED ==="
