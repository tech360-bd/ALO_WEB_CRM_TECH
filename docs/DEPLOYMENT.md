# ALO Education — Production Deployment (GitHub → VPS)

**Target**
- App directory: `/root/alo-github-main-new`
- Port: `3044` (HOSTNAME `0.0.0.0`)
- Domain: `https://aloeducation.com` (Nginx `proxy_pass http://127.0.0.1:3044`)
- Previous Nginx upstream `127.0.0.1:3025` is kept until new release passes health checks, then atomically switched to `3044` and reloaded only after `nginx -t` succeeds.

This doc is the single source of truth for GitHub Secrets, deployment-user setup, server prerequisites, rollback, and troubleshooting. It replaces placeholders in older docs.

---

## 1. GitHub Secrets (Repository → Settings → Secrets and variables → Actions → New repository secret)

| Secret | Value | Notes |
|---|---|---|
| `DEPLOY_HOST` | VPS IP/hostname, e.g. `65.108.91.110` or `aloeducation.com` | SSH host |
| `DEPLOY_USER` | `deploy` (recommended) or `root` (legacy) | Restricted deploy user, see §2 |
| `DEPLOY_SSH_KEY` | Private key content (`cat ~/.ssh/alo-education-deploy`) including `-----BEGIN OPENSSH PRIVATE KEY-----` | Ed25519, no passphrase, never commit |
| `DEPLOY_PORT` | `22` (or `2222` if hardened) | SSH port |

All four are required by `.github/workflows/deploy-production.yml`. The workflow never prints them.

Optional (already in server `.env`, not GitHub secrets):
- `DATABASE_URL`, `NEXTAUTH_SECRET`, `WHATSAPP_TOKEN`, etc. — managed only on the server.

Never store database credentials, `WHATSAPP_APP_SECRET`, or `WHATSAPP_TOKEN` in GitHub.

---

## 2. Deployment user — least privilege (recommended)

Do **not** use `root` SSH if a restricted user can be configured.

**On VPS as `root` (once):**
```bash
# 1. Create deploy user
adduser deploy --disabled-password --gecos ""  # or: useradd -m -s /bin/bash deploy
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
chown deploy:deploy /home/deploy/.ssh

# 2. App directories — deploy must write to production dir and releases
mkdir -p /root/alo-github-main-new /root/alo-releases /root/alo-shared
# Option A: give deploy ownership (if /root is acceptable)
chown -R deploy:deploy /root/alo-github-main-new /root/alo-releases /root/alo-shared
chmod 750 /root/alo-github-main-new /root/alo-releases
# Option B (safer): keep /root owned by root, put app in /home/deploy
# mkdir -p /home/deploy/alo-github-main-new && ln -sfn /home/deploy/alo-github-main-new /root/alo-github-main-new

# 3. Sudoers — deploy may run only required commands without password
cat > /etc/sudoers.d/deploy-alo <<'SUDO'
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/sbin/nginx -t, /usr/bin/nginx -t, /bin/systemctl reload nginx, /usr/bin/caddy reload *, /usr/bin/caddy fmt *, /usr/local/bin/pm2 *, /usr/bin/pm2 *
SUDO
chmod 440 /etc/sudoers.d/deploy-alo

# 4. PM2 — install globally for deploy user (Node 22 via nvm or nodesource)
su - deploy -c "npm i -g pm2@latest"
# Ensure pm2 is in PATH for deploy: link to /usr/local/bin if needed
ln -sf $(su - deploy -c "which pm2") /usr/local/bin/pm2 2>/dev/null || true

# 5. Nginx — allow deploy to edit site and reload (via sudo above)
chgrp deploy /etc/nginx/sites-enabled/aloeducation.com 2>/dev/null || true
chmod 640 /etc/nginx/sites-enabled/aloeducation.com 2>/dev/null || true

# 6. Node 22
node -v; npm -v  # must be >=22 and >=10
```

**SSH key:**

