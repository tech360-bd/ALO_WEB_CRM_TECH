# Database Backup & Restore — Alaminn.info V5

This document describes the automated SQLite backup / restore / verify
tooling for the Alaminn.info production database.

- **DB file**: `/home/z/my-project/db/custom.db`
- **Backup directory**: `/home/z/my-project/db/backups/`
- **Backup log**: `/home/z/my-project/db/backups/backup.log`
- **Engine**: SQLite (via Prisma + `bun:sqlite` for scripting)

All scripts are plain TypeScript executed with Bun. No extra
dependencies are required — they use Bun's built-in `bun:sqlite`
module.

---

## 1. Scripts

| Script                       | npm alias       | Purpose                                            |
| ---------------------------- | --------------- | -------------------------------------------------- |
| `scripts/backup-db.ts`       | `bun run db:backup`  | Snapshot the live DB, verify, prune old backups.   |
| `scripts/restore-db.ts`      | `bun run db:restore` | Restore the live DB from a named backup file.      |
| `scripts/verify-db.ts`       | `bun run db:verify`  | Run integrity_check + FK check + row counts.       |

### 1.1 `db:backup`

```bash
bun run db:backup
# or:
bun run scripts/backup-db.ts
```

What it does, in order:

1. Opens the live DB **read-only** (a backup script must never mutate
   production data).
2. Runs `PRAGMA integrity_check` on the source — aborts if the source
   is corrupt.
3. Runs SQLite's native **`VACUUM INTO '<path>'`** which atomically
   writes a consistent, defragmented snapshot to a new file. This is
   safe to run while the Next.js server is live (SQLite holds a shared
   lock during the snapshot).
4. Opens the freshly written backup **read-only** and runs
   `PRAGMA integrity_check` on it. If the backup is corrupt it is
   deleted and the script exits `1`.
5. Prunes old backups per the retention policy (see §3).
6. Logs everything to stdout **and** appends to
   `db/backups/backup.log`.

**Filename format**: `alaminn-YYYY-MM-DD-HHMMSS.db`

**Exit codes**: `0` success, `1` failure.

### 1.2 `db:restore`

```bash
bun run db:restore -- <backup-file>            # interactive
bun run db:restore -- <backup-file> --yes      # non-interactive
echo yes | bun run db:restore -- <backup-file> # piped confirmation
```

`<backup-file>` may be:

- Just a filename (e.g. `alaminn-2026-07-12-030100.db`) — resolved
  against `db/backups/`.
- An absolute path.
- A path relative to the current working directory.

What it does, in order:

1. Resolves and locates the backup file.
2. **Verifies the backup's integrity** via `PRAGMA integrity_check`.
   If the backup is corrupt the script aborts **without touching the
   live DB**.
3. Asks for explicit confirmation. You can skip the prompt with
   `--yes` (or by piping `yes` into stdin).
4. **Creates a pre-restore snapshot** of the current live DB using
   `VACUUM INTO`, named `pre-restore-alaminn-YYYY-MM-DD-HHMMSS.db`.
   This is your "undo" — you can always restore THIS file to roll back
   the restore.
5. **Atomically replaces** the live DB file:
   - `rename(live.db, live.db.restoring-<ts>)` (atomic on same FS)
   - `copyFileSync(backup, live.db)`
   - Verify the new live.db with `PRAGMA integrity_check`
   - On any failure, roll back: `unlink(live.db); rename(tmp, live.db)`
   - On success, `unlink(live.db.restoring-<ts>)`
6. Logs every step to stdout **and** `db/backups/backup.log`.

**Exit codes**: `0` success, `1` aborted (corrupt backup, user
declined, IO error, post-restore integrity failure).

### 1.3 `db:verify`

```bash
bun run db:verify
```

What it does:

1. Opens the live DB read-only.
2. Runs `PRAGMA integrity_check`.
3. Runs `PRAGMA foreign_key_check` — flags any broken FK references.
4. Lists every user table with a row count. Tables that are expected
   to be non-empty (User, Project, Article, Resource, ImpactRecord,
   CaseStudy, Partnership) are flagged if they are empty.
5. Reports a Prisma migration count if the `_prisma_migrations` table
   exists (it does NOT when using `prisma db push`, which this project
   uses — that is normal, not an anomaly).
6. Prints a summary. Exit `0` if healthy, `1` if any anomalies were
   found.

---

## 2. Running Backups Manually

```bash
cd /home/z/my-project

# One-off backup
bun run db:backup

# Verify the DB is healthy
bun run db:verify

# List existing backups
ls -lh db/backups/

# Tail the backup log
tail -f db/backups/backup.log
```

---

## 3. Retention Policy

### Implemented (current)

The `db:backup` script keeps the **most recent 30 backup files** in
`db/backups/`. Older backups are deleted automatically after each
successful run. The pruning happens **after** a successful backup +
integrity verification, so we never delete good backups to make room
for one that turned out to be corrupt.

