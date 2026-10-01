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
# Domain deployment helper script
set -e

DOMAIN=$1
if [ -z "$DOMAIN" ]; then
  echo "Usage: ./auto_domain_agent.sh <domain_name>"
  exit 1
fi

echo "Deploying domain: $DOMAIN"
python3 -c "from backend.auto_domain_deploy import auto_domain_deploy; res = auto_domain_deploy.deploy_domain('$DOMAIN', '/www/wwwroot/$DOMAIN'); print(res)"
