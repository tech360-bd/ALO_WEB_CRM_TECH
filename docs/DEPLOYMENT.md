# ALO Education — Production Deployment (GitHub → VPS)

**Last corrected:** 2026-09-17 (full-project audit). This document now describes the workflow
that is ACTUALLY installed in `.github/workflows/deploy-production.yml` — an earlier version of
this page described an older, never-shipped workflow generation (different secret names, nginx
auto-switching from `:3025`, `/root/alo-releases` backups). Those descriptions are obsolete;
the historical context is kept at the end of each section.

**Target**
- Intended app directory: `/root/alo-github-main-new` (workflow auto-detects ground truth: the
  live PM2 `exec cwd` first, then an existing checkout whose git remote matches this repository —
  intended dir first, legacy `/root/alo-github-main` next — then initializes the intended dir)
- Port: `3044` (HOSTNAME `0.0.0.0`) · PM2 process: `alo-education`
- Domain: `https://aloeducation.com` (reverse proxy → `127.0.0.1:3044`)
- Protected, never touched: `learn.aloeducation.com` → PM2 `alo-learning-journey` → port `3017`

The single source of truth for workflow behavior is the workflow file itself. Secrets checklist
and runbooks: `docs/CICD_WORKFLOWS.md`. Incident investigation: `docs/VPS_INCIDENT_RUNBOOK_2026-09-17.md`.

---

## 1. GitHub Secrets & variables (Repository → Settings → Secrets and variables → Actions)

These are the EXACT names the installed workflow consumes — do not invent alternates:

| Name | Type | Required | Notes |
|---|---|---|---|
| `DEPLOY_HOST` | Secret | yes | VPS hostname/IP (historical reports: `server.aloeducation.com`) |
| `DEPLOY_USER` | Secret | yes | SSH user (historical reports: `root`; a restricted `deploy` user is preferable — see §2) |
| `DEPLOY_SSH_KEY` | Secret | yes | **Private** key (full content incl. `-----BEGIN … PRIVATE KEY-----`), dedicated deploy keypair, no passphrase |
| `DEPLOY_PORT` | Secret | **yes (required since 2026-09-17)** | The VPS's REAL SSH port. There is **no silent fallback to 22**: the deploy gate rejects missing / non-numeric / out-of-range (1–65535) values with actionable errors, and a TCP preflight classifies reachability before authentication. Verify on the server: `ss -tlnp | grep sshd`. Historical reports recorded `57813` for `server.aloeducation.com` — re-verify before trusting. |
| `DEPLOY_HOST_SSH_FINGERPRINT` | **Repository VARIABLE** (non-secret) | yes | SSH host-key pin, `SHA256:...` (ed25519 line). Obtain: `ssh-keyscan -p <DEPLOY_PORT> <DEPLOY_HOST> \| ssh-keygen -lf -` and verify out-of-band (two independent channels) — never TOFU. Host-key checking is never disabled. |
| `production` environment | Environment | exists | Deploy job runs inside it; optionally add required reviewers |

Built-in `GITHUB_TOKEN` (permissions `contents: read`) is used for the private-repo fetch on the
VPS via an inline credential helper — the token is never written to `.git/config` or any remote
URL. No third-party tokens are stored.

**Historical note (do not use):** an older workflow generation used `PRODUCTION_VPS_HOST`,
`PRODUCTION_VPS_USER`, `PRODUCTION_VPS_SSH_KEY`, `PRODUCTION_VPS_PORT`,
`PRODUCTION_VPS_FINGERPRINT` (see `docs/DEPLOYMENT_FIX_REPORT.md`, failure "Job 103991234761":
empty `INPUT_HOST/PORT/USERNAME/KEY` and invalid `script_stop` input). The installed workflow
uses only the `DEPLOY_*` names above; that failure class (missing-input + invalid-input) is
additionally prevented today by the gate's presence check and the TCP preflight.

Never store database credentials, `WHATSAPP_TOKEN`, or `WHATSAPP_APP_SECRET` in GitHub.

---

## 2. Deployment user — least privilege (recommended)

Do **not** use `root` SSH if a restricted user can be configured.

