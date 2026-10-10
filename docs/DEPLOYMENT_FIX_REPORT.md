> LEGACY / NOT USED FOR CURRENT PRODUCTION where conflicting: Hostinger + Node.js 22.x + npm is the only current production architecture. Historical instructions below are retained as evidence, not executable release guidance. See root HOSTINGER-RUNTIME-STANDARD.md.

# Production Deployment Fix Report — Job 103991234761

**Date:** 2026-09-15
**Branch:** arena/01a0a165-alo-education-z-ai
**Base Commit:** 3b73e66cad3444e8eb07160de7f83e8f3bf1cfbb (origin/main)
**Failed Job:** Deploy ALO Education to Production VPS ID 103991234761
**Errors:** `Error: missing server host` and `invalid input script_stop`

## Summary
Fixed production deployment pipeline to be production-safe, SSH via GitHub Secrets, no hardcoded secrets, with pre-flight validation, SSH connectivity check, exact SHA verification, backup, .env preservation, prisma safety, PM2 verification, correct port 3044, health check /api/health, rollback safety, .gitmodules fix, checkout warnings fixed.

## Root Causes Verified

| Issue | What Was Verified | What Was Fixed | What Was Missing | Safe Commands |
|-------|-------------------|----------------|------------------|---------------|
| **Missing server host** | `git show origin/main:.github/workflows/deploy-production.yml` uses `secrets.DEPLOY_HOST/USER/SSH_KEY/PORT` but runner had empty `INPUT_HOST/PORT/USERNAME/KEY` | Changed to `PRODUCTION_VPS_HOST/PORT/USER/SSH_KEY` with legacy fallback `DEPLOY_HOST`, added pre-flight secret validation that fails with `::error::` without echoing values | Required secrets `PRODUCTION_VPS_HOST` etc not set or named differently | `gh api repos/engralaminn-collab/alo_education_z....ai/actions/secrets` (requires admin) / Check repo Settings → Secrets |
| **Invalid input script_stop** | Workflow had `script_stop: true` under `appleboy/ssh-action@v1.2.2` | Removed `script_stop` (not valid input for this action). Valid inputs are `host, port, username, key, timeout, command_timeout, script` | Valid action inputs list | `cat .github/workflows/deploy-production.yml \| grep -A2 appleboy` |
| **_reference_repos submodule error** | `git ls-tree origin/main _reference_repos/` shows 29x 160000 gitlinks, `git show origin/main:.gitmodules` missing → `fatal: No url found for submodule path '_reference_repos/CloddsBot'` | `git rm --cached -r _reference_repos`, `rm -rf _reference_repos`, add to `.gitignore`, checkout `submodules: false` | `.gitmodules` with URLs | `git ls-files --stage \| grep 160000`, `git submodule status` |
| **Port mismatch 3025 vs 3044** | Workflow checked `:3025`, but `ecosystem.config.cjs` has `PORT 3044` | Changed env `APP_PORT=3044`, check `ss :3044`, grep `PORT` from `ecosystem.config.cjs` | Correct port from config | `cat ecosystem.config.cjs \| grep PORT`, `ss -lntp \| grep 3044` |
| **No SHA verification** | Old workflow used `git reset --hard origin/main` blindly, no `GITHUB_SHA` env | Added `GITHUB_SHA=${{ github.sha }}`, fetch + `cat-file -e $SHA`, `branch --contains`, `rev-parse HEAD` verification, fail if mismatch | Exact SHA match | `git rev-parse HEAD && echo $GITHUB_SHA` |
| **No backup / .env preservation** | No backup step, risk of overwriting `.env` | Added backup dir `/root/alo-backups/alo-backup-<timestamp>-<sha>` with SHA, branch, pm2 describe, .env backup (local only, chmod 600), verify `test -f .env` before and after reset, never `cp .env.example .env` | Backup and .env check | `ls -la /root/alo-backups/ && cat /root/alo-live/.env \| head` (never log values) |
| **Prisma unsafe** | Old risky `deploy.sh` used `prisma db push --accept-data-loss` | Workflow now does `prisma validate`, `prisma generate` explicit, `migrate deploy` only (never `dev`, `push`, `reset`) | Safe migration | `npx prisma validate && npx prisma generate && npx prisma migrate deploy` |
| **Build hidden failures** | Some scripts used `\|\| true` | Removed `\|\| true`, use `set -Eeuo pipefail`, `npm ci` + `npm run build` fail-fast | Fail-fast | `npm ci && npm run build` |
| **PM2 not verified** | Old only restart, no describe | Added `pm2 describe alo-education` before and after, `restart --update-env`, `save`, verify `online` | PM2 online check | `pm2 describe alo-education && pm2 status` |
| **Health check wrong endpoint** | Checked `/` only, not `/api/health` | Added curl `http://127.0.0.1:3044/api/health` preferred (exists at `src/app/api/health/route.ts`), fallback `/`, rollback if fails | Health endpoint | `curl -fsS http://127.0.0.1:3044/api/health` |
| **Checkout warnings** | `submodules: recursive` without valid `.gitmodules` | Changed to `submodules: false`, upgraded `actions/checkout@v4` → `v5` to fix Node 20 deprecation | Clean checkout | `git status --short` |
| **Security logging** | Risk of `set -x` leaking secrets | Use `set -Eeuo pipefail` not `set -x`, never log private key/DATABASE_URL/JWT | No secret logs | `grep -r "set -x" .github/` → should be empty |

