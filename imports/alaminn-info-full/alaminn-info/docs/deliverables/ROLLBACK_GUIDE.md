# ROLLBACK_GUIDE.md

| Field | Value |
|---|---|
| **Title** | Alaminn.info — Deployment Rollback Guide |
| **Version** | 1.0.0 |
| **Date** | 2026-07-19 |
| **Purpose** | How to roll back a deployment that introduced a regression. Covers the pre-deploy backup strategy, the rollback procedure (source + DB), when to roll back vs fix-forward, and how to test rollback in a maintenance window. |

---

## Rollback strategy overview

Alaminn.info uses a **two-layer rollback strategy**:

1. **Source code rollback**: Keep the previous `.next/standalone/` directory as `.next/standalone.bak/` before each deploy. If the new deploy fails, rename back and restart Passenger.
2. **Database rollback**: Restore from the pre-restore backup taken before any migration. Required ONLY if a DB migration broke something.

Most regressions are code-only and require only the source rollback. DB rollbacks are rare but catastrophic when needed — practice them before relying on them.

---

## Pre-deploy: the `.next/standalone.bak` convention

### What to do BEFORE every redeploy

```bash
cd ~/alaminn.info

# 1. Stop the app via cPanel UI (Setup Node.js App → Stop) OR
#    touch tmp/stop.txt (Passenger will not accept new requests, then exit)

# 2. Back up the current build
if [ -d .next/standalone ]; then
  rm -rf .next/standalone.bak
  mv .next/standalone .next/standalone.bak
  echo "Backed up current build to .next/standalone.bak"
fi

# 3. Take a pre-deploy DB snapshot (mandatory if a migration is involved)
bash scripts/backup.sh
# This produces storage/backups/alaminn_info_YYYYMMDD_HHMMSS.sql.gz + .sha256
# Record the filename — you'll need it for rollback.

# 4. Run the redeploy
bash deploy/cpanel/redeploy.sh
# This runs: npm ci → prisma generate → prisma migrate deploy (or db push) → npm run build
```

### Why keep `.next/standalone.bak`?

- It's the **fastest** rollback path: rename + restart, done in < 30 seconds.
- It avoids re-running `npm run build` (which takes 90–180s).
- It's a self-contained snapshot of the exact binary that was running before the deploy.

### Why take a DB snapshot BEFORE the migration?

- `prisma migrate deploy` may run `ALTER TABLE` or `DROP COLUMN` statements.
- If the migration breaks something (e.g. drops a column the app still reads), the only recovery is to restore the DB to its pre-migration state.
- The script `scripts/restore.sh` creates an automatic pre-restore snapshot, but that's for restore operations, not migrations. You need a manual snapshot before the migration.

---

## Rollback procedure: code-only regression

Use this when the new deploy introduced a code bug but the database schema is unchanged (no migrations ran).

### Symptoms

- App returns 500 errors after deploy
- Specific routes broken
- Build succeeded but runtime errors
- No DB schema changes

### Steps

```bash
cd ~/alaminn.info

# 1. Stop the app via cPanel UI (Setup Node.js App → Stop)
#    OR via terminal:
touch tmp/stop.txt

# 2. Verify the backup exists
ls -la .next/standalone.bak/
# Expect: server.js, .next/, public/, package.json

# 3. Swap the builds
rm -rf .next/standalone.failed   # preserve the failed build for forensics (optional)
mv .next/standalone .next/standalone.failed
mv .next/standalone.bak .next/standalone

# 4. (Optional) Revert the source code too if you need to redeploy later
# git reset --hard <previous-commit>
# OR: tar -xzf ~/alaminn.info.predeploy.<timestamp>.tgz -C ~/

# 5. Restart the app
# Via cPanel UI: Setup Node.js App → Start App
# Via terminal:
rm -f tmp/stop.txt
touch tmp/restart.txt

# 6. Verify
curl -sI https://alaminn.info | head -1
# Expect: HTTP/2 200

curl -s https://alaminn.info/api/health | head -c 200
# Expect: {"status":"ok","timestamp":"..."}

# 7. Tail the log to confirm no errors
tail -f ~/logs/alaminn.log
```

### Time to complete

< 30 seconds for the swap + restart. Total downtime: 1–2 minutes (including verification).

---

## Rollback procedure: database migration broke something

Use this when a `prisma migrate deploy` introduced a schema change that broke the app (e.g. dropped a column the app reads, renamed a table, changed a column type and lost data).

### Symptoms

- App returns 500 errors with Prisma error messages like `Unknown column 'X'` or `Column 'Y' cannot be null`
- Migration ran but data was lost
- App boots but specific endpoints fail with DB errors

### Steps