**On VPS as `root` (once):**
```bash
# 1. Create deploy user
adduser deploy --disabled-password --gecos ""  # or: useradd -m -s /bin/bash deploy
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
chown deploy:deploy /home/deploy/.ssh

# 2. App directories — deploy must write to the production dir
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

# 5. Node 22
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
# Test from local (use the REAL port — see the DEPLOY_PORT row in §1):
ssh -i ~/.ssh/alo-education-deploy -p <DEPLOY_PORT> deploy@YOUR_HOST "whoami; pm2 list | head; ls -ld /root/alo-github-main-new"
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
nginx -t && nginx -v || true
caddy version 2>&1 | head -1 || echo "Caddy not used"
mysql --version  # MySQL 8.0+
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
# Reverse proxy — read-only check; the workflow NEVER edits proxy config:
grep -RE "proxy_pass.*3044|reverse_proxy.*3044" /etc/nginx/ /etc/caddy/ 2>/dev/null | head
```

Standalone config validation (no server needed — run anywhere the repo is checked out):
```bash
node scripts/validate-deployment-config.mjs   # checks ecosystem PORT/HOSTNAME, health route, expected dir
```

**MySQL:**
- Connection is via server `.env` `DATABASE_URL` — never print, commit, or overwrite.
- Workflow never runs `prisma db push`, `prisma migrate reset`, or seeds.
- `prisma migrate deploy` runs **only** when workflow input `skip_migrations=false` (explicit
  operator opt-in) and after the backup/review gate in `docs/db/2026-09-16-employee-document-version/README.md`.

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

`.github/workflows/ci.yml` (trigger: PR → main + manual dispatch; **never deploys, uses no
repository secrets** — fork-PR safe):
- `npm ci` from the committed lockfile
- secret-leak scan over tracked files
- `prisma validate` + `prisma generate` (step-scoped dummy `DATABASE_URL`)
- `npm run lint`, `npm run typecheck` (with swap + raised heap — this repo's tsc exceeds the
  runner default), `npm test` (vitest; DB-integration tests self-skip without a disposable
  `DATABASE_URL` and are reported as skipped, never passed)
- `npm run build` with dummy env; verifies `.next/standalone/server.js`
- `tests/unit/deployment-config.test.ts` (port 3044, hostname 0.0.0.0, standalone) runs inside
  the vitest suite; `scripts/validate-deployment-config.mjs` can also be run standalone

Branch protection: require the `CI — Pull Request Validation` check before merging to `main`.

No merge or deploy without green CI.

---

## 5. Deployment — what the installed workflow actually does

`.github/workflows/deploy-production.yml` is **the only** production deploy path.
Trigger: `push` to `main` (docs-only pushes are excluded via `paths-ignore`), `workflow_dispatch`
(explicit `ref` + `skip_migrations`), or `workflow_call` from `deploy-recovery.yml`
(operator recovery with strict 40-hex-SHA input).

**Gate job (on the GitHub runner — production untouched if any of this fails):**
1. Resolves the deployment ref to an exact 40-char SHA; verifies repository identity.
2. **Configuration presence gate (names only, never values):** `DEPLOY_HOST`, `DEPLOY_USER`,
   `DEPLOY_SSH_KEY`, `DEPLOY_PORT` (validated: numeric, no leading zeros, 1–65535), variable
   `DEPLOY_HOST_SSH_FINGERPRINT` (must look like `SHA256:...`).
3. `npm ci`, prisma validate/generate, lint, typecheck (with swap), blocking tests, full
   production build; verifies `.next/standalone/server.js`.

**Deploy job (in the protected `production` environment; concurrency-locked):**
1. **TCP preflight (no auth):** classifies the SSH target as `open` / `refused-or-unreachable` /
   `filtered-or-timeout` / `dns-failure` and aborts with a classified error if not open — a
   network problem can never be misreported as an authentication problem.
2. SSH (appleboy/ssh-action v1.2.5, pinned SHA) with `fingerprint:` host-key pinning.
3. On the VPS: protects `alo-learning-journey` (never stopped/restarted); picks the deploy dir
   from ground truth (live PM2 `exec cwd` → matching remote checkout → intended
   `/root/alo-github-main-new`); verifies the checkout's remote matches this repository.
