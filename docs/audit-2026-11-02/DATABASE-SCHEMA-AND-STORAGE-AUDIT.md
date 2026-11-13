# 6 · DATABASE SCHEMA AND STORAGE AUDIT

**Important limit, stated up front:** no database was reachable (`DATABASE_URL` absent, no MySQL client, Prisma engine download blocked). **No model was validated by Prisma at runtime and no data was read.** Everything below is static analysis of `prisma/schema.prisma`, migrations, seed scripts, storage files and the code that queries them.

---

## 1. Schema overview

| Measure | Value |
| --- | --- |
| Single schema file | `prisma/schema.prisma` |
| Models | **618** |
| Datasource | MySQL (`provider = "mysql"`) |
| Client generator | `prisma-client-js`, 5 binary targets incl. musl/openssl variants |
| Migrations applied-style | **48** in `prisma/migrations/` (from `0_init` to 2026-10-xx) |
| Legacy migrations retained | **12** in `prisma/legacy-migrations-20261001/` |
| Seed / verification scripts | 30 under `prisma/` + 5 under `scripts/` |
| SQL schema artefacts | `database.sql` (178 KB), `database/{schema,foreign-keys,indexes,views}.sql`, `deploy/alo_education_production.sql`, `scripts/seed-core.sql` |
| Mirror schema for offline verification | `prisma/verification-mirror/` (used by `npm run awf:verify` against SQLite) |

### Model families

| Family | Models | Example |
| --- | --- | --- |
| `Phd*` | **51** | PhdProject, PhdSupervisor, PhdLiteratureSource |
| `Employee*` | 34 | EmployeeAccessRequest, EmployeeQuota |
| `Awf*` (AI workforce) | 23 | AwfAgent, AwfRun, AwfToolGrant |
| `Marketing*` | 22 | MarketingCampaign, MarketingApproval |
| **`Crm*` (catalogue/CRM core)** | **20** | CrmUniversity, CrmCourse, CrmCourseIntakeFee, CrmCourseRequirement, CrmScholarship, CrmRanking, CrmCourseMonthlyCoverage, CrmCoverageRevision, CrmOfficialEvidence, CrmSourceLog, CrmDiscoveryRecord, CrmImportBatch/Error, CrmAuditLog |
| `Partner*` | 11 | Partner, PartnerCommission |
| `Ucc*` | 6 | UccConversation, UccMessage |
| WhatsApp / legacy / others | remainder | WhatsAppOfficialNumber, UniversityPage, CoursePage, Campus, Department |

---

## 2. Dead schema: 212 of 618 models are referenced by no code

The scan searched `src/`, `scripts/` and `prisma/` for `db.<model>`, `tx.<model>` or `prisma.<model>` accessors (camelCase and lowercase variants). **212 models (34 %) are never used by any first-party file** — full list in `usage-analysis.json` → `prismaModelsUnreferencedInCode`.

Consequences:
- migration cost carried for tables nobody reads;
- risk that new work builds on a dead model;
- `prisma generate` produces a client 34 % larger than needed.

*Caveat:* a model can be legitimately referenced only from raw SQL or from a route we did not scan; treat the list as a **review queue**, not as a delete list.

---

## 3. The catalogue data model — what exists vs what the catalogue requires

| Requirement | Model / field today | Status |
| --- | --- | --- |
| Institution | `CrmUniversity` (56 columns, IDs, URLs, ranking, aliases JSON) | Good |
| Institution alias table | `CrmUniversity.aliases` (JSON string) | Partial — no merge history |
| Campus | `Campus` model with FK → `CrmUniversity.universityId`; `CrmUniversity.campusName`; `CrmCourse.campus`, `CrmCourse.campusId` | Partial — course→campus is single-valued |
| Faculty / school | `UniversityFaculty` keyed by **`universitySlug` string**, not an FK; `programmeCount`, `verificationStatus` | Fragile — renamed slug orphans rows |
| Department | `Department` has `id, name, code, description, status` — **no university or faculty link** | **Missing** |
| Course identity | `courseId`, `courseCode`, `slug`, `officialUrl` | Good, no uniqueness rule on (university, code) |
| Study level / award | `studyLevel`, `programLevel`, `qualification`, `degreeType` (free strings) + lookup IDs | Partial — no enforced vocabulary |
| Delivery / structure | `deliveryMode`, `attendanceMode`, `durationMonths`, placement flags | Missing credits/modules/handbook URL |
| Entry requirements | `CrmCourseRequirement` (academic, min score, prerequisites, `countrySpecificRequirement`, portfolio/interview flags) | Partial — no document requirements |
| English requirements | numeric fields inside `CrmCourseRequirement` (IELTS/PTE/TOEFL/DET) | **Missing** accepted-test list, validity, exemptions, UKVI flag |
| Tuition fees | `CrmCourseIntakeFee.yearlyTuition/totalTuition/tuitionPeriod/currencies` + `CrmCourse.tuitionFee` | **Missing** academic year, fee basis enum, indicative/confirmed, deposit conditions, refund URL |
| Intakes / deadlines | `intakeYear`, `intakeMonth`, `intakeName`, `applicationDeadline`, `startDate` (String) | **Missing** opening date, rolling flag, timezone, confirmed-for-international |
| Scholarships | `CrmScholarship` (name, provider, amount, %, eligible countries/levels, deadline, URL, expiry) | Missing renewal, documents, separate-application flag, BD-eligibility |
| Accreditation | free text on `CrmUniversity` | Missing structured body/scope/source |
| Rankings | `CrmRanking` + `CrmUniversity.ranking*` | Good |
| Source register | `CrmSourceLog`, `CrmOfficialSourceCheck`, `CrmSourceVerificationEvent`, `CrmOfficialEvidence` (SHA-256, excerpt, field scope) | **Strong — reuse** |
| Verification workflow | `UniversityUpdateRequest`, `ApprovalQueueItem`, `CrmCoverageRevision`, `CrmAuditLog`, `DataConflict` | Good |
| Import batches / errors | `CrmImportBatch`, `CrmImportError` (+ legacy `ImportBatch`/`ImportError`) | Good, duplicated |
| History | `CrmAuditLog`, `CrmCoverageRevision` + legacy `UniversityHistory`, `CourseHistory`, `ScholarshipHistory` | Duplicated across two systems |
| Course-month coverage | `CrmCourseMonthlyCoverage` + `CrmCoverageRevision` + `buildCoverageMatrix` | Good — this is the model that actually drives publishing |

