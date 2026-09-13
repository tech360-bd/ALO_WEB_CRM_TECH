# Production Rollback — Safe Procedure (ALO Education)

This guide shows how to revert a failed production deployment without losing `.env`, uploads, or audit history.

---

## 1. How the deployment prepares a backup

Every run of `.github/workflows/deploy-production.yml` (the `Deploy to VPS` step) does before checkout:

```bash
DEPLOY_DIR=/root/alo-live
BACKUP_DIR=$DEPLOY_DIR/.deploy-backup-$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)
mkdir -p "$BACKUP_DIR"
cp -a .env "$BACKUP_DIR/.env"                # production secrets
cp -a storage "$BACKUP_DIR/storage"          # documents
cp -a uploads "$BACKUP_DIR/uploads"          # alternative upload location
cp -a public/uploads "$BACKUP_DIR/public_uploads"
```

The previous commit SHA is recorded in the workflow logs as `Deployed: <SHA_before>` and `Target: <SHA_after>`. You can also find it via:

```bash
cd /root/alo-live
git reflog | head -n 20
ls -lt .deploy-backup* | head -n 20
```

---

## 2. When to rollback

* `pm2 describe alo-education` shows `errored` / `stopped` instead of `online`.
* `curl http://127.0.0.1:3000/api/health` returns non-200 or `"status":"degraded"` with DB error, or connection refused.
* Logs show `Error: Cannot find module`, Prisma `P3009` migration drift, or `WHATSAPP_APP_SECRET` misconfiguration after deploy.
* Any post-deploy check in `docs/VPS-GITHUB-DEPLOYMENT.md` step 11 fails.

---

## 3. Rollback steps (on VPS, as DEPLOY_USER)

> Placeholders: `YOUR_DEPLOY_DIR` (e.g. `/root/alo-live`), `YOUR_PM2_NAME` (`alo-education`), `YOUR_HEALTH_PORT` (`3000` or `3025`), `PREVIOUS_SHA` (the commit you want to return to), `BACKUP_DIR` (the backup created by the failed deploy).

### 3.1 Identify the previously working commit

```bash
cd YOUR_DEPLOY_DIR
git log --oneline -10
# or
git reflog | head -n 20
# The commit before the failed deploy is usually:
PREVIOUS_SHA=$(git rev-parse HEAD~1)
# Or pick explicitly: PREVIOUS_SHA=abc1234def...
# The backup directory name contains the short SHA: .deploy-backup-20260913-123456-abc1234
ls -lt .deploy-backup* | head -n 10
BACKUP_DIR=$(ls -td .deploy-backup* | head -n 1)
echo "PREVIOUS_SHA=$PREVIOUS_SHA"
echo "BACKUP_DIR=$BACKUP_DIR"
```

### 3.2 Restore code (without losing .env / uploads)

```bash
cd YOUR_DEPLOY_DIR
# Preserve current .env just in case
cp .env /tmp/current-env-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Restore the known-good commit (safe checkout)
git fetch origin --prune
git checkout --force "$PREVIOUS_SHA"

# Restore production secrets and uploads from backup (they were never committed)
if [ -f "$BACKUP_DIR/.env" ]; then cp "$BACKUP_DIR/.env" ./.env; echo ".env restored"; fi
if [ -d "$BACKUP_DIR/storage" ]; then rm -rf storage; cp -a "$BACKUP_DIR/storage" ./; echo "storage restored"; fi
if [ -d "$BACKUP_DIR/uploads" ]; then rm -rf uploads; cp -a "$BACKUP_DIR/uploads" ./; echo "uploads restored"; fi
if [ -d "$BACKUP_DIR/public_uploads" ]; then mkdir -p public; cp -a "$BACKUP_DIR/public_uploads" public/uploads 2>/dev/null; echo "public/uploads restored"; fi

# Re-install exactly the deps for that commit
npm ci 2>&1 | tail -n 20
npx --yes prisma@6.19.3 generate 2>&1 | tail -n 20
```

