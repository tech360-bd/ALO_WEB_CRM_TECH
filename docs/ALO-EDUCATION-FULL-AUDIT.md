# ALO Education — full-repository audit

**Date:** 2026-09-30 UTC. **Repository:** engralaminn-collab/alo_education_z....ai. **Baseline:** df1961fd705e26e159d3a6c7b0aa5d7830f4d5ed. **Working branch:** arena/01a0f2b5-alo-education-z-ai.

## Decision before implementation

**NOT PRODUCTION READY.** This report was written before application-code changes. ALO Education remains its own product; no ALO Labs code or architecture will be imported. This is a repository-wide inventory and automated content inspection, with manual tracing of critical paths, **not a claim that every line or every feature has been manually verified**. The requested entire enterprise implementation cannot honestly be certified from this audit. Findings below separate evidence from unverified coverage. Subsequent repairs and fresh results belong in `ALO-EDUCATION-PRODUCTION-COMPLETION-REPORT.md`.

## A. Repository inventory and method

All **5,660 tracked files** were read for SHA-256 inventory; UTF-8 text was scanned in full, binaries inventoried by metadata/hash. Generated output and datasets are not treated as verified business operations. Appendices in `docs/audit/2026-09-30/`:

- `inventory.tsv`: exact baseline paths, byte sizes, SHA-256, line counts, inspection method.
- `routes.tsv`: all **1,192 page/layout/API files**, HTTP method, authentication *signals* and direct DB delegates. Signals are search hints, not authorization proofs.
- `models.tsv`: **479 Prisma models**, source line and field inventory.
- `duplicates.tsv`: **795 byte-identical groups / 2,438 redundant file instances**. Identical assets or exports are not automatically redundant business services.
- `findings.tsv`: all-file pattern matches with line numbers (not all confirmed bugs).
- `dependency-audit-baseline.json`: actual npm advisory response.

| Area | Files | Inspection / role |
|---|---:|---|
| Root | 319 | package/lock/config/env examples, Docker, deployment, historical audits, CSV/JSON university datasets, screenshots; approximately 353 MB |
| `src` | 1,877 | Active Next.js app, 819 API routes, portals, components, hooks, libraries, proxy, scheduler |
| `prisma` | 39 | 10,347-line MySQL schema, 11 SQL migrations + lock, 26 seeds |
| `tests` | 30 | 27 unit files, 2 integration files, 1 browser file |
| `scripts` | 108 | deploy/backup/restore, data collection/import, mass source-repair and report generators |
| `.github` | 4 | PR CI, production deploy, recovery, health/dependency monitoring |
| `deploy` | 8 | SQL export, Ubuntu systemd/Caddy and backup/restore scripts |
| `deploy-build` | 110 | Derived deployment snapshot; not authoritative source |
| `alo-education-web-crm-final` | 1,521 | Historical parallel application/export, older schema and outputs; not root deployment authority |
| `alo-cpanel` | 84 | PHP/PDO CRM, own config/auth/schema/installer; explicitly legacy per STATUS.md |
| `backend` | 28 | Python FastAPI AgentOS, SQLite workflow/file builder, local AI, separate approval/memory implementations and tracked bytecode |
| `mini-services` | 10 | Three Bun services (follow-up, SLA, university monitor), independent package manifests/locks |
| `database` | 5 | Additional SQL schema/index/view/FK exports |
| `docs` / `documentation` | 270 / 19 | Design/operations/import templates/integration docs and historical evidence; claims rechecked against source |
| `storage` | 918 | Generated task outputs and stored files; not runtime completion evidence |
| `public` | 178 | Public assets, PWA and images; private uploads must not use this tree |
| Other directories | 115 | `.repair-backup-20260819`, `.zscripts`, AUDIT*, agent-ctx, agents, audit, cron, data, delivery evidence, evidence, examples, external, public_html, test-results — included in file manifests |

### Active architecture

Root `package.json`: Next.js 16 / React 19 / Node >=22 / npm >=10; Prisma 6/MySQL; Tailwind/Radix; Vitest/Playwright. No workspace-based application consolidation. Root Next.js standalone is the deployed authority; preserve it rather than introduce another CRM. Three Bun services and Python/SQLite AgentOS are separate, inconsistent execution paths, not proof of one durable workflow engine.

