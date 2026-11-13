# Shared AI Gateway & Monitoring — final report

**Date:** 2026-10-25
**Branch:** `arena/fd119d66-alo-web-crm-tech` (from `a3f3253f`)
**Scope executed:** shared gateway infrastructure, security controls, observability
assets, verification, and a single opt-in application client (PhD).
**Status:** **partial by design** — the gateway and its verification are complete and
tested in this sandbox; production deployment, live-provider inference and the CRM /
AgentOS integrations are **not** done and are reported as BLOCKED or NOT RUN.

---

## A. Environment discovered

| Item | Finding |
|---|---|
| Repository | `tech360-bd/ALO_WEB_CRM_TECH`, branch `arena/fd119d66-alo-web-crm-tech`, HEAD `a3f3253f` |
| Stack | Next.js 16.4.2 (Turbopack), React 19, Prisma 6 with MySQL in production and a SQLite verification mirror, Vitest |
| Runtimes | Node v22.22.3, npm, `gh`; no Docker, no PM2, no nginx/Caddy, no systemd unit for these apps in the sandbox |
| Listening ports at audit | `0.0.0.0:111`, `*:22`, `*:49983` only. 3180/9180/9090/3030 were free |
| Databases | Production MySQL **not reachable** from here; a disposable SQLite file is used for verification (`.phd-tmp/`) |
| Env files | `.env.example` only — **no** real credentials, so no live provider call was possible |
| Existing AI surface | `src/lib/ai.ts` (groq → openrouter → zai), `src/lib/ai-gateway.ts` (in-process), `model-router.ts`, `groq-protection.ts`, `department-model-config.ts`, `ai-providers/*`, `ai-workforce/runtimes.ts`; 9 call sites; 43 hard-coded model names |
| Monitoring/observability | None installed; no Prometheus, no Grafana, no alert delivery, no cert-expiry probe |
| Capacity | 2 vCPU / ~3.9 GiB RAM, ~4 GiB free disk headroom — a local model is **not** feasible here |
| Known failures before this work | full-repo `tsc` OOMs; `next build` OOMs; integration suites need MySQL |

Gate 0 conclusion: **allowed to build the gateway as a new, isolated, loopback-only
service with no production change.** Not allowed: schema change, provider migration,
proxy/DNS/TLS change, or enabling a flag on a live app. Rationale and full audit in
`baseline.md`.

---

## B. Changes made

**Added (all new files; nothing was deleted or renamed):**

* `services/ai-gateway/` — `gateway.mjs` (config, auth, policy, rate limits,
  retries/jitter, circuit breaker, redacted audit, Prometheus text exposition,
  handlers), `server.mjs` (fail-closed startup, graceful shutdown), `package.json`
  (no dependencies).
* `scripts/verify-ai-gateway.sh` — 23-check executable verification with JSON output.
* `monitoring/prometheus/{ai-gateway-scrape,ai-gateway-alerts}.yml`,
  `monitoring/grafana/ai-gateway-dashboard.json` (6 panels).
* `.env.ai-gateway.example` — placeholders only.
* `src/lib/phd/ai/gateway.ts` — typed, server-only gateway client.
* `tests/unit/ai-gateway/gateway.test.ts` (25 tests),
  `tests/unit/phd/ai-gateway-client.test.ts` (7 tests).
* `docs/ai-gateway/` — 11 documents (this report included).

**Modified (3 small, reversible edits):**

| File | Change | Why |
|---|---|---|
| `src/lib/phd/ai/client.ts` | Uses the gateway when `PHD_AI_GATEWAY_ENABLED=true`; otherwise unchanged | Enables the integration behind a flag |
| `scripts/phd/setup-verification-db.mjs` | Removed `--accept-data-loss`; recreates the disposable SQLite file instead | Repository safety guard forbids destructive flags |
| `src/lib/phd/storage.ts` | `PHD_STORAGE_ROOT` override; path resolved per call, default identical to before | Integration tests were writing uploads into the real `storage/phd` |
| `tests/integration/phd/services.test.ts` | Points uploads at `.phd-tmp/storage` | Keeps test fixtures out of the runtime store |
| `.gitignore` | Ignores `/.phd-tmp/`, `/.ai-gateway-tmp/`, `/storage/phd/` | Local artifacts and runtime documents |

