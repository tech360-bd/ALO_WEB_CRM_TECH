# Deployment runbook

Scope: the existing Next.js application (Hostinger-owned) and the future self-hosted services. Read with `docs/audit/DEPLOYMENT_AUDIT.md`.

---

## 1. Ground truth

* **Hostinger owns production.** GitHub Actions is CI-only; `deploy-production.yml` and `deploy-recovery.yml` are refusal stubs. `Dockerfile`, `ecosystem.config.cjs` and `deploy/ubuntu/restore.sh` all refuse to run by design.
* Runtime: Node 22, standalone Next server on port **3044**, behind nginx/Caddy.
* Database: MySQL 8.x; Prisma migrations only (`prisma migrate deploy`), never `db push`.
* Build needs ≥4 GB heap (`ALO_BUILD_HEAP_MB`, default 4096) and, on CI-sized runners, swap.

## 2. Pre-flight checklist (every release)

- [ ] `git log -1` is the intended commit; branch is `main` for production.
- [ ] CI green on that commit (`Lint · Typecheck · Tests · Prisma · Build` **and** `MySQL 8 · Migrate · Integrate · Boot`).
- [ ] `npm run audit:env -- --check` passes (no stale environment document).
- [ ] No pending destructive migration; review every new `migration.sql` for `DROP|TRUNCATE|ALTER … MODIFY` on populated columns.
- [ ] Fresh backup exists and its sha256 verifies (`docs/operations/BACKUP_AND_RESTORE.md` §3).
- [ ] `docs/environment-classification.json` matches the production variable set.
- [ ] Rollback artefact identified: previous release directory or tarball + the previous migration state.

## 3. Build

```bash
nvm use 22                 # or .nvmrc
npm ci                     # lockfile-exact
npm run build              # assert-node22 → prisma generate → verify-client → next build → standalone prep
```

Post-build verification (do not skip):

```bash
npm run db:verify-client   # fails on the any-typed placeholder or model-list mismatch
node -e "console.log(require('./package.json').version)"
ls .next/standalone/server.js
```

If `prisma generate` fails on a restricted network, vendor the engine binaries and set `PRISMA_ENGINES_MIRROR` — do not disable the verification step.

## 4. Deploy (Hostinger procedure)

1. Announce the window; capture the current release id.
2. Copy the built artefact to a **new** release directory (never overwrite the running one).
3. Point the release symlink atomically.
4. Run `prisma migrate deploy` **only** if new migrations exist and the pre-flight checklist is complete.
5. Restart the app process.
6. `curl -fsS https://<host>/api/health` → `200` and `"status":"ok"`.
7. `node scripts/production-smoke.mjs https://<host>` — must pass.
8. Verify one authenticated read and one authorized-denied read (a role that must not see a record).
9. Watch logs for 10 minutes; confirm structured startup line names the DB driver and provider mode.

## 5. Rollback

| Situation | Action |
| --- | --- |
| App unhealthy, schema unchanged | Re-point the symlink to the previous release; restart; verify health |
| App unhealthy, migration applied | **Do not** attempt a reverse migration blindly. Stop traffic, restore the pre-deploy backup into a new schema, verify, then repoint. Requires approval. |
| Data corruption suspected | Stop writes immediately; take a fresh dump of the current state (evidence); escalate |

Rollback must be rehearsed on a staging copy at least once per quarter.

## 6. Adding the self-hosted speech/AI services (Phase 3–6)

Each service ships with:

* its own systemd unit (or container) with `Restart=always`, memory limits and a health endpoint;
* **loopback binding** (`127.0.0.1`) or a private bridge — never `0.0.0.0` unless it must be reachable from the telephony host;
* a pinned model-artefact manifest (name, revision, sha256, licence) checked at startup;
* a readiness probe wired into the app's `/api/health/ai`;
* a degraded-mode behaviour: unavailable model → explicit `MODEL_UNAVAILABLE`, human hand-off, never a silent cloud call.

Port plan (all private unless noted):

| Service | Port | Exposure |
| --- | --- | --- |
| Next.js app | 3044 | behind nginx 443 |
| AI gateway | 8080 (+9090 metrics) | loopback/private |
| Ollama | 11434 | loopback |
| ASR service | 8070 | loopback |
| TTS service | 8071 | loopback |
| Call orchestrator | 8072 | private |
| Redis | 6379 | loopback |
| MySQL | 3306 | loopback |
| Asterisk SIP | 5060/5061, RTP range | **internet only if a trunk exists**, with fail2ban + TLS |

## 7. Monitoring and alerts to add

| Alert | Condition |
| --- | --- |
| App not ready | `/api/health` ≠ 200 for 5 min |
| DB connection failures | > 5/min |
| Model unavailable | `/api/health/ai` degraded for 2 min |
| ASR error rate | > 5 % over 10 min |
| TTS error rate | > 5 % over 10 min |
| Audio-to-audio latency | p90 > configured budget for 10 min |
| Queue depth | waiting > 10 for 5 min |
| SIP registration failure | any trunk down > 2 min |
| Disk | < 20 % free; recordings volume < 15 % |
| Backup freshness | newest successful backup > 26 h |
| Job failures | dead-letter count > 0 |

## 8. Incident quick reference

| Symptom | First checks |
| --- | --- |
| 503 on `/api/health` | DB reachable? `SELECT 1`; credentials rotated? |
| All AI calls fail | `LOCAL_AI_URL` set? Ollama up? `PAID_AI_API_ALLOWED` intentionally false? |
| Calls connect but no audio | RTP ports/firewall; codec mismatch; VAD threshold |
| AI answers but is cut off | barge-in threshold too sensitive; TTS chunking |
| Transcript empty | ASR service down → expected `ASR_UNAVAILABLE`, not an empty answer |
| Supervisor cannot see live calls | WebSocket path/proxy; auth scope |

## 9. Explicit prohibitions

`prisma db push`, `migrate reset`, `seed` on production, editing applied migrations, `DROP`/`TRUNCATE` outside a disposable DB, deploying from a branch, and exposing model/telephony management ports publicly.
