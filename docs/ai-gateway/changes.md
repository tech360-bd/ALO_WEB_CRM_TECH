# Files changed and why

All paths are relative to the repository root. Nothing was deleted; no database
schema, migration, route, component, authentication rule or design token was
modified.

## Added — gateway service

| Path | Why |
|---|---|
| `services/ai-gateway/gateway.mjs` | The gateway: config parsing, per-app identity, schema/limit validation, data-class policy, deterministic routing, bounded retries with jitter, circuit breaker, redacted audit, Prometheus exposition, HTTP handlers. Zero runtime dependencies. |
| `services/ai-gateway/server.mjs` | Process entry point with fail-closed startup, startup log line, SIGTERM/SIGINT graceful shutdown. |
| `services/ai-gateway/package.json` | Declares `type: module`, Node ≥ 20, `start`/`check` scripts. No dependencies. |

## Added — verification and operation

| Path | Why |
|---|---|
| `scripts/verify-ai-gateway.sh` | 23 executable checks (liveness, readiness, auth, policy, local-only egress, metrics isolation, log redaction, failover data-safety, unit suite, type check, live-provider BLOCKED). Writes `.ai-gateway-tmp/verification-results.json`. |
| `monitoring/prometheus/ai-gateway-scrape.yml` | Scrapes only the private metrics listener. |
| `monitoring/prometheus/ai-gateway-alerts.yml` | Nine staged alert rules; dashboard-only until a test notification is approved. |
| `monitoring/grafana/ai-gateway-dashboard.json` | Six-panel operator dashboard, UID `alo-ai-gateway`. |
| `.env.ai-gateway.example` | Placeholders only; documents required vs optional variables. |

## Added — documentation

| Path | Why |
|---|---|
| `docs/ai-gateway/baseline.md` | Phase 0 audit, confirmed facts, unknowns, risks, rollback map, Gate 0 decision. |
| `docs/ai-gateway/architecture.md` | Components, request lifecycle, routing table, failure semantics, isolation, deliberate omissions. |
| `docs/ai-gateway/environment-variables.md` | Every variable: format, default, reader, rotation, startup behaviour. |
| `docs/ai-gateway/port-map.md` | Verified inventory, conflict procedure, exposure rules. |
| `docs/ai-gateway/provider-matrix.md` | Adapters, external-use conditions, local-capacity measurement, third-party review decisions. |
| `docs/ai-gateway/security-and-data-policy.md` | Threats/controls, identity, classification, logging rules, residual risks. |
| `docs/ai-gateway/monitoring-and-alerts.md` | Metric catalogue, dashboard, alerts, staging policy, blocked checks. |
| `docs/ai-gateway/deployment.md` | Host prerequisites, systemd/PM2 examples (to be confirmed), one-app-at-a-time integration, exit criteria. |
| `docs/ai-gateway/rollback.md` | Triggers, ordered steps, forbidden actions, rehearsal status. |
| `docs/ai-gateway/verification-results.md` | Actual results of the verification run with evidence and limitations. |
| `docs/ai-gateway/changes.md` | This file. |

## Added — application integration (opt-in)

| Path | Why |
|---|---|
| `src/lib/phd/ai/gateway.ts` | Typed server-side client: flag detection, timeout, error taxonomy, no token leakage. Defaults to `CONFIDENTIAL` + `local_only`. |
| `tests/unit/phd/ai-gateway-client.test.ts` | 7 tests against a real local HTTP server: disabled no-op, request contract, policy error without retry, empty-completion contract error, timeout, no token in errors. |
| `tests/unit/ai-gateway/gateway.test.ts` | 25 tests for config validation, auth, models listing, body limits, quotas, local-only enforcement, confidentiality, fallback direction, retry bounds, timeout, breaker, redaction, listener separation. |

## Modified

| Path | Change | Why safe |
|---|---|---|
| `src/lib/phd/ai/client.ts` | Prefers the gateway when `PHD_AI_GATEWAY_ENABLED=true`; otherwise the previous `generateText` path is untouched. | Behaviour is identical with the flag off; a gateway failure is surfaced and **not** retried directly against a provider (that would bypass policy). |
| `scripts/phd/setup-verification-db.mjs` | Removed `--accept-data-loss`; on a schema mismatch the disposable SQLite file is deleted and recreated. | Forbidden by `tests/unit/critical-safety-remediation.test.ts`; the file is scratch data, not an application database. |
| `src/lib/phd/storage.ts` | Optional `PHD_STORAGE_ROOT`; the root is resolved per call, default unchanged (`storage/phd`). | Lets tests (and a separate data volume) use another directory with no behaviour change when unset. |
| `tests/integration/phd/services.test.ts` | Sets `PHD_STORAGE_ROOT` to `.phd-tmp/storage`. | Test uploads used to land in the real runtime document store. |
| `.gitignore` | Ignores `/.phd-tmp/`, `/.ai-gateway-tmp/`, `/storage/phd/`; adds `!.env.ai-gateway.example` so the placeholder template is trackable while real `.env*` files stay ignored. | Local artifacts, runtime documents and one template exception. |

## Deliberately not modified

* `prisma/schema.prisma`, all migrations — no schema change in this phase.
* `src/lib/ai.ts`, `src/lib/ai-gateway.ts`, `src/lib/model-router.ts`,
  `src/lib/groq-protection.ts`, the provider catalogue — the existing in-process
  path stays intact so rollback is a flag flip. Migrating those 9 call sites is
  remaining work, done one at a time with output comparison.
* Every `src/app/api/**` route, every React component, the design system.
* Authentication, RBAC, session handling, audit tables.
* CRM and AgentOS code paths — no gateway flag is enabled for them.

## Untracked findings (no change made)

* 43 hard-coded model names across `src/lib` and `src/app` — model drift risk,
  documented in the baseline; not refactored in this phase.
* Unofficial provider proxies in `src/lib/ai-providers/catalog.ts` behind
  `ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS` — flagged High risk; the gateway refuses
  them by design.
* No monitoring stack, no PM2/systemd unit for the applications in this
  environment — documented as BLOCKED rather than invented.
