# Unified Project — Deployment & Rollback

**Date:** 2026-10-27
**Canonical repo:** `tech360-bd/ALO_WEB_CRM_TECH`
**Verified in sandbox:** filesystem/config inspection only. **No live deployment was performed.**

> Status: deployment artifacts are **present** but **NOT VERIFIED** end-to-end (no DB, no
> engine, no container runtime, no network to providers). Production readiness is
> therefore **NOT CONFIRMED**.

---

## 1. Deployment surfaces found

| Artifact | Path | Notes |
|---|---|---|
| Dockerfile | `Dockerfile` (1,744 B) | Multi-stage Node build |
| Compose | `docker-compose.yml` (1,793 B) | App + services |
| PM2 | `ecosystem.config.cjs` | Process supervision |
| Standalone server | `server.js` | `npm run start` → `NODE_ENV=production node server.js` |
| Build prep | `scripts/prepare-standalone.mjs` | Runs after `next build` |
| Node gate | `scripts/assert-node22.cjs` | Fails build if Node ≠ 22.x |
| CI | `.github/workflows/{ci,codeql,deploy-production,deploy-recovery,health-monitor}.yml` | 5 workflows |
| VPS script | `alo-vps-deploy.sh` | Ubuntu/VPS deployment |
| Provider guide | `HOSTINGER-DEPLOYMENT-GUIDE.md`, `DEPLOYMENT.md`, `GITHUB-AUTO-DEPLOYMENT.md`, `README_DEPLOYMENT.md`, `DEPLOYMENT_ENTRYPOINT_MATRIX.md`, `DEPLOYMENT_FILE_INVENTORY.csv` | Documented procedures |

## 2. Canonical build & start

```bash
# 1. Env
cp .env.example .env          # then fill DATABASE_URL, AUTH_SECRET, ...

# 2. Dependencies (Node 22.x, npm >=10)
npm ci

# 3. Prisma client + migrations (REQUIRES engine download)
npx prisma generate
npx prisma migrate deploy
npm run db:seed               # optional, 25 seed scripts exist

# 4. Build (heap-tunable)
ALO_BUILD_HEAP_MB=8192 npm run build

# 5. Start
npm run start                 # node server.js  (standalone)
#   or: npm run dev            # next dev --webpack -p 3000
```

### 2.1 Known build blocker
`npm run build` currently **fails in this sandbox**:
1. Plain `prisma generate` cannot download the native engine (`binaries.prisma.sh` is
   outside the sandbox egress allowlist) — Repair Log **R5 is REPAIRED** via the officially
   supported WASM engine distribution bundled in `node_modules/prisma/build/`:

   ```sh
   B=$PWD/node_modules/prisma/build
   PRISMA_GENERATE_NO_ENGINE=1 \
   PRISMA_SCHEMA_ENGINE_BINARY=$B/schema_engine_bg.wasm \
   PRISMA_QUERY_ENGINE_LIBRARY=$B/query_engine_bg.mysql.wasm \
   npx prisma generate          # → ✔ Generated Prisma Client (v6.19.3, engine=none)
   ```

   On a normal host with `binaries.prisma.sh` reachable, plain `npx prisma generate` works
   and produces the standard native-engine client — no workaround needed.
2. Even with the real client, `next build --webpack` **OOMs** here, and full `tsc` cannot
   complete either: the generated client is 37.8 MB / 978k lines for 604 models and the
   sandbox has 3,939 MB RAM (2 CPU, 0 swap). Measured OOM at 1.9 GB, 3.0 GB and 3.4 GB
   heap; a 10-file focused program also OOMs (Repair Log R6, R10).
**Mitigation required:** a host/CI runner with ≥ 8 GB RAM (recommended 16 GB) and/or
route-surface reduction (457 pages / 1,034 API routes).

## 3. Container deployment

```bash
docker compose up -d --build
```
- Bind services to `0.0.0.0`; expose the app port; keep DB on a private network.
- Provide `DATABASE_URL`, `AUTH_SECRET`, and provider secrets via secrets manager —
  **never** bake into the image.
- Health check: `GET /api/health` (or the route configured in `health-monitor.yml`).

## 4. PM2 / systemd

```bash
pm2 start ecosystem.config.cjs --env production
pm2 logs alo-web-crm
pm2 reload alo-web-crm
```
- `ecosystem.config.cjs` defines the app name/script; verify the `script` points at
  `server.js` and `NODE_ENV=production`.

## 5. Backup & recovery

- **Database:** `mysqldump` (or provider snapshot) of the MySQL instance; verify restore in
  a staging DB before relying on it. Schedule encrypted, offsite backups.
- **Files:** private storage bucket (never `public/uploads`) — back up separately.
- **Secrets:** store in the provider secret store; document names only.
- **Code:** the canonical repo + tagged release commit.

## 6. Rollback

1. **Code:** `git checkout <previous-release-tag>` / redeploy the previous image.
2. **Migrations:** apply the previous migration state (`prisma migrate resolve` /
   `prisma migrate deploy` to the prior directory) — **only with an approved plan**.
3. **DB data:** restore the most recent verified backup (point-in-time where supported).
4. **Env:** revert `.env` to the previous known-good set (do not rotate secrets during
   rollback).
5. **Verify:** health check + a smoke test of the affected routes.

> Rollback was **not executed** in this sandbox (no live system).

## 7. Production readiness verdict

| Environment | Verdict | Reason |
|---|---|---|
| Local development | ⚠️ **NOT VERIFIED** | No `.env`; Prisma client generated via WASM path, but no runtime smoke test executed |
| Staging | ⚠️ **NOT VERIFIED** | Same blockers; no staging access |
| Production | ❌ **NOT READY / NOT VERIFIED** | Build OOMs and full `tsc` cannot run in this 3.9 GB sandbox; no deployment executed |

**Do not label this project production-ready** until: (a) `prisma generate` succeeds on the
target host, (b) `tsc` is clean, (c) the build completes, (d) tests pass against a real DB,
and (e) a smoke test passes on the target environment.
