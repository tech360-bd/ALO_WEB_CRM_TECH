# Production Setup — ALO Education CRM (https://aloeducation.com :3044)

**Stack:** Next.js 16 standalone, MySQL 8.4, Redis 7, Node 22, Caddy/Nginx, PM2, GitHub Actions `main` → `/root/alo-live` (do NOT assume, verify with workflow DEPLOY_DIR).

## 1) VPS prerequisites (Ubuntu 22.04+)
- Node 22 (`n`), npm 10, PM2, MySQL 8.4 or managed, Redis 7 (`redis-server`), Caddy 2, git, OpenSSL.
- Paths: `DEPLOY_DIR=/root/alo-live` per `.github/workflows/deploy-production.yml` — verify `git remote -v` on VPS.
- Ports: app `3044` (not 3000, not 3025), Redis `6379` localhost only, MySQL `3306` internal (docker-compose internal `db:3306`).

## 2) Secrets — never commit
- Create `/root/alo-live/.env` from `.env.production.example` — fill via `openssl rand -hex 32` (NEXTAUTH_SECRET etc), `openssl rand -base64 48` (FILE_SIGN_SECRET), cPanel DB creds (URL-encode), Meta/Apify/Groq etc.
- Required prod: DATABASE_URL, NEXTAUTH_SECRET, ENCRYPTION_KEY, FILE_SIGN_SECRET, ALO_CRON_SECRET (32 hex), WHATSAPP_TOKEN/VERIFY_TOKEN if WA active, REDIS_URL if locking.
- Rotate procedure: see `docs/final-master/SECURITY_AUDIT_FINAL_REPORT.md` (re-encrypt if ENCRYPTION_KEY, invalidate sessions if NEXTAUTH_SECRET, rotate FILE_SIGN_SECRET — old signed URLs expire).

## 3) Deploy — GitHub Actions (single workflow)
Workflow `.github/workflows/deploy-production.yml` on `push main` + `workflow_dispatch`:
1. `npm ci` — 2. `prisma generate` — 3. `prisma migrate deploy` (never reset) — 4. `npm run build` (standalone) — 5. `pm2 restart alo-education --update-env && pm2 save` — 6. health `curl -fsS http://127.0.0.1:3044/` (fix from :3025) — 7. verify `git rev-parse HEAD == origin/main`.
- GH Secrets required: DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY, DEPLOY_PORT. Never print values.
- Env missing fails build: `npx prisma validate` + `npm run typecheck` gates added (Phase 12).
- Manual fallback SSH:
```
cd /root/alo-live && git fetch origin main && git reset --hard origin/main
npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
pm2 restart alo-education --update-env && pm2 save && pm2 describe alo-education | grep online
curl -fsS http://127.0.0.1:3044/ && ss -lntp | grep :3044
```

## 4) Caddy / Docker / PM2 — actual inspected config
- **Caddyfile** (prod): `aloeducation.com { reverse_proxy 127.0.0.1:3044 { header_up Host {host} } }` + `encode gzip zstd` + log `/var/log/caddy/alo_education_access.log`. Reload: `caddy reload --config Caddyfile`.
- **docker-compose.yml:** services `app` build `.` env_file `.env`, ports `3044:3044` (updated from 3000), `db` mysql:8.4 healthcheck `mysqladmin ping`, `nginx` optional 80/443. Env `DATABASE_URL=mysql://${MYSQL_USER}@db:3306/${MYSQL_DATABASE}` — use `MOLX_URL=http://molx:3001` when Molx container added (not localhost in compose).
- **ecosystem.config.cjs:** `apps:[{name:'alo-education', script:'./.next/standalone/server.js', env:{PORT:3044, HOSTNAME:'0.0.0.0', NODE_ENV:'production'}, instances:1}]`. Start: `pm2 start ecosystem.config.cjs && pm2 save && pm2 startup`.