Authentication: `src/lib/auth.ts` (NextAuth), `auth-middleware.ts` (PortalSession + NextAuth bridge), `student-auth.ts`, `unified-auth.ts`, `src/proxy.ts`. RBAC/data scope: `permissions.ts`, `data-scope.ts`, `access-control*`, `employee-access-engine.ts`, `rbac/*`. User/PortalUser and Student/AloStudent/PortalStudentProfile are parallel identities needing deliberate reconciliation. No consistent organization/company ownership foundation was found across the 479 models.

AI: `ai.ts`, `ai-gateway.ts`, `model-router.ts`, `ai-tool-loop.ts`, `agent-orchestrator.ts`, `tool-gateway.ts`, `ai-action-executor.ts`, `agentos.ts`, `ai-agents/*`, `brains/*`, Python backend, marketing agents. AiEmployee, AiAgent, AiAgentRegistry and AgentDefinition are different registries; AgentAuditLog references **AgentDefinition**, not AiEmployee. Departments have numeric default performance claims. Registered identities are not active workers.

Workflow: `automation-engine.ts` has real lead/scheduler handlers, plus `crm-automation.ts`, orchestrator, cron worker, n8n adapters, Python workflow runner. Workflow transactionality, retry durability, compensation and all trigger types are not unified or proven.

Integrations inspected through adapters/config references: Groq, OpenRouter, Z.ai, local AI, WhatsApp/Meta, email, SMS, 3CX/VoIP, UCC, Chatwoot, Nextcloud, Ghost, LanguageTool, social providers, university crawlers, video/Remotion/FFmpeg/ComfyUI and external repository bootstrap. An adapter existing is not credential configuration or successful delivery.

## B/D. Feature and missing-capability inventory

Labels: **REAL** = substantive implementation found (not necessarily live-verified); **PARTIAL** = some required behavior absent/unverified; **BROKEN** = concrete defect; **MISSING** = no implementation found after model/source/route searches; **MOCK/DEMO** = non-operational behavior; **DUPLICATE** = overlapping implementations; **BLOCKED** = external/runtime dependency prevents verification. Compound labels reflect mixed subfeatures. API paths below are source directories beneath `src/app/api`.

