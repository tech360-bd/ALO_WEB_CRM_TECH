# VPS + GitHub Connection & Safe Production Deployment (ALO Education)

This guide shows **exactly** how to connect your private GitHub repo to your Linux VPS (Ubuntu/Debian) and deploy without losing `.env`, uploads, or database.

> Placeholders: `YOUR_VPS_HOST`, `YOUR_SSH_USER`, `YOUR_SSH_PORT`, `YOUR_DEPLOY_DIR`, `YOUR_PM2_NAME`, `YOUR_HEALTH_PORT`. Replace before running. Never paste secrets into chat.

---

## 1. Confirm the real VPS values (read-only)

Run on your VPS (SSH or provider console). Nothing is changed.

```bash
# Hostname, user, port, Node, Git, app dir, PM2, listening port
hostname -f
whoami
echo $SSH_CONNECTION
ss -lntp | grep -E ':3000|:3025|:8000'   # shows PM2 port
node -v; npm -v; git --version
pwd; ls -la YOUR_DEPLOY_DIR 2>&1 | head -n 30   # e.g. /root/alo-live
pm2 list
pm2 describe YOUR_PM2_NAME 2>&1 | grep -E 'name|status|script path|cwd|exec cwd|node version|uptime'
curl -i http://127.0.0.1:YOUR_HEALTH_PORT/api/health 2>&1 | head -n 40
cat YOUR_DEPLOY_DIR/.env 2>&1 | head -n 20  # verify .env exists (do not cat secrets)
ls -lh YOUR_DEPLOY_DIR/storage YOUR_DEPLOY_DIR/uploads 2>&1 | head -n 20
```

Document the actual values: `DEPLOY_HOST=YOUR_VPS_HOST`, `DEPLOY_USER=YOUR_SSH_USER`, `DEPLOY_PORT=YOUR_SSH_PORT` (**required — no port-22 fallback since 2026-09-17; verify with `ss -tlnp | grep sshd`**, historical reports recorded `57813`), `DEPLOY_DIR=/root/alo-github-main-new` (intended; the workflow auto-detects the live PM2 `exec cwd` first), `PM2_NAME=alo-education`, `HEALTH_PORT=3044` (must equal the app `PORT`; `3000`/`3025` are legacy values — 3044 is the verified production port).

---

## 2. Create a least-privilege deployment user (recommended, do not use root if possible)

Commands that **change** the server (run once as root):

```bash
# On VPS as root
adduser deploy --disabled-password --gecos ""
usermod -aG sudo deploy   # only if deploy needs pm2 + git; otherwise keep minimal
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
# Give deploy ownership of the app dir (adjust YOUR_DEPLOY_DIR)
chown -R deploy:deploy /root/alo-live  # or: mkdir -p /home/deploy/alo-live && chown deploy:deploy /home/deploy/alo-live
# Allow deploy to run pm2 without password (if PM2 is user-scoped)
# If PM2 is systemd: ensure deploy can run `pm2` via nvm/Node path
```

If your VPS mandate is `root` deploy (many legacy setups use `/root/alo-live`), you may keep `DEPLOY_USER=root` — note that GitHub Secrets will then hold root credentials. Prefer a dedicated `deploy` user.

---

## 3. Configure a deployment SSH key (secure)

**On your local machine** (not the VPS):

```bash
ssh-keygen -t ed25519 -C "alo-education-deploy@YOUR_VPS_HOST" -f ~/.ssh/alo-education-deploy
# Do NOT set a passphrase if GitHub Actions will use it unattended; protect the private key as a GitHub Secret instead
cat ~/.ssh/alo-education-deploy.pub
```

**On the VPS** (as `YOUR_SSH_USER`):

```bash
# Append the public key to authorized_keys
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys   # paste the .pub content, save
chmod 600 ~/.ssh/authorized_keys
# Test from local: you should SSH without password
ssh -i ~/.ssh/alo-education-deploy -p YOUR_SSH_PORT YOUR_SSH_USER@YOUR_VPS_HOST "echo ok; whoami; pm2 list | head"
```

**In GitHub** (repo → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*):