4. Backs up `.env`, `storage`, `uploads`, `public/uploads`, `ecosystem.config.cjs` to
   `.deploy-backup-<timestamp>-<shortSHA>/` and records the previous commit in
   `.deploy-prev-commit`. No `git clean` is ever run.
5. Fetches with the ephemeral `GITHUB_TOKEN` (inline credential helper), checks out the EXACT
   SHA, hard-fails unless `HEAD == requested SHA`, appends to `.deploy_history.log`.
6. `npm ci` → prisma validate/generate → `migrate status`; migrations only on explicit
   `skip_migrations=false` (never seeds) → `npm run build` → verifies standalone server.js.
7. Restarts ONLY `alo-education` (ecosystem or explicit `PORT=3044 HOSTNAME=0.0.0.0` start);
   `pm2 save`; waits for port 3044; checks protected port 3017 is still listening.
8. Local health `http://127.0.0.1:3044/api/health` (parses `status: ok|degraded`), spot-checks
   `/`, `/universities`, `/courses`, `/destinations`, then public
   `https://aloeducation.com/api/health`; read-only reverse-proxy verification (grep only).
9. Prints a Deployment Summary (deployed commit, previous commit, deploy dir, PM2, ports, backup dir).

**Rollback (accurate semantics):** if the SSH deploy step fails, a bounded rollback step
redeploys the commit recorded in `.deploy-prev-commit`, rebuilds, restarts, re-checks health,
and preserves the failed attempt's PM2 logs in `storage/logs/failed-deploy-*.log`. If the
previous commit is unknown it refuses to guess and points at the `.deploy-backup-*` snapshots.
**If the SSH connection itself never established (e.g. TCP preflight failure or SSH-level
refusal), nothing was modified and no rollback is attempted or required — the run fails with the
classification instead of fabricating a rollback.**

**Health endpoints:**
- Local: `http://127.0.0.1:3044/api/health` → `{"status":"ok","database":{"connected":true}}` or `degraded`
- Public: `https://aloeducation.com/api/health` (same)

Deployment is **not** considered live until the workflow's Deployment Summary and health checks
pass. Do not claim live otherwise.

---

## 6. Reverse proxy — read-only from the workflow

The installed workflow **never edits nginx/Caddy configuration**. It only greps for
`proxy_pass … 3044` / Caddyfile references and warns if the proxy doesn't mention the port.
Proxy changes are manual, operator-owned actions (`nginx -t` before any reload).
Historical note: an earlier (never-shipped) design auto-switched `:3025 → :3044` after health
passed; that behavior does not exist in the installed workflow and its descriptions elsewhere
in old reports are obsolete.

Manual verification:
```bash
grep -RE "proxy_pass|reverse_proxy" /etc/nginx/sites-enabled/ /etc/caddy/ 2>/dev/null | grep -E "3044|3017"
nginx -t 2>/dev/null || caddy validate --config /etc/caddy/Caddyfile 2>/dev/null
systemctl status nginx 2>/dev/null | head -3 || systemctl status caddy | head -3
curl -i https://aloeducation.com/api/health | head -n 20
```

---

## 7. Rollback

Automatic (preferred): the workflow's bounded rollback step (see §5).

Manual (only when automatic rollback reports "MANUAL INTERVENTION REQUIRED"):
```bash
cd /root/alo-github-main-new            # or the dir from the Deployment Summary
cat .deploy-prev-commit                  # previous known commit
ls -dt .deploy-backup-* | head           # backups: .env.backup, storage, uploads, ecosystem.config.cjs
cat .deploy_history.log | tail           # deployment history

PREV_SHA=$(cat .deploy-prev-commit)
# Restore code without losing .env
cp .env /tmp/cur-env 2>/dev/null || true
git fetch origin --prune
git checkout --force "$PREV_SHA"
cp /tmp/cur-env .env 2>/dev/null || true
npm ci && npx prisma generate && npm run build
pm2 restart ecosystem.config.cjs --update-env || pm2 restart alo-education --update-env
pm2 save
sleep 3
curl -fsS http://127.0.0.1:3044/api/health | python3 -m json.tool
```