| Requirement family | Status | Evidence / implemented foundation | Missing or unverified requirements |
|---|---|---|---|
| Company/organization | PARTIAL / MISSING | EmployeeBranch, EmployeeDepartment, EnterpriseDepartment; HR/settings APIs | Tenant/company relationships and universal organization policies/approval hierarchy |
| CRM | REAL / PARTIAL / DUPLICATE | Lead, LeadForm, Task; `leads`, `crm`, `counselor`; crm-automation, scoring, duplicates | Complete transactional conversion/attribution/communications; cross-portal identity reconciliation; all action scope tests |
| Sales | PARTIAL | Services/packages, quotes, commissions and CRM pipeline surfaces | Full opportunity/contract/discount/proposal lifecycle and audited forecasting |
| Students | REAL / PARTIAL / DUPLICATE | Student + education/passport/English/funding/preferences, portals | Consistent authority across 3 student models; pre-departure/post-arrival end-to-end proof |
| Universities/courses | REAL / PARTIAL | CrmUniversity/CrmCourse, intakes/fees/requirements/scholarships/source checks; course finder | Stored imports are not all independently verified current requirements; unified provenance coverage |
| Course matching | REAL / PARTIAL | eligibility-engine, source-verification, finder/research | Full intake/budget/city/career/scholarship eligibility explanation and source freshness validation |
| Applications/admissions | REAL / PARTIAL / DUPLICATE | Application, B2bApplication, offers/CAS-I20-COE/deadlines/tasks, application-manager | Actual university submission requires integration; status persistence alone is not submission |
| Visa | REAL / PARTIAL | VisaCase/checklists/interviews/risk/sensitive reviews, visa APIs | Jurisdictional legal review, complete approval/expiry/escalation E2E |
| Documents | REAL / PARTIAL | storage-service, file-validator, document-security, StudentDocument/FileMetadata/OcrJob | Universal private storage/access/retention/version enforcement and real OCR provider verification |
| Finance | REAL / PARTIAL | Payment, commissions, payroll, quotation/PDF routes | Complete invoice/refund/expense/budget/approval reconciliation |
| Accounting | BROKEN / PARTIAL / MISSING | double-entry-ledger persists JSON in CrmAuditLog | Swallows failed posting, accepts invalid values, truncates aging at 5,000 and mixes journal/payment balances; no dedicated fiscal periods/reconciliation/immutable ledger foundation |
| HR/payroll/recruitment | REAL / PARTIAL | EmployeeHR, attendance/leave/payroll/HR APIs, recent payroll safety tests | Recruitment lifecycle, onboarding/training/performance/ownership E2E and accounting integration |
| Procurement | MISSING / PARTIAL | Vendor credit convenience in ledger; search did not locate purchase-order/request models | Vendor master, PO/request approvals, goods receipt, invoice matching, performance |
| Physical assets | MISSING | Brand/Marketing/VideoAsset are not employee physical assets | Assignment/location/maintenance/warranty/depreciation/disposal/audit |
| Marketing | REAL / PARTIAL / BLOCKED | MarketingCampaign/content/calendar/approval/social/UCC, provider adapters | Provider credentials, approval-safe scheduling and delivery/analytics verification per platform |
| Support | PARTIAL / BLOCKED | Conversations, SLA/escalations, knowledge, human channels | Complete ticket ownership/SLA lifecycle and verified omnichannel takeover |
| Enterprise workflow | BROKEN / DUPLICATE | automation-engine, CRM automation, orchestrator, Python/n8n/cron | One durable event/schedule/webhook/manual/AI engine with branch/parallel/timeout/retry/compensation semantics |
| AI workforce/employees | PARTIAL / BROKEN | AiEmployee/EnterpriseDepartment + skills/prompts/SOPs | Identity-to-runtime/tools/audit/memory mapping; full authority/constitution/budgets/KPIs; real concurrent capacity |
| 100 departments / ~2,000 AI workers | PARTIAL | Data-driven registry and seed counts | Not measured active capacity; config rollout only SEO; cannot infer deployment from seeds |
| Three-month specialization | PARTIAL / MISSING | Department config/rollout tests, knowledge/prompts | Datasets/benchmarks/versioned adaptation pipeline and month-specific measurable outcomes |
| AI model registry | MISSING / PARTIAL | Static department-model-config.ts / model-router | Persisted version/evaluation/dataset/deployment/rollback registry |
| AI runtime/tools | BROKEN / PARTIAL | Bounded model/tool loop; tool gateway + action executor | Fake external-send success; permissive tool access; non-existent DB field writes; fabricated completion; no organization isolation |
| Local/optional AI providers | BROKEN / PARTIAL | Local URL config, Python adapter; actual cloud clients | Gateway routes local on paper but calls cloud fallback function; provider pin/fallback privacy not enforced |
| Human approval | BROKEN / DUPLICATE | AiCommandAction, AgentApprovalQueue, ApprovalRequest, domain approval tables | Workforce approval API insufficient role gating, invalid update fields, fake resume success; complete expiry/escalation separation |
| AI memory | PARTIAL / DUPLICATE | AgentMemory, AiStudentMemory, MarketingAgentMemory, Python Qdrant | Department/company ACLs, source/version/retention and authorized retrieval |
| Knowledge | REAL / PARTIAL | KnowledgeBaseArticle/Document/Object/source chunks, knowledge-base-engine | Unified vector/hybrid ACL retrieval and approval/expiration enforcement |
| Workforce command center | BROKEN / PARTIAL | `/workforce/metrics`, ai-command-center UI | Counts/failure fallbacks and eligibility semantics unreliable; registered active status ≠ observed execution |
| Automation/AI quality | BROKEN | AutomationEvent + analytics implementations | Wrong denominator, failures sometimes counted as automation, errors silently zeroed; no measurable hallucination/model evaluation coverage |
| Security | PARTIAL / BROKEN | Sessions/RBAC/crypto/validation/rate limits/scoping utilities | Universal route/resource/tool authorization, tenant isolation, durable rate limits/audit, historical credential rotation proof |
| Database/migrations | BROKEN | 479 models, 11 migrations, SQL exports | Empty-DB replay fails statically; production ledger unknown; schema drift unverified |
| Coherent UI / portals | REAL / PARTIAL | Admin/CRM/student/counselor/employee/partner/application-manager pages | All requested navigation not unified; mock/static UI and ALO Labs text still occur |
| Analytics/BI | PARTIAL / BROKEN | DB queries in dashboard modules | Static/fallback claims, incomplete role-specific reports and validated financial totals |
| Production/backup/restart | BLOCKED / BROKEN | Docker/PM2/systemd/Caddy/GitHub deploy scripts | Failing deploy/rollback, worker placeholders, migration replay, backup restore and target-runtime access |
| Final student E2E | BLOCKED | Existing consultation persistence and negative visa tests; public browser tests | Entire lead→AI→matching→documents→offer→invoice→payment→visa chain is NOT verified |

