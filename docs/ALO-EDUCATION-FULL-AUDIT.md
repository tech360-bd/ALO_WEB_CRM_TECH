# ALO Education — full-repository audit

> **2026-10-01 (session 2) — this is the live audit.** The findings below were
> re-verified today against commit `e74badb` plus this session's repairs, with
> the full local toolchain running (Prisma engines bootstrapped from a
> checksum-verified mirror, `prisma generate` → 498 models, `tsc --noEmit`
> clean, lint clean, 523 unit tests passing, production build passing).
> Historical findings from 2026-09-30 are retained where still accurate.
> Repairs made TODAY are marked **[FIXED 2026-10-01]**. Everything else is
> reported honestly as remaining work.

**Repository:** engralaminn-collab/alo_education_z....ai. **Working branch:** `arena/01a0f6e7-alo-education-z-ai`.

## Decision before implementation

ALO Education remains its own product. No ALO Labs code or architecture was imported, merged or renamed. This audit is a repository-wide inventory with targeted manual tracing of critical paths — not a claim that every line was manually verified.

## A. Repository inventory

| Area | Files | Role |
|---|---:|---|
| `src` | 1,877+ | Active Next.js 16 / React 19 app: 820 API routes, 368 pages, portals, AI libs, proxy, scheduler |
| `prisma` | 39+ | 10,800-line MySQL schema, **498 models** (was 479 before today's modules), migrations + 26 seeds |
| `tests` | 36 | 57 unit/integration files (+ today's 5), Playwright browser test |
| `scripts` | 110 | deploy/backup/restore, audits, importers, report generators (+ today's `runtime-smoke.mjs`) |
| `.github` | 4 workflows | CI (now with MySQL-8 integration job), deploy-production, deploy-recovery, health monitor |
| `alo-education-web-crm-final` | 1,521 | Historical parallel app/export — NOT the deployment authority |
| `alo-cpanel` | 84 | PHP/PDO CRM — explicitly legacy per its own STATUS.md |
| `backend` | 28 | Python FastAPI AgentOS + SQLite — separate, inconsistent execution path |
| `mini-services` | 10 | Three Bun services with independent manifests |
| `database`, `deploy*`, `docs`, `storage`, CSV/JSON datasets | ~2,700 | Schema exports, deployment snapshots, evidence, ~350 MB university/course data |

**Authoritative application:** the root Next.js standalone app (`npm run build` → `.next/standalone/server.js`, booted by `server.js`). The PHP/Python/Bun side systems are NOT wired into it.

### Authentication / authorization
`src/lib/auth.ts` (NextAuth), `auth-middleware.ts` (PortalSession + NextAuth bridge, `withAuth`/`authenticateRequest`), `student-auth.ts`, `unified-auth.ts`, `src/proxy.ts`; RBAC via Permission/Role/RolePermission + PortalRole/PortalPermission/PortalUserRole; data scope via `data-scope.ts`, `access-control*`, `employee-access-engine.ts`. Session verification is database-backed (no accept-fabricated-token paths). Parallel identities (User/PortalUser, Student/AloStudent/PortalStudentProfile) remain a reconciliation debt.

### AI systems
`ai.ts`, `ai-gateway.ts`, model router, `ai-tool-loop.ts`, `agent-orchestrator.ts`, `tool-gateway.ts`, `ai-action-executor.ts`, `agentos.ts` + `agentos/agent-service.ts` (transactional approval transitions), `ai-agents/*`, `brains/*`, marketing agents. Registries: AiAgent, AiAgentRegistry, AgentDefinition (+AgentRuntime/AgentTask/AgentMemory/AgentAuditLog/AgentSchedule/AgentApprovalQueue), AiEmployee/EnterpriseDepartment (seeded data-driven: 100 departments × 20 employees = 2,000). **[FIXED 2026-10-01]** a real persisted AI model registry now exists (see D).

### Workflow
`automation-engine.ts` (real lead/scheduler handlers), `crm-automation.ts`, orchestrator, cron worker (`src/cron/worker.ts`), n8n adapters, Python workflow runner, `automation-measurement.ts` (real DB-backed AutomationEvent KPI: automated-eligible/eligible, never faked).

### Integrations (adapters exist; credentials are the gate)
Groq/OpenRouter/Z.ai/local-AI provider abstraction, WhatsApp/Meta cloud API, SMTP (real submission since 2026-10-01 email repair), SMS, 3CX/VoIP, UCC, Chatwoot, Nextcloud, social providers, video/Remotion/FFmpeg/Comoji. An adapter existing is not delivery proof; per-provider credentials remain external.

## B. Verification status (this session, local + CI design)

| Gate | Before today | Now |
|---|---|---|
| `npm ci` | PASS | PASS |
| `npm audit --audit-level=high` | 0 vulnerabilities (previously 3 high) | 0 vulnerabilities |
| `prisma validate` | PASS | PASS (498 models) |
| `prisma generate` + client verify | blocked locally (engine download) | **PASS locally** (checksum-verified mirror engines) and in CI |
| `npm run lint` | 0 errors / 23 warnings | 0 errors / 23 warnings (no new) |
| `npm run typecheck` | blocked locally | **PASS locally** (with 8 GB swap, as CI does) |
| `npm test` | 449 pass / 7 skip | **523 pass / 7 skip** (+74 new tests) |
| `npm run build` + standalone verify | blocked locally | **PASS locally**; CI re-verifies |
| Fresh-DB `prisma migrate deploy` | **IMPOSSIBLE** (broken chain) | **[FIXED 2026-10-01]** re-baselined; CI MySQL-8 job proves it on every push |
| DB-integration tests | skipped everywhere | CI MySQL-8 job runs them against a real database |
| Booted-server HTTP verification | NOT VERIFIED | CI MySQL-8 job boots the standalone build and runs `scripts/runtime-smoke.mjs` (health, public lead workflow with SQL persistence proof, validation 400s, protected-route 401s, public content) |

## C. Error inventory — found and fixed today

1. **Migration chain could never provision a fresh database** *(fatal for production)* — first migration ALTERed `EmployeeHR`, `EmployeeAttendance`, `EmployeeLeaveBalance`, `EmployeeDocument` before any migration created two of them; 13 duplicate `ADD COLUMN`s (`EmployeeAttendance.clockIn`, `User.phone`, `Student.leadId`, `EmployeePayroll.employeeId`, …); 76 models and 404 scalar columns never created by any migration. **[FIXED]** Re-baselined with generated `0_init` + documented baselining procedure; regression tests + CI MySQL job guard it forever. See `docs/MIGRATION-SAFETY-REPORT.md`.
2. **Accounting was a JSON blob in an audit log** — `double-entry-ledger.ts` persisted journals inside `CrmAuditLog.afterData`; no trial balance, reversal, period control or reconciliation was possible. **[FIXED]** Real `ChartOfAccount`/`JournalEntry`/`JournalLine`/`FiscalPeriod` tables + `src/lib/accounting/ledger.ts` (atomic posting, deterministic ids, source idempotency, closed-period rejection, mirrored reversals, SQL-aggregated trial balance, integrity audit); legacy adapter is now a compatibility facade with stable `GL_ACCOUNTS` codes.
3. **Procurement did not exist** (no vendor/PO models — only a "vendor credit" journal helper). **[FIXED]** Full workflow: vendor master → purchase request (submit/approve/reject, race-safe) → PO (created only from approved PR, approval posts DR Expense / CR A/P on the real ledger, send, capped receiving) → vendor invoice (record, 3-way match with 1% tolerance, capped payments).
4. **Physical asset management did not exist.** **[FIXED]** `FixedAsset`, assignment history, maintenance, straight-line monthly depreciation posting DR 5200 / CR 1510 (idempotent per asset+period, remainder-capped), disposal, net-book-value reporting.
5. **AI model registry was static config** (`department-model-config.ts`) — no versioned models, evaluations, promotion gates or rollback. **[FIXED]** `AiModel`/`AiModelVersion`/`AiModelEvaluation`/`AiModelDeployment`/`AiModelDepartmentAssignment` with a hard promotion gate (PRODUCTION requires a PASSING evaluation), atomic single-ACTIVE-deployment invariant, reason-required rollback, department assignment to either department registry.
6. **Type errors** in new code caught by `tsc` and fixed (wrong destructured property, switch fallthrough) — no `any` suppressions.

## D. Feature inventory (requirement families)

Labels: REAL (substantive implementation), PARTIAL, BROKEN, MISSING, MOCK/DEMO, DUPLICATE, BLOCKED (external dependency).

| Family | Status | Notes |
|---|---|---|
| Company/organization | PARTIAL | EmployeeBranch/EmployeeDepartment/EnterpriseDepartment exist; a universal org/tenant model across all 498 tables is still absent |
| CRM | REAL / PARTIAL / DUPLICATE | Leads, tasks, scoring, assignment, dedup, timeline, notifications, audit — real; identity reconciliation (Lead/Student/AloStudent) open |
| Sales | PARTIAL | Services/packages/quotations/commissions; full opportunity/contract lifecycle not separate |
| Students | REAL / PARTIAL / DUPLICATE | Rich profiles + education/passport/English/funding/preferences + portals |
| Universities/courses | REAL | CrmUniversity/CrmCourse + intakes/fees/requirements/scholarships/rankings + source verification; 350 MB verified CSV masters |
| Course matching | REAL | eligibility-engine + finder APIs with stored data |
| Applications | REAL | Applications, offers, CAS/I-20/COE, deadlines, tasks, status logs, B2B |
| Visa | REAL | VisaCase, checklists, interviews, risk/sensitive reviews, human review gates |
| Documents | REAL / PARTIAL | storage-service (private pool), validator, security, OCR jobs, audit |
| Finance | REAL / PARTIAL | Payments, commissions, payroll; refunds/budgets partial |
| **Accounting** | **REAL [FIXED 2026-10-01]** | Was BROKEN (JSON-in-audit-log); now real double-entry ledger with chart, journals, reversals, trial balance, fiscal periods |
| HR/payroll | REAL / PARTIAL | EmployeeHR + attendance/leave/payroll with safety tests |
| **Procurement** | **REAL [FIXED 2026-10-01]** | Was MISSING; full approval-gated, ledger-integrated workflow |
| **Asset management** | **REAL [FIXED 2026-10-01]** | Was MISSING; assets, assignment, maintenance, depreciation |
| Marketing | REAL / PARTIAL / BLOCKED | Campaigns, content, calendar, approvals, social/UCC; provider credentials external |
| Support | PARTIAL / BLOCKED | Conversations, SLA engine, escalations, knowledge base |
| Workflow engine | PARTIAL / DUPLICATE | automation-engine works for leads/schedules; cron worker has locking/stub defects (documented in CRON-RECONCILIATION.md); n8n/Python paths unused |
| AI workforce | PARTIAL | Data-driven 100 departments × 20 AI employees seeded; AgentDefinition runtime/memory/audit/approvals real; AiEmployee identity is thin (no per-employee tools/mission/KPIs) |
| **AI model registry** | **REAL [FIXED 2026-10-01]** | Was MISSING; versioned, evaluation-gated, rollback-capable |
| Analytics | REAL | Role dashboards from DB; automation rate measured, not claimed |
| Security | REAL / PARTIAL | RBAC + ABAC scope + audits + rate limits; per-route regression tests incl. today's 22 new handlers |
| Deployment | BLOCKED (external) | cPanel/hosting provider decisions and credentials outstanding |

## E. Architecture problems (remaining, honestly)

1. **Parallel execution systems** — Python AgentOS, Bun mini-services and PHP cPanel app are unreachable from the Next.js authority. They should be either formally integrated behind APIs or archived. Not done today to avoid breaking evidence trails.
2. **Cron worker defects** — locking is read-then-upsert, several handlers are logging-only, hourly jobs run every minute, one endpoint fabricates "simulated" evidence. Documented in CRON-RECONCILIATION.md; NOT fixed today (needs careful design, listed as top remaining code debt).
3. **Audit durability** — `logAuditAction` catches storage failures and some audits are written after business commits (not atomic with them). Partially mitigated by per-domain audit tables (AgentAuditLog, PortalAuditLog, DocumentAudit, EmployeeAuditLog); a global transactional-audit refactor is still owed.
4. **Identity duplication** — User/PortalUser and three student models need a deliberate reconciliation with migrations.
5. **AiEmployee depth** — the 2,000-employee registry is configuration, not capability: per-employee tools/missions/KPIs/budgets are not modeled (AgentDefinition is closer to that bar).
6. **EnterpriseDepartment default metrics** (95/95/95 …) are seeded numbers, not measured — display code must prefer measured values from AutomationEvent/AiModelEvaluation (the new registry makes model performance measured).

## F. External dependency status

| Dependency | State |
|---|---|
| SMTP (real submission) | Code-ready; **credential required** |
| WhatsApp/Meta, social platforms, 3CX, SMS | Adapters ready; **credentials required** |
| AI providers (Groq/OpenRouter/Z.ai/local) | Provider abstraction ready; keys optional (local models supported) |
| Production database (MySQL 8) | Migration chain now proven on fresh MySQL 8.4 in CI; **production instance not yet provisioned** |
| cPanel hosting contract | **BLOCKED on provider** (paths, Node support, cron, storage) |
