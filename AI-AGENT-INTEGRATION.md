# AI-AGENT-INTEGRATION — ALO Education

Snapshot: **2026-10-18**, branch `arena/ef31f574-alo-web-crm-tech`

> **No AI provider was called from this environment.** `api.groq.com` and any ALO
> Labs host are unreachable, and no API key was supplied. Statements below come
> from source inspection.

---

## 1. Headline finding: ALO Labs does not exist in this repository

```
grep -rln "ALO_LABS|alo-labs|aloLabs|ALO LABS" .   (excluding node_modules)
  → no matches
```

There is no client, no endpoint, no base-URL variable, no queue binding, no model
registry entry and no seed row referring to ALO Labs. Task 7 — *"Connect the CRM
to ALO Labs AI using authenticated APIs and durable background queues"* — is
**BLOCKED**, not partially done.

### What is needed to unblock

| Input | Why |
|---|---|
| ALO Labs API base URL | Nothing to point a client at |
| Authentication scheme (API key? OAuth2 client-credentials? mTLS?) | Determines the credential model |
| OpenAPI spec or endpoint list | Determines the client surface |
| Rate limits and idempotency semantics | Determines queue retry policy |
| Credential values, delivered out-of-band | Must never be committed |
| Data-processing agreement | Student PII would leave the CRM |

Writing a speculative client against an invented contract would produce code that
looks integrated and is not. That is the specific failure this document is meant
to prevent.

### What *can* be done now, and safely

The repository already has the two things a real ALO Labs integration needs:
an **authenticated provider-gateway pattern** and a **durable queue**. Wiring
ALO Labs is therefore additive, not architectural.

---

## 2. Existing AI infrastructure (reusable, verified present)

### Provider gateway

| File | Role |
|---|---|
| `src/lib/ai-gateway.ts` | Central provider gateway (Groq and others) |
| `src/lib/ai.ts` | Core AI helpers |
| `src/lib/ai-models/registry.ts` | Model registry |
| `src/lib/department-model-config.ts` | Per-department model assignment |
| `src/lib/ai-workforce/runtimes.ts` | AI Workforce runtimes |

Configuration variables (names only):

| Variable | Role |
|---|---|
| `GROQ_API_KEY` | Groq provider key |
| `GROQ_MAX_CONCURRENCY`, `GROQ_MAX_QUEUE`, `GROQ_PER_MINUTE` | Concurrency and rate limiting |
| `ZAI_API_KEY` | Z.ai provider key |
| `LOCAL_AI_URL`, `LOCAL_AI_MODEL`, `LOCAL_AI_API_KEY` | Self-hosted endpoint |
| `AI_DEFAULT_MODEL`, `AI_FAST_MODEL`, `AI_SMART_MODEL`, `AI_AGENT_MODEL` | Model routing tiers |

