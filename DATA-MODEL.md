# ALO EDUCATION — DATA MODEL

**Schema:** `prisma/schema.prisma` · **Models:** 548 · **Enums:** 0 · **Database:** MySQL 8
**Migrations:** `prisma/migrations/` (latest: `20261019000000_regulatory_rule_versioning`)

---

## 1. Conventions that apply to the whole schema

These are existing repository conventions. New tables follow them rather than introducing a second
style, because a mixed schema is harder to reason about than a consistent imperfect one.

| Convention | Detail | Consequence |
|---|---|---|
| **No Prisma enums** | `grep -c "^enum "` returns **0** across 548 models | Statuses are free-text `String`. The database will accept any value; validity is enforced only in application code. See §6. |
| **Money is `Float`** | Not `Decimal` | Rounding risk in financial aggregation. `src/lib/accounting/ledger.ts` is written to be cents-safe to compensate. |
| **Primary keys** | `String @id @default(cuid())` | Case-sensitive. Never case-fold an id — see `ruleKeyFor`. |
| **JSON in `String` columns** | Arrays/objects stored as JSON text in `TEXT`/`LONGTEXT` | Every reader must tolerate corrupt JSON. New libs parse defensively and degrade rather than throw. |
| **Audit columns** | `createdAt`, `updatedAt`, usually `createdBy`/`updatedBy` | Required by s104. |
| **Soft relationships** | Many id columns are **not** foreign keys | e.g. `PortalNotification` has `userId`/`studentProfileId` with no FK. Orphan rows are possible; deletes are not cascaded. |

### MySQL 8 literal-default trap

A `TEXT`/`LONGTEXT`/`JSON`/`BLOB` column **cannot** take a literal default. MySQL rejects

```sql
`payload` LONGTEXT NOT NULL DEFAULT '{}'      -- ERROR 1101
```

and requires Prisma's expression form:

```sql
`payload` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}')   -- correct
```

This failure is **invisible on an existing database**, because every migration statement is
`CREATE TABLE IF NOT EXISTS` and MySQL skips definition processing when the table exists — so it only
breaks a fresh install. `tests/unit/mysql-migration-compat.test.ts` guards the whole chain statically
and runs on every push. It caught 24 such columns in new work before they shipped.

---

## 2. Canonical entities (s103, s104)

The catalogue models are **not** named `University` / `Course`. Using the wrong name silently queries
nothing.

| Concept | Canonical model | Line | Notes |
|---|---|---|---|
| University | `CrmUniversity` | 1612 | `universityId` is `@unique`; `id` is the cuid |
| Course | `CrmCourse` | 1687 | |
| Course requirement | `CrmCourseRequirement` | 1817 | |
| Intake & fee | `CrmCourseIntakeFee` | 1782 | Also `CourseIntake` |
| Scholarship | `CrmScholarship` | 1855 | `verificationStatus` gates trust |
| Commission rule | `CrmCommission` | 2006 | |
| Country | `Country` | 3340 | Plus `CountryEntryRequirement`, `CountryEnglishTest`, `CountryVisaStep`, `CountryWorkRight`, `CountryFaq`, `CountrySource` |
| Visa | **`VisaCase`** | 1126 | There is **no** `VisaApplication` model |
| Lead | `Lead` | — | `leadId` `@unique`, `status` defaults `NEW` |
| Commission | `Commission` | — | `commissionCode` `@unique` |
| Partner | `PartnerProfile` | 3120 | **`partnerId` is the tenant key and is NOT unique** |

`Application.safeStatus` is the **only** externally-shareable status projection. `stage` and
`reviewStatus` are internal and must never be returned to a student, partner or university account.

### Visa (`VisaCase`) key fields

`caseCode`, `studentId`, `destinationCountry`, `currentStage`, `readinessScore`, `riskLevel`,
`isUrgent`, `deadline DateTime?`, `counselorId`, `visaOfficerId`.

### Documents

Documents have **no expiry-date columns**. `ApplicationDocument.status` includes an `EXPIRED` value,
and `PortalStudentProfile.passportExpiry` is **free text**. Expiry logic therefore has to parse
strings defensively and must treat an unparseable date as unknown, never as urgent.

### Notifications — six separate models

