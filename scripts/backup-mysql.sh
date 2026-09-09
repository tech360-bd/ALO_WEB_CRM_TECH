#!/bin/bash
# Backup Script — MySQL Database Backup
# Target Directory: /home/aloeduca/alo-web-crm-shared/backups

set -e

BACKUP_DIR="/home/aloeduca/alo-web-crm-shared/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_DATABASE:-aloeduca_alo_education}"
DB_USER="${DB_USERNAME:-aloeduca_ALO_final_web_crm}"
DB_HOST="${DB_HOST:-localhost}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[Backup] Starting MySQL backup for ${DB_NAME} at ${TIMESTAMP}..."

if [ -z "${DB_PASSWORD}" ]; then
  mysqldump -h "${DB_HOST}" -u "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
else
  mysqldump -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
fi

FILE_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")
SHA256_SUM=$(shasum -a 256 "${BACKUP_FILE}" | awk '{print $1}')

echo "[Backup] Successfully created ${BACKUP_FILE} (${FILE_SIZE} bytes)"
echo "[Backup] SHA-256: ${SHA256_SUM}"