### 3.3 Database migrations

* If the failed deploy **did not** run `prisma migrate deploy` (default `skip_migrations=true`), no DB rollback is needed — the DB is still at the previous migration.
* If it **did** run migrations and the DB is now at a newer migration that the previous code expects not to exist, you must either:
  * Forward-fix by deploying a new hotfix commit that includes the new schema, **or**
  * Restore the DB from the pre-deploy backup (see `BACKUP_RESTORE_GUIDE.md` if you have automated DB dumps). **Prisma does not automatically downgrade** — `migrate deploy` is forward-only.

Check status:

```bash
npx --yes prisma@6.19.3 migrate status 2>&1 | head -n 40
```

Do **not** run `prisma migrate reset` on production — it drops data.

### 3.4 Rebuild and restart

```bash
npm run build 2>&1 | tail -n 50
pm2 describe YOUR_PM2_NAME 2>&1 | grep -E 'status|script path|cwd|uptime' || pm2 list
pm2 reload YOUR_PM2_NAME --update-env || pm2 start ecosystem.config.cjs --env production
pm2 save
sleep 5
curl -fsS http://127.0.0.1:YOUR_HEALTH_PORT/api/health | python3 -m json.tool
# Expect {"status":"ok","database":{"connected":true}}
```

### 3.5 Verify via GitHub

```bash
cd YOUR_DEPLOY_DIR
git rev-parse HEAD  # should equal PREVIOUS_SHA
pm2 describe YOUR_PM2_NAME | grep -q "online" && echo "PM2 online"
curl -fsS http://127.0.0.1:YOUR_HEALTH_PORT/api/health | grep -q '"status"' && echo "Health OK"
```

If you triggered the deploy via GitHub Actions, you can also roll back by re-running the workflow with `ref = PREVIOUS_SHA` — it will safely check out that exact SHA with the same backup/preserve logic.

---

## 4. What is preserved vs what is reverted

| Preserved (never overwritten) | Reverted to previous commit |
|---|---|
| `YOUR_DEPLOY_DIR/.env` (production secrets) | `src/`, `prisma/schema.prisma`, `package.json`, `next.config.ts`, etc. |
| `storage/`, `uploads/`, `public/uploads` (documents) | ` .next/`, `node_modules/` (rebuilt) |
| `WhatsAppOfficialNumber` rows, `AloAuditLog`, `ApplicationDocument` version history (DB) | Code and `ecosystem.config.cjs`, `Caddyfile` |
| `WhatsAppNumberAssignmentAudit` history | Workflow file `.github/workflows/deploy-production.yml` |

Document versions are **soft-delete + versioning** (`DocumentVersion`, `ApplicationDocument` status `REJECTED` never deletes) — rollback does not delete them. Verified documents cannot be casually replaced; corrections require the `correction workflow` with reason.

---

## 5. Post-rollback checklist

- [ ] `pm2 describe` shows `online` and `uptime` increasing
- [ ] `curl /api/health` shows `ok` and `database.connected=true`
- [ ] `git rev-parse HEAD == PREVIOUS_SHA`
- [ ] Admin can log in → `/admin/whatsapp-numbers` shows expected numbers as `connected`/`CONFIGURATION REQUIRED` as before
- [ ] Inbox (`/crm/inbox` or `/crm/communications/inbox`) loads threads
- [ ] A smoke test: send a WhatsApp via fallback path in draft mode (no real provider call if token missing) → timeline created
- [ ] Audit: `AloAuditLog` contains the revert action with actor `deploy`

---

## 6. Incident record

Log the incident in `docs/audits/FINAL_SYSTEM_AUDIT.md` (or your incident tracker):

* Failed SHA, previous SHA, time, `pm2 logs --lines 200`, `curl /api/health` output, `git reflog`, `BACKUP_DIR` path, DB migration status, resolution.

Never delete ` .deploy-backup*` until the incident is closed — they contain the `.env` at the time of failure.
