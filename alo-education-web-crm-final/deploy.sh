#!/usr/bin/env bash
# DEPLOYMENT OWNERSHIP QUARANTINE — no environment override is supported.
# GitHub Actions is CI-only; main eligibility never authorizes this legacy path.
#
# This legacy script is permanently disabled. Its former (already unreachable)
# body ran a data-loss-authorizing schema push and swallowed seed failures with
# `|| true`; that body has been removed (see git history before this change).
#
# Approved process: docs/HOSTINGER-PRODUCTION-DEPLOYMENT.md
#   - Schema: back up, `npx prisma migrate status`, then `npx prisma migrate deploy`
#     only after migration review and release approval.
#   - Seeding is NOT part of deployment. `prisma/seed-complete.ts` resets the
#     Super Admin password on every run, so it is a separate, one-time, manual
#     operator step (section 5 of the runbook). It must never run implicitly and
#     its failure must never be ignored.
_alo_branch="$(git -C "$(dirname "$0")" branch --show-current 2>/dev/null)" || _alo_branch=""
if [ "$_alo_branch" != "main" ]; then
  echo "BLOCKED: production operations require the main branch; current branch is unauthorized or unknown." >&2
  exit 1
fi
echo "DISABLED: legacy deployment/recovery is not an approved Hostinger production mechanism. No changes performed." >&2
echo "See docs/HOSTINGER-PRODUCTION-DEPLOYMENT.md for the approved, reviewed process." >&2
exit 1