### Recommended production strategy (tiered)

For a more aggressive retention strategy, the cron entries below
combined with a small `find`-based prune can implement:

- Keep the last **24 hourly** backups (1 day of granular recovery)
- Keep the last **7 daily** backups (1 week of daily recovery)
- Keep the last **4 weekly** backups (1 month of weekly recovery)
- Keep the last **12 monthly** backups (1 year of monthly recovery)

This is not currently automated by the script (the spec calls for
"keep last 30" which is what we implement). To enable the tiered
strategy, replace the retention constant in
`scripts/backup-db.ts` (`RETENTION_COUNT`) with a tiered prune
function. The skeleton is left as a future enhancement.

### Manual cleanup

If you ever need to manually purge old backups:

```bash
# Keep the most recent 30, delete the rest
cd /home/z/my-project/db/backups
ls -1t alaminn-*.db | tail -n +31 | xargs -r rm -v
```

---

## 4. Automated Backups via Cron

Hourly cron entry (recommended baseline):

```cron
# m h  dom mon dow   command
0 * * * * cd /home/z/my-project && bun run db:backup >> db/backups/backup.log 2>&1
```

Daily cron entry (in addition to hourly, for the tiered strategy):

```cron
30 3 * * * cd /home/z/my-project && bun run db:backup >> db/backups/backup.log 2>&1
```

Install with:

```bash
crontab -e
# paste the lines above, save, exit
crontab -l   # verify
```

Cron runs as your user — make sure:

- `bun` is on cron's PATH. Either use the absolute path to `bun`
  (e.g. `/home/z/.bun/bin/bun`) or set `PATH=` at the top of the
  crontab.
- The working directory (`/home/z/my-project`) is readable by your
  user.
- The `DATABASE_URL` env var is set in `.env`, OR the script will
  fall back to `db/custom.db` relative to the project root (which is
  the case for this project).

Example crontab header with PATH:

```cron
PATH=/home/z/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
SHELL=/bin/bash
0 * * * * cd /home/z/my-project && bun run db:backup >> db/backups/backup.log 2>&1
```

---

## 5. Restoring From a Backup

### 5.1 Standard restore

```bash
cd /home/z/my-project

# 1. List available backups (newest at the bottom)
ls -ltr db/backups/alaminn-*.db

# 2. (Optional but recommended) Stop the live server so nothing writes
#    to the DB during the restore.
#    (In this project the dev server auto-restarts; for production:
#    `systemctl stop alaminn` or `pm2 stop alaminn`)

# 3. Restore interactively (will prompt for confirmation)
bun run db:restore -- alaminn-2026-07-12-030100.db

#    OR skip the prompt (scripted / cron-driven recovery):
bun run db:restore -- alaminn-2026-07-12-030100.db --yes

# 4. Verify the restored DB is healthy
bun run db:verify

# 5. Restart the server (if you stopped it in step 2)
```

The restore script **always** creates a `pre-restore-alaminn-*.db`
snapshot of the *current* live DB before overwriting it. If the
restore turns out to be the wrong move, you can roll back by
restoring THAT file:

```bash
ls -ltr db/backups/pre-restore-alaminn-*.db
bun run db:restore -- pre-restore-alaminn-2026-07-12-030200.db --yes
```

### 5.2 Restore from an arbitrary file

```bash
# Absolute path
bun run db:restore -- /path/to/my-snapshot.db --yes

# Relative path (resolved against CWD)
bun run db:restore -- ../snapshots/old.db --yes
```

### 5.3 What the restore script will NEVER do

- Restore a backup that fails `PRAGMA integrity_check`. The live DB
  is left untouched.
- Overwrite the live DB without first creating a pre-restore
  snapshot. If the snapshot step fails, the script aborts.
- Leave the live DB in a broken state if the replacement fails. The
  script rolls back to the previous live DB file (preserved as
  `<db>.restoring-<ts>` during the swap).

---

## 6. Disaster Recovery

### 6.1 The DB file is gone / truncated

```bash
# 1. Find the newest good backup
ls -ltr db/backups/alaminn-*.db
bun run db:verify    # confirm even the live (broken) state — may fail

# 2. Restore the newest backup non-interactively
NEWEST=$(ls -1t db/backups/alaminn-*.db | head -n1)
bun run db:restore -- "$NEWEST" --yes

# 3. Verify
bun run db:verify

# 4. Restart the Next.js server
```

### 6.2 The DB file is corrupt

```bash
# 1. Verify (will report corruption)
bun run db:verify

# 2. If integrity_check fails, do NOT run db:backup (it will refuse
#    anyway). Restore from the newest good backup:
ls -1t db/backups/alaminn-*.db | head -n5
bun run db:restore -- alaminn-<newest>.db --yes

# 3. Verify
bun run db:verify
```

### 6.3 The whole project directory is gone

Restore from your off-host backups (you DO have off-host backups,
right?). The minimum files needed to recover are:

