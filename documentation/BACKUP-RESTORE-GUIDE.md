# ALO Education — Backup & Restore Guide

## Backup Strategy

### Daily Automated Backup
```bash
#!/bin/bash
BACKUP_DIR="/home/username/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="$BACKUP_DIR/alo_education_$DATE.sql"

# PostgreSQL
pg_dump --no-tablespaces -U alo_user alo_education > "$DB_FILE"

# Verify non-empty
if [ ! -s "$DB_FILE" ]; then
  echo "ERROR: Backup file is empty!"
  exit 1
fi

# Calculate SHA-256
sha256sum "$DB_FILE" > "$DB_FILE.sha256"

# Compress
gzip "$DB_FILE"

# Retain 30 days
find "$BACKUP_DIR" -name "alo_education_*.sql.gz" -mtime +30 -delete
```

### Backup Verification
1. Verify file size > 0
2. Verify SHA-256 matches
3. Test restore on staging
4. Record backup metadata

### Restore Procedure
```bash
# Stop application
pm2 stop alo-education

# Restore database
gunzip -c /path/to/backup.sql.gz | psql -U alo_user alo_education

# Verify
psql -U alo_user -d alo_education -c "SELECT COUNT(*) FROM \"User\";"

# Restart
pm2 start alo-education
```

### File Backup
- `/public/` — Static assets
- `/upload/` — Student documents (if local storage)
- `/.env` — Environment configuration (encrypted)

### Disaster Recovery
1. Provision new server
2. Install Node.js/Bun + PostgreSQL
3. Restore database from backup
4. Restore .env configuration
5. Deploy application
6. Verify health endpoint
7. Switch DNS
