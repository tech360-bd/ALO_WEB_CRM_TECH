# ALO EDUCATION — AI AGENTS

Spec s55–s62, s16, s24, s93, s105, s116.

---

## 1. Governing rules

Two rules shape every AI surface in this platform, and both are enforced in code rather than left to
convention:

**s93 — No fake AI.** If an agent cannot perform an action it must not pretend. It returns
`Unable to complete automatically / Human review required / Reason: …`.

**s15, s16 — No fabricated authority.** AI must never invent university requirements, deadlines,
scholarship amounts, visa rules, achievements, employment, qualifications or financial facts. Every
score and recommendation must carry the evidence that produced it.

A concrete example of s93 in practice, from this work: `emitWebhook` returns `NOT_CONFIGURED` when no
subscription exists rather than reporting a successful send, and the eligibility engine's
`Missing Information` label is used instead of scoring against data the student never supplied.

---

## 2. Persistence

| Model | Line | Purpose |
|---|---|---|
| `AiAgent` | 7035 | `department`, `agentName`, `agentCode`, `agentType`, `status`, `jobsProcessed`, `pendingApprovals`, `lastRunAt`, `supervisorAgentId` |
| `AiAgentRegistry` | 7054 | Registration and versioning |
| `AiAgentLineage` | 7412 | Provenance chain between agent runs |

Plus the AI command/approval surface under `src/app/api/ai-workforce/` (22 routes), including
`agents/[slug]/{compare,lifecycle,versions}` and `approvals/[id]`.

`AiAgent.supervisorAgentId` and `pendingApprovals` are what make s55's "human approval requirements"
and s116's approval gates representable in data rather than only in policy.

---

## 3. Gateways

Two distinct gateways exist; they are not interchangeable.

### `src/lib/ai-gateway.ts` — provider gateway

`aiGateway(req)` plus typed helpers: `generateStructured<T>()`, `classify()`, `summarize()`,
`chat()`, `stream()`. Requests omit `provider`/`endpoint`, which the gateway resolves — so no caller
hard-codes a vendor (s78).

### `src/lib/ai-workforce/gateway.ts` — execution gateway

`aiGatewayExecute(req, options)`, `planRoute(req, runtimes)`, `ensureGatewayReady()`,
`requestFingerprint(req)`, `deterministicOnly(task, facts)`, and a typed `GatewayError`.

`deterministicOnly` is the important one for s93: it computes what can be answered **from facts
alone**, with no model call. `requestFingerprint` supports idempotency so a retried agent run does not
execute twice (s90).

### Provider catalogue

`src/lib/ai-providers/catalog.ts` holds `FREE_PROVIDERS`, `FREE_PROVIDER_SLUGS`,
`EXCLUDED_PROVIDERS` (each with a reason), and — notably — two honesty fields:

```ts
FREE_TIER_CLAIMS_SOURCE = 'owner-supplied provider list, 2026-10-18 — not verified against official documentation';
VERIFIED_FREE_TIERS = [];   // empty: nothing has been verified
```

That is s105 applied to the AI layer itself: an unverified claim is labelled as unverified and the
verified list is empty rather than being populated optimistically.

---

## 4. Agent roles named in s55

The specification lists seventeen agents. Their status in this codebase:

| Agent | Status | Evidence |
|---|---|---|
| Lead Intelligence | PRESENT | `src/app/api/brains/`, lead scoring routes |
| Counselor Copilot | PRESENT | `counselor-dashboard`, next-best-action consumption |
| University / Course Matching | PRESENT | `src/lib/university-course/eligibility-engine.ts`, `/api/course-finder/*` (16 routes) |
| Document Review | PRESENT | `ai-document-processing` cron job; `src/lib/communications/document-{match,policy}.ts` |
| Application Quality | PRESENT | quality-gate routes under `applications` |
| Visa Readiness | PRESENT | `VisaReadinessAssessment`, `visa-readiness` lib |
| Deadline Agent | PRESENT | `document-expiry-alerts`, `intake-deadline-alerts`, `scholarship-expiry` cron jobs |
| Communication Agent | PRESENT | UCC (21 routes), `channel-registry.ts` |
| Marketing Agent | PRESENT | `marketing` (34 routes) |
| Partner Risk | PRESENT | `AI_PARTNER_RISK` flag; partner risk grading |
| Commission Agent | PRESENT | commission reconciliation routes |
| **Student Success** | **BUILT THIS BRANCH** | `src/lib/risk/student-success-score.ts`, 18 tests |
| Management Intelligence | PRESENT | `daily-analytics-summary` cron; UCC morning summary |
| Knowledge Agent | PRESENT | knowledge-sharing hub |
| Data Quality Agent | PRESENT | 4 data-quality files; `data-conflicts`, `data-freshness` routes |
| **Opportunity Graph** | **BUILT THIS BRANCH** | `src/lib/intelligence/opportunity-graph.ts`, 40 tests |
| **Attention Engine** | **BUILT THIS BRANCH** | `src/lib/intelligence/attention-engine.ts`, 22 tests |

