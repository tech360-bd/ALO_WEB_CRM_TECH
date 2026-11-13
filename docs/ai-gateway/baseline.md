# Phase 0 — Baseline audit

**Audit date:** 2026-10-25
**Scope:** ALO Education CRM, UK PhD Proposal Builder, ALO Labs AgentOS (as found in this repository)
**Method:** read-only inspection (`git`, `node`, `ss`, `systemctl`, `grep`, dependency and file listing). No application process, database or deployment was modified.

> **Gate 0 status: the audit is complete, but it is a *development-sandbox* baseline.**
> The production VPS/Hostinger host described in the brief is **not reachable from this
> environment**. Every production-only fact below is marked **UNKNOWN** or **BLOCKED**
> and must be collected on the real host before any change is deployed. This document
> must not be read as a claim that production was audited.

---

## 1. Confirmed facts

| Item | Observed value | Evidence |
|---|---|---|
| Repository | `tech360-bd/ALO_WEB_CRM_TECH`, checked out at `/home/user/ALO_WEB_CRM_TECH` | `git remote -v`, working tree |
| Base commit | `a3f3253f` ("Merge pull request #30 … public brand and platform audit") | `git rev-parse --short HEAD` |
| Working branch | `arena/fd119d66-alo-web-crm-tech` | `git branch --show-current` |
| Working tree | 12 modified/untracked paths, all part of the PhD module work | `git status --porcelain` |
| Package | `alo-education-erp` 0.3.0 | `package.json` |
| Framework | Next.js **16.4.2** (App Router), React 19.2.8 | resolved `next/package.json` |
| ORM | Prisma 6.19.3, 599 models (47 `Phd*`, added on this branch) | `prisma/schema.prisma` |
| Auth | NextAuth 4.24.11 (JWT strategy) + portal bearer + student session | `src/lib/auth.ts`, `src/lib/unified-auth.ts` |
| Validation | zod 4.6.7, ajv 8.20.0 | `package.json` |
| Runtime | Node v22.22.3, npm 10.9.8, Python 3.11.2 | `node -v`, `npm -v`, `python3 -V` |
| Host | Linux 6.1.158+ x86_64, **2 vCPU**, **~3.9 GiB RAM**, 21 GB disk (15 GB free) | `uname -srm`, `nproc`, `/proc/meminfo`, `df -h` |
| Service manager | **No PM2, no Docker.** systemd 252 present, but **no `alo*`, `next*` or `node*` unit** exists | `command -v pm2`, `command -v docker`, `systemctl list-units` |
| Reverse proxy | **No nginx, no caddy** in this sandbox | `command -v`, `/etc/nginx` |
| Listening sockets | `0.0.0.0:111` (rpcbind), `*:22` (ssh), `*:49983` (sandbox) | `ss -ltnp` |
| Ports 3180 / 9180 / 9090 / 3030 | **free** at audit time | `ss -ltn` |
| Build / test commands | `next build`, `vitest run`, `next lint`, `tsc` (see `package.json`) | `package.json` scripts |
| Test inventory | 283 unit files, 12 integration files, Playwright e2e directory | `tests/` |
| Observability | **None installed**: no Prometheus client, no Sentry, no OpenTelemetry, no `monitoring/` directory | dependency tree, repo listing |
| CI/CD | No workflow files found for the gateway; deployment method **UNKNOWN** | `.github/` inspection |

### 1.1 The three products are one codebase, not three repositories

Everything the brief calls a separate product exists today as a module of this
monorepo:

| Product | Location in this repository | Evidence |
|---|---|---|
| ALO Education CRM | `src/app/api/**`, `src/lib/application-manager`, `src/lib/communication`, commissions, finance | existing routes |
| UK PhD Proposal Builder | `src/lib/phd/**` (47 models, 12 services, 12 test files), `/api/phd/*` **not yet created** | added on this branch |
| ALO Labs AgentOS | `src/app/api/agentos/**`, `src/lib/ai-workforce`, `src/lib/ai-agents` | `api/agentos/rollout`, `workforce/gateway` |

**Unknown:** whether separate repositories, domains or hosts exist outside this
checkout. None were found; none were assumed.

---

## 2. Current AI integration inventory