**`ALO Labs would slot in here** — as another provider in
`src/lib/ai-models/registry.ts` with its own key variable, following the pattern
`LOCAL_AI_*` already establishes for a self-hosted authenticated endpoint.

### Agents

`src/lib/ai-agents/`:

| Agent | File |
|---|---|
| Student intake | `student-intake-agent.ts` — called from the WhatsApp webhook via `handleIntakeMessage()` |
| International course | `international-course-agent.ts` |
| Campus/course mapper | `campus-course-mapper.ts` |
| Research assistant | `research-assistant.ts` |
| Social media | `social-media-agent.ts` |
| Supervisor matcher | `supervisor-matcher.ts` |
| Synthetic-data guard | `synthetic-data-guard.ts` |

Plus `src/lib/agentos/**`, `src/lib/brains/**`, `src/lib/ai-workforce/**`.

### Guardrails

`src/app/api/ai-safety/**` and these variables:

| Variable | Purpose |
|---|---|
| `AGENT_MAX_STEPS` | Step ceiling per run |
| `AGENT_MAX_TOOL_CALLS` | Tool-call ceiling |
| `AGENT_TOKEN_BUDGET` | Token ceiling |
| `AGENT_MAX_RUNTIME_MS` | Wall-clock ceiling |
| `AGENT_APPROVAL_POLICY` | Human-in-the-loop policy |

Kill switch: the `GlobalAiPause` model, plus `AiAction` / `AiTask` for
per-action accounting and `AgentApprovalQueue` for gated actions.

`synthetic-data-guard.ts` deserves noting: there is an explicit guard against
agents fabricating data, and the repository root contains
`ALO_SYNTHETIC_DATA_REJECTED.csv` (2.5 MB) — evidence the guard has rejected
output in practice.

---

## 3. Durable background queues

The queue system is the strongest part of the AI infrastructure and is the right
home for ALO Labs work.

`src/lib/cron/`:

| File | Role |
|---|---|
| `job-registry.ts` | Single source of truth for every scheduled job |
| `job-runner.ts` | Lease-based execution with durable logging |
| `cron-lock.ts` | Distributed lock so a second runner cannot double-execute |
| `job-handlers.ts` | Lazily-imported handler implementations |
| `parse-cron.ts`, `route-handler.ts` | Scheduling and HTTP entry |
| `health-snapshot.ts` | Operational health |

Registered jobs: **21**, counted from `job-registry.ts`:

```
15  job                  → real work under a lease with a durable log entry
 2  external-dependency  → refuses to run, names the missing outside resource
 4  superseded           → refuses to run, names the live implementation instead
```

The registry's own header is unusually honest and worth quoting:

> *"every declared path resolves to exactly one of three honest outcomes: job →
> real work … external-dependency → refuses to run, naming the missing outside
> resource … superseded → refuses to run, naming the live implementation instead.
> **No entry is a placeholder: a job that cannot do its job says so and never
> reports success.**"*

It also records the failure mode it replaced: *"15 jobs were declared in
`vercel.json` and `src/cron/cron-definitions.ts` while only one of those paths had
a route file: every other declaration 404'd in production."*

AI-relevant jobs:

| Key | Schedule | Disposition |
|---|---|---|
| `ai-document-processing` | — | `job` |
| `agent-schedules` | — | `job` |
| `sla-monitoring` | every minute | `job` |
| `whatsapp-followups` | every 5 min | `job` |
| `failed-message-retry` | every 5 min, max 3 attempts | `job` |

All schedules are evaluated in **`Asia/Dhaka`**, matching the business calendar
used by `allocateIdentifier`.

Models backing durability: `CronJobLog`, `MonitoringJob`, `MarketingAgentJob`,
`VideoEngineJob`, `OcrJob`, `AiTask`, `AiAction`.

> **`database-backup` is one of the two `external-dependency` jobs.** The
> application does **not** back itself up. Any rollback-readiness claim must be
> verified against Hostinger, not against this repository.

---

## 4. Recommended ALO Labs integration shape

Not implemented — recorded so the work is scoped rather than guessed.

```
1. Config       ALO_LABS_BASE_URL, ALO_LABS_API_KEY (or client id/secret pair)
                → classify in docs/environment-classification.json
                → declare in .env.example and .env.production.example
                → key must fail closed in production (follow ENCRYPTION_KEY)

2. Client       src/lib/alo-labs/client.ts
                authenticated requests, explicit timeout, no retry inside the call

3. Registry     add the provider to src/lib/ai-models/registry.ts so it inherits
                existing model routing, evaluation and department assignment

4. Queue        one job in src/lib/cron/job-registry.ts, disposition 'job',
                with a lockTtlSeconds and timeoutMs, logging to CronJobLog

5. Idempotency  reuse src/lib/communications/webhook-idempotency.ts and the
                WebhookEvent @@unique([provider, eventId]) constraint

6. Guardrails   route through the existing AGENT_* ceilings and AgentApprovalQueue
                so ALO Labs actions cannot bypass human approval

7. Tests        a fake-server unit test (the pattern used for clamd in
                tests/unit/malware-scan.test.ts) plus a self-skipping
                integration test for the real contract
```

Two constraints to respect:

- **Never store the ALO Labs key in the database.** Environment only, matching
  every other provider here.
- **Student PII crossing to ALO Labs is a data-processing decision**, not an
  engineering one. It needs an agreement before the first call, not after.

---

## 5. Test results

No new AI code was added in this branch, so there is nothing new to test. The
pre-existing AI-related suites were run as part of the full suite and are green:

```
Test Files  191 passed | 7 skipped (198)
     Tests  2087 passed | 75 skipped (2162)
```

Relevant pre-existing files observed green in this run:
`tests/unit/ai-security-remediation.test.ts` (5 tests),
`tests/unit/ai-provider-policy.test.ts`.

**No test in this repository exercises a live ALO Labs call, because no ALO Labs
code exists.**

---

## 6. Status

| Item | Status |
|---|---|
| ALO Labs client | **Blocked** — no contract, no credentials, no code |
| Authenticated provider pattern to reuse | Implemented |
| Durable queue to reuse | Implemented |
| Guardrails to reuse | Implemented |
| Idempotency to reuse | Implemented |
| Live AI provider connection | **Unverified** — no call made from this environment |
| Deployment | **Not deployed** |
