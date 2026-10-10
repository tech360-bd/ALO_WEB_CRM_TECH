> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# PRODUCTION ROLLBACK RUNBOOK

**Project:** ALO Education
**VPS Dir:** /root/alo-github-main
**Port:** 3044
**PM2:** alo-education
**Domain:** aloeducation.com
**Health:** /api/health
**Date:** 2026-09-15

## Purpose

Safe rollback of application code when health checks fail after deployment. Database rollback is NOT automatically safe unless migration is demonstrably reversible.

## Pre-Deployment Preservation (Must Be Done Before Every Deployment)

### 1. Capture Current Production State

```bash
ssh $VPS_USER@$VPS_HOST -p $VPS_PORT "
  cd /root/alo-github-main &&
  echo '=== CURRENT COMMIT ===' &&
  git rev-parse HEAD &&
  git log -1 --oneline &&
  git status --short &&
  echo '=== PM2 STATUS ===' &&
  pm2 describe alo-education &&
  pm2 status &&
  echo '=== PORT ===' &&
  ss -tlnp | grep 3044 &&
  echo '=== HEALTH ===' &&
  curl -fsS http://127.0.0.1:3044/api/health || echo 'health failed' &&
  echo '=== DISK/MEMORY ===' &&
  df -h &&
  free -h &&
  echo '=== LOGS TAIL ===' &&
  pm2 logs alo-education --lines 50 --nostream
" 2>&1 | tee /tmp/pre-deploy-$(date +%Y%m%d-%H%M%S).log
```

**Save this log — required for rollback decision.**

### 2. Database Backup (Verified, Provider-Appropriate)

**MySQL/MariaDB (Prisma provider mysql):**

```bash
ssh $VPS_USER@$VPS_HOST -p $VPS_PORT "
  cd /root/alo-github-main &&
  # Verify DB provider from schema.prisma
  grep -A2 'datasource db' prisma/schema.prisma &&
  # Create backup dir
  mkdir -p /root/alo-backups &&
  # Backup via mysqldump (requires DB credentials from .env, never print them)
  # Use provider-appropriate method — example:
  set -a; source .env; set +a; \
  mysqldump -h \${DATABASE_HOST:-localhost} -u \${DATABASE_USER} -p\${DATABASE_PASSWORD} \${DATABASE_NAME} > /root/alo-backups/db-backup-\$(date +%Y%m%d-%H%M%S)-\$(git rev-parse --short HEAD).sql &&
  ls -lh /root/alo-backups/db-backup-*.sql | tail -n 5 &&
  wc -l /root/alo-backups/db-backup-*.sql | tail -n 5 &&
  # Verify backup non-empty and contains tables
  head -n 20 /root/alo-backups/db-backup-\$(ls -t /root/alo-backups/db-backup-*.sql | head -n1) | grep -E 'CREATE TABLE|INSERT INTO' | head -n 5
"
```

**Verification:**
- Backup file exists: `ls -lh /root/alo-backups/db-backup-*.sql`
- Non-empty: `wc -l` > 1000, size > 1MB
- Contains tables: `grep CREATE TABLE`
- Can be inspected: `head -n 20`
- Can be restored to safe test target (not production) — test restore if possible

**Never proceed without verified backup.**

### 3. Preserve Known-Good Application Release

```bash
ssh $VPS_USER@$VPS_HOST -p $VPS_PORT "
  mkdir -p /root/alo-backups &&
  cp -al /root/alo-github-main /root/alo-backups/alo-backup-\$(date +%Y%m%d-%H%M%S)-\$(git -C /root/alo-github-main rev-parse --short HEAD) &&
  ls -ld /root/alo-backups/alo-backup-* | tail -n 10 &&
  cat /root/alo-backups/alo-backup-*/.git/refs/heads/arena/01a0a165-alo-education-z-ai 2>/dev/null || git -C /root/alo-backups/alo-backup-*/ rev-parse HEAD 2>/dev/null | head -n1
"
```

**This uses hard links (cp -al) to save disk space, preserves previous release for instant rollback.**

### 4. Record Rollback Info

Create file `/root/alo-backups/rollback-info-<timestamp>.txt`:

