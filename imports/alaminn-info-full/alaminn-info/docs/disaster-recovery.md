# Disaster Recovery — Alaminn.info V5

This document describes the backup strategy, restore procedure, verification
steps, and recovery scenarios for Alaminn.info. It also defines the RTO
(Recovery Time Objective) and RPO (Recovery Point Objective) targets.

For the operational reference of the backup/restore scripts, see
[backup-restore.md](./backup-restore.md). For environment variable setup, see
[environment.md](./environment.md). For deployment, see
[deployment.md](./deployment.md).

---

## 1. RTO / RPO Targets

| Metric | Target | Basis |
| --- | --- | --- |
| **RPO** (Recovery Point Objective) | ≤ 1 hour | Hourly cron-driven `db:backup`. Worst-case data loss = 1 hour of writes. |
| **RTO** (Recovery Time Objective) | ≤ 15 minutes | Restore from the newest good backup + verify + restart the server. The restore script is interactive but accepts `--yes` for scripted recovery. |
| **RTO (full host loss)** | ≤ 2 hours | Re-provision host, clone repo, restore `.env`, restore `db/backups/`, `bun install`, restore DB, regenerate Prisma client, start server. |

These targets assume:

- Hourly cron backups are firing (verify with `tail db/backups/backup.log`).
- Off-host replication of `db/backups/` is configured (rsync / S3 / Restic).
- The `.env` file (especially `AUTH_SECRET`) is stored in a secure off-host
  location (password manager, secrets vault).

---

## 2. Backup Strategy

### 2.1 What is backed up

| Asset | Backup method | Frequency |
| --- | --- | --- |
| **SQLite DB** (`db/custom.db`) | `scripts/backup-db.ts` (VACUUM INTO snapshot) | Hourly (cron) |
| **`db/backups/` directory** | Off-host replication (rsync / S3 / Restic) | Hourly (after each backup) |
| **`.env` file** | Manual — copy to password manager / secrets vault | On every change |
| **`prisma/schema.prisma`** | Git (version control) | On every commit |
| **`package.json` + `bun.lock`** | Git | On every commit |
| **Source code** | Git (off-host: GitHub / GitLab) | On every commit |
| **Brand assets** (`/public/brand/*`) | Git + off-host object storage | On every change |

The critical production state is the SQLite DB. Everything else is
reconstructable from Git + the `.env` file.

### 2.2 The backup script — `scripts/backup-db.ts`

What it does, in order:

1. Opens the live DB **read-only** (a backup script must never mutate prod).
2. Runs `PRAGMA integrity_check` on the source — aborts if the source is
   corrupt.
3. Uses SQLite's native **`VACUUM INTO '<path>'`** to produce a consistent,
   defragmented snapshot. This is safe to run while the Next.js server is
   live (SQLite holds a shared lock during the snapshot).
4. Opens the freshly written backup **read-only** and runs
   `PRAGMA integrity_check` on it. If the backup is corrupt it is deleted
   and the script exits `1`.
5. Prunes old backups per the retention policy (keep last 30 by default).
6. Logs everything to stdout **and** appends to `db/backups/backup.log`.

**Filename format:** `alaminn-YYYY-MM-DD-HHMMSS.db`
**Exit codes:** `0` success, `1` failure.

### 2.3 Retention policy

The `db:backup` script keeps the **most recent 30 backup files** in
`db/backups/`. Older backups are deleted automatically after each successful
run. The pruning happens **after** a successful backup + integrity
verification, so we never delete good backups to make room for one that
turned out to be corrupt.

Override the retention count for ops/testing:

```bash
BACKUP_RETENTION_COUNT=3 bun run scripts/backup-db.ts
```

### 2.4 Recommended tiered retention (production)

For a more aggressive retention strategy, replace the simple "keep last 30"
with a tiered prune:

| Tier | Count | Granularity |
| --- | --- | --- |
| Hourly | 24 | Last 24 hours |
| Daily | 7 | Last 7 days |
| Weekly | 4 | Last 4 weeks |
| Monthly | 12 | Last 12 months |

