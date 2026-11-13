# Security and data policy

## 1. Threats considered

| Threat | Control |
|---|---|
| Secret exfiltration from the browser or client bundle | Gateway tokens exist only in server-side process environments; no `NEXT_PUBLIC_*` variable holds one. |
| A compromised application calling models as another application | Per-application token hash, constant-time comparison, one identity per token, no shared token. |
| Confidential documents egressing to an external provider | Data class + app opt-in + deployment policy, all required; `CONFIDENTIAL`/`RESTRICTED` refuse external unconditionally. |
| Prompt injection from uploaded PDFs / pasted text | The PhD module wraps untrusted content in explicit data markers, strips control characters, caps length and records suspicion (`src/lib/phd/ai/safety.ts`). The gateway itself never executes model output. |
| Provider outage cascading into the applications | Circuit breaker, bounded retries, concurrency cap, explicit 5xx categories. |
| Runaway agent loops | Per-application quotas; the PhD job queue has `maxAttempts`, dedupe keys and a 60 s execution timeout. AgentOS integration is not enabled. |
| Prompt/PII leakage into logs and metrics | Metadata-only audit; metric labels are a fixed vocabulary (app id, model id, outcome, reason). No user ids, emails, document names or request ids as labels. |
| Insider reading the audit trail | Audit records ids, counts, latency and codes only; no prompt or completion content. |
| Malformed input exhausting memory | Byte cap before parse, message-count cap, `max_tokens` bound, output-size validation. |

## 2. Identity and authorisation

```
Authorization: Bearer <32+ byte random token>
        │
        ├─ SHA-256 ─→ compared with each registry entry (timing-safe)
        ├─ unknown / malformed / short ─→ 401 (before body read)
        └─ known ─→ { id, dataClassification, allowExternal, allowedModels, quota }
```

* Tokens are generated with `crypto.randomBytes(32)`; the plaintext never leaves
  the consuming application's secret store.
* Rotation supports two live hashes.
* The gateway has **no** user database access and does not read CRM or PhD rows.
  Application-level authorisation (who may see which student/project) remains in
  the applications, which is where the records live.

## 3. Data classification

| Class | Examples | External egress |
|---|---|---|
| PUBLIC | marketing copy, public programme text | permitted when policy approved |
| INTERNAL | internal summaries, non-personal drafts | permitted when policy approved |
| CONFIDENTIAL | applicant documents, PhD drafts, staff notes | **refused** |
| RESTRICTED | financial/commission records, identity documents | **refused** |

The PhD client defaults to `CONFIDENTIAL` and requests `local_only`. That is
defence in depth: even if the route were changed, the class still blocks egress.

### Commission and financial data

Commission terms, rates and fee records are operational/financial data. They are
never sent to a research model. The existing business rule that commission data
must not influence academic scoring is unchanged by this layer.

## 4. Logging and audit

One JSON line per request, containing:

```
ts, service, event, requestId, app, provider, model, route,
dataClassification, fallbackUsed, attempts, status, latencyMs,
promptTokens, completionTokens
```

Never logged: prompt text, completion text, message history, file names, email
addresses, tokens, authorisation headers, stack traces, provider response bodies.

The verification script greps the gateway log and metrics output for the test
prompt strings and for both test tokens; a hit is a FAIL.

`AI_GATEWAY_LOG_PROMPTS=true` or `AI_GATEWAY_LOG_COMPLETIONS=true` makes a
production start fail. These switches exist for local diagnosis only.

## 5. Transport and network

* Gateway binds loopback; production refuses a non-loopback bind.
* No TLS is terminated by the gateway. Any cross-host traffic must use the
  existing reverse proxy/private network with TLS; a plaintext cross-host hop is
  not acceptable and is not configured here.
* Metrics are served on a separate listener and the API port returns `404` for
  `/metrics` (verified).
* No new domain, DNS record or certificate is introduced.

## 6. Application integration rules

### PhD Proposal Builder
* Original student inputs, sources, citations, review history and document
  versions are preserved; the gateway is stateless and writes nothing to the DB.
* AI drafts are generated into a job result, not written into the proposal,
  unless the user explicitly applies them.
* AI-labelled claims are stored as `AI_SYNTHESIS`/`HYPOTHESIS`, never
  `VERIFIED_FACT`; verification remains a human action.
* Commission/CRM financial records are never sent to research models.

### ALO Education CRM
* Gateway integration is **not enabled** in this phase.
* When enabled, existing RBAC remains authoritative; an AI response must never be
  the sole basis for a financial change, approval, deletion or high-impact
  communication.

### AgentOS
* Not enabled. Per-agent quotas, iteration caps, tool allowlists and approval
  gates must be verified in AgentOS before any model call is routed through the
  gateway.

## 7. Secret handling checklist

- [x] No secret is committed: `.env.ai-gateway.example` contains placeholders.
- [x] Tokens are hashed at rest in the gateway registry.
- [x] Errors never echo the token (unit test asserts this).
- [x] `AI_GATEWAY_APPS` values do not appear in `/health/*` responses.
- [ ] Production secret store mechanism — **to be confirmed on the host**.
- [ ] Rotation drill on the host — **not run**.

## 8. Privacy and retention

* The gateway stores nothing, so it has no retention obligation; application
  retention policies remain authoritative.
* `AI_USAGE_RETENTION_DAYS=30` is declared for the future metrics store; the
  gateway itself keeps counters in memory and loses them on restart.
* Audit lines go to the process log; log rotation and retention are the host's
  responsibility (documented in `monitoring-and-alerts.md`).

## 9. Known residual risks

1. **Single process.** A gateway crash stops AI features for every integrated
   product. Mitigation: each application keeps a feature flag to return to its
   previous path; no application is enabled yet.
2. **In-memory counters.** Restarting resets quotas, breakers and metrics.
   Acceptable at this scale; a shared store would be required for a cluster.
3. **No cost enforcement.** Token counts are exposed but budgets are not
   enforced (no verified price table).
4. **External provider not exercised.** No credential exists here, so external
   inference is unverified — reported as BLOCKED, not PASS.