On your **local machine:**
```bash
ssh-keygen -t ed25519 -C "alo-education-deploy@$(hostname)" -f ~/.ssh/alo-education-deploy
cat ~/.ssh/alo-education-deploy.pub  # copy this
```

On **VPS as `deploy`:**
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys  # paste .pub, save
chmod 600 ~/.ssh/authorized_keys
# Test from local:
ssh -i ~/.ssh/alo-education-deploy -p 22 deploy@YOUR_HOST "whoami; pm2 list | head; ls -ld /root/alo-github-main-new"
```

Then add the **private** key content to GitHub `DEPLOY_SSH_KEY`.

If you must use `root`, set `DEPLOY_USER=root` — note that GitHub then holds root credentials (higher risk).

---

## 3. Server prerequisites

**System:**
```bash
node -v  # v22.x
npm -v   # 10.x
pm2 -v
nginx -t && nginx -v
caddy version 2>&1 | head -1 || echo "Caddy not used — Nginx is primary"
mysql --version  # MySQL 8.0
git --version
ss -lntp | head
```

**App prerequisites:**
```bash
ls -ld /root/alo-github-main-new
cat /root/alo-github-main-new/.env 2>&1 | head -n 5  # must exist — never delete
ls -ld /root/alo-github-main-new/storage /root/alo-github-main-new/uploads /root/alo-github-main-new/public/uploads 2>&1 | head
cat /root/alo-github-main-new/ecosystem.config.cjs | grep -E "PORT|HOSTNAME"
# Must show PORT "3044" and HOSTNAME "0.0.0.0"

pm2 describe alo-education 2>&1 | grep -E "name|status|script path|cwd|exec cwd"
curl -fsS http://127.0.0.1:3044/api/health | python3 -m json.tool
cat /etc/nginx/sites-enabled/aloeducation.com 2>&1 | grep -E "proxy_pass|aloeducation|3044|3025" | head
```

**MySQL:**
- Connection is via server `.env` `DATABASE_URL` — never print, commit, or overwrite.
- Workflow never runs `prisma db push` or `prisma migrate reset`.
- `prisma migrate deploy` runs **only** when workflow input `skip_migrations=false` and after you have reviewed `prisma/migrations/` and `npx prisma migrate status`.

**Build validation:**
```bash
# On VPS or CI — must create .next/standalone/server.js
npm ci
npx prisma generate
npm run build
test -f .next/standalone/server.js && echo "✓ standalone ok" || echo "✗ missing"
```

---

## 4. CI — must pass before merge to main

`.github/workflows/ci.yml` (trigger: PR → main, push → main):
- Validates `package-lock.json` present, `bun.lock` absent, `packageManager: npm@...`
- `npm ci` (from lockfile)
- `prisma validate` + `prisma generate`
- `npm run lint`, `npm run typecheck`, `npm run test` (vitest)
- `scripts/validate-deployment-config.mjs` + `tests/unit/deployment-config.test.ts` (port 3044, hostname 0.0.0.0, standalone)
- `npm run build` with dummy env, verifies `.next/standalone/server.js` exists and respects `PORT`/`HOSTNAME`
- Fails if any step fails.

Branch protection: enable in GitHub → Settings → Branches → Require status checks to pass before merging (require `lint-typecheck-test`).

No merge or deploy without green CI.

---

## 5. Deployment — release/rollback, validate before switch

`.github/workflows/deploy-production.yml` is **the only** production deploy path.

**Trigger:** `push` to `main` (after PR merge) or `workflow_dispatch` with explicit `ref` and `skip_migrations`.

**What it does (on VPS via SSH):**
1. Resolves exact `DEPLOY_SHA` = `github.sha` (or `inputs.ref` if manually dispatched) — never `origin/main` head.
2. Backs up `/.env`, `storage`, `uploads`, `public/uploads` to `/root/alo-releases/backups/pre-<shortSHA>-<timestamp>` and writes `PREV_SHA`.
3. `git fetch origin --prune` and `git cat-file -e $DEPLOY_SHA` — fails if SHA not reachable.
4. Preserves `.env` (gitignored) across `git checkout --force $DEPLOY_SHA` via `/tmp/alo-env-preserve`.
5. `npm ci` (requires `package-lock.json`, fails if `bun.lock` present).
6. `npx prisma generate` (uses real `.env` DATABASE_URL or dummy).
7. Migrations: skipped by default (`skip_migrations=true`). If `false`, runs `prisma migrate deploy`.
8. `npm run build` → verifies `.next/standalone/server.js`.
9. `node scripts/validate-deployment-config.mjs`.
10. `pm2 reload ecosystem.config.cjs --env production` (or `pm2 start` if first). `ecosystem.config.cjs` must have `HOSTNAME 0.0.0.0`, `PORT 3044`.
11. Waits for `ss -lntp | grep :3044` and `curl -fsS http://127.0.0.1:3044/api/health` (6 retries). Fails deploy if local health fails.
12. **Only then** updates Nginx/Caddy: finds site with `aloeducation.com` + `:3025`, `sed s/:3025/:3044/g`, `nginx -t` then `systemctl reload nginx` (or `caddy reload`). Preserves unrelated vhosts (only that file).
13. Public check `curl -fsS https://aloeducation.com/api/health` (5 retries, warns but does not fail if CDN delay).
14. Verifies `git rev-parse HEAD == DEPLOY_SHA`, prunes old backups (keep 10).