Nine in-process call sites already go through `src/lib/ai-gateway.ts`, which is an
**in-process function**, not a network service. It performs Ajv schema validation,
department model policy, privacy routing, Groq rate guarding and `CrmAuditLog`
audit events (`AI_GATEWAY_REQUESTED`, `AI_GATEWAY_BLOCKED`).

| Component | Role | Risk observed |
|---|---|---|
| `src/lib/ai.ts` | Provider chain: Groq → OpenRouter → ZAI (`glm-4-flash`); optional local via `LOCAL_AI_URL` | **Implicit cross-provider fallback** on any error; model names hard-coded |
| `src/lib/ai-gateway.ts` | In-process policy gateway, 9 call sites (`api/chat`, `api/agentos/rollout`, `api/workforce/gateway`, …) | Audit stored in CRM table; no metrics; no per-application credentials |
| `src/lib/model-router.ts` | Task-based routing with hard-coded model defaults | Cannot express data classification |
| `src/lib/department-model-config.ts` | Department primary/fallback models | Static; no runtime verification |
| `src/lib/groq-protection.ts` | Per-minute / concurrency / queue limits for Groq | Only one provider |
| `src/lib/ai-providers/catalog.ts` | Large catalogue of "free" providers incl. **unofficial proxies** | `ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS` flag; catalog explicitly notes claims are unverified |
| `src/lib/ai-workforce/runtimes.ts`, `doodle-note-engine.ts`, `ai.ts` | Direct provider `fetch` calls | Retry/timeout logic duplicated |
| `src/lib/phd/ai/client.ts` | New structured-output client for the PhD module | Now prefers the shared gateway when enabled |
| `src/lib/ai-agents/social-media-agent.ts` | Hard-coded `glm-4-flash` default | Model drift risk |

**Confirmed deficiencies the new gateway addresses**

1. No service-to-service authentication: any code path running in the app process can call a provider.
2. No per-application quotas, budgets or isolation.
3. No metrics, no dashboards, no alerting.
4. Audit records contain provider/model metadata but there is no platform-wide usage view.
5. Provider credentials sit in each application process environment.
6. Implicit fallback can move a request between providers without an explicit policy decision.

---

## 3. Unknowns and assumptions (must be resolved on the production host)

| # | Unknown | Why it matters | How to resolve |
|---|---|---|---|
| U1 | Production host, provider (VPS/Hostinger/cloud), OS and version | Port, firewall, systemd/PM2 availability | `hostnamectl`, provider control panel |
| U2 | Production process manager and unit names | Rollback must use the real names, never `kill`/`pm2 delete all` | `pm2 list` / `systemctl list-units` |
| U3 | Production reverse proxy and TLS termination | Gateway must stay private behind it | `nginx -T` / `caddy config` |
| U4 | Production database type, size, migration status | No migration is proposed in this phase; still required for rollback | `prisma migrate status` on the real DB |
| U5 | Backup mechanism and last verified restore | Prerequisite for any deployment | provider snapshots / restic logs |
| U6 | Existing monitoring (UptimeRobot, HetrixTools, provider metrics) | Avoid installing a duplicate stack | check dashboards and DNS |
| U7 | `AI_EXTERNAL_DATA_POLICY` decision for each provider | External egress is blocked until approved | DPAs + written approval |
| U8 | Whether any Groq/OpenRouter/ZAI key is live in production | Live inference tests are otherwise BLOCKED | secret store check, without printing values |
| U9 | GPU availability / local model feasibility | 2 vCPU and ~3.9 GiB RAM cannot host a useful general model | measure on target host |
| U10 | Domain names and TLS certificates for public routes | No new domain may be introduced without approval | DNS + cert inventory |

`U9` is already answered for **this sandbox**: local inference beyond a tiny
quantised model is not viable here (2 vCPU, <4 GiB RAM, shared disk). The local
adapter is therefore implemented but *not* pointed at a model.

---

## 4. Port and service inventory