Full reasons per file: `changes.md`.

**Unchanged:** `prisma/schema.prisma` (no gateway change), every migration, every
API route, every component, authentication/RBAC, the in-process AI path, CRM and
AgentOS code.

---

## C. Verification results

### Executed here (exact commands)

```bash
bash scripts/verify-ai-gateway.sh
# Summary: PASS=21 FAIL=0 BLOCKED=1 NOT-RUN=1

npx vitest run tests/unit/ai-gateway              # 25 passed
npx vitest run tests/unit/phd/ai-gateway-client.test.ts   # 7 passed
npx vitest run tests/unit/phd                     # 124 passed (12 files)
npx vitest run tests/unit                         # 301 files, 3374 passed, 0 failed
npx vitest run tests/unit/critical-safety-remediation.test.ts  # 46 passed
ALO_DB_DRIVER=sqlite DATABASE_URL="file:$PWD/.phd-tmp/phd-test.db" \
  npx vitest run tests/integration/phd            # 39 passed
npx eslint services/ai-gateway src/lib/phd/ai tests/unit/ai-gateway \
  tests/unit/phd/ai-gateway-client.test.ts        # exit 0, no findings
NODE_OPTIONS=--max-old-space-size=2048 npx tsc -p tsconfig.phd.json --noEmit  # exit 0
```

### Gateway checks — PASS (21)

Loopback-only bind on both listeners · distinct liveness/readiness · unauthenticated
request rejected (401) · authenticated request served · unapproved model rejected
(403) · `local_only` route with **zero** external calls · approved external route
reaching only the approved stub · CONFIDENTIAL identity staying on the local provider
· metrics unreachable on the API port (404) · no prompt/completion/token in logs or
metrics · unknown token rejected · gateway killed without any change to the
application database checksum · production refuses to start with no app registry ·
production refuses a non-loopback bind · unit suite · `node --check` ×2 · scoped
`tsc`.

### BLOCKED (1)

* **Live provider inference** — no API key exists in this environment and no `.env*`
  contains real values. Requires credentials, an approved data policy and a cost cap.

### NOT RUN (1)

* **Registry presence in the operator shell** — the script builds its own temporary
  registry; the production `AI_GATEWAY_APPS` value was never available here.

### BLOCKED / NOT RUN at repository level

| Item | Status | Reason |
|---|---|---|
| `next build` | **BLOCKED (environment)** | exit 137 OOM at 2560 MB heap; retry stalled 14 min at 3861/3939 MiB and was stopped. Not evidence of a build failure. |
| Repository-wide `eslint .` | **NOT RUN** | exceeded 420 s on 2 vCPU; every new/touched file lints clean |
| Full-repo `tsc --noEmit` | **BLOCKED** | OOM (exit 134) |
| `tests/integration/*` other than PhD | **BLOCKED** | need `TEST_DATABASE_URL` MySQL |
| Prometheus/Grafana install and alert delivery | **BLOCKED** | not installed; no approved recipients |
| Service-manager restart of the apps | **BLOCKED** | no PM2/systemd unit exists here |
| CRM and AgentOS gateway integration | **NOT RUN** | deliberately not enabled; no client written |
| Load/capacity testing | **NOT RUN** | 2 vCPU makes any number unrepresentative |
| `POST /v1/embeddings` | **NOT IMPLEMENTED** | therefore excluded from the API contract and from any claim |

Machine-readable evidence: `.ai-gateway-tmp/verification-results.json`,
`.ai-gateway-tmp/unit-all-final.json`. Per-check table: `verification-results.md`.

---

## D. Security and data preservation

* **Authentication** — per-application bearer tokens, stored only as SHA-256 hashes in
  the gateway's own config; the plaintext lives only in the consuming app's secret
  store. Constant-time comparison; unknown token → 401 with no detail.