| Secret name | Value | Notes |
|---|---|---|
| `DEPLOY_HOST` | `YOUR_VPS_HOST` | e.g. `65.108.91.110` or `aloeducation.com` |
| `DEPLOY_USER` | `YOUR_SSH_USER` | e.g. `deploy` or `root` |
| `DEPLOY_SSH_KEY` | *private key file content* | `cat ~/.ssh/alo-education-deploy` (including `-----BEGIN...`/`-----END...`) |
| `DEPLOY_PORT` | `YOUR_SSH_PORT` | **required** — the real sshd port, verified on the server (`ss -tlnp \| grep sshd`); no fallback to 22 |

Never print secret values in logs — the workflow masks them with `***`.

---

## 4. Confirm VPS can fetch the private repo

```bash
# On VPS as DEPLOY_USER
ssh -i ~/.ssh/alo-education-deploy -p YOUR_SSH_PORT YOUR_SSH_USER@YOUR_VPS_HOST
cd YOUR_DEPLOY_DIR
git remote -v
# For private repo, deploy must have a deploy key or token with read
# Option A: deploy key (read-only)
# - Generate: ssh-keygen -t ed25519 -C "alo-vps-readonly" -f ~/.ssh/github-alo-readonly
# - Add public key to GitHub repo → Settings → Deploy keys → Allow read-only
# - On VPS: eval $(ssh-agent) && ssh-add ~/.ssh/github-alo-readonly && git fetch origin
# Option B: fine-grained PAT (if deploy uses https)
# - GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → repo read
# - On VPS: git remote set-url origin https://YOUR_PAT@github.com/engralaminn-collab/alo_education_z....ai.git
git fetch origin --prune
git log --oneline -5
```

If `git fetch` fails with `Permission denied (publickey)`, the deploy key is missing.

---

## 5. Configure the deployment directory without overwriting production files

The safe workflow in `.github/workflows/deploy-production.yml` does:

* Backs up `YOUR_DEPLOY_DIR/.env`, `storage/`, `uploads/`, `public/uploads` to `.deploy-backup-<timestamp>-<shortSHA>` before checkout.
* Preserves `.env` across `git checkout --force <SHA>` (copy to `/tmp/alo-env-backup`, restore).
* Does **not** run `git reset --hard origin/main` blindly and does **not** run `git clean -fdx` — uploaded documents and `.env` survive.
* `npm ci` and `npx prisma generate` are run, but migrations are **skipped by default** (`skip_migrations=true`) until you approve.

**Manual check on VPS (read-only):**

```bash
ls -la YOUR_DEPLOY_DIR | head -n 40
ls -lh YOUR_DEPLOY_DIR/.deploy-backup* 2>&1 | head -n 20
cat YOUR_DEPLOY_DIR/.git/COMMIT_EDITMSG 2>&1 | head
```

---

## 6. PM2 process and health endpoint

```bash
# Current PM2 process (as seen earlier)
pm2 describe YOUR_PM2_NAME 2>&1 | grep -E 'name|status|script path|cwd|node version|uptime|memory'
# Health endpoint (public, no auth)
curl -fsS http://127.0.0.1:YOUR_HEALTH_PORT/api/health | python3 -m json.tool
# Expect: {"status":"ok","database":{"connected":true},...} or "degraded" if DB down
# Caddy should reverse_proxy 127.0.0.1:YOUR_HEALTH_PORT (see Caddyfile)
cat /etc/caddy/Caddyfile 2>&1 | head -n 40
```

If `Caddyfile` proxies `:3025` but `ecosystem.config.cjs` serves `:3000`, unify them: set `PORT=3000` in `.env` and `reverse_proxy 127.0.0.1:3000` in Caddyfile, or keep 3025 consistently — document whichever you keep. The deploy workflow auto-detects 3025 vs 3000.

---

## 7. Configure Meta WhatsApp credentials securely (on VPS only)