**Verdict:** the catalogue can be built on the existing `Crm*` family with **additive** fields; only faculty/department linkage, fee metadata, English-requirement separation and document requirements need new structures. Nothing requires a parallel schema.

---

## 4. Migration and schema-hygiene findings

1. **Two schema generations coexist** (`Crm*` and legacy `UniversityPage/CoursePage/Campus/Department`) with different naming and status vocabularies — the source of the dual public gate.
2. **`UniversityFaculty.universitySlug`** joins by string rather than `universityId` — a documented integrity risk if a slug is regenerated.
3. **`Department` has no institutional context** — faculty/department coverage cannot be measured today.
4. **Status columns are free-text strings** (`status`, `verificationStatus`, `publicationStatus`, `internationalEligibility`) with defaults; MySQL has no enum constraint, so vocabulary drift is possible (it has already happened: `VERIFIED_OFFICIAL`, `CROSS_SOURCE_VERIFIED`, `PARTIALLY_VERIFIED`, `verified_pending_approval`, `published_verified`).
5. **`CrmCourseIntakeFee.intakeMonth` is a String** while `intakeYear` is Int — the two CSV vocabularies (text vs numeric month) are a direct consequence.
6. **48 migrations for 618 models** implies consolidated/dumped migrations; the true incremental history is not recoverable from the repo alone.
7. **`prisma validate` could not be run** in this environment (engine download blocked) — schema syntax is confirmed only by the fact that ESLint/typecheck configs and CI call it; treat schema validity as **unverified in this audit**.

---

## 5. Storage audit (`storage/`, 918 files, 1.2 MB)

| Path | Files | Content |
| --- | --- | --- |
| `storage/official/official/test-upload-001/documents/` | — | **Test upload artefact** committed to the repo (`730cc92d-….txt`) |
| `storage/outputs/task_TASK-20260801123716185603/` | 8 | AI agent run outputs: `agents_executed.json`, `audit_log.txt`, `final_output.txt`, `learning_report.json`, `payment_guard_report.json`, `productivity_report.json`, `protection_report.json` |
| `storage/student-partner/`, `storage/official/…` | remainder | JSON/TXT artefacts (604 json, 301 txt, 8 html, 5 pdf) |

Findings:
- **Runtime output is committed to git.** Agent run artefacts and a test upload are in version control; they carry no checksums and no retention policy.
- **No PII found** in the sampled files (they are agent reports, not student documents). This is a **sampled** conclusion, not a guarantee — a full content scan is required before any repository is shared externally.
- **Upload controls exist in code**: `src/lib/document-security.ts`, `file-validator.ts`, `storage-service.ts`, `src/lib/storage/*`, `FILE_SIGN_SECRET` for signed links, and guarded routes `/api/employee-access/secure-download`, `/api/documents/*`. Whether they are correctly enforced is **unproven** (no runtime).

## 6. Backup / restore

| Artefact | Purpose | Verified? |
| --- | --- | --- |
| `scripts/backup-mysql.sh` | mysqldump wrapper | Present; **not executed** (no MySQL) |
| `scripts/restore-mysql.sh` | Restore wrapper | Present; not executed |
| `scripts/backup_agentos.sh` | AgentOS data backup | Present; not executed |
| `/api/cron/database-backup` (vercel cron `0 20 * * *`) | Scheduled backup endpoint | Configured; not executed |
| `deploy/alo_education_production.sql` | Production schema dump | 4.9 MB; content not diffed against `schema.prisma` (they may disagree) |

**Risk:** three backup paths exist and none has a recorded, recent restore test in the repository.

---

## 7. Data-integrity recommendations (proposal only)

1. Do **not** add unique constraints until the duplicate audit in report 4 is resolved (existing synthetic duplicates would block the migration).
2. Add, in one additive migration: `CrmUniversityAlias`, `universityId` FK on `UniversityFaculty`, `universityId/facultyId/officialUrl` on `Department`, fee-metadata columns on `CrmCourseIntakeFee`, `CrmCourseEnglishRequirement`, `CrmCourseDocumentRequirement`.
3. Convert the five free-text status columns to a documented vocabulary with a **check constraint or enum**, and migrate `VERIFIED_OFFICIAL`/`CROSS_SOURCE_VERIFIED` by an explicit owner decision (not silently).
4. Purge or gitignore `storage/outputs/**` and the test upload.
5. Record one successful restore test as evidence before go-live.