**Health endpoints:**
- Local: `http://127.0.0.1:3044/api/health` → `{"status":"ok","database":{"connected":true}}` or `degraded`
- Public: `https://aloeducation.com/api/health` (same)

Deployment is **not** considered live until workflow shows `DEPLOYMENT COMPLETE` and both health checks pass. Do not claim live otherwise.

---

## 6. Nginx update — only after healthy

- Before deploy, server proxies `aloeducation.com` → `127.0.0.1:3025`.
- After step 12, it proxies → `127.0.0.1:3044`.
- Workflow backs up config to `*.bak-<timestamp>` before `sed`.
- It runs `nginx -t` first; if that fails, it **does not** reload and fails the job, leaving previous Nginx active.
- Unrelated vhosts (other `server_name`) are untouched.

Manual verification:
```bash
cat /etc/nginx/sites-enabled/aloeducation.com | grep -E "proxy_pass|server_name"
nginx -t
systemctl status nginx | head
curl -i https://aloeducation.com/api/health | head -n 20
```

---

## 7. Rollback

See `docs/PRODUCTION-ROLLBACK.md` (updated for `/root/alo-github-main-new` and `3044`). Quick path:

```bash
cd /root/alo-github-main-new
git log --oneline -5
PREV_SHA=$(cat /root/alo-releases/backups/pre-*/PREV_SHA | head -n1 || git rev-parse HEAD~1)
BACKUP_DIR=$(ls -dt /root/alo-releases/backups/pre-* | head -n1)
echo $PREV_SHA $BACKUP_DIR

# Restore code without losing .env
cp .env /tmp/cur-env 2>/dev/null || true
git fetch origin --prune
git checkout --force $PREV_SHA
cp /tmp/cur-env .env 2>/dev/null || cp $BACKUP_DIR/.env .env 2>/dev/null || true
[ -d $BACKUP_DIR/storage ] && rm -rf storage && cp -a $BACKUP_DIR/storage ./
[ -d $BACKUP_DIR/uploads ] && rm -rf uploads && cp -a $BACKUP_DIR/uploads ./
[ -d $BACKUP_DIR/public_uploads ] && rm -rf public/uploads && mkdir -p public && cp -a $BACKUP_DIR/public_uploads public/uploads

npm ci
npx prisma generate
npm run build
pm2 reload ecosystem.config.cjs --env production
pm2 save
sleep 3
curl -fsS http://127.0.0.1:3044/api/health | python3 -m json.tool
# Revert Nginx if it was changed
sudo cp /etc/nginx/sites-enabled/aloeducation.com.bak-* /etc/nginx/sites-enabled/aloeducation.com 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
```