```bash
cd ~/alaminn.info

# 1. STOP THE APP IMMEDIATELY to prevent further writes
# Via cPanel UI: Setup Node.js App → Stop
# Via terminal:
touch tmp/stop.txt

# 2. Identify the pre-deploy backup
# This is the snapshot you took BEFORE running prisma migrate deploy.
ls -lt storage/backups/*.sql.gz | head -5
# Look for the file created just before the deploy timestamp.

# 3. Verify the backup is restorable
bash scripts/verify-backup.sh storage/backups/<pre-deploy-file>.sql.gz
# All 5 checks must PASS. If any fails, do NOT proceed — find a different backup.

# 4. Roll back the source code FIRST (so the app matches the DB schema you're restoring)
rm -rf .next/standalone.failed
mv .next/standalone .next/standalone.failed
mv .next/standalone.bak .next/standalone

# 5. Restore the database
bash scripts/restore.sh storage/backups/<pre-deploy-file>.sql.gz
# Type RESTORE when prompted.
# This will:
#   a. Create a pre-restore safety snapshot (in case you need to undo THIS restore)
#   b. Verify the SHA-256 checksum
#   c. Import the SQL
#   d. Verify table count = 55

# 6. Restart the app
rm -f tmp/stop.txt
touch tmp/restart.txt

# 7. Verify EVERYTHING
curl -sI https://alaminn.info | head -1
curl -s https://alaminn.info/api/health | head -c 200
curl -sI https://alaminn.info/higher-study | head -1
curl -sI https://alaminn.info/higher-study/universities/university-of-oxford | head -1
curl -sI https://alaminn.info/english-learning | head -1
curl -sI https://alaminn.info/admin/login | head -1
# All should return 200.

# 8. Log in to admin and spot-check:
#    - Inquiries list is intact
#    - Higher Study universities are intact
#    - English Learning courses are intact
#    - Audit log shows the restore event

# 9. Notify stakeholders that the rollback is complete and the site is stable.
```

### Time to complete

5–15 minutes (depending on DB size and bandwidth). Total downtime: 10–20 minutes.

---

## When to roll back vs fix-forward

### Roll back when

- The regression is severe (site down, data loss, security breach).
- The fix is non-trivial (will take > 1 hour to develop + test).
- The deploy introduced a DB migration that can't be safely reversed without data loss.
- Users are actively affected and you need to restore service NOW.

### Fix-forward when

- The regression is minor (cosmetic bug, non-critical feature broken).
- The fix is trivial (< 30 minutes to develop + test).
- No DB migration is involved (or the migration is forward-compatible).
- Rolling back would lose more user data than fix-forward (e.g. inquiries received in the last hour).

### Decision matrix

| Symptom | DB migration? | Roll back or fix-forward? |
|---|---|---|
| Site returns 502 | No | Fix-forward (likely a build issue) |
| Site returns 500 on every page | No | Roll back code, then fix-forward |
| Site returns 500 on specific endpoint | No | Fix-forward (less disruptive) |
| Data corruption / loss | Yes | **Roll back DB** + code |
| Security breach | Either | **Roll back** + audit + patch |
| Admin login broken | No | Roll back code (admin access is critical) |
| Cron endpoints failing | No | Fix-forward (crons are non-user-facing) |
| ALO Education referrals failing | No | Roll back code (revenue path) |
| English Learning referrals failing | No | Roll back code (revenue path) |

---

## Testing rollback in a maintenance window

> ⚠️ **Mandatory**: practice the rollback procedure at least ONCE before declaring production ready. A rollback procedure you've never tested is not a rollback procedure — it's a hope.

### Test plan