## Production-Safe Gates Added (All Must Pass)

1. **Workflow syntax valid** — YAML validated via `python3 -c "import yaml; yaml.safe_load(...)"` → `YAML valid`
2. **Required secrets present** — Pre-flight step checks `PRODUCTION_VPS_HOST/PORT/USER/SSH_KEY` (or legacy `DEPLOY_HOST`) without echoing values, fails with `::error::`
3. **SSH connectivity** — Separate job step runs `whoami; hostname; pwd; uptime` via same secrets
4. **Production directory verified** — `test -d $PRODUCTION_APP_DIR`, `test -d .git`, `rev-parse --show-toplevel`, `branch --show-current`, `remote -v`, `package.json`, `prisma/schema.prisma`, `ecosystem.config.cjs`, `.env` existence
5. **Git remote verified** — `git remote -v` contains expected repo
6. **Exact SHA verified** — `GITHUB_SHA` env passed, `git fetch origin --prune`, `cat-file -e $SHA`, `branch -r --contains $SHA`, `reset --hard` to exact SHA or origin/main if matches, final `rev-parse HEAD == GITHUB_SHA`
7. **Dependencies installed** — `npm ci` (lockfile)
8. **Prisma validated & generated** — `prisma --version`, `validate`, `generate`, verify `node_modules/.prisma/client`
9. **Migration verified** — `migrate deploy` only, never destructive
10. **Build successful** — `npm run build`, verify `.next` and `.next/standalone/server.js`
11. **PM2 restart successful** — `describe` before, `restart --update-env`, `save`, `status`, `describe`, verify `online`
12. **Port listening** — `ss -lntp | grep :3044` (from `ecosystem.config.cjs`), fallback check
13. **Health endpoint successful** — `curl -fsS http://127.0.0.1:3044/api/health` with retries, fallback `/`
14. **.gitmodules clean** — `ls-files --stage | grep 160000` empty, `submodule status` no error

## Deployment Steps (Hardened)

```
PRE-FLIGHT → VERIFY APP DIRECTORY → VERIFY GIT REMOTE → BACKUP → VERIFY COMMIT (SHA) → VERIFY .ENV PRESERVATION → INSTALL (npm ci) → PRISMA VALIDATION → PRISMA GENERATE → DATABASE MIGRATION (deploy only) → BUILD → PM2 RESTART → PORT VERIFICATION (3044) → HEALTH CHECK (/api/health) → FINAL VERIFICATION
```

On health failure: capture diagnostics (`pm2 logs --lines 100`, `ss`, `curl -v`), attempt rollback to previous backup SHA, restore .env, rebuild, restart PM2, verify health again.

## Secrets Handling