- `db/backups/alaminn-*.db` (the SQLite snapshot)
- `prisma/schema.prisma` (so `prisma generate` can rebuild the client)
- `package.json` and `bun.lock` (so `bun install` can rebuild deps)
- The `.env` file (or at minimum the `AUTH_SECRET`, `DATABASE_URL`,
  `SMTP_*`, `EMAIL_FROM` values — without `AUTH_SECRET` existing
  sessions become invalid but the data is intact)

Recovery steps:

```bash
# 1. Re-provision host: clone repo, restore .env, restore db/backups/
git clone <repo> alaminn
cd alaminn
cp /path/to/saved/.env .
cp /path/to/saved/db/backups/*.db db/backups/

# 2. Install deps
bun install

# 3. Restore the DB
NEWEST=$(ls -1t db/backups/alaminn-*.db | head -n1)
bun run db:restore -- "$NEWEST" --yes

# 4. Regenerate Prisma client
bun run db:generate

# 5. Verify
bun run db:verify

# 6. Start the server
bun run dev    # or your production start command
```

### 6.4 The backup directory itself is gone

If `db/backups/` is empty or missing:

1. **Stop writing to the DB** (stop the Next.js server).
2. Copy the live `db/custom.db` to a safe location — that is your
   only current "backup".
3. Recreate the backups directory: `mkdir -p db/backups`.
4. Restart the server.
5. Run `bun run db:backup` to create a fresh backup.
6. **Set up off-host replication** (rsync to a remote host, S3 sync,
   etc.) — see §7.

### 6.5 A "successful" restore broke the app

If you restored an older backup and the app throws schema errors
(typically: Prisma client expects a column that the backup doesn't
have):

```bash
# Option A — roll back to the pre-restore snapshot
ls -1t db/backups/pre-restore-alaminn-*.db
bun run db:restore -- pre-restore-alaminn-<ts>.db --yes

# Option B — re-apply the current schema to the restored DB
# (destructive: any columns missing from the backup will be added
#  empty; any columns missing from the schema will be dropped)
bun run db:push
```

---

## 7. Off-Host Replication (recommended)

The scripts in this repo create **local** backups only. For real
disaster recovery you should also replicate the backups off-host.
A few options:

### 7.1 rsync to a remote host (simplest)

Append to the hourly cron entry:

```cron
0 * * * * cd /home/z/my-project && bun run db:backup >> db/backups/backup.log 2>&1 && rsync -az --delete db/backups/ user@backup-host:/srv/backups/alaminn/
```

### 7.2 S3 sync

```bash
aws s3 sync db/backups/ s3://alaminn-backups/db/ --exclude "backup.log" --delete
```

(Add to cron after the `db:backup` step.)

### 7.3 Restic / Borg backup

For deduplicated, encrypted, incremental off-host backups:

```bash
restic -r sftp:backup-host:/srv/restic/alaminn backup db/backups/
```

---

## 8. Verifying Backups Are Working

After deploying the cron entry, check the log daily for the first
week:

```bash
tail -n 100 db/backups/backup.log
```

You should see one entry per hour that looks like:

```
[2026-07-12T03:00:00.123Z] ── Backup start ───────────────────────────────────────
[2026-07-12T03:00:00.124Z] Source DB : /home/z/my-project/db/custom.db
[2026-07-12T03:00:00.124Z] Backup to : /home/z/my-project/db/backups/alaminn-2026-07-12-030000.db
[2026-07-12T03:00:00.130Z] Source int: ok
[2026-07-12T03:00:00.250Z] Backup size: 244.00 KB (249856 bytes)
[2026-07-12T03:00:00.251Z] Backup int : ok
[2026-07-12T03:00:00.251Z] Backup objs: 20 tables in schema
[2026-07-12T03:00:00.251Z] Duration   : 128 ms
[2026-07-12T03:00:00.251Z] Retention  : 1 backup(s) kept (max 30)
[2026-07-12T03:00:00.251Z] ── Backup OK ─────────────────────────────────────────
```

Set up a separate alert (e.g. healthchecks.io) on the cron job so
you get paged if a backup run is missed:

```cron
0 * * * * cd /home/z/my-project && bun run db:backup >> db/backups/backup.log 2>&1 && curl -fsS --retry 3 https://hc-ping.com/<uuid> > /dev/null
```

---

## 9. Quick Reference

```bash
# Backup now
bun run db:backup

# Verify DB is healthy
bun run db:verify

# List backups
ls -ltr db/backups/alaminn-*.db

# Restore (interactive)
bun run db:restore -- alaminn-2026-07-12-030100.db

# Restore (non-interactive / scripted)
bun run db:restore -- alaminn-2026-07-12-030100.db --yes

# Undo a restore (restore the pre-restore snapshot)
bun run db:restore -- pre-restore-alaminn-2026-07-12-030200.db --yes

# Tail the backup log
tail -f db/backups/backup.log

# Force a prune now (run a backup — it prunes as a side effect)
bun run db:backup
```