This is not currently automated by the script — it's documented in
`backup-restore.md` as a future enhancement.

### 2.5 Off-host replication

The scripts create **local** backups only. For real disaster recovery you
must replicate the backups off-host. Options:

#### rsync to a remote host (simplest)

```cron
0 * * * * cd /home/z/my-project && bun run scripts/backup-db.ts >> db/backups/backup.log 2>&1 && rsync -az --delete db/backups/ user@backup-host:/srv/backups/alaminn/
```

#### S3 sync

```bash
aws s3 sync db/backups/ s3://alaminn-backups/db/ --exclude "backup.log" --delete
```

#### Restic / Borg (deduplicated + encrypted)

```bash
restic -r sftp:backup-host:/srv/restic/alaminn backup db/backups/
```

### 2.6 Automated cron entry

Hourly cron (recommended baseline):

```cron
PATH=/home/z/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
SHELL=/bin/bash
0 * * * * cd /home/z/my-project && bun run scripts/backup-db.ts >> db/backups/backup.log 2>&1
30 3 * * * cd /home/z/my-project && bun run scripts/backup-db.ts >> db/backups/backup.log 2>&1
```

Install with:

```bash
crontab -e
# paste the lines above, save, exit
crontab -l   # verify
```

Add a heartbeat ping so you get alerted if a backup run is missed:

```cron
0 * * * * cd /home/z/my-project && bun run scripts/backup-db.ts >> db/backups/backup.log 2>&1 && curl -fsS --retry 3 https://hc-ping.com/<uuid> > /dev/null
```

### 2.7 Verifying backups are working

After deploying the cron entry, check the log daily for the first week:

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

If you see `── Backup FAILED ──` or `[ERROR]` lines, investigate immediately.

---

## 3. Restore Procedure

### 3.1 The restore script — `scripts/restore-db.ts`

What it does, in order:

1. Resolves the backup file path (relative to `db/backups/`, CWD, or absolute).
2. **Verifies the backup's integrity** via `PRAGMA integrity_check`. If the
   backup is corrupt the script aborts **without touching the live DB**.
3. Asks for explicit confirmation. Skip with `--yes` or by piping `yes` into
   stdin.
4. **Creates a pre-restore snapshot** of the current live DB using
   `VACUUM INTO`, named `pre-restore-alaminn-YYYY-MM-DD-HHMMSS.db`. This is
   your "undo" — you can always restore THIS file to roll back the restore.
5. **Atomically replaces** the live DB file:
   - `rename(live.db, live.db.restoring-<ts>)` (atomic on same filesystem).
   - `copyFileSync(backup, live.db)`.
   - Verify the new live.db with `PRAGMA integrity_check`.
   - On any failure, roll back: `unlink(live.db); rename(tmp, live.db)`.
   - On success, `unlink(live.db.restoring-<ts>)`.
6. Logs every step to stdout **and** `db/backups/backup.log`.

**Exit codes:** `0` success, `1` aborted (corrupt backup, user declined, IO
error, post-restore integrity failure).

### 3.2 Standard restore

```bash
cd /home/z/my-project

# 1. List available backups (newest at the bottom)
ls -ltr db/backups/alaminn-*.db

# 2. (Optional but recommended) Stop the live server so nothing writes
#    to the DB during the restore.
#    systemctl stop alaminn   # or: pm2 stop alaminn

# 3. Restore interactively (will prompt for confirmation)
bun run scripts/restore-db.ts alaminn-2026-07-12-030100.db

#    OR skip the prompt (scripted / cron-driven recovery):
bun run scripts/restore-db.ts alaminn-2026-07-12-030100.db --yes

# 4. Verify the restored DB is healthy
bun run scripts/verify-db.ts

# 5. Restart the server (if you stopped it in step 2)
#    systemctl start alaminn
```

### 3.3 Undoing a restore

The restore script **always** creates a `pre-restore-alaminn-*.db` snapshot
of the *current* live DB before overwriting it. To undo a restore:

