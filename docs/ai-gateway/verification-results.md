# Verification results

**Run date:** 2026-10-25
**Environment:** development sandbox (Linux 6.1.158+, 2 vCPU, ~3.9 GiB RAM, Node v22.22.3)
**Commit:** `a3f3253f` + working-tree changes on `arena/fd119d66-alo-web-crm-tech`
**Machine-readable report:** `.ai-gateway-tmp/verification-results.json`

> This is **not** a production verification. The production host was unreachable,
> no provider credential exists in this environment, and no application server is
> running. Every claim below is limited to what was actually executed here.

## 1. Executable verification — `bash scripts/verify-ai-gateway.sh`

```
Summary: PASS=21 FAIL=0 BLOCKED=1 NOT-RUN=1
```

| # | Test | Command / identifier | Status | Evidence | Limitation |
|---:|---|---|---|---|---|
| 1 | Node runtime ≥ 20 | `node -v` | **PASS** | `v22.22.3` | — |
| 2 | Gateway app registry present in the shell | `env AI_GATEWAY_APPS` | **NOT RUN** | not set for the shell | The script generates a temporary registry; production registry not inspected |
| 3 | Assigned ports free | `ss -ltn` on 33180/39180/33181 | **PASS** | no listener | Production 3180/9180 checked separately in the audit |
| 4 | Gateway process starts | `node services/ai-gateway/server.mjs` | **PASS** | startup line with port + provider list | Sandbox only |
| 5 | Both listeners on loopback | `ss -ltn` | **PASS** | `127.0.0.1:33180`, `127.0.0.1:39180` | — |
| 6 | Liveness | `curl /health/live` | **PASS** | `{"status":"ok",...}` | — |
| 7 | Readiness reflects providers | `curl /health/ready` | **PASS** | `{"status":"ready","providers":[{"id":"mock",...}]}` | Mock + approved stub only |
| 8 | Unauthenticated inference rejected | `curl POST /v1/chat/completions` (no token) | **PASS** | `401 UNAUTHENTICATED` | — |
| 9 | Authenticated inference succeeds | same with `crm` token | **PASS** | `200`, `provider=mock`, `X-Request-Id` present | Mock provider, not a real model |
| 10 | Unapproved model rejected | `crm` token, model `gpt-5-unapproved` | **PASS** | `403 MODEL_NOT_PERMITTED` | — |
| 11 | Local-only never calls external | `route=local_only` + external stub hit counter | **PASS** | `403 LOCAL_ONLY_UNAVAILABLE`, **external hits = 0** | — |
| 12 | Approved external route reaches only the approved provider | `route=external_approved` + stub counter | **PASS** | `200`, stub response, hits ≥ 1 | Stub, not a real vendor |
| 13 | Confidential identity stays local | `phd` token (`CONFIDENTIAL`) | **PASS** | `200`, `provider=mock` | Local provider only |
| 14 | Metrics private | `curl :3180/metrics` and `:9180/metrics` | **PASS** | `404` on API port, `200` on metrics port | — |
| 15 | No prompts/tokens in logs or metrics | `grep` over gateway log + metrics | **PASS** | no hit for prompt text or either token | Logs are the process stdout in this run |
| 16 | Unknown token rejected | `curl /v1/models` with random token | **PASS** | `401` | — |
| 17 | Gateway failure does not alter application data | kill process; compare SQLite checksum | **PASS** | connection refused; `sha256` unchanged | Verification DB, not production data |
| 18 | Gateway test suite | `npx vitest run tests/unit/ai-gateway` | **PASS** | 25 tests passed | — |
| 19 | Gateway source parses | `node --check` ×2 | **PASS** | no syntax error | — |
| 20 | TypeScript check (PhD + gateway client) | `NODE_OPTIONS=--max-old-space-size=2048 npx tsc -p tsconfig.phd.json --noEmit` | **PASS** | exit 0, no diagnostics | Scoped config; full-repo `tsc` OOMs (see §4) |
| 21 | Production refuses to start without an application registry | `NODE_ENV=production node services/ai-gateway/server.mjs` | **PASS** | exit 1, `config_invalid: No application identities are configured` | — |
| 22 | Production refuses a non-loopback bind | `NODE_ENV=production AI_GATEWAY_HOST=0.0.0.0 …` | **PASS** | exit 1, `must bind to loopback` | — |
| 23 | Live provider inference | authorised live call | **BLOCKED** | no `GROQ_API_KEY` / `OPENROUTER_API_KEY` / `ZAI_API_KEY` / `EXTERNAL_MODEL_API_KEY` present, no `.env*` values | Requires credentials + explicit approval + bounded cost |

### Result interpretation

* **21 PASS** are real executions against a running process, not static checks.
* **1 BLOCKED** (live provider) is reported as blocked, not passed.
* **1 NOT RUN** (registry presence) is a configuration fact the script cannot assume.

## 2. Application test suites actually executed