| Port | Service | Binding | Status |
|---:|---|---|---|
| 22 | SSH | all interfaces | in use, out of scope |
| 111 | rpcbind | all interfaces | in use, out of scope |
| 49983 | sandbox ephemeral | all interfaces | in use, out of scope |
| 3180 | **shared AI gateway (proposed)** | `127.0.0.1` | free; implemented |
| 9180 | **gateway metrics (proposed)** | `127.0.0.1` | free; implemented |
| 9090 | Prometheus (proposed) | `127.0.0.1` | free; **not installed** |
| 3030 | Grafana (proposed) | `127.0.0.1` | free; **not installed** |
| 9100 | node-exporter (referenced by scrape config) | `127.0.0.1` | free; **not installed** |

See `port-map.md` for the conflict-resolution procedure.

---

## 5. Security and reliability risks (ranked)

| Sev | Risk | Evidence | Mitigation in this phase |
|---|---|---|---|
| High | Unofficial AI proxies are catalogued and can be enabled by flag; confidential CRM/PhD data could egress through an unvetted third party | `ai-providers/catalog.ts`, `ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS` | Gateway refuses external providers unless allowlisted **and** policy `approved`; CONFIDENTIAL/RESTRICTED never leave the host; documented in `security-and-data-policy.md` |
| High | No service-to-service authentication between applications and model providers | `ai.ts` calls providers with app-held keys | Per-application hashed tokens, constant-time comparison, 401 before any work |
| High | Implicit provider fallback can cross a data-policy boundary | `generateText` loops providers | Gateway fallback is policy-gated and one-directional (external → local only) |
| Medium | No metrics/alerting; failures are only visible in application logs | no monitoring dependency | Private metrics listener, Prometheus rules, Grafana dashboard |
| Medium | Retry behaviour is duplicated and unbounded in places | `ai.ts`, `runtimes.ts` | Bounded retries (max 4), exponential backoff with jitter, circuit breaker |
| Medium | Prompt/PII leakage into logs is possible in existing code | e.g. provider error passthrough | Gateway logs metadata only; verification greps logs for prompt text |
| Medium | No verified restore path | U5 | Deployment gated on backup verification |
| Low | Hard-coded model names drift from provider catalogues | 10+ occurrences | Gateway `/v1/models` reports configured models only |
| Low | Gateway would be a new single point of failure | architecture | Applications keep their existing provider path behind a feature flag; rollback is a flag flip |

---

## 6. Files proposed for modification (and why)

Nothing in the existing application was deleted or rewritten. See `changes.md`
for the full list with reasons; the summary is:

* **New:** `services/ai-gateway/{gateway,server}.mjs`, `services/ai-gateway/package.json` — the gateway.
* **New:** `scripts/verify-ai-gateway.sh` — executable verification.
* **New:** `monitoring/{prometheus,grafana}/*` — scrape config, alert rules, dashboard.
* **New:** `.env.ai-gateway.example` — placeholders only.
* **New:** `docs/ai-gateway/*` — this documentation set.
* **New:** `src/lib/phd/ai/gateway.ts` — application client, opt-in.
* **Modified:** `src/lib/phd/ai/client.ts` — prefers the gateway when the flag is on; unchanged behaviour when it is off.
* **Modified:** `.gitignore` — ignores local verification artifacts.
* **Not modified:** database schema, migrations, authentication, RBAC, existing routes, design system, existing AI call sites.

## 7. Rollback method for every planned production change

| Change | Rollback | Tested here? |
|---|---|---|
| New gateway service | Stop the unit/process; no application depends on it until a flag is enabled | Yes — process start/stop exercised by the verification script |
| Application client flag | Set `PHD_AI_GATEWAY_ENABLED=false`, restart the app process; the previous provider path remains intact | Yes — unit test asserts the disabled state is a no-op |
| Monitoring config | Remove the scrape target/rule files; no application coupling | No — Prometheus/Grafana are not installed here (BLOCKED) |
| `.gitignore` / docs | `git revert` of the commit | N/A |

No database migration, schema change, data rewrite or DNS/TLS change is part of
this phase.

---

## 8. Gate 0 decision

* The shared gateway can be implemented and verified **in isolation** without touching production.
* It **must not** be enabled for any application until U1–U8 are answered on the real host.
* Live-provider inference remains **BLOCKED** in this environment: no `.env`, `.env.local` or `.env.production` file exists, and only `.env.example` (names, no values) is present.