```bash
ls -ltr db/backups/pre-restore-alaminn-*.db
bun run scripts/restore-db.ts pre-restore-alaminn-2026-07-12-030200.db --yes
```

### 3.4 Restore from an arbitrary file

```bash
# Absolute path
bun run scripts/restore-db.ts /path/to/my-snapshot.db --yes

# Relative path (resolved against CWD)
bun run scripts/restore-db.ts ../snapshots/old.db --yes
```

### 3.5 What the restore script will NEVER do

- Restore a backup that fails `PRAGMA integrity_check`. The live DB is left
  untouched.
- Overwrite the live DB without first creating a pre-restore snapshot. If
  the snapshot step fails, the script aborts.
- Leave the live DB in a broken state if the replacement fails. The script
  rolls back to the previous live DB file (preserved as
  `<db>.restoring-<ts>` during the swap).

---

## 4. Verification

### 4.1 The verify script — `scripts/verify-db.ts`

What it does:

1. Opens the live DB read-only.
2. Runs `PRAGMA integrity_check`.
3. Runs `PRAGMA foreign_key_check` — flags any broken FK references.
4. Lists every user table with a row count. Tables that are expected to be
  non-empty (User, Project, Article, Resource, ImpactRecord, CaseStudy) are
  flagged if they are empty.
5. Reports a Prisma migration count if the `_prisma_migrations` table exists
   (it does NOT when using `prisma db push`, which this project uses — that
   is normal, not an anomaly).
6. Prints a summary. Exit `0` if healthy, `1` if any anomalies were found.

### 4.2 Post-restore verification checklist

After every restore, run through this checklist:

- [ ] `bun run scripts/verify-db.ts` reports `0 anomalies`.
- [ ] `curl -fsS https://alaminn.info/api/health` returns `{"status":"ok"}`.
- [ ] `curl -fsS https://alaminn.info/api/health/deep` (authenticated as
      SECURITY_AUDITOR) shows `checks.database.status: "ok"` and
      `checks.content.status: "ok"` with the expected counts.
- [ ] Sign in to the Command Center as OWNER — dashboard loads with the
      expected inquiries, opportunities, AI tasks, meetings, audit logs.
- [ ] Submit a test inquiry through the public contact form — confirm the
      reference is generated and the confirmation email arrives.
- [ ] `tail -n 50 db/backups/backup.log` shows no `[ERROR]` lines since the
      restore.

---

## 5. Recovery Scenarios

### 5.1 The DB file is gone / truncated

```bash
# 1. Find the newest good backup
ls -ltr db/backups/alaminn-*.db
bun run scripts/verify-db.ts   # confirm even the live (broken) state — may fail

# 2. Restore the newest backup non-interactively
NEWEST=$(ls -1t db/backups/alaminn-*.db | head -n1)
bun run scripts/restore-db.ts "$NEWEST" --yes

# 3. Verify
bun run scripts/verify-db.ts

# 4. Restart the Next.js server
systemctl restart alaminn
```

**RTO:** ~5 minutes (single restore + verify + restart).
**RPO:** ≤ 1 hour (last successful hourly backup).

### 5.2 The DB file is corrupt

```bash
# 1. Verify (will report corruption)
bun run scripts/verify-db.ts

# 2. If integrity_check fails, do NOT run db:backup (it will refuse
#    anyway — it checks source integrity first). Restore from the newest
#    good backup:
ls -1t db/backups/alaminn-*.db | head -n5
bun run scripts/restore-db.ts alaminn-<newest>.db --yes

# 3. Verify
bun run scripts/verify-db.ts

# 4. Restart
systemctl restart alaminn
```

**RTO:** ~5 minutes.
**RPO:** ≤ 1 hour.

### 5.3 The whole project directory is gone

Restore from your off-host backups. The minimum files needed to recover are:

- `db/backups/alaminn-*.db` (the SQLite snapshot)
- `prisma/schema.prisma` (so `prisma generate` can rebuild the client)
- `package.json` and `bun.lock` (so `bun install` can rebuild deps)
- The `.env` file (or at minimum the `AUTH_SECRET`, `DATABASE_URL`,
  `SMTP_*`, `EMAIL_FROM` values — without `AUTH_SECRET` existing sessions
  become invalid but the data is intact)

