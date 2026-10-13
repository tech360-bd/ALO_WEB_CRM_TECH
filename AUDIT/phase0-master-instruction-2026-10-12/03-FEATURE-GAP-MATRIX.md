# 03 — Feature Inventory and Gap Matrix

**Date:** 2026-10-12 · **Commit:** `be9081f` · Requirement source: Master Implementation Instruction §3–§17.
**Status legend:** PASS (verified) · PARTIAL · FAIL (tested & failed / absent when required) · NOT VERIFIED · BLOCKED (external dependency).
"Evidence" paths are relative to the repository root. "Gap / next action" items are carried into `05-IMPLEMENTATION-PLAN.md`.

## §3 Public website

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Required pages (home…policies) | PASS | `src/app/**` 407 pages; `AUDIT/ARENA-PAGE-INVENTORY.csv` | — |
| Study destinations (UK/CA/AU/IE/NZ/US/DE/…configurable) | PARTIAL | `src/app/destinations/**`, `CountryPage` family, `src/lib/country-destinations-data.ts`, admin `/admin/destinations` | Verify every destination's content is source-linked (no invented fees/rankings) — ties to §3 "never invent" rule and data-quality programme |
| Verified info only (no invented partnerships/fees/guarantees) | PARTIAL | catalogue policy + guards; `AUDIT/course-finder-2026-10-12/UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md` | Verified data import pipeline (Phase 2); keep synthetic guards |
| CMS: draft/review/publish, SEO, canonical, social meta, sitemap/robots, alt text, redirects, version history, attribution | PARTIAL | `CmsRevision`, `CmsManagedContent`, `ContentPublication`, admin `/admin/seo`, `/admin/builder`, `sitemap.ts`, `robots.ts` | Evidence pass: scheduling, redirect management, version-history UX in staging |
| Bangla + English content | PARTIAL | `src/i18n/` present | Coverage audit of content pairs; Bangla AI quality evaluation (§10/§17) |
| Course Finder (COURSES + UNIVERSITIES modes, levels Foundation→PhD) | PASS (code) | `EnhancedCourseFinder`, `/api/course-finder/*`, `public-catalog.ts` filters | Data readiness (B5) is the limiter |
| Results/detail fields + source/verification dates + Apply Now gating | PASS (code) | course/university pages + `public-content-page-policy` | Apply-Now "open for applications" gating needs a verified-intake source (data) |