- **Required:** `PRODUCTION_VPS_HOST`, `PRODUCTION_VPS_PORT`, `PRODUCTION_VPS_USER`, `PRODUCTION_VPS_SSH_KEY`
- **Optional:** `PRODUCTION_VPS_FINGERPRINT`
- **Legacy fallback:** `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (still supported, but prefer new names)
- **Never hardcoded:** No VPS IP, username, key, DB password, API keys in YAML, shell, .env committed, README, logs, source
- **Validation:** Pre-flight step checks presence without echoing values
- **Security:** `set -Eeuo pipefail` not `set -x`, never log `DATABASE_URL`, `JWT`, tokens

## Production Configuration (Verified)

- **App Dir:** `/root/alo-live` (configurable via `env.PRODUCTION_APP_DIR`)
- **PM2 Name:** `alo-education` (via `env.PM2_APP_NAME`)
- **Port:** `3044` (from `ecosystem.config.cjs` env PORT, via `env.APP_PORT`) — not 3025
- **Health:** `src/app/api/health/route.ts` exists, returns `{status: ok/degraded, database: {connected}}`
- **Ecosystem:** `ecosystem.config.cjs` → `script .next/standalone/server.js`, `PORT 3044`
- **Package:** `package.json` build = `prisma generate && next build --webpack`

## .gitmodules Fix

- Removed 29 invalid submodule gitlinks via `git rm --cached -r _reference_repos`
- Added `_reference_repos/` to `.gitignore`
- Changed checkout to `submodules: false`
- Upgraded checkout `v4` → `v5` (Node 24, fixes Node 20 deprecation warning)
- Verified: `git ls-files --stage | grep 160000` empty, `git submodule status` exit 0

## Workflow Validation

- YAML valid: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-production.yml'))"` → `YAML valid`
- No `script_stop:` input
- No hardcoded secrets
- No `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION`
- No `|| true` hiding failures
- No `prisma migrate dev` / `db push` / `reset`
- No `.env` overwrite

## Final Verification Checklist

- [x] Workflow syntax valid
- [x] Required secrets documented and validated without echoing values
- [x] SSH connectivity pre-flight added
- [x] Production dir configurable and verified (`/root/alo-live`)
- [x] Git remote verified
- [x] Exact SHA verified (`${{ github.sha }}`)
- [x] Backup before destructive (SHA, branch, PM2 state, .env local)
- [x] .env preservation verified, never overwritten
- [x] Prisma validate + generate explicit, migrate deploy only
- [x] npm ci + build fail-fast
- [x] PM2 describe before restart, restart --update-env, save, verify online
- [x] Port 3044 verified via ss (not 3025)
- [x] Health check curl /api/health preferred
- [x] Rollback safety if health fails
- [x] .gitmodules fixed, checkout submodules:false
- [x] actions/checkout updated to v5
- [x] Security: no set -x, no secret logs
- [x] Error reporting with sections
- [x] YAML validation passed

## How to Test Failure Path (Without Breaking Production)

```bash
# 1. Test secret validation (should fail if secrets missing)
# Go to GitHub → Actions → Deploy workflow → Run workflow without secrets set → expect ::error::Missing secret

# 2. Test SSH connectivity
# Use wrong port → expect timeout in SSH connectivity pre-flight step

# 3. Test app dir verification
# On VPS: mv /root/alo-live /root/alo-live.bak && run workflow → expect error "Production directory does not exist" + safe commands listed
# Then mv back

# 4. Test SHA verification
# Manually push new commit while deployment in progress → origin/main SHA differs from GITHUB_SHA → workflow checks out expected SHA, not latest

# 5. Test .env preservation
# On VPS: ls -la /root/alo-live/.env → exists, after git reset still exists

# 6. Test health rollback
# Temporarily break build: on VPS, edit ecosystem to wrong port, deploy → health fails → rollback to previous backup attempted
```

## Remaining Manual Prerequisites

- Set GitHub Secrets: `PRODUCTION_VPS_HOST`, `PRODUCTION_VPS_PORT`, `PRODUCTION_VPS_USER`, `PRODUCTION_VPS_SSH_KEY` (Ed25519, no passphrase)
- Verify VPS `/root/alo-live/.env` exists, chmod 600, contains DATABASE_URL etc (never in GitHub)
- Verify PM2 `alo-education` exists: `pm2 describe alo-education`
- Verify Node 22, npm, pm2, git on VPS
- Verify `ss -lntp | grep 3044` after deploy
- Verify `curl http://127.0.0.1:3044/api/health` → status ok

## Deployment Is LIVE When

- Workflow shows `DEPLOYMENT COMPLETE` and `ALO Education ERP is LIVE on port 3044`
- `pm2 describe alo-education` → online
- `ss -lntp | grep 3044` → node listening
- `curl http://127.0.0.1:3044/api/health` → `{"status":"ok"}`
- `git rev-parse HEAD` on VPS equals GitHub SHA
- No secrets in logs