### What the three new engines guarantee

**Application risk (s111).** Deterministic, not a model call. Score bands GREEN 0–17 / AMBER 18–44 /
RED ≥45, clamped 0–100. Six factors force RED regardless of total: `DEADLINE_PASSED`, `NO_UNIVERSITY`,
`NO_COURSE`, `REVIEW_REJECTED`, `OFFER_REJECTED`, `DOCUMENT_SET_BLOCKING`. Every factor names the field
that triggered it.

**Student success (s112).** Weights across `documents`, `profile`, `financial`, `visa`, `application`,
`deadline` sum to **exactly 1.0** (asserted by test). Bands `ON_TRACK` ≥80, `NEEDS_SUPPORT` ≥60,
`AT_RISK` ≥40, `CRITICAL` <40. Every response carries `SUCCESS_SCORE_DISCLAIMER` — it is operational
support, never an admission or visa prediction.

**Opportunity graph (s110).** Every edge carries `evidence: {table, id, field}` naming the real row
that produced it, and every recommendation carries `becauseOf` naming the edges that justify it.
Weights encode real progression: an `UNCONDITIONAL_OFFER` application scores 1.0, `DECISION_PENDING`
0.8, `DRAFT` 0.4; a granted visa case 1.0 versus 0.5 pending; settled commission 1.0 versus 0.4
unsettled. **Unverified scholarship data is surfaced at weight 0.5 and labelled** rather than being
dropped or trusted equally (s105). A funding gap is reported as `NOT_FOUND` with "check the official
funding page", never as "no funding exists".

---

## 5. Safety controls

`src/lib/communications/ai-safety.ts` and the AI command routes enforce the s55 forbidden-action list.
The repository's own stated rules, which the new code respects:

- AI cannot publish to the public site without human approval.
- AI cannot send private student data externally without OTP verification.
- AI cannot change critical status (`VISA_APPROVED`, `ENROLLED`) without permission.
- AI cannot approve documents — human review is mandatory.
- Low-risk actions (`READ`, `ANALYZE`, `SUMMARIZE`, `CLASSIFY`, `DRAFT`, `RECOMMEND`, `PREPARE`) may
  run autonomously; high-risk actions (`FINALIZE`, `APPROVE`, `SEND`, `PAY`, `DELETE`, `ESCALATE`)
  require a human (`validateAiAction`).

A test in `catalogue-phase1-review-writes.test.ts` confirms that AI payloads attempting to set
verification or publication state are rejected, and that a failed primary executor produces an
**UNVERIFIED DRAFT** containing only supplied values rather than inventing the rest.

---

## 6. Feature flags gating AI (s117)

`AI_VISA_AGENT`, `AI_PARTNER_RISK`, `AI_LEAD_AGENT`, `AI_COUNSELOR_COPILOT`, `AI_DOCUMENT_REVIEW`,
`AI_MANAGEMENT_BRIEFING` — all bootstrapped **disabled at 0% rollout**. An AI capability is off until
an administrator enables it with a recorded reason.

---

## 7. Verification status

The three engines built in this branch are covered by 80 unit tests asserting determinism, evidence
presence, weight arithmetic, band boundaries and the disclaimer.

**Not verified:** no agent was executed against a live model provider, because no provider credentials
exist in this environment. Every AI surface is therefore `NOT CONFIGURED` for runtime purposes. No
claim is made that any agent produces useful output — only that the deterministic scoring engines
compute correctly from supplied inputs and that the code refuses to fabricate when it cannot act.