Or via GitHub: Actions → *Recovery — Deploy Exact Commit* → paste the 40-char `PREV_SHA` →
`skip_migrations=true` → Run (same gated pipeline, same protections).

Never run `git reset --hard`, `git clean -fdx`, `prisma db push`, or `prisma migrate reset` on production.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Gate fails `DEPLOY_PORT is missing` | Secret not configured (required since 2026-09-17) | Add the verified SSH port as secret `DEPLOY_PORT` (§1) |
| Gate fails `DEPLOY_PORT … out of range` / non-numeric | Typo or placeholder in the secret | Correct the secret to a number 1–65535, no leading zeros |
| TCP preflight `dns-failure` | Wrong `DEPLOY_HOST` or DNS record | Verify host on server console / DNS provider |
| TCP preflight `refused-or-unreachable` | Wrong port or sshd down | On server console: `ss -tlnp | grep sshd`; fix `DEPLOY_PORT` or start sshd |
| TCP preflight `filtered-or-timeout` | Firewall/cloud security group blocks the port | Allow the GitHub Actions IP range or the correct port in the firewall |
| Deploy fails `Permission denied (publickey)` | Public key not in the user's `authorized_keys` | Re-add pub key, re-test `ssh -i key -p <port> user@host whoami` |
| Deploy fails host-key verification | `DEPLOY_HOST_SSH_FINGERPRINT` doesn't match the real host key | Re-verify via two independent channels (`ssh-keyscan` + console `for k in /etc/ssh/ssh_host_*_key.pub; do ssh-keygen -lf $k; done`), update the variable |
| `git fetch` auth failure on VPS | (Historical, fixed) bare fetch in a private repo | Current workflow uses the ephemeral `GITHUB_TOKEN` credential helper — if seen, check the workflow version |
| `Missing .next/standalone/server.js` | `output: standalone` missing or build failed | Check `next.config.ts`, run `npm run build` locally |
| `Port 3044 not listening` | `ecosystem.config.cjs` wrong or build/`.env` broken | `pm2 logs alo-education --lines 120`; verify `PORT 3044`, `HOSTNAME 0.0.0.0` |
| `Local health failed` | DB down or `.env` missing `DATABASE_URL` | Check `.env` keys (never paste values), `pm2 logs`, DB service status |
| `Public health 502` | Reverse proxy up but app down (today's incident class) | Follow `docs/VPS_INCIDENT_RUNBOOK_2026-09-17.md` |
| `prisma migrate deploy` failed | Pending migrations need review | `npx prisma migrate status` on VPS, review SQL in `prisma/migrations/`, apply manually only if safe |

**Logs:**
```bash
pm2 logs alo-education --lines 100
pm2 describe alo-education | grep -E "status|uptime|memory|error"
cat storage/logs/failed-deploy-*.log 2>/dev/null | tail -100   # preserved failed-deploy diagnostics
ls -lh .deploy-backup-* .deploy_history.log 2>/dev/null
```

**Never expose:** `.env`, `DATABASE_URL`, `DEPLOY_SSH_KEY`, `WHATSAPP_TOKEN` in logs, artifacts, or PR descriptions.

---

## 9. Checklist before marking deploy live

- [ ] CI green (gate job green on the deploy run: lint, typecheck, tests, build with standalone)
- [ ] TCP preflight reported `open`
- [ ] Deployment Summary shows the exact intended SHA, deploy dir, and backup dir
- [ ] `pm2 describe alo-education` → `online`, `PORT 3044`, `HOSTNAME 0.0.0.0`, uptime increasing
- [ ] `curl http://127.0.0.1:3044/api/health` → `{"status":"ok"}` (degraded only with a DB incident open)
- [ ] `ss -lntp | grep 3044` shows node; `ss -lntp | grep 3017` still shows the protected service
- [ ] `curl https://aloeducation.com/api/health` → `status` ok (not 502)
- [ ] `cat .deployed_commit` on the VPS equals the deployed SHA from the workflow summary
- [ ] No secrets in workflow logs
