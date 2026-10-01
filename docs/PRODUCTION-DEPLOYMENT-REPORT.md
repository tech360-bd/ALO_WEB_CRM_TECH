> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# PRODUCTION DEPLOYMENT REPORT

**Date:** 2026-09-15
**Branch:** arena/01a0a165-alo-education-z-ai
**Local HEAD:** 14a3127 (hardened workflow 860 lines)
**Remote HEAD:** 86762bb (final report, workflow broken due to permission block)
**Main HEAD:** 3b73e66
**VPS Dir:** /root/alo-github-main-new
**Port:** 3044
**PM2:** alo-education
**Domain:** aloeducation.com
**Health:** /api/health

## Deployment Target Verification (Local Config)

- **ecosystem.config.cjs:** PORT 3044, name alo-education, script .next/standalone/server.js, HOSTNAME 0.0.0.0 — PASS
- **Caddyfile:** aloeducation.com reverse_proxy 127.0.0.1:3044 — PASS
- **nginx.conf:** proxy_pass http://127.0.0.1:3044 — PASS
- **package.json:** name alo-education-erp, version 0.3.0 — PASS
- **Prisma schema:** provider mysql, binaryTargets native, debian-openssl-1.1.x, rhel-openssl-3.0.x, debian-openssl-3.0.x, linux-musl-openssl-3.0.x — PASS
- **Health route:** src/app/api/health/route.ts exists, returns {status, database, timestamp, uptime, node, platform, responseTime_ms} without secrets — PASS

## Deployment Workflow Hardening (Local 14a3127)

**File:** .github/workflows/deploy-production.yml 860 lines

**Verified gates:**

1. **Checkout safe:** checkout@v5 submodules:false, verifies no gitlink 160000, .gitmodules validation — PASS
2. **Secret pre-flight:** Validates PRODUCTION_VPS_HOST/PORT/USER/SSH_KEY without echoing values, ::error:: if missing, supports legacy DEPLOY_* fallback — PASS
3. **SSH connectivity pre-flight:** echo hostname pwd with valid appleboy/ssh-action@v1.2.2 inputs (host/port/username/key/timeout/command_timeout/script, no script_stop) — PASS
4. **Verify app directory:** test -d /root/alo-github-main-new, is git repo, remote -v, package.json, Prisma schema, ecosystem, .env preserve test -f .env never cp .env.example .env — PASS
5. **Safe git:** git status, remote -v, rev-parse --show-toplevel, branch --show-current, exact SHA verify ${{ github.sha }} fail if mismatch — PASS
6. **Backup:** timestamped /root/alo-backups/alo-backup-<timestamp>-<sha> with cp -al, SHA, branch, pm2 describe, .env backup chmod 600 — PASS
7. **Preserve .env/uploads:** rsync --exclude .env, .env.production, uploads, storage — PASS
8. **DB safety:** prisma validate, generate, migrate deploy only never dev/push/reset/delete — PASS
9. **Build:** npm ci, npm run build fail-fast no || true — PASS
10. **PM2:** pm2 describe alo-education before restart, restart --update-env, save, status/describe — PASS
11. **Port verification:** ss :3044 not 3025, actual PORT from config — PASS
12. **Health check:** curl -fsS http://127.0.0.1:3044/api/health preferred, fail if health fails — PASS
13. **Rollback:** if health fails after build, capture diagnostics, restore previous good release, restart PM2, verify health — PASS
14. **Security:** set -Eeuo pipefail not set -x, never log private key/password/DATABASE_URL/JWT/API keys/tokens — PASS
15. **Error sections:** PRE-FLIGHT, SSH CONNECTIVITY, VERIFY APP DIRECTORY, VERIFY GIT REMOTE, VERIFY COMMIT, BACKUP, INSTALL, PRISMA VALIDATION/GENERATE/MIGRATION, BUILD, PM2 RESTART, HEALTH CHECK, FINAL VERIFICATION — PASS

**Remote workflow (86762bb):** 114 lines broken — missing all above gates, has script_stop invalid, assumes 3025, no secret pre-flight, no backup, no SHA verify, no .env preserve, no rollback — FAIL, needs replacement after permission fix.

