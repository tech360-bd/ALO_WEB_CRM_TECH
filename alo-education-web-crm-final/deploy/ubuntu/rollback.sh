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
# ============================================================
# ALO Education ERP — rollback script
# Rolls back to the previous backup (or a specified timestamp).
# Usage: sudo bash rollback.sh [YYYYMMDD-HHMMSS]
# ============================================================
set -Eeuo pipefail

BACKUP_ROOT="/var/backups/alo-education"
TARGET_TS="${1:-}"

log()  { echo "[rollback] $*"; }
fail() { echo "[rollback][ERROR] $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "Run with sudo"

if [[ -n "$TARGET_TS" ]]; then
  SRC_DIR="$BACKUP_ROOT/$TARGET_TS"
else
  # Pick the second-newest backup (the newest is today's, which is the broken state)
  SRC_DIR=$(ls -1dt "$BACKUP_ROOT"/*/ 2>/dev/null | sed -n '2p' | sed 's:/$::')
  [[ -n "$SRC_DIR" ]] || fail "No previous backup found in $BACKUP_ROOT"
fi

log "Rolling back to: $SRC_DIR"
exec bash "$(dirname "${BASH_SOURCE[0]}")/restore.sh" "$SRC_DIR"
