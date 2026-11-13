# Deployment audit — ALO AgentOS / Web CRM

Read-only, 2026-10-27, commit `e74d145e`.

---

## 1. What actually deploys today

| Question | Answer | Evidence |
| --- | --- | --- |
| Who owns production? | **Hostinger** (shared/VPS hosting), not GitHub Actions | comments in `.github/workflows/deploy-production.yml`, `deploy-recovery.yml`, `Dockerfile:2`, `docker-compose.yml:1`, `ecosystem.config.cjs:1` |
| Can Actions deploy? | No — both deploy workflows are refusal stubs | `.github/workflows/deploy-production.yml` (`exit 1`) |
| Can a container deploy? | No — entrypoint refuses | `Dockerfile` `CMD ["sh","-c","echo 'DISABLED …'; exit 1"]` |
| Can PM2 deploy? | No — module throws on load | `ecosystem.config.cjs:1` |
| Can systemd deploy from this repo? | Unit exists but restore path refuses | `deploy/ubuntu/alo-education.service`, `restore.sh` (`exit 1`) |
| Runtime | Node 22 (`engines`, `.nvmrc`, `.node-version`, `scripts/assert-node22.cjs`), standalone Next server (`server.js` → `.next/standalone/server.js`) | `package.json`, `server.js` |
| Port | 3044 (pinned by `tests/unit/deployment-config.test.ts` per the ecosystem comment) | `ecosystem.config.cjs` |
| Reverse proxy | nginx (`nginx.conf` at repo root) and/or Caddy (`deploy/ubuntu/Caddyfile`) | both present; which is live is a production question, not answerable from the repo |

**Consequence for this programme:** there is no reproducible container image and no infrastructure-as-code for production. Any new service (ASR, TTS, LLM runtime, telephony) must come with its own reviewed, self-hosted deployment path — it cannot piggyback on the existing (disabled) Docker/PM2 setup.

---

## 2. Build and release contract

`npm run build` performs, in order:

1. `scripts/assert-node22.cjs` — hard Node version gate.
2. `RAYON_NUM_THREADS=1 UV_THREADPOOL_SIZE=1 NEXT_PRIVATE_BUILD_WORKER=0 NODE_OPTIONS=--max-old-space-size=${ALO_BUILD_HEAP_MB:-4096} prisma generate`
3. `npm run db:verify-client` — fails if the generated client is the `any` placeholder or its model list ≠ schema.
4. `next build --webpack`
5. `scripts/prepare-standalone.mjs`

CI additionally provisions **swap** before typecheck because `tsc` needs >4 GB effective memory on a 7 GB runner (documented in `ci.yml` at the "Provision swap" step). This is a real capacity signal: the type graph is heavy.

**Sandbox finding (environmental, not a repo defect):** `npx prisma generate` fails here with

```
Error: request to https://binaries.prisma.sh/all_commits/c2990dca…/debian-openssl-3.0.x/libquery_engine.so.node.gz.sha256 failed
```

so `npm run db:verify-client` reports "Prisma model metadata is missing" and `next build`/`tsc` cannot run in this sandbox. For air-gapped or restricted-network deployments, engine binaries must be vendored and `PRISMA_ENGINES_MIRROR` pointed at an internal mirror. Recorded as a deployment prerequisite, not a code defect.

---

## 3. Configuration surface

| Item | Count / state |
| --- | --- |
| Variables in `.env.example` | 242 |
| Variables in `.env.production.example` | 188 |
| Generated classification | `docs/environment-classification.json` — **currently stale** (F11) |
| Audit tooling | `scripts/audit-env-vars.mjs` (mechanical classification, `--check` gate), `scripts/audit-env-vars` wired to CI |
| Cloud-AI gate | `PAID_AI_API_ALLOWED` must be exactly `true`; default deny |
| Local-AI hooks | `LOCAL_AI_URL`, `LOCAL_AI_MODEL`, `LOCAL_AI_API_KEY` (`src/lib/ai.ts:114`, `.env.example:325`) |
| Speech/telephony env | **none** except `TELEPHONY_PROVIDER_API_KEY` (single boolean switch, no provider integration) and video-engine `WHISPER_MODEL` |
| Secrets in repo | No `.env` present. CI runs a tracked-file secret scan (GitHub/GitLab/Slack/OpenAI/Google key shapes, private-key blocks, DSN-with-password) — but explicitly excludes `imports/alo-education-full/node_modules` (58,758 files) |

---

## 4. Operations tooling present