Or via GitHub: Actions → Deploy workflow → Run workflow → `ref = PREV_SHA` → `skip_migrations=true` → Run (same safe logic).

Never run `git reset --hard`, `git clean -fdx`, `prisma db push`, or `prisma migrate reset` on production.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Workflow fails `bun.lock found` | Both lockfiles committed | `rm bun.lock && git rm bun.lock && git commit -m "use npm"` — CI expects only `package-lock.json` |
| `prismagenerate: command not found` | Typo `prismagenerate` | Ensure `package.json` build has `prisma generate` with space |
| `Missing .next/standalone/server.js` | `next.config` not `output: standalone` or build failed | Check `next.config.ts` has `output: "standalone"` and `npm run build` succeeds locally with dummy env |
| `Port 3044 not listening` | `ecosystem.config.cjs` still `3000`/`127.0.0.1` or build failed | Fix to `PORT 3044`, `HOSTNAME 0.0.0.0`, rebuild, `pm2 describe alo-education` |
| `Local health failed` | DB down or `.env` missing `DATABASE_URL` | `cat .env | grep DATABASE_URL` (do not paste secret), `pm2 logs alo-education --lines 100`, `npx prisma migrate status` |
| `Nginx not reloaded` | `nginx -t` failed due to syntax | `sudo nginx -t` shows error, restore `*.bak-*`, check `proxy_pass` line |
| `Public health 502` | Nginx still pointing to 3025 while app on 3044 | Workflow should have switched after local health — check `/etc/nginx/...` has `3044` |
| `Permission denied (publickey)` | Deploy key not in `authorized_keys` or wrong `DEPLOY_USER` | Re-add pub key to VPS `~/.ssh/authorized_keys`, test `ssh -i key deploy@host whoami` |
| `git cat-file -e SHA failed` | SHA not fetched (private repo, deploy key lacks read) | Add deploy key read-only to GitHub repo → Deploy keys, or use PAT for `https` remote |
| `prisma migrate deploy` failed | Pending migrations need review | `npx prisma migrate status` on VPS, review SQL in `prisma/migrations/`, run manually only if safe |

**Logs:**
```bash
pm2 logs alo-education --lines 100
pm2 describe alo-education | grep -E "status|uptime|memory|error"
journalctl -u nginx --lines 100 2>&1 | tail
cat /var/log/caddy/alo_education_access.log 2>&1 | tail
ls -lh /root/alo-releases/backups/ | head
```

**Never expose:** `.env`, `DATABASE_URL`, `DEPLOY_SSH_KEY`, `WHATSAPP_TOKEN` in logs, artifacts, or PR descriptions.

---

## 9. Checklist before marking deploy live

- [ ] CI green on `main` (`lint`, `typecheck`, `test`, `prisma validate`, `build` with standalone)
- [ ] Deployment workflow shows `Deployed SHA == Expected SHA` and `Backup at: ...`
- [ ] `pm2 describe alo-education` → `online`, `PORT 3044`, `HOSTNAME 0.0.0.0`, uptime increasing
- [ ] `curl http://127.0.0.1:3044/api/health` → `{"status":"ok"}` or `degraded` with DB error explained
- [ ] `ss -lntp | grep 3044` shows node
- [ ] `nginx -t` passed and `systemctl reload nginx` succeeded
- [ ] `curl https://aloeducation.com/api/health` → `status` ok/degraded (not 502)
- [ ] `git rev-parse HEAD` on VPS equals GitHub `main` head and `DEPLOY_SHA`
- [ ] No secrets in workflow logs

Return this checklist with PR link, changed-file summary, CI results, required secrets, and remaining manual prerequisites (see PR description).