```
Timestamp: 2026-09-15T21:50:00Z
Previous commit: <SHA>
Previous branch: arena/01a0a165-alo-education-z-ai (or main)
PM2 process: alo-education
Port: 3044
Health before deploy: {status: ok, ...}
Backup app dir: /root/alo-backups/alo-backup-<timestamp>-<sha>
Backup DB file: /root/alo-backups/db-backup-<timestamp>-<sha>.sql
Deployed commit: <new SHA>
Deployed branch: arena/01a0a165-alo-education-z-ai
Rollback command: cp -al /root/alo-backups/alo-backup-<timestamp>-<sha> /root/alo-github-main && cd /root/alo-github-main && pm2 restart alo-education --update-env && curl -fsS http://127.0.0.1:3044/api/health
```

## Deployment Health Check Failure — When to Rollback

**Rollback application code if:**

- `curl -fsS http://127.0.0.1:3044/api/health` fails after build and PM2 restart
- PM2 process `alo-education` is errored, stopped, or restart loop
- `ss -tlnp | grep 3044` shows not listening
- Logs show critical startup errors, DB errors, unhandled exceptions, repeated failures
- Domain https://aloeducation.com/api/health fails

**Do NOT automatically rollback database unless:**

- Migration is demonstrably reversible (e.g., additive column, not DROP)
- Backup verified and tested
- Explicit approval for DB rollback
- Safe DB recovery plan exists

**Database rollback is NOT safe by default — application code rollback is safe.**

## Application Code Rollback Procedure (Safe)

```bash
ssh $VPS_USER@$VPS_HOST -p $VPS_PORT "
  set -Eeuo pipefail
  echo '=== ROLLBACK START ==='
  # 1. Capture diagnostics
  cd /root/alo-github-main
  git rev-parse HEAD > /tmp/failed-deploy-sha.txt
  pm2 logs alo-education --lines 100 --nostream > /tmp/failed-deploy-logs.txt || true
  curl -fsS http://127.0.0.1:3044/api/health > /tmp/failed-health.json || echo 'health failed' > /tmp/failed-health.json
  ss -tlnp | grep 3044 > /tmp/failed-port.txt || echo 'port not listening' > /tmp/failed-port.txt

  # 2. Identify previous good release (latest backup before failed deploy)
  PREV_BACKUP=\$(ls -td /root/alo-backups/alo-backup-* | head -n2 | tail -n1)
  echo \"Previous good release: \$PREV_BACKUP\"
  ls -ld \$PREV_BACKUP
  cat \$PREV_BACKUP/.git/COMMIT_EDITMSG 2>/dev/null | head -n1 || git -C \$PREV_BACKUP log -1 --oneline || echo 'no git log'

  # 3. Restore previous release (hard link copy preserves current failed as well)
  # Option A: Restore via cp -al (fast, preserves failed for investigation)
  TIMESTAMP=\$(date +%Y%m%d-%H%M%S)
  mv /root/alo-github-main /root/alo-backups/alo-failed-\$TIMESTAMP-\$(cat /tmp/failed-deploy-sha.txt | cut -c1-7)
  cp -al \$PREV_BACKUP /root/alo-github-main
  cd /root/alo-github-main
  echo \"Restored to: \$(git rev-parse HEAD) \$(git log -1 --oneline)\"

  # 4. Restart PM2
  pm2 describe alo-education
  pm2 restart alo-education --update-env
  pm2 save
  pm2 status
  pm2 describe alo-education

  # 5. Verify health after rollback
  sleep 5
  ss -tlnp | grep 3044
  curl -fsS http://127.0.0.1:3044/api/health
  curl -fsS https://aloeducation.com/api/health || echo 'domain health failed (check Caddy/nginx)'

  # 6. Check logs after rollback
  pm2 logs alo-education --lines 50 --nostream

  echo '=== ROLLBACK COMPLETE ==='
  echo \"Previous good SHA: \$(git rev-parse HEAD)\"
  echo \"Failed SHA: \$(cat /tmp/failed-deploy-sha.txt)\"
  echo \"Failed logs: /tmp/failed-deploy-logs.txt\"
  echo \"Failed health: /tmp/failed-health.json\"
"
```

**After rollback, verify:**
- PM2 online and stable
- Port 3044 listening
- /api/health healthy
- Domain HTTPS healthy
- No critical errors in logs
- Critical user flows work

## Database Rollback — Only If Safe and Approved

