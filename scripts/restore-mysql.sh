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
# Restore Script — MySQL Database Restore
# Usage: ./scripts/restore-mysql.sh /path/to/backup.sql.gz

set -e

BACKUP_FILE="$1"
DB_NAME="${DB_DATABASE:-aloeduca_alo_education}"
DB_USER="${DB_USERNAME:-aloeduca_ALO_final_web_crm}"
DB_HOST="${DB_HOST:-localhost}"

if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file is required. Usage: ./restore-mysql.sh /path/to/backup.sql.gz"
  exit 1
fi

echo "[Restore] Starting database restore into ${DB_NAME} from ${BACKUP_FILE}..."

if [ -z "${DB_PASSWORD}" ]; then
  gunzip -c "${BACKUP_FILE}" | mysql -h "${DB_HOST}" -u "${DB_USER}" "${DB_NAME}"
else
  gunzip -c "${BACKUP_FILE}" | mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}"
fi

echo "[Restore] Database restore completed successfully."
