# PHASE 14 — Release Checklist (Human Approval Required)

**Branch:** `arena/01a09c20-alo-education-z-ai` @ `b302364` (+ local workflow 3044 fix pending push) | **Date:** 2026-09-15 Asia/Dhaka | **Do not deploy until all Mandatory checked and human signs.**

## Mandatory Gates (must be ✅ before READY → DEPLOYED)

- [ ] **GitHub workflow port:** `docs/patches/WORKFLOW_3044_FIX.patch` applied to `arena/01a09c20-alo-education-z-ai` on GitHub (requires `workflows: write` or PAT `workflow` scope). Verify `git ls-remote origin arena/...` shows new SHA + `grep 3044` in workflow. *Arena App cannot push workflows — manual web edit required.*
- [ ] **VPS `.env` required secrets present (report bool only):** `DATABASE_URL`, `NEXTAUTH_SECRET` (32), `ENCRYPTION_KEY` (64-hex), `FILE_SIGN_SECRET` (≥32), `ALO_CRON_SECRET` (≥16), `WHATSAPP_*` if WA, `REDIS_URL` if locking, `MOLX_URL` reachable (`http://molx:3001` compose), `GOOGLE_CLIENT_*` if social/SEO. *Never commit values — check via `grep -c` placeholder vs real length on VPS.*
- [ ] **Backups verified:** `ls -lh /root/backups/alo-*.sql.gz` + `sha256sum` + `ls -lh /root/backups/storage-*/` — **before** `migrate deploy`.
- [ ] **Prisma:** `npx prisma validate` exit 0 + `npx prisma generate` exit 0 **in CI/VPS with network** (sandbox fails `binaries.prisma.sh` disconnect — env failure not code). `npx prisma migrate status` shows no pending destructive.
- [ ] **Tests:** `npm test` → `14/15` with `154` pass, `1 failed consultation-workflow` only due to `prisma generate` network (see report §4) — plus new `cron-auth`/`SSRF`/`webhook` tests added. `deployment-config` + `security-hardening` strict `3044` pass.
- [ ] **Lint/Typecheck:** Lint `27` pre-existing (not Phase14 regressions) — either fix or approve to run non-strict in deploy. Typecheck `15` pre-existing (prisma client drift) — same.
- [ ] **Security:** `npm audit` → `7 vulns (2 moderate, 5 high)` after safe fix (was `12`). Critical `next` RCE is **Windows-only** on Linux prod — schedule `next`+`sharp` update non-breaking. No secrets in `git log`, `sourceMap`, `client bundle`.
- [ ] **Caddy/nginx:** `Caddyfile` + `nginx.conf` + `docker-compose` + `ecosystem` + `Dockerfile` all `3044` (verified). `HEALTH_PORT=3044`.
- [ ] **Human approval:** Authorized owner signs below after smoke tests §.

## Smoke Tests (authorized operator, live `aloeducation.com:3044`, do not claim unless actually ran)

- [ ] `curl -I https://aloeducation.com` → `200` + `Strict-Transport-Security`
- [ ] `curl -fsS http://127.0.0.1:3044/api/health | jq '.status, .database.connected'` → `ok` + `true` + `ss -lntp | grep :3044` + `pm2 describe` online
- [ ] Login `SUPER_ADMIN` → `/admin` 200, `STUDENT` → `/admin` 403, `/api/auth/session` 401 when unauth
- [ ] `redis-cli ping` → `PONG` + `curl /api/automation/schedule | jq .redisMode` → `redis` (not `memory-fallback`)
- [ ] `curl https://aloeducation.com/api/automation/schedule` no header → `401` hint, `curl -H "Authorization: Bearer wrong" -X POST` → `401`, `curl -H "Authorization: Bearer $ALO_CRON_SECRET" -X POST` → `200` `cronSecretVerified`
- [ ] `curl /api/research/provider-status | jq .providers.primary` → `molx`/`firecrawl` + `hardening.timeoutMs 15000`
- [ ] `curl "/api/employee-access/secure-download?filePath=/private/x.pdf"` no auth → `401`/`403`, valid signed URL → `200` + audit
- [ ] WhatsApp webhook `GET ?hub.mode=subscribe&hub.verify_token=...` → `challenge`, `POST -H "X-Hub-Signature-256: sha256=invalid"` → `403`, valid HMAC → `200` + idempotency (duplicate `providerMsgId` ignored)
- [ ] `ls -lh /root/backups/` + `pm2 logs --lines 20` + `tail /var/log/caddy/alo_education_access.log`

## Post-Deploy

- [ ] `git rev-parse HEAD == origin/main` on VPS (`/root/alo-live`)
- [ ] `npx prisma migrate deploy` exit 0 (after backup)
- [ ] `npm run build` + `pm2 restart` + `ss :3044` + `curl :3044/` 200
- [ ] Monitor errors, backup retention 7 days, document rollback SHA.

---

**Sign-off:** _________________________ (Owner) Date: __________ Time (Asia/Dhaka): __________
**Result after sign-off + live smoke tests actually ran:** `DEPLOYED AND VERIFIED` (only then, with evidence).

