# 💾 BACKUP, RESTORE & DISASTER RECOVERY MANUAL

## 1. BACKUP POLICY & SCHEDULE

| Asset | Frequency | Storage Location | Retention | Encryption |
|---|---|---|---|---|
| **Database Dump (MySQL)** | Daily (02:00 AM) | Encrypted S3 / Cloud Storage | 90 Days | AES-256 |
| **Uploaded Documents** | Continuous Sync | Encrypted Object Storage | Indefinite | Server-Side AES-256 |
| **System Encryption Keys** | Manual / On Change | Vault / Offline Backup | Indefinite | GPG Encrypted |
| **Prisma Schema & Code** | Per Release | Git Remote / Tagged Release | Permanent | TLS 1.3 |

---

## 2. AUTOMATED BACKUP SCRIPT EXAMPLE (`backup.sh`)

```bash
#!/bin/bash
# ALO Education MySQL Automated Daily Backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/alo_crm"
DB_NAME="${DATABASE_NAME:-alo_crm}"
DB_USER="${DATABASE_USER:-root}"

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p"$DATABASE_PASSWORD" $DB_NAME | gzip > $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

# Sync to offsite backup storage
aws s3 cp $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz s3://alo-crm-backups-secure/daily/

# Keep only last 30 local days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
```

---

## 3. DISASTER RECOVERY & RESTORE PROCEDURE

### Database Restoration Steps
1. Stop the application service (`pm2 stop alo-crm`).
2. Download the desired backup archive from secure offsite storage.
3. Restore database:
   ```bash
   gunzip -c db_backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u root -p alo_crm
   ```
4. Run Prisma schema validation and migration check:
   ```bash
   npx prisma validate && npx prisma migrate deploy
   ```
5. Restart application service (`pm2 restart alo-crm`).
6. Verify application health check at `https://<domain>/api/health`.