## §4 Student portal

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Registration/login/profile/education/English test/preferences/saved items | PASS | `src/app/student/**` (46 pages), `Student*` + `PortalStudent*` models | Identity-model reconciliation (B11) |
| Applications + status + history + checklist + notifications | PARTIAL | `Application`, `ApplicationStageHistory`, `PortalStudentApplication`, `B2bApplication`, `ApplicationStatusLog` | Verify configurable stages (§4's 18 stages are labelled non-mandatory sequence) via admin config UI evidence |
| Document upload/replacement with review | PARTIAL | `StudentDocument`, `DocumentVersion`, student/documents pages | Malware scan (D3) + download-authz proof (B3) |
| Counsellor communication, appointments, support, consent settings | PASS | `CommunicationThread`, `Appointment`, `CommunicationConsent`, `ConsentRecord` | — |
| Isolation: no cross-student access via URL/ID tampering | PARTIAL | `tests/unit/legacy-lead-surfaces.test.ts`, `tests/integration/communication-ownership.test.ts`, access-scope | Run dedicated negative suite in staging; add cross-tenant matrix cases to CI |
| Forms: public enquiry → lead/draft; authenticated application; server-side validation; duplicate protection | PASS (code) | `Lead`, `LeadForm`, `FormSubmission`, `ImportStagingStudent` | Duplicate-submission rate-limit evidence |

## §5 B2B partner portal

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Registration/approval, org profile, compliance docs, representatives, agreements/expiry | PARTIAL | `PartnerProfile`, `PartnerUserSeatRequest`, `PartnerPackage*`, partner pages | Agreement-expiry reminder job evidence |
| Assigned students/apps, docs, enquiries, reporting, tickets, audit | PASS (code) | partner + partner-admin pages, `PartnerLead`, `CrmCommission` | Commission reporting "if contractually applicable" — confirm with owner |
| Tenant isolation (A never sees B) + staff-approved transfers | PASS (locked) | `tests/integration/partner-b2b-security.test.ts`; `docs/B2B_PARTNER_TENANT_SECURITY.md` | Staging re-run; ownership-transfer approval flow evidence |

## §6 Staff workspace and HR

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Employee directory (ID, dept, manager, status, permissions, training) | PASS | `Employee`, `EmployeeProfile`, `Hrm*` family, `/admin/employees`, employee portal (38 pages) | — |
| Lead assignment, case management, tasks, queues, SLA/escalation | PASS | `Lead`, `CounselorTask`, `SlaPolicy`, `SlaEvent`, `EscalationEvent`, `/admin/sla-monitor` | — |
| HR privacy (no salary/ID/disciplinary to ordinary staff) | PARTIAL | `EmployeeSalary`, `EmployeeSecurityEvent`, permission engine; `ALO_EMPLOYEE_ACCESS_SYSTEM_CHECK_REPORT_20260914.md` | Permission-matrix evidence pass against §6 list (Phase 1) |
| Proportionate monitoring | PARTIAL | `EmployeePerformance`, `CounselorResponseMetric`, `EmployeeLoginLog` | Written policy + scope review (Phase 1 deliverable) |

## §7 Central document management

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Cross-record Document Center (student/partner/employee) | PASS | `Document`, `DocumentVersion`, `StudentDocument`, `EmployeeDocument*`, `OfficialDocument`, `DocumentChecklist` | — |
| Workflow: authz check → validate → **malware scan** → private store → metadata/version → review → notify → audit | PARTIAL | models + `/admin/document-security`, `DocumentAudit`, `DocumentSecurityIncident` | **Build malware-scan stage (D3/B2)**; verify each workflow step end-to-end in staging |
| Statuses (uploaded…archived) | PASS (code) | status strings on document models | Confirm retention policy job (`Archived under retention`) |
| Private short-lived signed URLs or authenticated download service | NOT VERIFIED | no presign code found (B3) | Verify/prove download authorization; add signed-URL or explicit authenticated service tests |
| Encryption at rest/transit, limits, retention, access logs, backup | PARTIAL | TLS at edge (Caddy/nginx); `FileEvent`, `FileMetadata` logs | At-rest encryption depends on host (BLOCKED B9); retention/backup evidence Phase 6 |

## §8 WhatsApp and social media

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Employee communication profiles (work number, ownership, permissions) | PASS | `EmployeeCommunicationProfile`, `WhatsAppOfficialNumber`, `WhatsAppNumberAssignmentAudit`, `SocialAccountOwnership` | — |
| WhatsApp architecture distinctions (individual / business / shared inbox) | PASS (code) | `whatsapp-cloud-api.ts`, `wacrm-broadcast.ts`, `chatwoot-inbox.ts`, `Ucc*` unified comms | Live Business account connection NOT VERIFIED (B12) |
| No password/cookie collection for WhatsApp | PASS | design docs; no such fields found | — |
| Social publishing honesty (handle ≠ permission) | PASS (post-`be9081f`) | partner-marketing `capabilities` + refusals; `SocialIntegration`, `ConnectedAccount` | Extend capability-honesty pattern to all remaining social surfaces (inventory task) |
| Workflows (notifications, reminders, assignment, delivery status, history) | PARTIAL | `WhatsAppFollowUpSchedule`, `WhatsAppRetryQueue`, `NotificationEngine`, `CommunicationLog` | End-to-end delivery/failure test with provider sandbox |
| Consent, opt-out, frequency limits; transactional vs bulk separation | PARTIAL | `CommunicationConsent`, `EmailCampaign` vs `EmailOutboxItem`, `Broadcast`+`BroadcastRecipient` | Frequency-cap policy + evidence (Phase 3) |

## §9 AI Command Center

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Core dashboard (agents, departments, tasks, models, latency, resources, approvals, security) | PARTIAL | `/admin/ai-command-center`, `/admin/agent-center`, `/admin/ai-monitor`, `AgentOSExecution`, `AutomationMetric` | §9 "no fabricated metrics" review: all counts derived from event tables; label estimates (Phase 4) |
| 100 departments × 2,000 agents registry | PARTIAL | `AiEmployee`/`EnterpriseDepartment` seed (100×20), `agents/agent_registry_1020.json` (2000), `Awf*` seed | **Consolidate registries (C1)** before any new registry work |
| Department fields (owner, skills, tools, workflows, data policy, enable/disable) | PASS (code) | `AwfDepartment`, `AwfSkill`, `AwfTool`, `AwfWorkflow`, grants | Reconcile across registry families |
| Agent fields (instructions/prompt version, schemas, timeout/retry, resource limits, approvals, versions, health, logs, evals) | PASS (code) | `AwfAgent`, `AwfAgentVersion`, `AwfPromptVersion`, `AwfTestCase/Result`, `AgentMemory`, `AgentSchedule` | Evaluation history populated by Phase 4/5 protocol |
| Shared execution pool (not 2,000 processes) | PASS (design) | `ai-workforce/runner.ts` shared pool + concurrency limits | Load test in Phase 5 |
| Navigation (Overview…Configuration) | PASS | admin AI pages + super-admin/ai-workforce | — |

## §10 AI model strategy (no paid provider API)

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Provider-independent interface | PASS | `ai-gateway.ts`, `text.ts`, `output-schemas.ts`, runtimes abstraction | — |
| Self-hosted open-weight runtime support (Ollama/vLLM) | PASS (code) | `ai-workforce/runtimes.ts` `local-openai` | Actual deployment + health NOT VERIFIED (B10) |
| **No paid LLM API calls in normal operation** | PARTIAL | local-first routing exists; **cloud keys still configurable** (B1) | **Enforcement:** fail-closed policy switch (`ALO_AI_ALLOW_PAID_AP=0` default), CI check that production env ships without paid keys, license register |
| Model selection evaluation (Bangla/English, JSON, RAG, tool-use, licenses) | NOT VERIFIED | `AiModelEvaluation`, `AwfTestCase` scaffolding | Phase 4 evaluation dataset + report (deliverable 15) |
| Deterministic fallback | PASS | `deterministic-engine.ts`, model-router `fallback`, `synthetic-data-guard.ts` | — |
| Cost separation (infra vs API) | NOT VERIFIED | — | Add to finance reporting taxonomy (Phase 4) |

## §11 AI orchestration across modules

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Task flow 1–12 (validate → queue → route → scoped tools → validate result → approval → apply → retain) | PASS (code) | `ai-workforce/{api,runner,workflow-engine,validation,approvals,audit}.ts` | End-to-end pilot evidence (Phase 4 exit condition) |
| Example departmental workloads (research/CRM/application/marketing/engineering) | PARTIAL | `ai-agents/*`, `research/*`, marketing agents, `AI-AUTOMATION-REPORT.md` | Wire each to pilot tasks with sources |
| Restrictions (no DNS/production, no bulk w/o consent, no approvals of admissions/visas, no unrestricted shell) | PARTIAL | `ai-safety.ts`, `security.ts`, tool grants, `ConstitutionalRule`, `GlobalAiPause` | Adversarial test suite (§17 AI tests) — D8 |

## §12 Knowledge base and retrieval

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Approved sources (university/course records, policies, playbooks, docs, guidelines) | PARTIAL | `KnowledgeBaseArticle/Document/Category`, `AwfKnowledgeSource/Chunk`, `MarketingRagSource/Chunk`, `TrainingMaterial` | Source approval workflow evidence |
| **Permission enforcement at query time** | NOT VERIFIED | `knowledge.ts` has access hooks; no dedicated isolation tests found | Build cross-role retrieval isolation tests (Phase 4) |
| Provenance (URL, retrieval time, verification status, version) | PARTIAL | `SourceSnapshot`, `VerifiedMetric`, `OfficialSource` | Enforce provenance-on-every-result in output schemas |
| Untrusted content (prompt-injection resistance) | NOT VERIFIED | — | §17 injection tests (Phase 4) |

## §13 Security, privacy, access control

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Documented permission matrix vs roles | PARTIAL | `ROLE_INVENTORY.csv`, `/admin/permission-matrix`, `/admin/role-permissions`, `PermissionPackage` | Reconcile matrix with §13 role list + live DB roles (Phase 1) |
| Password hashing, sessions, revocation | PASS | NextAuth credentials, `PortalSession`, `LoginAttempt`, `PasswordResetToken`, `OtpCode` | — |
| MFA | FAIL (absent) | no TOTP code found (B4) | Decide mandate level; implement TOTP for privileged roles (Phase 1/2) |
| Server-side authz + object-level checks | PASS (mostly) | `withAuth`, access engines, 79 catalogue-security tests | ~85 proxy-only routes (B7) — handler-level guard sweep |
| CSRF/origin, input validation, output encoding | PASS (pattern) | `mutationOriginAllowed`, zod schemas on hardened routes | Sweep: apply `mutationOriginAllowed` inventory-wide (Phase 1) |
| Rate limiting | PARTIAL | `src/lib/rate-limiter.ts`, OTP engine | Verify coverage on all public forms/APIs |
| Secure cookies/headers/CORS | PARTIAL | `next.config.ts`, proxy | Evidence pass vs §13 checklist in staging |
| Secret management | PARTIAL | `.env.example` (no real secrets); `SECRET_SCAN_REPORT.md` | CI secret-scan gate (Phase 1) |
| Upload validation + **malware scanning** | PARTIAL | size/type checks exist in places | **D3 build** |
| Audit logs for sensitive ops | PASS | audit model families (see map §3) | — |
| Dependency/vulnerability checks | NOT VERIFIED | CI quality-gates | `npm audit`/dependency-review gate evidence |
| Backup/recovery + retention/deletion | PARTIAL | `backup.sh`/`restore.sh`, `CommunicationDeleteRequest`, retention models | Restore-test evidence (Phase 6) |
| AI agents inherit scoped permissions | PASS (design) | `rbac.ts`, tool grants, `AiCommandAction` | Adversarial proof (D8) |

## §14 MySQL and data management

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Verify actual production engine/version/schema first | NOT VERIFIED | compose = MySQL 8; `docs/DATABASE_RECONCILIATION.md` | **Phase 1 task 0:** read-only production DB probe (owner-approved) |
| Preserve records; identify duplicates/inconsistencies | PARTIAL | `DataConflict`, `DataQualityScore`, `/admin/data-review/duplicates` | Merge workflow (B13) + read-only VERIFIED-data audit (D6) |
| FK/index documentation | PARTIAL | `prisma/schema.prisma` + `ALO_DATA_DICTIONARY.md` | Generate FK/index report from live DB |
| Transactions, versioned migrations, isolated migration tests, rollback, backups + restore tests | PARTIAL | `prisma/migrations`, CI mysql job, backup scripts | Migration on isolated copy + restore-test evidence (Phase 6) |
| No raw credentials/tokens in ordinary tables | PASS (pattern) | provider tokens modelled (`SocialConnectedAccount` masked fields per UI contract) | Table-level secret sweep (Phase 1) |
| Unsafe defaults | FAIL→pending migration | `CoursePage.verificationStatus` default `VERIFIED` (D1) | Authorised migration + backfill audit |

## §15 Email and domain preservation

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Keep existing provider/mailboxes; no DNS/MX changes in routine dev | PASS (policy) | no DNS tooling in repo | Enforce via Phase 6 cutover checklist |
| Pre-cutover DNS/SPF/DKIM/DMARC documentation + single SPF | NOT VERIFIED | — | **Phase 6 gate:** capture DNS before any cutover |
| SMTP config acquisition, secure storage, send/delivery/reply/bounce tests | PARTIAL | `EmailOutboxItem`, `EmailEvent`, `EmailSuppression`, `ProviderErrorLog` | Live SMTP test (B12) |
| Transactional templates (enquiry, receipt, missing docs, reset, appointments) | PASS (code) | `CommunicationTemplate`, email templates | Delivery-log evidence |

## §16 Reporting and analytics

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Dashboards listed (leads, applications, counsellor, partner, docs, data quality, comms, AI, security) | PARTIAL | `/admin/reports`, `/crm/**` dashboards, `WeeklyReport`, `MarketingReport`, `VerifiedMetric`, `/admin/data-coverage` | Metric-definition review: derived-only, calculation rules documented, period labelled (Phase 2/4) |
| No sensitive data in aggregates beyond viewer rights | PARTIAL | `SensitiveDataRevealLog`, access engines | Aggregate-scope tests |

## §17 Testing and acceptance

| Requirement | Status | Evidence | Gap / next action |
|---|---|---|---|
| Isolated test env + test data | PASS | vitest fakes/harnesses; CI mysql-integration job | — |
| App test list (auth, RBAC, isolation, lifecycle, uploads, email, integrations, rate-limit, responsive, a11y, SEO) | PARTIAL | 177 test files; today 1911 passing | a11y + responsive + SEO rendering suites thin — Phase 2 additions |
| AI test list (models, Bangla/English, structured output, tools, retrieval, injection, isolation, retry, approvals, exhaustion, rollback, reproducibility) | PARTIAL | `AwfTestCase/Result`, `ai-workforce/validation` | Build the AI evaluation suite + dataset (Phase 4) |
| Release evidence format (command, commit, result, logs, actually executed) | PASS (practice) | `AUDIT/*` evidence folders | Keep template for all future runs |
| Production acceptance gates | NOT VERIFIED | — | Phase 6 checklist incl. backup restore + sign-off |

---

### Aggregate counts (this matrix)

- **PASS:** 22 requirement-clusters · **PARTIAL:** 38 · **FAIL (absent/unsafe):** 3 (MFA, malware scan, unsafe defaults) · **NOT VERIFIED:** 15 · **BLOCKED:** 2 (Hostinger facts, this-sandbox Prisma engines).

The three FAIL items are all small, well-scoped builds/migrations; the NOT VERIFIED items are mostly evidence work on real infrastructure. No requirement cluster is architecturally blocked except where noted.