| Suite | Command | Result |
|---|---|---|
| Full unit suite | `npx vitest run tests/unit --reporter=json` | **301 files / 3 374 tests / 0 failed** (`EXIT:0`) |
| Gateway unit + integration | `npx vitest run tests/unit/ai-gateway` | **25 passed** |
| PhD gateway client | `npx vitest run tests/unit/phd/ai-gateway-client.test.ts` | **7 passed** |
| PhD module unit (includes the gateway client) | `npx vitest run tests/unit/phd` | **12 files / 124 passed** |
| PhD integration (real SQLite rows, constraints, FKs) | `ALO_DB_DRIVER=sqlite DATABASE_URL="file:$PWD/.phd-tmp/phd-test.db" npx vitest run tests/integration/phd` | **39 passed / 0 failed** |
| Repository safety guard (no destructive Prisma flags) | `npx vitest run tests/unit/critical-safety-remediation.test.ts` | **46 passed** (after removing `--accept-data-loss` from the verification-DB script) |
| ESLint on new and touched code | `npx eslint services/ai-gateway src/lib/phd/ai tests/unit/ai-gateway tests/unit/phd/ai-gateway-client.test.ts` | **exit 0, no findings** |
| Repository-wide ESLint | `npx eslint .` | **NOT RUN (timeout)** — exceeded 420 s on 2 vCPU. Scoped lint of every new/touched file passes; a full-repo lint must run in CI or on the target host. |
| Scoped type check | `npx tsc -p tsconfig.phd.json --noEmit` | **exit 0** |

### Other integration suites

`tests/integration/*` (communication ownership, consultation workflow, partner
B2B security, visa security, university monitoring, …) require a live MySQL
database via `TEST_DATABASE_URL`. No MySQL server is reachable here.

**Status: BLOCKED** — not run, not claimed.

## 3. Security boundary tests (explicit)

| Boundary | Test | Result |
|---|---|---|
| Unauthenticated caller → inference | no token | **PASS** (401) |
| Unknown/foreign token → any route | random token; `agentos`-style token not in registry | **PASS** (401) |
| CRM token → PhD-restricted model | `crm` token with `not-permitted` model | **PASS** (403) |
| CONFIDENTIAL app → external provider | `phd` identity + external adapter present | **PASS** (local only, external call count 0) |
| `local_only` → external | external adapter available | **PASS** (403, external hit count 0) |
| Malformed JSON / bad role / oversized `max_tokens` | direct POSTs | **PASS** (400) |
| Oversized body | 20 KB prompt over an 8 KB cap | **PASS** (413 or socket close; provider never called) |
| Retry bound | failing provider, `MAX_RETRIES=2` | **PASS** (exactly 3 attempts) |
| Circuit breaker | 3 consecutive failures, threshold 2 | **PASS** (`503 CIRCUIT_OPEN`, provider called twice only) |
| Token in error text | provider failure | **PASS** (token absent) |
| Metrics exposure | API port vs metrics port | **PASS** (404 / 200) |

Cross-application **document** isolation cannot be tested at the gateway because
the gateway has no document store or database access; the existing application
ownership rules remain the control (and were separately tested at service level,
including 404 on cross-project literature reads/writes).

## 4. Known limitations of this verification

| Area | Status | Why |
|---|---|---|
| Full-repository `tsc --noEmit` | **BLOCKED** | Exceeds the sandbox heap (OOM, exit 134). The scoped config covers all new/changed TypeScript. |
| Production build (`next build`) | **BLOCKED (environment)** | Two attempts, both on the same 2 vCPU / 3.9 GiB sandbox. Attempt 1 (`--max-old-space-size=2560`): `Killed`, exit 137 (OS OOM) after the compiler started. Attempt 2 (1536 MB heap): stalled in "Creating an optimized production build" for 14 minutes with the host at 3861/3939 MiB used, then terminated deliberately; log at `.ai-gateway-tmp/build-retry.log`. Neither run reached type-checking or page emission, so this is **not** evidence the build passes *or* fails. It must be run on the target host. |
| Prometheus/Grafana adoption | **BLOCKED** | Not installed; configuration provided and syntax-reviewed by inspection only |
| Alert delivery | **BLOCKED** | No notification credentials or approved recipients |
| Service-manager restart | **BLOCKED** | No PM2/systemd unit exists for these apps in this environment |
| Live provider output quality | **BLOCKED** | No credentials; quality comparison against the old path is outstanding |
| CRM and AgentOS integration | **NOT RUN** | Deliberately not enabled; only the PhD module has a client |
| TLS/certificate expiry alerting | **BLOCKED** | No exporter or external probe installed |
| Capacity under real traffic | **NOT RUN** | No load test was performed; 2 vCPU makes any figure unrepresentative |

## 5. Reproduction

```bash
# gateway verification (self-contained; needs no credentials)
bash scripts/verify-ai-gateway.sh
cat .ai-gateway-tmp/verification-results.json

# application-level suites
npx vitest run tests/unit/ai-gateway
npx vitest run tests/unit/phd
node scripts/phd/setup-verification-db.mjs --fresh
ALO_DB_DRIVER=sqlite DATABASE_URL="file:$PWD/.phd-tmp/phd-test.db" \
  npx vitest run tests/integration/phd
```