Recovery steps:

```bash
# 1. Re-provision host: clone repo, restore .env, restore db/backups/
git clone <repo> alaminn
cd alaminn
cp /path/to/saved/.env .
cp -r /path/to/saved/db/backups/*.db db/backups/

# 2. Install deps
bun install

# 3. Restore the DB
NEWEST=$(ls -1t db/backups/alaminn-*.db | head -n1)
bun run scripts/restore-db.ts "$NEWEST" --yes

# 4. Regenerate Prisma client
bun run db:generate

# 5. Verify
bun run scripts/verify-db.ts

# 6. Build + start the server
bun run build
NODE_ENV=production bun .next/standalone/server.js
```

**RTO:** ~2 hours (host re-provisioning dominates).
**RPO:** ≤ 1 hour (assuming off-host replication was firing).

### 5.4 The backup directory itself is gone

If `db/backups/` is empty or missing:

1. **Stop writing to the DB** (stop the Next.js server):
   `systemctl stop alaminn`.
2. Copy the live `db/custom.db` to a safe location — that is your only
   current "backup".
3. Recreate the backups directory: `mkdir -p db/backups`.
4. Restart the server: `systemctl start alaminn`.
5. Run `bun run scripts/backup-db.ts` to create a fresh backup.
6. **Set up off-host replication** (rsync / S3 / Restic) so this can't
   happen again.

**RPO if caught immediately:** 0 (the live DB is intact).
**RPO if not caught:** catastrophic — the next DB failure loses everything
since the last good backup.

### 5.5 A "successful" restore broke the app