**WARNING: Database rollback can cause data loss. Only if migration is reversible and explicitly approved.**

**Safe scenarios for DB rollback:**
- Migration only added column/table/index (additive)
- No DROP, no TRUNCATE, no destructive data change
- Backup verified non-empty and restorable
- Test restore succeeded on safe target

**Unsafe scenarios — DO NOT rollback DB:**
- Migration dropped column/table
- Migration truncated data
- Migration had destructive seed
- No verified backup
- No test restore

**If DB rollback is approved and safe:**

```bash
ssh $VPS_USER@$VPS_HOST -p $VPS_PORT "
  set -Eeuo pipefail
  echo '=== DB ROLLBACK START — ONLY IF SAFE AND APPROVED ==='
  # 1. Verify backup
  BACKUP_FILE=\$(ls -t /root/alo-backups/db-backup-*.sql | head -n1)
  echo \"Backup file: \$BACKUP_FILE\"
  ls -lh \$BACKUP_FILE
  wc -l \$BACKUP_FILE
  head -n 20 \$BACKUP_FILE | grep CREATE TABLE | head -n5

  # 2. Confirm with user (manual step)
  echo 'WARNING: This will restore DB from backup, may cause data loss since backup time'
  echo 'Type YES to continue:'
  read CONFIRM
  if [ \"\$CONFIRM\" != \"YES\" ]; then echo 'Aborted'; exit 1; fi

  # 3. Restore (example for MySQL)
  set -a; source /root/alo-github-main/.env; set +a
  mysql -h \${DATABASE_HOST:-localhost} -u \${DATABASE_USER} -p\${DATABASE_PASSWORD} \${DATABASE_NAME} < \$BACKUP_FILE

  # 4. Verify
  echo 'DB restored, verifying...'
  # Run prisma validate, check tables
  cd /root/alo-github-main
  npx prisma validate

  echo '=== DB ROLLBACK COMPLETE ==='
"
```

**After DB rollback, verify:**
- DB connection succeeds
- Tables exist, data intact as of backup time
- Application health healthy
- No data loss beyond backup time (communicate to stakeholders)

## Rollback Verification Checklist

- [ ] Previous good release identified and exists
- [ ] Failed release preserved for investigation (not deleted)
- [ ] Application code restored to previous good SHA
- [ ] PM2 restarted and online stable
- [ ] Port 3044 listening (ss)
- [ ] /api/health local healthy
- [ ] /api/health domain HTTPS healthy
- [ ] No critical startup/DB/unhandled errors in logs
- [ ] Critical user flows work (public pages, auth, CRM, student portal)
- [ ] Database backup verified (if DB rollback considered)
- [ ] Database rollback only if safe and approved (additive migration, verified backup, test restore)
- [ ] Rollback info recorded with SHA, timestamp, results, rollback command
- [ ] Stakeholders notified of rollback and any data loss window (if DB rollback)

## Rollback Info Template

```
Rollback executed: 2026-09-15T21:50:00Z
Failed deploy SHA: 14a3127
Failed deploy branch: arena/01a0a165-alo-education-z-ai
Failed deploy time: 2026-09-15T21:45:00Z
Failure reason: health check failed after build, logs show <error>
Previous good SHA: 86762bb
Previous good branch: arena/01a0a165-alo-education-z-ai
Previous good backup dir: /root/alo-backups/alo-backup-20260915-214500-86762bb
Previous good backup DB: /root/alo-backups/db-backup-20260915-214500-86762bb.sql
Rollback command: cp -al /root/alo-backups/alo-backup-20260915-214500-86762bb /root/alo-github-main && cd /root/alo-github-main && pm2 restart alo-education --update-env && curl -fsS http://127.0.0.1:3044/api/health
Rollback result: PASS — PM2 online, port 3044 listening, health ok, domain ok, logs clean
DB rollback: NOT PERFORMED — migration was additive, app rollback sufficient, no data loss
Investigate failed: /root/alo-backups/alo-failed-20260915-214600-14a3127 preserved for investigation
```

## Contacts and Escalation

- **VPS Owner:** (to be filled)
- **DB Owner:** (to be filled)
- **On-call:** (to be filled)
- **Rollback approver:** (to be filled for DB rollback)

---

**End of Rollback Runbook — Application code rollback safe, DB rollback only if safe and approved, always verify backup.**