## Deployment Procedure (Intended — Not Yet Executed Due to Blockers)

**Before touching production, authorized steps:**

1. **Capture current production state:**
   ```bash
   ssh $VPS_USER@$VPS_HOST -p $VPS_PORT "cd /root/alo-github-main-new && git rev-parse HEAD && git status --short && pm2 describe alo-education && pm2 status && ss -tlnp | grep 3044 && curl -fsS http://127.0.0.1:3044/api/health && df -h && free -h && cat ecosystem.config.cjs | grep PORT"
   ```
   - Status: BLOCKED_REQUIRES_SSH — no SSH credentials in sandbox, needs GitHub Secrets

2. **Create and verify database backup:**
   ```bash
   ssh ... "mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > /root/alo-backups/db-backup-$(date +%Y%m%d-%H%M%S).sql && ls -lh /root/alo-backups/db-backup-*.sql | tail -n 5 && wc -l /root/alo-backups/db-backup-*.sql"
   ```
   - Status: BLOCKED_REQUIRES_SSH + DB credentials

3. **Preserve known-good release:**
   ```bash
   ssh ... "cp -al /root/alo-github-main-new /root/alo-backups/alo-backup-$(date +%Y%m%d-%H%M%S)-$(git -C /root/alo-github-main-new rev-parse --short HEAD) && ls -ld /root/alo-backups/* | tail -n 5"
   ```
   - Status: BLOCKED_REQUIRES_SSH

4. **Fetch verified integration branch and checkout exact commit:**
   ```bash
   ssh ... "cd /root/alo-github-main-new && git fetch origin && git checkout arena/01a0a165-alo-education-z-ai && git rev-parse HEAD && git log -1 --oneline"
   ```
   - Intended commit: 14a3127 (local hardened) after remote reconciled to same SHA after workflow permission fix
   - Status: BLOCKED_REQUIRES_SSH + workflows permission

5. **Install dependencies reproducibly:**
   ```bash
   ssh ... "cd /root/alo-github-main-new && npm ci"
   ```
   - Status: BLOCKED_REQUIRES_SSH

6. **Generate Prisma Client in VPS environment:**
   ```bash
   ssh ... "cd /root/alo-github-main-new && npx prisma validate && npx prisma generate"
   ```
   - Status: BLOCKED_REQUIRES_SSH — should PASS on VPS with internet (binaryTargets already configured)

7. **Run pre-deployment checks:**
   ```bash
   ssh ... "cd /root/alo-github-main-new && npx tsc --noEmit && npm run lint && npm test"
   ```
   - Expected: tsc 0 PASS, lint PASS, tests 17/18 178 PASS (1 fail Prisma stub should PASS after generate)
   - Status: BLOCKED_REQUIRES_SSH

8. **Build production:**
   ```bash
   ssh ... "cd /root/alo-github-main-new && NODE_OPTIONS='--max-old-space-size=4096' npm run build"
   ```
   - Expected: PASS on VPS with 8GB+ RAM
   - Status: BLOCKED_REQUIRES_SSH + memory verification

9. **Review and safely apply migrations:**
   ```bash
   ssh ... "cd /root/alo-github-main-new && npx prisma migrate deploy"
   ```
   - Safety: Only after backup and schema review, never dev/push/reset/delete
   - Status: BLOCKED_REQUIRES_SSH + backup verification

10. **Restart PM2:**
    ```bash
    ssh ... "cd /root/alo-github-main-new && pm2 describe alo-education && pm2 restart alo-education --update-env && pm2 save && pm2 status && pm2 describe alo-education"
    ```
    - Status: BLOCKED_REQUIRES_SSH

11. **Verify listening port:**
    ```bash
    ssh ... "ss -tlnp | grep 3044 && cat ecosystem.config.cjs | grep PORT"
    ```
    - Expected: 0.0.0.0:3044 LISTEN
    - Status: BLOCKED_REQUIRES_SSH