## C/E. Confirmed errors and architectural risks

1. **P0 — destructive tests can wipe non-test data.** `tests/integration/consultation-workflow.test.ts` enables on any DATABASE_URL and calls unfiltered `deleteMany({})` on several business tables. Require separate test URL, explicit isolation check and test-owned cleanup before any DB execution.
2. **P0 — AI privacy/provider identity bypass.** `ai-gateway.ts::invokeProvider` passes only model to `ai.ts::generateText`, which cascades Groq→OpenRouter→Z.ai regardless of selected provider. Local route is not executed; audit labels route rather than actual provider. Department allowFallback=false cannot prevent this inner cascade. `model-router.ts` explicitly falls back private data to Groq. Config validation allows external confidential routing merely because LOCAL_AI_URL is set.
3. **P0 — tool/approval authorization incomplete.** tool-gateway trusts humanApproved boolean, has no authoritative agent/department/data authorization; sendExternalMessage returns sent:true without a network call. writeTimeline returns no-db/ok:true after invalid-schema insert. Workforce orchestrate/approval routes require login but not management permission. AgentAuditLog receives nonexistent `details` and unrelated AiEmployee IDs; errors suppressed.
4. **P0 — accounting false success.** postJournal swallows insert failure and returns a journal ID. Numeric/date/line validation incomplete; aging errors fall back to fabricated zero and double-count payment/journal entries.
5. **P1 — orchestration false completion.** Plans are discarded, failed scoring not propagated, invalid task/audit/queue fields hidden behind `any`; reads idempotency rows as completed regardless of success. HUMAN_REQUIRED returns COMPLETED. Missing RAG import is TypeScript-suppressed.
6. **P1 — automation metrics wrong.** automation-analytics includes HUMAN_REQUIRED in eligible denominator, humanRate = 100 − automation includes failed/pending tasks; exceptions return zero. automation-engine's second calculation counts failed AUTOMATED rows and assisted workflow rows as automated. Multiple incompatible formulae.
7. **P1 — database migration order.** First migration `20250915000000_hrms_enterprise` ALTERs EmployeeHR before `20260731000000_init_mysql` CREATEs it (including many same columns). Editing/reordering applied migration history without production ledger/backup is unsafe. No migrations will be rewritten in this pass.
8. **P1 — health lies/leaks.** `/api/health` responds 200 for missing DB and includes raw exception, runtime version/platform. Need readiness 503, non-sensitive public output, separate liveness semantics if monitoring needs it.
9. **P1 — workers not production execution.** src/cron/worker.ts backup, reports, email, expiry and analytics jobs only log; optional nonexistent cronLock fallback is not a distributed lock; canned university counts. Queue counter in Groq guard is not a durable job queue.
10. **P1 — fake performance defaults.** AiEmployee.successRate=95, EnterpriseDepartment coverage/pass metrics=90–100 by default. These must not be represented as measured production performance. No zero-rewrite of historic data without migration review.
11. **P1 — security/deployment scope.** Organization IDs absent across core entities. 197 API files have no simple auth marker; this includes public and differently-guarded endpoints, **not 197 proven vulnerabilities**. Requires per-resource review. Existing broad TS/lint suppressions mean clean gates do not prove soundness.
12. **P1 — deployment failure confirmed from GitHub.** Run 36434349342: validate/build success, Deploy via SSH failure, Automatic rollback failure. Run 36699387210: public production health failure. No target server, DB or provider credentials in this workspace. No live write/deploy attempted.
13. **P2 — dependency advisories.** npm audit: 6 vulnerable packages (4 high, 2 moderate), chains include deepmerge-ts→@prisma/config→prisma, brace-expansion, fast-uri, js-yaml. No forced major upgrade without compatibility proof.
14. **P2 — Prisma binary download blocked.** validate/generate fail reaching binaries.prisma.sh TLS (also reproduced using curl). Baseline typecheck passed, but subsequent inspection found an ungenerated `PrismaClient: any` placeholder. That result does not verify Prisma model types; fresh CLI validation is blocked. No TLS-verification bypass will be used.
15. **P2 — stale snapshots/duplicate implementation risk.** PHP legacy and nested final/deploy-build copies must not become active. Root Python backend independently uses SQLite and fake fallback outputs. Deletion/consolidation requires preserving any unique behavior, not mass removal.
16. **P2 — product naming drift.** Marketing AIEmployeeDepartmentView claims `Reuses ALO Labs infrastructure` in its department description. This is not an API integration or authorization to merge products.
17. **P2 — broad historical suppression.** Full content scan found 3,894 explicit-any signals, 58 TS/lint suppression signals, 62 TODO/FIXME, 5,289 mock/simulation/placeholder words (includes docs, form placeholders and educational mock examinations, which are not necessarily defects). Confirm specific production behavior before removal.