| Capability | File | Assessment |
| --- | --- | --- |
| Liveness/readiness | `src/app/api/health/route.ts`, `src/app/api/health/live` | Readiness probes DB + 6 modules; returns 503 when degraded; **no AI/model/ASR/TTS/telephony probes** |
| Public smoke | `scripts/production-smoke.mjs` + `health-monitor.yml` (daily 03:30 UTC) | Good — external, credential-free |
| Backup | `scripts/backup-mysql.sh`, `deploy/ubuntu/backup.sh` | Reasonable dump hygiene; no encryption, no freshness alert |
| Restore | `deploy/ubuntu/restore.sh` | **Refusal stub**; no verified restore |
| Rollback | `rollback.sh`, `ROLLBACK-GUIDE.md`, `RELEASE_MANAGEMENT_GUIDE.md` | Present; needs validation against the real release process |
| Monitoring | `monitoring/prometheus/ai-gateway-*`, `monitoring/grafana/ai-gateway-dashboard.json` | Covers the AI gateway only; no app-wide metrics |
| Cron | `src/cron/*`, `CronLock` model, `scripts/cron-scheduler.sh` | DB-locked, but no queue, no dead-letter, no per-job SLA |
| Container/CI scanning | CodeQL (`actions`, `javascript-typescript`, `python`), `npm audit` high/critical gate | Good baseline; no image scan (no image is built) |

**Missing for the target product:** model-health endpoints, ASR/TTS latency and error metrics, call-state and SIP trunk monitoring, queue depth, disk-space alerts for recordings, backup-freshness alerts, structured log redaction for transcripts and phone numbers.

---

## 5. Repository hygiene affecting deployment

| Item | Value | Impact |
| --- | --- | --- |
| `.git` size | 242 MB | slow clones, slow CI checkout |
| Tracked files | 68,387 | mostly vendored packages |
| Vendored `node_modules` | 58,758 files (`imports/alo-education-full/`) | excluded from the secret scan; unreliable dependency provenance |
| Root CSVs | 111 files / 214 MB | build context bloat; possible personal data |
| Root markdown | 194 files | documentation sprawl |
| `tsconfig.*.json` variants | 14 files at root | audit-scope leftovers |

These are **not** blockers for the call-center programme but they slow every phase and undermine "reviewable, incremental, reversible". Recommend a separately approved cleanup phase (untrack vendored trees, move CSVs to object storage, archive root reports into `docs/`).

---

## 6. Capacity planning for the new stack (to be measured, not assumed)

The brief forbids claiming real-time multilingual calls without benchmarks. Current repo facts: no GPU, no model host, no audio hardware. Therefore:

| Tier | Minimum (dev/lab, 1 concurrent call) | Recommended (small pilot, 5–10 concurrent) |
| --- | --- | --- |
| CPU | 8 vCPU | 16 vCPU |
| RAM | 16 GB | 32–64 GB |
| Disk | 100 GB SSD | 500 GB SSD + object storage for recordings |
| GPU | none (small int4 models on CPU) | 1× 24 GB GPU for LLM + TTS |
| Network | LAN only | LAN + SIP trunk |

These figures are **planning assumptions** and must be replaced by measurements in Phase 4 (`docs/testing/ACCEPTANCE_TEST_PLAN.md` §D). No latency claim is made until then.

---

## 7. Recommended deployment topology (target)

```
         ┌──────────── nginx (TLS, 80/443) ────────────┐
         │                                             │
   app (Next 3044)        audio-gateway (WS/WSS 7880)  │
         │                        │                    │
         ├── ai-gateway (8080) ───┤                    │
         │        │               │                    │
         │   ollama (11434, loopback only)              │
         │   asr  (8070, loopback)  tts (8071, loopback)
         │                        │                    │
         └── MySQL 3306 (loopback) ┴── Asterisk/FreeSWITCH (5060/5061/5080)
```

Rules: only 80/443 and (if a SIP trunk is used) the SIP/TLS ports face the internet; every model/ASR/TTS port binds to loopback or a private bridge; telephony management (AMI/ARI/ARI-WS) is never public.

---

## 8. Approval-gated actions

| Action | Needs |
| --- | --- |
| Any production deploy | Not in this programme; Hostinger procedure remains the owner |
| Adding a new systemd unit / container for speech services | Approval of the architecture doc |
| Exposing SIP ports | Security review + firewall plan |
| Vendoring Prisma engines | Approval (adds binaries to the build) |
| Repository hygiene (untrack 58k files, move CSVs) | Separate approval — history rewrite is out of scope |
