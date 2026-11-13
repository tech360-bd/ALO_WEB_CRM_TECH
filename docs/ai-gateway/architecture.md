# Shared AI gateway — architecture

## 1. Problem

Every product in this monorepo currently reaches model providers from inside its
own Next.js process:

* provider keys live in the same environment as session secrets;
* retry, timeout and rate-limit logic is duplicated (and in places unbounded);
* there is no per-product quota, no data-egress policy, no shared usage view;
* `src/lib/ai.ts` falls back across providers implicitly, which can move a
  request from a local/approved provider to an unvetted one without a decision
  anyone can audit.

## 2. Shape

```
   ALO Education CRM        UK PhD Proposal Builder        ALO Labs AgentOS
   (Next.js process)        (Next.js process)              (Next.js process)
          │  Bearer <app token>       │                          │
          └──────────────┬────────────┴──────────────────────────┘
                         ▼
                ┌───────────────────────────────────────────┐
                │  shared AI gateway  (127.0.0.1:3180)      │
                │  ─ application identity + quotas           │
                │  ─ request/schema/size validation          │
                │  ─ data-classification policy              │
                │  ─ deterministic router + allowlist        │
                │  ─ bounded retries, timeout, circuit break │
                │  ─ metadata-only audit log                 │
                └───────┬───────────────────────┬───────────┘
                        │                       │
              local adapter (127.0.0.1)   approved external adapter
                        │                       │
                   small local model      provider with approved DPA
                        └──────────┬────────────┘
                                   ▼
              private metrics listener (127.0.0.1:9180)
                                   │
                          Prometheus → Grafana → alerts
```

The gateway is a **separate process** (`services/ai-gateway/server.mjs`) because:

1. provider credentials then live in one service, not in every web worker;
2. quotas and circuit breakers are shared, so one product cannot exhaust a
   provider for the others;
3. the metrics listener can be bound and firewalled independently of the app;
4. it can be restarted or rolled back without redeploying the products.

It is deliberately **not** a document store, a database proxy, a cache or an agent
orchestrator. Application authorisation, business rules and record ownership stay
in the applications.

## 3. Modules

| File | Responsibility |
|---|---|
| `services/ai-gateway/gateway.mjs` | Config parsing, auth, policy, routing, retries, breaker, metrics, HTTP handlers |
| `services/ai-gateway/server.mjs` | Process entry point, fail-closed startup, signal handling |
| `src/lib/phd/ai/gateway.ts` | Typed server-side client used by the PhD module |
| `src/lib/phd/ai/client.ts` | Structured-output client; uses the gateway when enabled, unchanged path otherwise |
| `scripts/verify-ai-gateway.sh` | 23 executable checks with a JSON report |
| `monitoring/prometheus/*` | Scrape config + staged alert rules |
| `monitoring/grafana/ai-gateway-dashboard.json` | Six-panel operator dashboard |

## 4. Request lifecycle

1. **Transport** — HTTP/1.1 on loopback. No TLS is terminated here; production
   traffic reaches the gateway through the existing reverse proxy, and the
   gateway itself must never be published.
2. **Identity** — `Authorization: Bearer <token>`. The token is hashed with
   SHA-256 and compared in constant time against the app registry. A token that
   is not in the registry gets `401` before any body is read.
3. **Body** — read with a hard byte cap; JSON parse errors return `400`.
4. **Schema** — model, message roles/content, `max_tokens` bounds, route and data
   classification are validated. Model allowlist per application is enforced.
5. **Policy** — `classifyRoute()` decides whether external egress is permissible:
   the application must opt in, the deployment must be `approved`, and the data
   class must be below `CONFIDENTIAL`.
6. **Quota** — per application *and* per user key, 60-second window.
7. **Concurrency** — in-flight counter against `AI_GATEWAY_MAX_CONCURRENT_REQUESTS`.
8. **Provider selection** — deterministic. `external_approved` prefers the
   external adapter; every other route prefers local. Fallback is permitted only
   from external to local, and only when `AI_GATEWAY_EXTERNAL_FALLBACK_ENABLED`.
9. **Execution** — bounded retries (1 + `MAX_RETRIES`), exponential backoff with
   jitter, per-provider timeout, circuit breaker.
10. **Audit + metrics** — one metadata-only JSON line and one bounded-label
    metric increment. Prompt and completion text are never written anywhere.

## 5. Routing policy

| Route | Meaning | External allowed |
|---|---|---|
| `policy_default` | Local if configured, otherwise external when policy permits | only if app opt-in + policy approved + class < CONFIDENTIAL |
| `local_only` | Must stay on the host; refuses rather than degrades | **never** |
| `external_approved` | Explicitly wants the approved external provider, may fall back to local | requires approval |
| `quality` / `cost_controlled` | Reserved aliases that currently resolve to `policy_default` | same rules |
| `manual_review` | No model call; returns `202 MANUAL_REVIEW_REQUIRED` | n/a |

`quality` and `cost_controlled` are accepted by the API but **do not yet change
provider selection** — implementing them without verified price/quality data
would be a guess. This is recorded as remaining work, not as a feature.

## 6. Failure semantics

| Condition | Behaviour |
|---|---|
| No configured application | `401`; in production the process refuses to start |
| No provider | `/health/ready` → `503`; inference → `503 NO_PROVIDER` |
| Provider 5xx / 429 | bounded retry, then `502`/`503`; breaker counts the failure |
| Provider timeout | `504 PROVIDER_TIMEOUT`; retried only up to the bound |
| Breaker open | `503 CIRCUIT_OPEN` without touching the provider |
| External disallowed | `403 EXTERNAL_NOT_ALLOWED` or `403 LOCAL_ONLY_UNAVAILABLE` |
| Over concurrency | `503 OVERLOADED` with `Retry-After` |
| Missing gateway config in an app | The app keeps its existing path when the flag is off; when the flag is on it fails visibly and never silently re-routes |

## 7. Isolation model

* **Application isolation** — a token maps to exactly one application id. There is
  no cross-application read path because the gateway stores nothing. `/v1/models`
  is filtered by the caller's allowlist.
* **Tenant isolation within an application** — the gateway sees only the
  pseudonymous `user` key supplied for rate limiting; it does not read CRM or PhD
  records, so it cannot leak one tenant's data to another.
* **Provider isolation** — an external provider is only reachable through the
  external adapter, which requires both an allowlist entry and approved policy.

## 8. What is intentionally absent

* **Caching.** `AI_GATEWAY_CACHE_ENABLED` exists in the naming contract but the
  gateway does not cache. Caching prompts or completions would require tenant
  isolation, encryption, invalidation and retention design that has not been
  approved. `/metrics` reports no cache series.
* **Embeddings.** No embeddings endpoint is implemented; the contract only lists
  it if implemented and required.
* **Autonomous model choice.** No adapter may choose a provider or credential.
* **Retrieval of application data.** The gateway has no database credentials.

## 9. Capacity

Measured on this sandbox: 2 vCPU, ~3.9 GiB RAM. The gateway itself is I/O bound
(single Node process, in-memory counters) and handles the verification load
without measurable pressure. **Local model inference is not viable at this size**
— a 7B model at 4-bit needs roughly 5–6 GiB before context. Any local adapter
must be sized and measured on the target host before being enabled; until then
the gateway reports readiness only for providers that are configured.