### Baseline checks actually executed

- `npm ci --no-audit --no-fund`: PASS, 1,175 packages; deprecation warnings fluent-ffmpeg/recharts.
- `npm ls --depth=0`: dependency inventory captured.
- `npm audit --json`: FAIL, counts above.
- `NODE_OPTIONS=--max-old-space-size=6144 npm run typecheck`: PASS (configured scope only, noImplicitAny=false; excludes scripts/prisma/backend).
- `npm run lint`: PASS with existing broad disabled rules. No new suppression is justified by this result.
- `npm test`: **275 passed, 7 skipped**, 28 files passed/1 skipped. Tests that mock providers/DB verify contracts, not real integration.
- `DATABASE_URL=<validation-only local test URL> npm run db:validate`; `npm run db:generate`: BLOCKED, engine download TLS failure. Validation URL is not a production database.
- `gh repo view`, `gh run list`, `gh run view ... --json jobs`: repository and failing deployment/health jobs verified. Checkout is shallow (single baseline); remote branches inspected without switching branch.
- Production build/browser/real database/AI worker/external delivery checks not yet completed at this audit checkpoint.

## Repair order and non-destructive constraints

1. Guard destructive tests; correct fail-open/false-success paths and provider privacy.
2. Consolidate automation calculation using existing AutomationEvent; unknown/empty is not proof of target achievement.
3. Correct health readiness and scoped access in touched endpoints; add behavioral regression tests.
4. Apply compatible dependency patches; attempt full build and browser tests; record all failures.
5. Freeze migration history; create static replay-order evidence and an operator runbook until production ledger + verified backup/restore + schema engine are available.
6. Expand enterprise capabilities only on audited relationships and working foundation. Missing ERP/AI features remain explicitly incomplete, not generated tables or buttons declared finished.

No production data, credentials, seed, payment, notification, university submission or infrastructure has been modified by this audit. All ALO Labs separation constraints remain in force.

## 2026-10-01 blocker-elimination checkpoint

See [REPOSITORY-BLOCKERS-2026-10-01.md](REPOSITORY-BLOCKERS-2026-10-01.md), [MIGRATION-SAFETY-REPORT.md](MIGRATION-SAFETY-REPORT.md) and [CRON-RECONCILIATION.md](CRON-RECONCILIATION.md). Email false-success repair is tested; the full 21-point request is NOT complete. Migration ordering, audit atomicity/payload storage, cron stubs/locking, ledger lifecycle, legacy approval race and dependency highs remain repository-side blockers alongside external hosting/database credentials. No deployment, production-data change or live verification occurred. This checkpoint supersedes any broader completion wording above.
