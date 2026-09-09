#!/bin/bash
# Domain deployment helper script
set -e

DOMAIN=$1
if [ -z "$DOMAIN" ]; then
  echo "Usage: ./auto_domain_agent.sh <domain_name>"
  exit 1
fi

echo "Deploying domain: $DOMAIN"
python3 -c "from backend.auto_domain_deploy import auto_domain_deploy; res = auto_domain_deploy.deploy_domain('$DOMAIN', '/www/wwwroot/$DOMAIN'); print(res)"