## 5) Database & migrations
- Never `migrate reset` prod. Backup first: `mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE | gzip > /root/backups/alo-$(date +%F).sql.gz`.
- Apply: `npx prisma migrate deploy`. Verify: `npx prisma validate`. Seed once: `npx prisma db seed` (seed-complete).
- Cron locking uses DB-based distributed lock (15 jobs Asia/Dhaka) — requires `REDIS_URL` for queue health; fallback MemoryRedis disables cross-instance lock.

## 6) Scheduler / Redis
- Validate `REDIS_URL=redis://127.0.0.1:6379` reachable: `redis-cli ping`. If not set, `src/lib/redis.ts` falls back to memory (warns, not claimed active).
- Scheduler endpoint `POST /api/automation/schedule` requires header `Authorization: Bearer $ALO_CRON_SECRET` or `x-cron-secret` (Phase 10 fix) — verified server-side, never frontend. Test: `curl -H "Authorization: Bearer $ALO_CRON_SECRET" https://aloeducation.com/api/automation/schedule`. Without secret → 401.
- Cron job health: `src/cron/cron-definitions.ts` 15 jobs (sla-monitoring every minute, etc.) with `locking:true`. Verify with `npm run cron:verify` or `npx tsx scripts/verify-15-cron.ts`.

## 7) Document storage & FILE_SIGN_SECRET
- `STORAGE_POOL_C=/home/aloeduca/alo-education/storage/uploads` (outside `public/`). Uploads randomized names, metadata in DB (`StudentDocument`, `Document`, `DocumentVersion`, `DocumentAudit`). Downloads via `/api/employee-access/secure-download` with HMAC `FILE_SIGN_SECRET` (≥32), `timingSafeEqual`, expiry capped 60m — fail-closed prod throw. Backup `storage/` separately; GitHub never contains docs.

## 8) Web Search → Scrape → Extract → AI → CRM (Molx/Firecrawl)
- Set `MOLX_URL` to actual reachable address: compose `http://molx:3001`, non-docker `http://localhost:3001` or VPS IP. Fallback `FIRECRAWL_API_KEY` only when permitted. Check status `researchProviderStatus()` (`GET /api/research/provider-status` after Phase 3 fix). Respect robots, privacy, source attribution (`sourceUrl + lastVerifiedAt`), AI output untrusted, human review workflow (`/api/admin/university-data/updates/[id]/approve`).

## 9) Health checks & rollback
- Local: `curl -fsS http://127.0.0.1:3044/` + `pm2 describe alo-education | grep online` + `ss -lntp | grep :3044`.
- Logs: `pm2 logs alo-education`, `tail /var/log/caddy/alo_education_access.log`.
- Rollback (safe): `cd /root/alo-live && git log --oneline -5` pick prior SHA, `git reset --hard <sha> && npm ci && npx prisma migrate deploy && npm run build && pm2 restart alo-education --update-env && curl -fsS http://127.0.0.1:3044/`. Never rollback DB without dump restore.

## 10) Checklist before claiming production-ready
- [ ] `.env` on `/root/alo-live` has `PORT=3044`, `HEALTH_PORT=3044`, `DATABASE_URL` encoded, `NEXTAUTH_SECRET` random, `ENCRYPTION_KEY` 64-hex, `FILE_SIGN_SECRET` ≥32, `REDIS_URL` if using, `ALO_CRON_SECRET` random, `MOLX_URL` reachable.
- [ ] `Caddyfile` proxies `127.0.0.1:3044`, workflow health `curl :3044`.
- [ ] `npx prisma migrate deploy` succeeds, no pending migrations.
- [ ] `npm run build` + `pm2 restart` online, `curl :3044` 200, `git rev-parse HEAD == origin/main`.
- [ ] No `.env` committed (`git log --all -- .env` empty), `.gitignore` excludes.
- [ ] Secrets rotated if ever in git history.

See `docs/VPS-GITHUB-DEPLOYMENT.md`, `docs/WHATSAPP-META-SETUP.md`, `docs/GOOGLE_SEO_SETUP.md`, `docs/DOCUMENT_SECURITY.md`, `docs/INTEGRATION_SETUP.md` for per-integration steps.
