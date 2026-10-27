# Architecture audit — ALO AgentOS / Web CRM

Audited 2026-10-27 at `e74d145e` (branch `main`). Read-only. See `PHASE1_AUDIT_REPORT_2026-10-27.md` for the summary and severity register.

---

## 1. Shape of the system

Single Next.js application (`next@16.4.2`, App Router, React 19, Node 22, npm 10) with three logical products sharing one deployment:

| Layer | Location | Size |
| --- | --- | --- |
| Public website (SEO, courses, universities, consultations) | `src/app/(public pages)`, `src/components/website` | ~200 pages |
| CRM / operations (students, applications, visa, HRM, accounting, marketing, partner B2B) | `src/app/crm`, `src/app/admin`, `src/app/employee`, `src/app/super-admin`, `src/app/student`, `src/app/partner*` | ~260 pages |
| API surface | `src/app/api/**/route.ts` | **1,088 route handlers** |
| Domain logic | `src/lib/**` (65 subdirectories) | 525 modules |
| UI kit | `src/components/ui` (Radix + Tailwind 4) | 542 components |

Entry points: `src/app/layout.tsx` (root), `src/proxy.ts` (Next 16's renamed middleware, 673 lines of route classification), `server.js` + `scripts/prepare-standalone.mjs` (production standalone server), `prisma.config.ts` (Prisma CLI contract).

There is **one** deployable web process plus optional side services (`services/ai-gateway`, `mini-services/*`). There is no queue worker, no job runner and no object-store client in the production path.

---

## 2. AI subsystem (the part this programme extends)

```
src/lib/model-router.ts          privacy-first routing: privateData -> local only
        │
        ▼
src/lib/ai-gateway.ts   ──────────►  services/ai-gateway/gateway.mjs   (standalone HTTP, token-hashed app registry,
        │                             per-app data classification, local_only routes, circuit breaker, metrics port)
        ▼
src/lib/ai.ts                    native adapters: groq | openrouter | zai | local (OpenAI-compatible)
        │
        ▼
src/lib/ai-providers/resolve.ts  assertCloudInferenceAllowed() — PAID_AI_API_ALLOWED must be exactly "true"
src/lib/ai-providers/catalog.ts  66 catalogued provider entries with provenance + free-tier labels
```

Supporting domain layers:

* `src/lib/ai-workforce/*` — agent registry, runner, workflow engine, approvals, telemetry, **memory** (`memory.ts`), **knowledge/RAG** (`knowledge.ts`), security/redaction, deterministic engine.
* `src/lib/ai-agents/*`, `src/lib/agents`, `src/lib/brains` — role agents (counsellor, visa, marketing, social).
* `src/lib/ai-models/registry.ts` — model registry with versioned adapters and an evaluation-gate promotion path.

**Assessment (positive):** the fail-closed posture is unusually good and is unit-tested: cloud inference is denied unless an owner sets `PAID_AI_API_ALLOWED=true`; private-data tasks cannot route to a cloud provider; the gateway refuses to cross from a `local_only` decision to an external provider; provider keys are masked, never logged.

**Assessment (gap):** this is an *e-commerce CRM with AI features*, not an AI call center. Missing entirely: audio capture, VAD, streaming ASR, TTS, turn-taking, barge-in, telephony transport, call state machine, queues, supervisor monitoring. The only speech code (`src/lib/video-engine/captioning/videocaptioner.ts`) returns fabricated text (see `AI_AND_SPEECH_AUDIT.md` §3).

---

## 3. Layering and coupling

| Concern | Implementation | Quality |
| --- | --- | --- |
| AuthZ | `src/lib/access-control/central-security-engine.ts` (`validateRequestAccess`), `src/lib/rbac/*`, `withAuth` wrapper on API routes | Strong concept; enforcement per-route, so coverage must be proven per route |
| Tenant/branch isolation | `partnerId`, `officeId`, `branchId` string columns + app-level filters; `src/lib/access-control/object-scope.ts` | Works by convention; **no database-level tenant column or RLS** |
| Audit | `AuditLog`, `AwfAuditLog`, `AgentAuditLog`, `MarketingAuditLog`, `transactional-audit.ts` | Multiple parallel logs — needs a single query surface |
| Background work | `src/cron/*`, `scripts/cron-scheduler.sh`, `CronLock` model | Locked cron, no durable queue, no retry/dead-letter |
| File storage | `src/lib/storage/*`, `StudentDocument.storagePath`, local `storage/` volume | No object storage; no virus-scan hook in the upload path |
| Realtime | `src/components/realtime/*` | Polling/SSE only; **no WebSocket/WebRTC transport** |

The call-center programme needs a real audio transport. Nothing in the current stack provides one, so adding it is additive rather than a rewrite.

---

## 4. Structural risks

| # | Risk | Evidence | Impact |
| --- | --- | --- | --- |
| A-R1 | **One repository, six products, one deploy** — a change to marketing CSS and a change to payroll ship together | 462 pages, 1,088 API routes in one Next app | No blast-radius control; every release is a full regression surface |
| A-R2 | **610-model schema in one file** (514 KB) | `prisma/schema.prisma` | Client generation is slow; review is impractical; migration reasoning is error-prone |
| A-R3 | **Vendored `node_modules` tracked in Git** | 58,758 tracked files under `imports/alo-education-full/` | Secret scanning is explicitly excluded there; `git clone` ≈ 1 GB; supply-chain content is opaque |
| A-R4 | **214 MB of CSV exports in the repository root** | 111 files | Slows every operation; risks committing personal data |
| A-R5 | **Root directory holds 194 markdown reports** | `ls *.md` | Documentation is not discoverable; contradicts the `docs/` convention this programme must follow |
| A-R6 | **Route-level authorization by convention** | 1,088 handlers; `withAuth` used inconsistently (e.g. `src/app/api/crm/ucc/phone/route.ts` uses it, some handlers only check session) | A single missing wrapper is a data leak; needs a structural test |
| A-R7 | **Disabled-by-`throw` configuration files** | `ecosystem.config.cjs:1`, `Dockerfile` CMD, `deploy/ubuntu/restore.sh` | Correct intent, confusing execution: the file *looks* deployable |
| A-R8 | **Two Prisma schemas** (`schema.prisma`, verification mirror) | 610 models duplicated | Silent divergence risk; mitigated by `npm run awf:mirror` (verified in sync today) but **not enforced in CI** |

Recommendations: keep the monolith (it deploys and works today); add the call-center as **isolated services** with their own process boundary (see `docs/architecture/SELF_HOSTED_AI_CALL_CENTER.md`); enforce route authorization with a generated inventory test; untrack `imports/**/node_modules` and move CSVs to object storage in a separately approved change.

---

## 5. Dependencies that would block the programme

| Blocker | Why it matters | Mitigation |
| --- | --- | --- |
| No message broker / queue | Streaming call events, ASR partials and TTS jobs need ordered, retryable delivery | Add Redis (already a dependency: `ioredis@6`) + a worker process; keep the DB as the durable record |
| No WebSocket/WebRTC | Browser audio and supervisor live-monitoring require it | Add a small audio gateway (LiveKit or a purpose-built Node WS service) behind nginx |
| No object storage | Call recordings and knowledge PDFs cannot live on the app volume | Local MinIO (S3-compatible) or filesystem + checksum manifest |
| No embedding/vector path | Retrieval is lexical only | Reuse `AwfKnowledgeChunk.termIndex` as the baseline; add local embeddings behind a feature flag |
| Prisma engine binaries unavailable in restricted networks | Builds need `binaries.prisma.sh` | Vendor engine binaries into the build image and pin `PRISMA_ENGINES_MIRROR` |

---

## 6. Positive findings worth preserving

1. **Fail-closed AI policy** with tests (`src/lib/ai-providers/resolve.ts`, `tests/unit/ai-provider-policy.test.ts`).
2. **AI gateway as a separate, reviewable enforcement point** with its own documentation set (`docs/ai-gateway/`), Prometheus rules and Grafana dashboard.
3. **Permission-aware memory and knowledge layers already exist** (`src/lib/ai-workforce/{memory,knowledge}.ts` + `AwfMemory`, `AwfKnowledgeSource`, `AwfKnowledgeChunk`) — the call-center memory work is an *extension*, not a greenfield build.
4. **Recording-consent guard** with an explicit retention default (`src/lib/communication/call-consent.ts`).
5. **CI discipline**: pinned action SHAs, secret scan over tracked files, npm high/critical gate, migration-vs-schema drift check, disposable MySQL integration job with a booted-server smoke test.

These should not be replaced. Phase 5/6 work extends them.