```bash
nano YOUR_DEPLOY_DIR/.env   # add, never commit:
# WHATSAPP_VERIFY_TOKEN=YOUR_RANDOM_32CHAR
# WHATSAPP_APP_SECRET=YOUR_META_APP_SECRET
# WHATSAPP_TOKEN=YOUR_LONG_LIVED_SYSTEM_USER_TOKEN
# WHATSAPP_PHONE_NUMBER_ID=PHONE_NUMBER_ID_FOR_DEFAULT_SENDER
# WHATSAPP_BUSINESS_ACCOUNT_ID=YOUR_WABA_ID
# WHATSAPP_BUSINESS_PHONE=+8801805020100
pm2 restart YOUR_PM2_NAME --update-env
pm2 logs YOUR_PM2_NAME --lines 50 2>&1 | tail -n 50
curl -i "http://127.0.0.1:YOUR_HEALTH_PORT/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_RANDOM_32CHAR&hub.challenge=12345" 2>&1 | head -n 20
```

See `docs/WHATSAPP-META-SETUP.md` and `docs/EMPLOYEE-WHATSAPP-ASSIGNMENT.md` for the full flow.

---

## 8. Map verified phone_number_id to employees

After webhook verification succeeds:

```bash
# Admin UI: /admin/whatsapp-numbers (requires Super Admin)
# Or via API (Super Admin token):
curl -X POST http://127.0.0.1:YOUR_HEALTH_PORT/api/whatsapp/numbers \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"01805020102","metaPhoneNumberId":"123456789012345","metaBusinessAccountId":"102...","employeeOwnerId":"EMPLOYEE_ID","reason":"Assign verified number to counselor"}'
```

Query audit: `SELECT * FROM WhatsAppNumberAssignmentAudit WHERE phoneNumber='01805020102' ORDER BY createdAt DESC;`

---

## 9. Safe staging / non-production verification

Before touching production:

1. Push to a feature branch `arena/xxxx-...`.
2. Open a PR targeting `main` → CI runs (`lint`, `typecheck`, `tests`, `prisma validate`, `build`) — must be green.
3. Deploy the PR SHA to a **staging** VPS or to the same VPS under a different dir/PM2 (e.g., `YOUR_DEPLOY_DIR-staging`, `PM2_NAME=alo-education-staging`, `HEALTH_PORT=3001`). Use the same workflow with `inputs.ref = PR_SHA`.
4. Verify: `curl http://127.0.0.1:3001/api/health`, click through admin, test inbox with `CONFIGURATION REQUIRED` handling, check `pm2 logs`.
5. Only then proceed to production dispatch.

---

## 10. Manually approve and execute a production deployment

In GitHub → *Actions* → *ALO Education Production Deployment* → *Run workflow*:

* `ref`: the exact commit SHA you approved (e.g., `1454693...` or `main` for latest). The workflow checks out **that SHA**, not a moving branch reference.
* `skip_migrations`: leave `true` if you have not reviewed migrations; set `false` only after `npx prisma migrate status` review.
* Click *Run workflow* → monitor logs → verify `Deployed: <SHA>` matches `Expected: <SHA>` and health is `ok`.

---

## 11. Verify the deployment and roll back safely

```bash
# On VPS
cd YOUR_DEPLOY_DIR
git rev-parse HEAD; git log --oneline -3
pm2 describe YOUR_PM2_NAME | grep status
curl -fsS http://127.0.0.1:YOUR_HEALTH_PORT/api/health | python3 -m json.tool
ls -lh .deploy-backup* | head -n 20
```

If health fails, rollback: see `docs/PRODUCTION-ROLLBACK.md` (restores previous commit + `backup/.env`/`storage` + `pm2 reload`).

---

## 12. Operational notes

* The deploy workflow **never** prints `DEPLOY_SSH_KEY` or WhatsApp tokens — they are masked.
* The workflow is **not** destructive to production checkouts (no `git clean`, no blind `reset --hard` without backup, `.env` preserved).
* Migrations are **not** run automatically unless `skip_migrations=false` and you have approved them — run `npx prisma migrate deploy` separately if needed.
* Uploaded documents live under `storage/` / `uploads/` / `public/uploads` — these are excluded from git and preserved.
* For telecom/SMS/WhatsApp: CI never sends real messages; provider calls require `WHATSAPP_TOKEN` + `phone_number_id` which are absent in CI.