* **Isolation** — identity is derived from the token, never from the request body. A
  token cannot select another application's models, quotas or classification. The
  gateway has no database access, so it cannot read another tenant's records.
* **Data policy** — external calls require *all* of: app `allowExternal`, global
  `AI_EXTERNAL_DATA_POLICY=approved`, provider in `AI_PROVIDER_ALLOWLIST`, and a
  classification below `CONFIDENTIAL`. `local_only` is enforced before any provider is
  contacted (verified with an external stub hit counter at 0). Fallback runs
  external→local only, and only when explicitly enabled.
* **Logging** — prompts, completions, tokens and headers are never logged; audit lines
  carry request id, app id, route, model, status, latency and token counts. Production
  startup fails if prompt logging is requested.
* **Secrets in the repository** — none. `.env.ai-gateway.example` is placeholders only.
  No key, token or password appears in any doc, test, script or log.
* **Data preservation** — no schema change, no migration, no delete, no restore. The
  one destructive Prisma flag found in a verification script was removed. The gateway
  process was killed during verification and the SQLite database checksum was
  bit-identical before and after.
* **Residual risks** — no mTLS between app and gateway (loopback + token is the
  control); tokens are static until rotated by hand; the gateway trusts the app's
  declared classification; there is no per-user authorisation at the gateway (by
  design — that stays in the applications); no rate limiting at the network edge.

---

## E. Operational readiness

| Capability | State |
|---|---|
| Start/stop, graceful shutdown | Implemented; verified by kill-without-data-change |
| Fail-closed config | Verified: no registry → exit 1; non-loopback bind in production → exit 1; malformed registry → exit 1 with a single-line JSON error, no stack trace, no secret |
| Health/readiness | `/health/live`, `/health/ready` truthful about provider availability |
| Metrics | 9 bounded-label metrics on a separate loopback listener |
| Dashboard | 6 panels, valid JSON, not yet imported into a live Grafana |
| Alerts | 9 staged rules; `ALERTS_ENABLED=false`; dashboard-only until delivery is tested |
| Deployment | Documented with systemd and PM2 **examples to be confirmed against the real host**; the real service-manager layout is unknown |
| Rollback | Flag-first, then process stop; rehearsed at unit level and process level; DB restore explicitly not part of it |
| Runbooks | `deployment.md`, `rollback.md`, `monitoring-and-alerts.md`, `environment-variables.md` |

**Readiness verdict:** ready to run on a host that has been inspected, with a
credential and one approved provider. **Not** production-ready, and not described as
such anywhere.

---

## F. Remaining work

1. **Host inspection** — confirm the real service manager, unit names, ports, proxy
   route and backup/restore procedure; update `deployment.md` and `port-map.md`.
2. **Live provider** — supply an approved key, set `AI_EXTERNAL_DATA_POLICY` explicitly,
   run one bounded live call, capture cost and latency.
3. **Enable the PhD flag** on staging, compare output against the direct path, then on
   production behind the same flag; keep CRM and AgentOS off until their own tests pass.
4. **Migrate the remaining call sites** (`src/lib/ai.ts`, `ai-gateway.ts`,
   `model-router.ts`, 43 hard-coded model names) one at a time, with output comparison —
   not en masse.
5. **Clients for CRM and AgentOS**, honouring in-app authorisation, per-agent quotas,
   iteration and deadline limits, and approval gates.
6. **Monitoring adoption** — install Prometheus/Grafana, import the dashboard, deliver
   one test alert to an approved recipient, then enable `ALERTS_ENABLED`.
7. **Budgets** — implement `AI_MONTHLY_BUDGET_LIMIT` / `AI_MAX_COST_PER_REQUEST` only
   after a verified price table exists (currently accepted, not enforced).
8. **Local model** — infeasible on 2 vCPU/3.9 GiB; re-assess only on hardware with a
   measured benchmark.
9. **Embeddings** — implement and test, or leave it out of the contract.
10. **Run `next build`, full `tsc`, full `eslint` and the MySQL integration suites on
    a machine with adequate memory** before any production release.