12. **Verify domain HTTPS and /api/health:**
    ```bash
    curl -fsS https://aloeducation.com/api/health
    curl -fsS http://127.0.0.1:3044/api/health
    ```
    - Expected: {status: ok, database: {connected: true}, timestamp, uptime, node, platform, responseTime_ms}
    - Status: BLOCKED_REQUIRES_SSH + domain routing

13. **Smoke tests:**
    - Unauthenticated: GET /api/health, GET /, GET /api/countries, GET /api/universities (public routes) — should PASS 200 without secrets
    - Authenticated: POST /api/auth/login with safe test account, verify RBAC denies unauthorized — should PASS 401/403 for unauthorized
    - Status: BLOCKED_REQUIRES_SSH + test accounts

14. **Check logs:**
    ```bash
    ssh ... "pm2 logs alo-education --lines 100 --nostream && cat storage/logs/pm2-error.log | tail -n 50"
    ```
    - Expected: No critical startup, DB, unhandled exceptions, repeated failures
    - Status: BLOCKED_REQUIRES_SSH

15. **Critical user flows:**
    - Public website loads, countries, universities, courses, course finder
    - Student portal login, dashboard, applications, documents, timeline
    - Counselor portal, admin, super admin
    - CRM, WhatsApp webhook security
    - Status: BLOCKED_REQUIRES_SSH + test data

16. **Record deployed SHA and results:**
    - Deployed commit: 14a3127 (after permission fix and remote reconciliation)
    - Timestamp, results, rollback instructions
    - Status: NOT RUN — blocked

## Current Deployment Status

- **GitHub push:** BLOCKED — workflows permission missing, local 14a3127 has hardened workflow 860 lines, remote 86762bb has broken 114 lines, push fails `refusing to allow GitHub App to create or update workflow without workflows permission`
- **Database backup:** NOT RUN — requires SSH + DB credentials + verification
- **VPS deployment:** NOT RUN — requires SSH + workflows permission + secrets + memory verification
- **Live verification:** NOT RUN — requires successful deployment

## Commands Executed (Evidence, Secrets Redacted)

```bash
git remote -v
# origin https://github.com/engralaminn-collab/alo_education_z....ai.git

git branch --show-current
# arena/01a0a165-alo-education-z-ai

git rev-parse HEAD
# 14a3127e2b3ab1d8c4524bc428b6a22519604def

git rev-parse origin/arena/01a0a165-alo-education-z-ai
# 86762bbd692ca38f39262e59cf967b3824eb2493

git status --short --branch
# ## arena/01a0a165-alo-education-z-ai (clean)

ls -lh .github/workflows/deploy-production.yml
# 44K 860 lines local hardened

git push origin arena/01a0a165-alo-education-z-ai
# ! [remote rejected] refusing to allow a GitHub App to create or update workflow without workflows permission

./node_modules/.bin/tsc --noEmit
# 0 errors PASS

./node_modules/.bin/vitest run
# 17/18 suites 178 PASS, 1 fail PrismaClient not initialized ENVIRONMENT-BLOCKED
```

## Remaining Blockers

1. **Workflows permission:** GitHub App lacks Workflows: Read & Write — user must reconnect via Arena Settings → GitHub → Reconnect with Workflows permission — exact branch to push after fix: `arena/01a0a165-alo-education-z-ai` commit `14a3127` (hardened workflow)
2. **SSH access:** No SSH credentials in sandbox, needs GitHub Secrets PRODUCTION_VPS_HOST/PORT/USER/SSH_KEY — cannot verify VPS dir, PM2, health, memory, disk, logs
3. **Prisma TLS:** Sandbox network blocks binaries.prisma.sh — must generate on VPS with internet
4. **Build OOM:** Sandbox 4GB → needs VPS 8GB+ verification before build
5. **Database backup/migration:** Needs SSH + DB credentials + backup verification

## Final Status

**Deployment:** BLOCKED — workflows permission + SSH + VPS verification required before touching production.

**No production changes made during this mission — safe, no destructive operations.**

---

**End of Deployment Report — BLOCKED, not deployed, all pre-checks documented, ready to resume after permission fix.**