| Model | Line | Notes |
|---|---|---|
| `Notification` | 1465 | |
| `PortalNotification` | 3316 | `userId`, `studentProfileId`, `title`, `message`, `type`, `isRead`, `actionUrl` — **no FK** |
| `ApplicationNotification` | 5674 | Columns are **only** `id`, `applicationId`, `recipientType` (def `STUDENT`), `recipientId`, `channel` (def `portal`), `templateName`, `message`, `status` (def `PENDING`), `sentAt`, `createdAt`. There is **no** `type`, `title` or `audience` column. |
| `NotificationEngine` | 9136 | |
| `StudentNotification` | 9484 | `priority` ∈ `LOW|NORMAL|HIGH|URGENT` |
| `HrmNotification` | 9999 | |

---

## 3. Tables added by this work (15)

### Platform control plane — `20261018000000_platform_control_plane` (13 tables, 5 FKs, 0 destructive)

| Table | Spec | Purpose |
|---|---|---|
| `FeatureFlag` | s117 | Persisted module gates. Fail closed; bootstrap **disabled** at 0% rollout. |
| `FeatureFlagAudit` | s117, s65 | Append-only change history with actor and reason. |
| `WebhookSubscription` | s77 | Outbound target, event list, encrypted secret, tenant scope. |
| `WebhookDelivery` | s77 | One row per attempt. `UNIQUE(subscriptionId, eventId)` gives idempotency. |
| `ParentGuardian` | s13 | Parent record with `accessLevel`, `portalEnabled`, channel prefs. |
| `ParentGuardianConsent` | s67 | **Append-only.** Latest row per type governs; revocation wins. |
| `ParentGuardianPaymentResponsibility` | s13, s26 | Amount, paid, scope, status. |
| `UniversityPortalAccount` | s39 | Binds a login to exactly one `universityId` — the tenant anchor. |
| `UniversityPortalActivity` | s39, s65 | Audit of every portal action. |
| `ApplicationRiskAssessment` | s111 | Scored snapshot: level, score, factors, missing items. |
| `StudentSuccessAssessment` | s112 | Scored snapshot with component weights. |
| `AttentionSnapshot` | s108 | Persisted "what needs attention" report for trend analysis. |
| `OpportunityGraphEdge` | s110 | Materialised graph edge. `UNIQUE(sourceType, sourceId, targetType, targetId, relation)` makes re-runs upsert. Carries `evidence` JSON naming the source row. |

### Regulatory layer — `20261019000000_regulatory_rule_versioning` (2 tables, 0 FKs, 0 destructive)

| Table | Spec | Purpose |
|---|---|---|
| `RegulatoryRuleVersion` | s106 | Immutable dated rule version. `UNIQUE(ruleKey, versionNumber)`. Statuses `DRAFT → PENDING_APPROVAL → ACTIVE → SUPERSEDED / REJECTED / EXPIRED`. Carries provenance (`sourceType`, `sourceUrl`, `verificationStatus`, `verifiedBy`) and approval (`approvedBy`, `approvedAt`). |
| `PolicyChangeAlert` | s64 | Detected change with impact analysis (`affectedWorkflows`, `affectedStudentIds`, `affectedApplicationIds`, `affectedCountryIds`, `impactCount`) and `requiresApproval` defaulting **true**. |

Both migrations are **append-only**: they alter no existing table and drop nothing. The pre-existing
`Country*` rule tables are deliberately left untouched so current behaviour is preserved (s2); the
versioning layer sits above them.

### Invariants enforced in code, not by the database

Because there are no enums or CHECK constraints, these are guaranteed by the service layer and pinned
by unit tests:

- **Append-only history.** A superseded rule version is retained, never deleted or renumbered.
- **One active rule version per `ruleKey`.** Approval closes the previous window exactly where the new
  one opens — half-open `[effectiveFrom, effectiveUntil)`, so no gap and no overlap.
- **Human approval (s116).** Visa, entry, English, financial, work-right and policy rule changes
  require a named approver. An empty actor is refused, so neither a cron job nor an AI agent can
  self-approve.
- **Parent access** is resolved server-side from stored rows only. A cross-student read is an IDOR and
  is refused.
- **University tenant scope** is bound to the stored `UniversityPortalAccount.universityId`, never to a
  request parameter.
- **Webhook secrets** are stored encrypted and returned in plaintext exactly once.

---

## 4. Value vocabularies

Stored as strings; enforced by `src/lib/**` and pinned by tests.