If you restored an older backup and the app throws schema errors (typically:
Prisma client expects a column that the backup doesn't have):

```bash
# Option A — roll back to the pre-restore snapshot
ls -1t db/backups/pre-restore-alaminn-*.db
bun run scripts/restore-db.ts pre-restore-alaminn-<ts>.db --yes

# Option B — re-apply the current schema to the restored DB
# (destructive: any columns missing from the backup will be added
#  empty; any columns missing from the schema will be dropped)
bun run db:push
```

Option A is preferred — it's a clean rollback. Option B is for cases where
the pre-restore snapshot is also broken or unavailable.

### 5.6 AUTH_SECRET was leaked

If `AUTH_SECRET` is compromised (e.g., committed to a public repo, exfiltrated):

1. Generate a new secret: `openssl rand -hex 32`.
2. Update `.env` with the new `AUTH_SECRET`.
3. Restart the server: `systemctl restart alaminn`.
4. All existing sessions become invalid (the HMAC verification fails). Users
   will need to sign in again.
5. **No data is lost** — passwords are hashed with scrypt (not with
   `AUTH_SECRET`), so the User table is unaffected.
6. Notify all staff to expect to re-authenticate.
7. Investigate how the leak occurred (git history, CI logs, deployed
   artifacts) and rotate any other secrets that may have been exposed.

**RTO:** ~5 minutes (rotate + restart).
**RPO:** 0 (no data loss — sessions are stateless).

### 5.7 SMTP credentials were leaked

1. Reset the SMTP password at the provider (Gmail App Password, Resend API
   key, etc.).
2. Update `.env` with the new credentials.
3. Restart the server: `systemctl restart alaminn`.
4. Pending emails in the in-app retry queue (in-memory) are lost on restart —
   they would have been retried for up to ~20 seconds (3 attempts ×
   exponential backoff 1s → 4s → 16s). Acceptable — the triggering requests
   already succeeded from the user's perspective.
5. Check `server.log` for any `email.send_failed` entries during the leak
   window — those emails were NOT delivered and should be re-sent manually
   if important.

**RTO:** ~5 minutes.
**RPO:** 0 for data; some emails may have been dropped during the leak window.

### 5.8 A mini-service is down

The four sidecar services (ports 3001–3004) are **not required** for the main
app to function. The app degrades gracefully:

- **notification-service down:** notifications are not ingested. No user
  impact.
- **email-worker down:** the in-app retry queue (`src/lib/email/queue.ts`)
  handles retries independently. The sidecar is a pluggable fallback layer.
- **audit-worker down:** audit log reports and exports are unavailable. The
  audit log itself (in SQLite) continues to be written by the main app.
- **health-monitor down:** the mesh dashboard goes stale. No user impact.

To restart a mini-service:

```bash
( cd /home/z/my-project/mini-services/<name> && bun --hot index.ts </dev/null >/tmp/<name>.log 2>&1 & )
```

Verify with `curl http://localhost:300X/health`.

**RTO:** ~1 minute (restart the service).
**RPO:** N/A (mini-services are stateless or read-only).

---

## 6. Backup & Restore Script Reference

### 6.1 Scripts

| Script | Path | Purpose |
| --- | --- | --- |
| `backup-db.ts` | `scripts/backup-db.ts` | Snapshot the live DB, verify, prune old backups. |
| `restore-db.ts` | `scripts/restore-db.ts` | Restore the live DB from a named backup file. |
| `verify-db.ts` | `scripts/verify-db.ts` | Run `integrity_check` + FK check + row counts. |

### 6.2 Quick reference

```bash
# Backup now
bun run scripts/backup-db.ts

# Verify DB is healthy
bun run scripts/verify-db.ts

# List backups (newest at the bottom)
ls -ltr db/backups/alaminn-*.db

# Restore (interactive)
bun run scripts/restore-db.ts alaminn-2026-07-12-030100.db

# Restore (non-interactive / scripted)
bun run scripts/restore-db.ts alaminn-2026-07-12-030100.db --yes

# Undo a restore (restore the pre-restore snapshot)
bun run scripts/restore-db.ts pre-restore-alaminn-2026-07-12-030200.db --yes

# Tail the backup log
tail -f db/backups/backup.log

# Force a prune now (run a backup — it prunes as a side effect)
bun run scripts/backup-db.ts
```

> **Note:** The `docs/backup-restore.md` reference document mentions
> `bun run db:backup` / `db:restore` / `db:verify` npm-script aliases. These
> are aspirational — they are not yet wired into `package.json`. Use the
> direct script paths shown above.

---

## 7. Recovery Drill (recommended quarterly)

Run a recovery drill once per quarter to validate the backup/restore
procedure end-to-end:

1. **On a staging host** (never on production), stop the server.
2. Pick a recent backup: `ls -ltr db/backups/alaminn-*.db`.
3. Restore it: `bun run scripts/restore-db.ts alaminn-<recent>.db --yes`.
4. Run `bun run scripts/verify-db.ts` — expect `0 anomalies`.
5. Start the server and walk through the post-restore verification checklist
   (§4.2).
6. Undo the restore: `bun run scripts/restore-db.ts pre-restore-alaminn-<ts>.db --yes`.
7. Verify the undo with `bun run scripts/verify-db.ts`.
8. Document any issues encountered. Update this document if the procedure
   changed.

A successful drill validates:

- The backup files are not corrupt.
- The restore script works end-to-end.
- The pre-restore snapshot mechanism works (the undo succeeded).
- The verification script catches real problems.
- The RTO target (≤ 15 minutes for a single restore) is achievable.

---

## 8. Contacts & Escalation

| Role | Responsibility | When to contact |
| --- | --- | --- |
| **On-call engineer** | First responder for any production incident | PagerDuty / OpsGenie alert |
| **DBA** | SQLite corruption, schema migrations | If `verify-db.ts` reports anomalies that a restore doesn't fix |
| **Security lead** | AUTH_SECRET leak, SMTP credential leak, audit log anomalies | Immediately on suspicion |
| **Al Aminn (OWNER)** | Final authority on data loss acceptance | If RPO is exceeded and data must be re-entered manually |

For a single-host deployment, the on-call engineer and DBA are typically the
same person. The escalation path is: alert → investigate → restore → verify
→ communicate → post-mortem.
