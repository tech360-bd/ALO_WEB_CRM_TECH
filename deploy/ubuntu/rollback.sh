#!/usr/bin/env bash
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
# Ubuntu compatibility entrypoint. The exact-commit rollback implementation is
# shared with the AlmaLinux/PM2 deployment path and never resets the database
# or deletes .env, storage, uploads, or public/uploads.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export PRODUCTION_APP_DIR="${PRODUCTION_APP_DIR:-/opt/alo-education}"
exec "$ROOT/scripts/rollback.sh" "$@"
