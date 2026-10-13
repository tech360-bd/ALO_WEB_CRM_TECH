# BACKUP_RESTORE_GUIDE.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — Database Backup & Restore Guide |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | How to use `scripts/backup.sh`, `scripts/restore.sh`, and `scripts/verify-backup.sh` to back up, restore, and verify the MySQL 8 production database. Includes daily cron setup, restore procedure, retention policy, off-server option, and the mandatory restore test before declaring production ready. |

---

## Overview

The Alaminn.info database (`aloeduca_alamin_crm`, MySQL 8, 55 tables, ~274 seeded rows + live CRM data) is the single source of truth for the platform. Losing it means losing every inquiry, every referral, every contact, every newsletter subscriber, every Higher Study entity.

This guide covers:

1. The three scripts and what each does.
2. How to schedule a daily backup via cPanel cron.
3. The restore procedure (including the mandatory pre-restore safety backup).
4. Backup verification (offline file inspection — doesn't touch the DB).
5. The 30-day retention policy.
6. Off-server backup option (rsync to another server).
7. The mandatory restore test before declaring production ready.

---

## The three scripts

### `scripts/backup.sh` — creates a backup

**What it does**:
1. Resolves absolute paths for `mysqldump`, `gzip`, `sha256sum`, `flock` (auto-detects common cPanel locations).
2. Reads database credentials from `.env` (parses `DATABASE_URL` OR reads discrete `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).
3. Writes credentials to a `mktemp(1)` defaults-extra-file with mode 0600 — credentials are NEVER on argv (where `ps` could leak them) and NEVER printed.
4. Acquires a `flock` on `/tmp/alaminn-backup.lock` to prevent concurrent runs.
5. Runs `mysqldump --defaults-extra-file=<tmp> --single-transaction --quick --routines --triggers --events <db>`.
6. Pipes through `gzip -9` to `storage/backups/alaminn_info_YYYYMMDD_HHMMSS.sql.gz`.
7. Writes `sha256sum` to `storage/backups/alaminn_info_YYYYMMDD_HHMMSS.sql.gz.sha256`.
8. Prunes backups older than `BACKUP_RETENTION_DAYS` (default 30).
9. Removes the temp creds file via a trap (runs even on error).

**Output**: One `.sql.gz` file + one `.sha256` sibling in `storage/backups/`.

**Exit codes**:
- `0`: Backup created successfully (or skipped because another run holds the lock).
- `1`: Backup failed (mysqldump error, missing `.env`, no credentials, IO error). Details written to `storage/logs/backup.log` and stderr.

### `scripts/restore.sh` — restores from a backup

**What it does**:
1. Resolves absolute paths for `mysql`, `mysqldump`, `gzip`, `sha256sum`, `flock`.
2. Reads credentials from `.env` (same parser as `backup.sh`).
3. **Creates a pre-restore safety snapshot** BEFORE importing (so the operation can be undone). The snapshot goes to `storage/backups/pre-restore_YYYYMMDD_HHMMSS.sql.gz`.
4. Verifies the SHA-256 checksum of the supplied backup (if a `.sha256` sibling exists). On mismatch, aborts WITHOUT importing.
5. Verifies gzip integrity (`gunzip -t`).
6. Requires interactive confirmation: the user must type `RESTORE` literally.
7. Imports the backup via `gunzip -c <file> | mysql --defaults-extra-file=<tmp> <db>`.
8. Counts tables post-import; expects exactly 55 (configurable via `EXPECTED_TABLES`).
9. Reports success or rolls back (the pre-restore snapshot can be restored instead).

**Output**: Database is overwritten with the backup contents.

**Exit codes**:
- `0`: Restore completed and verified.
- `1`: Restore aborted (file not found, checksum mismatch, user declined confirmation, import error, table count mismatch).

### `scripts/verify-backup.sh` — verifies a backup file (offline)

**What it does**:
1. Resolves the backup file path (absolute, or relative to `storage/backups/`, or `latest` if no arg).
2. Performs 5 checks (all must pass):
   - **Check 1**: File exists and is non-empty.
   - **Check 2**: SHA-256 checksum matches the `.sha256` sibling (if present).
   - **Check 3**: gzip integrity check (`gunzip -t`).
   - **Check 4**: The dump contains exactly 55 `CREATE TABLE` statements (configurable via `EXPECTED_TABLES`).
   - **Check 5**: Key tables are present in the dump: `User`, `HigherStudyUniversity`, `HigherStudyScholarship`, `EnglishLearningCourse`.
3. Prints a per-check PASS/FAIL report.

**Output**: Exit code 0 (all pass) or 1 (one or more fail).

**Important**: this script does NOT touch the database. It purely inspects the backup file. Safe to run anytime.

---

## Step 1 — Daily backup cron setup

### Schedule

Run the backup script daily at 02:00 (server timezone) — a low-traffic window.

### Add via cPanel UI

1. cPanel → **Advanced → Cron Jobs**.
2. Under "Add New Cron Job":
   - **Common Settings**: `0 2 * * *` (Once a Day at 2 AM)
   - **Minute**: `0`
   - **Hour**: `2`
   - **Day**: `*`
   - **Month**: `*`
   - **Weekday**: `*`
   - **Command**: `/home/aloeduca/alaminn.info/scripts/backup.sh >> /home/aloeduca/alaminn.info/storage/logs/backup.log 2>&1`
3. Click **Add New Cron Job**.

### Add via crontab (Terminal)

```bash
crontab -e
# Append:
0 2 * * * /home/aloeduca/alaminn.info/scripts/backup.sh >> /home/aloeduca/alaminn.info/storage/logs/backup.log 2>&1
# Save and exit (:wq in vi)
```

### Verify

Run the script manually once to confirm it works:

```bash
cd ~/alaminn.info
bash scripts/backup.sh

# Verify the artefact
ls -lh storage/backups/
# Expect: alaminn_info_YYYYMMDD_HHMMSS.sql.gz (1-20 MB)
# Expect: alaminn_info_YYYYMMDD_HHMMSS.sql.gz.sha256 (64 hex chars + filename)

# Verify the log
tail -20 storage/logs/backup.log
# Expect: "Backup completed: alaminn_info_YYYYMMDD_HHMMSS.sql.gz (N bytes)"
```

### Recommended: weekly verification cron

Add a weekly verify cron to catch silent backup corruption:

```bash
# crontab entry:
0 6 * * 0 /home/aloeduca/alaminn.info/scripts/verify-backup.sh >> /home/aloeduca/alaminn.info/storage/logs/backup.log 2>&1
```

This runs every Sunday at 06:00 and verifies the latest backup. If any check fails, the log will show the failure (and cron will email the account owner if `MAILTO` is set).

---

## Step 2 — The restore procedure

> ⚠️ **Restore is destructive** — it OVERWRITES the live database with the contents of the backup file. Any data created AFTER the backup timestamp will be LOST.

### Pre-restore checklist

Before restoring:

1. **Confirm the restore is necessary** (failed migration, data corruption, accidental delete, etc.). If you can fix-forward without restoring, do that instead.
2. **Notify stakeholders** that the site will be in maintenance mode for 5–15 minutes.
3. **Verify the backup file is valid**:
   ```bash
   bash scripts/verify-backup.sh storage/backups/<file>.sql.gz
   # All 5 checks must PASS.
   ```
4. **Take a manual pre-restore snapshot** (in addition to the script's automatic one):
   ```bash
   bash scripts/backup.sh
   # This creates a final snapshot of the current (broken) state for forensic analysis.
   ```
5. **Put the site in maintenance mode** (optional — set `Setting: maintenance_mode=true` in the DB, or stop the app via cPanel UI).

### Running the restore

```bash
cd ~/alaminn.info
bash scripts/restore.sh storage/backups/<file>.sql.gz
```

### Interactive prompts

The script will:
1. Print the target database name and the backup file path.
2. Print the SHA-256 checksum of the backup.
3. Print a pre-restore safety snapshot path (auto-created).
4. Prompt:
   ```
   Type RESTORE to confirm, anything else to abort:
   ```
5. Type `RESTORE` (uppercase, no quotes) and press Enter.

### What happens during restore

1. **Pre-restore snapshot** is created at `storage/backups/pre-restore_YYYYMMDD_HHMMSS.sql.gz` (this is your UNDO button).
2. The backup file's SHA-256 is verified (if `.sha256` sibling exists).
3. The backup file's gzip integrity is verified (`gunzip -t`).
4. The SQL is piped to `mysql` via the defaults-extra-file (credentials never on argv).
5. Tables are counted post-import — expected 55.
6. If table count matches: success message, exit 0.
7. If table count doesn't match: the script prints the discrepancy and exits 1. The pre-restore snapshot is still available for a rollback.

### Post-restore verification

```bash
# 1. Verify the app can read the restored DB
curl -s https://alaminn.info/api/health | python3 -m json.tool
# Expect: {"status":"ok",...}

# 2. Verify a known record is back
mysql -u aloeduca_alamin_crm -p'ALO2026a' aloeduca_alamin_crm -e "
  SELECT email, role FROM User WHERE email='admin@alaminn.info';
"
# Expect: admin@alaminn.info / SUPER_ADMIN

# 3. Spot-check Higher Study data
mysql -u aloeduca_alamin_crm -p'ALO2026a' aloeduca_alamin_crm -e "
  SELECT slug, officialName FROM HigherStudyUniversity LIMIT 5;
"

# 4. Take the site out of maintenance mode (if you enabled it)
# Restart the app via cPanel UI.
```

---

## Step 3 — Backup verification (offline)

Run `verify-backup.sh` ANY TIME — it doesn't touch the database.

### Verify the latest backup

```bash
cd ~/alaminn.info
bash scripts/verify-backup.sh
# (No argument — uses the most recent .sql.gz in storage/backups/)
```

### Verify a specific backup

```bash
bash scripts/verify-backup.sh storage/backups/alaminn_info_20260101_020000.sql.gz
```

### Verify an absolute path

```bash
bash scripts/verify-backup.sh /tmp/some-other-backup.sql.gz
```

### Expected output (all passing)

```
Verifying: storage/backups/alaminn_info_20260101_020000.sql.gz
[1/5] File exists and is non-empty .................. PASS
[2/5] SHA-256 checksum matches ...................... PASS
[3/5] gzip integrity (gunzip -t) .................... PASS
[4/5] CREATE TABLE count = 55 ........................ PASS
[5/5] Key tables present:
        - User ..................................... PASS
        - HigherStudyUniversity .................... PASS
        - HigherStudyScholarship ................... PASS
        - EnglishLearningCourse .................... PASS

All checks PASSED.
```

### If any check fails

The script exits 1 and prints which check failed:

```
[3/5] gzip integrity (gunzip -t) .................... FAIL
  gunzip: data stream error
```

**Action**: the backup file is corrupted. Delete it and run `backup.sh` again to create a fresh one. Don't rely on a corrupted backup.

---

## Step 4 — Retention policy (30 days)

By default, `backup.sh` keeps backups for **30 days**. Backups older than 30 days are automatically pruned at the end of each run.

### Customizing retention

Override the default via the `BACKUP_RETENTION_DAYS` env var:

```bash
# Keep 90 days instead of 30
BACKUP_RETENTION_DAYS=90 bash scripts/backup.sh

# Or set in .env (then it applies to all runs):
echo "BACKUP_RETENTION_DAYS=90" >> ~/alaminn.info/.env
```

### Cron example with custom retention

```bash
# crontab entry:
0 2 * * * BACKUP_RETENTION_DAYS=90 /home/aloeduca/alaminn.info/scripts/backup.sh >> /home/aloeduca/alaminn.info/storage/logs/backup.log 2>&1
```

### Why 30 days?

- 30 daily backups = ~30 GB worst-case (each backup is ~500 MB max with full data; typically 1–20 MB).
- 30 days is long enough to discover a slow-burn data corruption (e.g. a bad migration that ran 2 weeks ago).
- 30 days is short enough to keep disk usage manageable on shared cPanel hosting (typically 5–20 GB total).

For compliance (e.g. GDPR audit trails requiring 7-year retention), pipe backups to long-term storage (S3 Glacier, Backblaze B2) via the off-server option below.

---

## Step 5 — Off-server backup (rsync to another server)

Local backups protect against data corruption but NOT against server loss (hardware failure, hosting provider bankruptcy, ransomware). For full protection, sync backups off-server.

### rsync to another VPS

```bash
# On the Alaminn.info server:
rsync -avz --delete \
  -e "ssh -i /home/aloeduca/.ssh/offsite_backup_key" \
  /home/aloeduca/alaminn.info/storage/backups/ \
  backup-user@offsite-server.example.com:/backups/alaminn.info/
```

Set up SSH key-based auth (no password) so this can run unattended:

1. **On the Alaminn.info server**:
   ```bash
   ssh-keygen -t ed25519 -f /home/aloeduca/.ssh/offsite_backup_key -N ""
   cat /home/aloeduca/.ssh/offsite_backup_key.pub
   ```

2. **On the offsite server** (as `backup-user`):
   ```bash
   mkdir -p ~/.ssh
   echo "<paste-public-key>" >> ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   mkdir -p /backups/alaminn.info/
   ```

3. **Test the rsync manually**:
   ```bash
   rsync -avz --dry-run \
     -e "ssh -i /home/aloeduca/.ssh/offsite_backup_key" \
     /home/aloeduca/alaminn.info/storage/backups/ \
     backup-user@offsite-server.example.com:/backups/alaminn.info/
   ```

4. **Add to crontab** (runs 30 min after the local backup):
   ```bash
   30 2 * * * rsync -avz --delete \
     -e "ssh -i /home/aloeduca/.ssh/offsite_backup_key" \
     /home/aloeduca/alaminn.info/storage/backups/ \
     backup-user@offsite-server.example.com:/backups/alaminn.info/ \
     >> /home/aloeduca/alaminn.info/storage/logs/backup.log 2>&1
   ```

### rsync to cloud storage (S3, B2, etc.)

Use `rclone` for cloud destinations:

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure (one-time, interactive)
rclone config
# Choose: s3, b2, etc.
# Name the remote: alaminn-offsite

# Sync to S3:
rclone sync /home/aloeduca/alaminn.info/storage/backups/ alaminn-offsite:alaminn-backups/ --transfers 4

# Add to crontab:
30 2 * * * rclone sync /home/aloeduca/alaminn.info/storage/backups/ alaminn-offsite:alaminn-backups/ --transfers 4 --log-file /home/aloeduca/alaminn.info/storage/logs/rclone.log
```

### Off-server retention

Apply a separate retention policy on the offsite server (typically longer — 90 or 365 days). The local 30-day policy prunes the local copies; the offsite server retains its own history.

---

## Step 6 — The mandatory restore test

> ⚠️ A backup you've never restored from is NOT a backup. It's a hope.

### What to test

In a maintenance window (early morning, low traffic):

1. Take a fresh backup.
2. Restore it to a STAGING database (NOT production) — OR restore to production if no staging exists, after notifying users.
3. Verify the app works against the restored DB.

### Procedure (with staging DB)

If you have a staging database (e.g. `aloeduca_alamin_staging`):

1. **Restore to staging**:
   ```bash
   # Override DATABASE_URL to point at staging
   DATABASE_URL='mysql://aloeduca_alamin_crm:ALO2026a@localhost:3306/aloeduca_alamin_staging' \
     bash scripts/restore.sh storage/backups/<latest>.sql.gz
   ```
2. **Verify staging**:
   - Spin up a staging app instance pointing at the staging DB.
   - Visit the staging URL.
   - Verify admin login works.
   - Verify Higher Study routes return 200.
   - Verify English Learning routes return 200.
3. **Tear down staging**:
   ```bash
   mysql -u aloeduca_alamin_crm -p -e "DROP DATABASE aloeduca_alamin_staging;"
   ```

### Procedure (without staging DB — production maintenance window)

If you don't have a staging DB:

1. **Notify users**: post a banner 24h in advance ("Maintenance window: 2026-XX-YY 03:00–04:00 UTC").
2. **At 03:00 UTC**: enable maintenance mode (or stop the app via cPanel UI).
3. **Take a fresh backup** (just to be safe):
   ```bash
   bash scripts/backup.sh
   ```
4. **Restore from an older backup** (e.g. yesterday's):
   ```bash
   bash scripts/restore.sh storage/backups/alaminn_info_<yesterday>.sql.gz
   ```
5. **Verify**:
   - `curl -s https://alaminn.info/api/health` → `{"status":"ok"}`
   - Log in as admin.
   - Visit `/higher-study/universities` — should list 20 universities.
6. **If verification passes**: the restore worked. You can either keep the restored state (data is 24h old) OR restore back from the fresh backup you just took in step 3:
   ```bash
   bash scripts/restore.sh storage/backups/alaminn_info_<just-now>.sql.gz
   ```
7. **Take the site out of maintenance mode**.

### When to run the restore test

- **Before declaring production ready** (mandatory — see `ROLLBACK_GUIDE.md`).
- **Quarterly** (every 3 months) to catch silent backup corruption.
- **After any major schema migration** (verify the new schema restores cleanly).
- **After any change to `backup.sh` / `restore.sh`** (verify the scripts still work).

---

## Quick reference

```bash
# ─── Backup ───────────────────────────────────────────────────────
cd ~/alaminn.info
bash scripts/backup.sh
# Output: storage/backups/alaminn_info_YYYYMMDD_HHMMSS.sql.gz + .sha256

# ─── Verify (offline — doesn't touch DB) ──────────────────────────
bash scripts/verify-backup.sh                                    # latest
bash scripts/verify-backup.sh storage/backups/<file>.sql.gz      # specific

# ─── Restore (interactive — requires typing RESTORE) ─────────────
bash scripts/restore.sh storage/backups/<file>.sql.gz

# ─── Retention override ──────────────────────────────────────────
BACKUP_RETENTION_DAYS=90 bash scripts/backup.sh

# ─── Daily cron ──────────────────────────────────────────────────
# 0 2 * * * /home/aloeduca/alaminn.info/scripts/backup.sh >> /home/aloeduca/alaminn.info/storage/logs/backup.log 2>&1

# ─── Weekly verify cron ──────────────────────────────────────────
# 0 6 * * 0 /home/aloeduca/alaminn.info/scripts/verify-backup.sh >> /home/aloeduca/alaminn.info/storage/logs/backup.log 2>&1

# ─── Off-site sync (rsync) ───────────────────────────────────────
# 30 2 * * * rsync -avz --delete -e "ssh -i ~/.ssh/offsite_backup_key" \
#   /home/aloeduca/alaminn.info/storage/backups/ \
#   backup-user@offsite.example.com:/backups/alaminn.info/
```

---

## Reference

- **Backup script**: `scripts/backup.sh` (200+ lines, cPanel cron compatible)
- **Restore script**: `scripts/restore.sh` (interactive, pre-restore safety snapshot)
- **Verify script**: `scripts/verify-backup.sh` (offline, 5 checks)
- **Backup output dir**: `storage/backups/`
- **Backup log**: `storage/logs/backup.log`
- **Restore log**: `storage/logs/restore.log`
- **Lock file (backup)**: `/tmp/alaminn-backup.lock`
- **Lock file (restore)**: `/tmp/alaminn-restore.lock`
- **Expected table count**: 55 (configurable via `EXPECTED_TABLES`)
- **Default retention**: 30 days (configurable via `BACKUP_RETENTION_DAYS`)
- **Credentials handling**: `mktemp` defaults-extra-file, mode 0600, never on argv, trap-cleaned
- **Compression**: `gzip -9`
- **Checksum**: SHA-256 (64 hex chars)
- **Restore confirmation**: type `RESTORE` literally
- **Mandatory restore test**: before declaring production ready, quarterly, after schema changes, after script edits
