# ALO Education — Database Documentation

> Describes the **actual** database layer. MySQL 8 is the production database.

## 1. Engine & configuration

- **Provider:** MySQL 8 (`prisma/schema.prisma` → `datasource db { provider = "mysql" }`).
- **Client:** Prisma 6.19.x, generated for
  `native`, `debian-openssl-1.1.x`, `rhel-openssl-3.0.x`,
  `debian-openssl-3.0.x`, `linux-musl-openssl-3.0.x`.
- **Connection:** `DATABASE_URL` environment variable
  (`mysql://USER:PASSWORD@HOST:3306/DATABASE`).
- **Client verification:** `npm run db:verify-client`
  (`scripts/verify-prisma-client.mjs`) — currently **479 models**.

## 2. Schema overview (479 models)

Major model families (prefix = family):

| Family | Purpose | Examples |
|---|---|---|
| (core) | Users, auth, RBAC, notifications | `User`, `Role`, `Permission`, `AloAuditLog` |
| `Student*` | Student profile, education, passport, funding, preferences | `Student`, `StudentPassport`, `StudentFunding` |
| `Application*`, `AloApplication` | Applications, stage history, documents, timeline | `Application`, `ApplicationStageHistory`, `TimelineEvent` |
| `Crm*` | University/course data product | `CrmUniversity`, `CrmCourse`, `CrmCourseIntakeFee`, `CrmCourseRequirement`, `CrmScholarship`, `CrmRanking`, `CrmCommission` |
| `CrmSource*`, `CrmOfficialSourceCheck` | Source verification system | `CrmSourceVerificationEvent`, `CrmDiscoverySource` |
| `Marketing*` | Marketing OS (campaigns, content, RAG, social, lead scoring) | `MarketingCampaign`, `MarketingRagChunk`, `MarketingLead` |
| `Agent*`, `AiAgent*` | AI agent platform | `AiAgentRegistry`, `AgentRuntime`, `AgentMemory`, `AgentApprovalQueue` |
| `Visa*` | Visa case management, interviews, risk, reviews | `VisaCase`, `VisaInterview`, `VisaRiskAssessment` |
| `English*`, `MockTest*`, `Test*` | English test prep & mock testing | `EnglishTest`, `MockTest`, `TestResult` |
| `Alo*` (portal ops) | Employee/CRM operational records | `AloStudent`, `AloDocument`, `AloPayment` |
| HR/payroll, finance | Double-entry ledger, payroll controls | (see schema sections) |

## 3. Verification & data-quality architecture

University/course data is treated as a product with provenance:

- `verificationStatus` on data-carrying models. Values used in production:
  `VERIFIED`, `NEEDS_REVIEW` (≈ spec `UNDER_REVIEW`), `DISCOVERED_ONLY`
  (≈ spec `UNVERIFIED`), `HUMAN_APPROVED`.
- Source tracking: `sourceUrl`/`sourceName`, `verifiedAt`, `verifiedBy`,
  expiry, `CrmSourceVerificationEvent`, `CrmOfficialSourceCheck`,
  `ALO_SOURCE_PROVENANCE` CSVs at repo root.
- **Critical information (PTE/IELTS requirements, tuition, deadlines,
  scholarships, visa rules, application fees) is never presented as verified
  without a verified source** — enforced in UI components via verification
  badges and in `src/lib/source-verification.ts`.
- Data-quality tooling: `src/lib/data-quality-engine.ts`,
  `src/lib/duplicate-detector.ts`, `scripts/audit-database-counts.ts`.

## 4. Migrations

History (do not rewrite — see Part 40 policy):

```
20250915000000_hrms_enterprise
20260731000000_init_mysql
20260801000000_course_data_provenance
20260801024630_official_source_checks
20260913000000_content_management
20260913010000_auth_audit_compatibility
20260913020000_crm_communication_compatibility
20260913030000_keyword_and_lead_linkage
20260913040000_content_intelligence_compatibility
20260913050000_benchmark_capabilities
20260928000000_payroll_safety
```

Commands: `db:validate`, `db:migrate` (dev), `db:deploy` (production),
`db:push`, `db:reset`, `db:seed`.

**Rules**
1. Inspect applied history before schema changes.
2. Additive, backward-compatible migrations only.
3. Never destroy production data; never run destructive SQL without evidence.
4. Historical migrations are immutable.

## 5. Seeds

`prisma/seed-complete.ts` is the canonical self-bootstrap seed (idempotent):
15 employee users, 3 partners, demo student, roles/permissions, universities,
courses, scholarships, applications, tasks, threads, audit logs.
Additional domain seeds (`seed-universities`, `seed-public`,
`seed-marketing`, `seed-ai-agents`, `seed-knowledge`, …) are optional and
idempotent. `package.json#prisma.seed = "tsx prisma/seed-complete.ts"`.

## 6. Test databases

- Unit tests run **DB-free**; DB-backed integration tests **self-skip with
  reason** when no disposable `DATABASE_URL` is configured
  (`tests/helpers/test-database.ts`, `tests/unit/test-database-safety.test.ts`).
- CI **never** points tests at production (`tests/unit/prisma-config-compatibility.test.ts`).