1. **Schedule a maintenance window**: Sunday 03:00–04:00 UTC (lowest traffic).
2. **Notify stakeholders**: post a banner 24h in advance.
3. **At 03:00**: take the site into maintenance mode.
4. **At 03:05**: take a fresh backup.
5. **At 03:10**: practice the code rollback (rename `.next/standalone` ↔ `.next/standalone.bak`).
6. **At 03:15**: verify the site loads.
7. **At 03:20**: practice the DB restore (restore from yesterday's backup).
8. **At 03:30**: verify all routes work, admin login works.
9. **At 03:35**: restore from the fresh backup taken at 03:05 (return to current state).
10. **At 03:45**: take the site out of maintenance mode.
11. **At 03:50**: final verification + notify stakeholders.

### Test checklist

- [ ] Maintenance mode banner displays
- [ ] Code rollback completes in < 30 seconds
- [ ] App starts successfully after code rollback
- [ ] DB restore completes in < 5 minutes
- [ ] App reads the restored DB without errors
- [ ] Admin login works against the restored DB
- [ ] Higher Study routes return 200 against the restored DB
- [ ] English Learning routes return 200 against the restored DB
- [ ] Re-restore from fresh backup completes cleanly
- [ ] Site is fully functional at end of test
- [ ] Total downtime < 60 minutes

If any step fails, document the failure and adjust the procedure. Don't declare production ready until the full test passes.

---

## Post-rollback actions

After a successful rollback:

1. **Document the incident** in `storage/logs/incidents/`:
   - What was the regression?
   - When was it detected?
   - What was the rollback procedure used?
   - How long was the downtime?
   - What's the root cause?
   - What's the fix-forward plan?

2. **Preserve the failed build** (`.next/standalone.failed/`) for forensic analysis. Don't delete it until the root cause is identified and fixed.

3. **Notify stakeholders**:
   - Users: "Service was interrupted from HH:MM to HH:MM UTC due to a deployment issue. The issue has been resolved by rolling back to the previous version. We apologize for the inconvenience."
   - Team: post the incident report in the team chat / incident tracker.

4. **Plan the fix-forward**:
   - Reproduce the issue locally.
   - Write a regression test that fails on the broken build.
   - Fix the issue.
   - Verify the test passes.
   - Schedule the next deploy (with the test in place).

5. **Update the rollback guide** if the procedure revealed an issue (e.g. a missing step, an unclear command).

---

## Common rollback pitfalls

### 1. Forgot to take `.next/standalone.bak` before the deploy

**Symptom**: No backup build to roll back to.
**Fix**: Re-run `npm run build` from the previous source commit (slow but works). Add the backup step to your deploy checklist.

### 2. Forgot to take a DB snapshot before the migration

**Symptom**: No DB backup to restore from.
**Fix**: Take a snapshot of the CURRENT (broken) state for forensics. Then fix-forward — write a migration that reverses the broken one (e.g. `ALTER TABLE` to re-add the dropped column). Apply the fix migration.

### 3. Restored DB but didn't roll back the source code

**Symptom**: App still fails because the new code expects the new schema, but the DB has the old schema.
**Fix**: Always roll back the source code FIRST, then restore the DB. The two must be in sync.

### 4. Restarted Passenger but didn't clear the `.next/cache`

**Symptom**: App serves stale pages from the cache.
**Fix**: `rm -rf .next/cache && touch tmp/restart.txt`. Verify with `curl -sI` (check the `X-Powered-By` header or response time).

### 5. Restored DB but admin password doesn't work

**Symptom**: The DB backup pre-dates a password change; the old password is now active.
**Fix**: Use the password that was active at the time of the backup. OR re-seed the admin user:
```bash
npx tsx scripts/seed-admin.ts
```

### 6. Rollback succeeded but cron jobs still reference the new code

**Symptom**: Cron endpoints fail because they call APIs that exist in the new code but not the old.
**Fix**: Disable the affected cron jobs in cPanel → Cron Jobs until the new code is redeployed.

---

## Quick reference

```bash
# ─── Pre-deploy (BEFORE redeploy.sh) ─────────────────────────────
cd ~/alaminn.info
rm -rf .next/standalone.bak
mv .next/standalone .next/standalone.bak
bash scripts/backup.sh   # record the filename

# ─── Code rollback (no DB migration involved) ────────────────────
touch tmp/stop.txt
mv .next/standalone .next/standalone.failed
mv .next/standalone.bak .next/standalone
rm -f tmp/stop.txt && touch tmp/restart.txt

# ─── DB rollback (migration broke something) ─────────────────────
touch tmp/stop.txt
mv .next/standalone .next/standalone.failed
mv .next/standalone.bak .next/standalone
bash scripts/restore.sh storage/backups/<pre-deploy-file>.sql.gz
# Type RESTORE when prompted
rm -f tmp/stop.txt && touch tmp/restart.txt

# ─── Verify ──────────────────────────────────────────────────────
curl -sI https://alaminn.info | head -1
curl -s https://alaminn.info/api/health | head -c 200
curl -sI https://alaminn.info/higher-study | head -1
curl -sI https://alaminn.info/english-learning | head -1
curl -sI https://alaminn.info/admin/login | head -1

# ─── Passenger restart (alternative to tmp/restart.txt) ──────────
/opt/passenger/bin/passenger-config restart-app /home/aloeduca/alaminn.info
```

---

## Reference

- **Pre-deploy backup**: `scripts/backup.sh` (DB) + `.next/standalone.bak` (code)
- **Restore script**: `scripts/restore.sh` (interactive, creates pre-restore safety snapshot)
- **Verify-backup script**: `scripts/verify-backup.sh` (offline, 5 checks)
- **Rollback guide**: this document
- **Maintenance window**: Sunday 03:00–04:00 UTC (recommended)
- **Code rollback time**: < 30 seconds (rename + restart)
- **DB rollback time**: 5–15 minutes (depending on DB size)
- **Mandatory test**: at least once before declaring production ready
- **Retest cadence**: quarterly, after schema migrations, after script edits