| Field | Allowed values |
|---|---|
| Feature flag key | `APPLICATION_RISK_SCORE`, `STUDENT_SUCCESS_SCORE`, `OPPORTUNITY_GRAPH`, `ATTENTION_ENGINE`, `PARENT_GUARDIAN_PORTAL`, `UNIVERSITY_PORTAL`, `REALTIME_UPDATES`, `OUTBOUND_WEBHOOKS`, `AI_VISA_AGENT`, `AI_PARTNER_RISK`, `WHATSAPP_AUTOMATION`, `B2B_PORTAL`, `POST_ARRIVAL`, and others in `FEATURE_FLAG_DEFAULTS` |
| Webhook events | `lead.created`, `lead.updated`, `student.created`, `application.created`, `application.status_changed`, `document.uploaded`, `offer.received`, `payment.completed`, `visa.status_changed`, `partner.approved`, `commission.paid`, … (`WEBHOOK_EVENTS`). Namespace wildcards such as `application.*` are accepted only when the namespace exists in the catalogue. |
| Risk level | `GREEN` 0–17, `AMBER` 18–44, `RED` ≥45. Hard-red factors: `DEADLINE_PASSED`, `NO_UNIVERSITY`, `NO_COURSE`, `REVIEW_REJECTED`, `OFFER_REJECTED`, `DOCUMENT_SET_BLOCKING`. |
| Success band | `ON_TRACK` ≥80, `NEEDS_SUPPORT` ≥60, `AT_RISK` ≥40, `CRITICAL` <40. Component weights sum to exactly 1.0. |
| Parent access | `NONE`, `LIMITED`, `FULL_JOURNEY` (unknown → `NONE`, fail closed) |
| Parent consent type | `DATA_SHARING`, `COMMUNICATION`, `FINANCIAL`, `DOCUMENT_ACCESS`, `THIRD_PARTY_DISCLOSURE` |
| University portal role | `UNIVERSITY_REPRESENTATIVE`, `UNIVERSITY_MANAGER` |
| Severity (s85) | `INFO`, `WARNING`, `URGENT`, `CRITICAL` |
| Rule source type (s105) | `OFFICIAL_GOVERNMENT`, `OFFICIAL_UNIVERSITY`, `APPROVED_PARTNER`, `VERIFIED_INTERNAL`, `UNVERIFIED` |
| Verification status | `NEEDS_REVIEW`, `VERIFIED`, `DISPUTED`, `STALE` |

---

## 5. Multi-tenancy (s69)

`PartnerProfile.partnerId` is the tenant key and is **not unique** — a partner organisation can have
several profile rows. Every partner-scoped query must therefore filter on the `partnerId` resolved
from the **session**, never from a request body or parameter.

Where tenant isolation is enforced:

- Webhook routes derive their filter from `auth.partnerId` on the stored row.
- `Application` queries for a partner always constrain `partnerId`.
- University routes bind `universityId` to the stored account and expose deposit **counts** only — no
  amounts, no payer identity.
- The parent portal resolves the parent from the session and builds an explicit field allowlist.
- `src/lib/partner-tenant-guard.ts` provides the shared guard.

---

## 6. Known design gap — no database-level status validation (s5, s20, s28)

With **zero** enums and no CHECK constraints, the database will persist any string in a status column.
A direct SQL write, an import, or a new code path can therefore create an application with
`stage: 'SUBMITED'` (misspelled) and nothing at the storage layer will object. Every consumer must then
tolerate unknown values.

Current mitigation: application-layer normalisation that **fails closed** (an unknown access level
becomes `NONE`; an unknown rule status becomes `DRAFT`; an unknown source becomes `UNVERIFIED`).

This is recorded as a gap rather than silently fixed, because converting 548 models' status columns to
enums is a large, risky migration touching existing production data, and per s2 functioning behaviour
must not be broken for architectural convenience. It needs an explicit decision.

---

## 7. Applying migrations

```bash
source /tmp/penv.sh          # offline Prisma engine paths (binaries.prisma.sh is not reachable)
npx prisma validate
npx prisma generate
node scripts/verify-prisma-client.mjs   # expect "548 models"
npx prisma migrate deploy               # NOT YET RUN — requires a real MySQL 8 database
```

After any `npm install` or `prisma generate`, re-copy
`libquery_engine-debian-openssl-3.0.x.so.node` into `node_modules/.prisma/client/`.

**Status: the two new migrations have never been applied to a database.** They are statically audited
(13 + 2 `CREATE TABLE`, 5 FKs, 0 destructive statements, MySQL 8 compatible defaults) but that is not
the same as verified.
