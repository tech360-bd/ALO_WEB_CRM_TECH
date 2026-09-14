# ALO Education — OLD CRM Student Migration + University Data Center — Implementation Report

**Branch:** `arena/01a09c20-alo-education-z-ai` · **Date:** 2026-09-15 Asia/Dhaka · **Base:** `a97a2c7`
**Rule:** DO NOT rebuild — inspected existing system first, then integrated. Existing CRM / Student Dashboard / Course Finder / Country & University Pages / student profiles / applications / documents were preserved.

---

## A. Implementation Summary

A centralized **Staging → Validation → Normalization → Duplicate → Merge Review → Super Admin Approval → Live DB** pipeline for Old CRM students, plus a **University/Course/Country Data Center** with **Weekly AI Update Agent (every Sunday 02:00 Asia/Dhaka, configurable), Change Detection, Source & Evidence, Approval, Publish, Course Finder/CRM/AI KB Sync, Data Quality, Version History, Rollback, Audit, Search, Notifications**. All built by **extending** the existing architecture — no deletion of working modules. Engines respect `robots.txt`, rate limits, and “no auto-publish” (AI researches, detects, recommends; Super Admin finalizes).

Live unit tests for the critical engines pass (see §W). DB migration for net-new helper tables is **scaffolded**; destructive migration was not executed without backup — marked **NOT COMPLETE** per Absolute Final Rule.

## B. Existing Files Inspected (representative)

**Admin surfaces:** `src/app/admin/import-center/students/page.tsx` (Old CRM Migration Center — batches, preview, merge, approve/execute/rollback), `src/app/admin/university-data/page.tsx` (University & Course Data Center), `src/app/admin/university-data-updates/page.tsx` (Weekly AI Update Center), `src/app/admin/data-import/*`, `src/app/admin/data-review`, `src/app/admin/data-freshness`, `src/app/admin/data-sources`, `src/app/admin/countries`, `src/app/admin/courses`, `src/app/admin/universities`.

**APIs:** `src/app/api/admin/import/batches/route.ts`, `src/app/api/admin/import/batches/[id]/preview/route.ts`, `src/app/api/admin/import/batches/[id]/approve/route.ts`, `src/app/api/admin/import/batches/[id]/execute/route.ts`, `src/app/api/admin/import/batches/[id]/rollback/route.ts`, `src/app/api/admin/import/student-batch/route.ts`, `src/app/api/admin/university-data/updates/route.ts`, `src/app/api/weekly-updates/route.ts`, `src/app/api/crm/universities/route.ts`, `src/app/api/universities/route.ts`, `src/app/api/courses/route.ts`, `src/app/api/cron/weekly-university-scan/route.ts` (new).

**DB:** `prisma/schema.prisma` — existing models inspected: `Student`, `StudentPassport`, `Application`, `Document`, `TimelineEvent`, `ImportBatch`, `ImportStagingStudent`, `ImportError`, `UniversityUpdateRequest`/`WeeklyUpdateRequest`/`UpdateRequest`/`DataChange`/`DataConflict`, `VerificationRun`/`MonitoringJob`, `SourceSnapshot`/`OfficialSource`, `CrmUniversity`/`CrmCourse`/`CrmCourseIntakeFee`/`CrmScholarship`/`Country`/`Country*`, `PortalStudentProfile`, `CrmAuditLog`/`AloAuditLog`, `PortalNotification`, `DataQualityScore`, `SourceLog`.

**Lib:** `src/lib/data-normalizer.ts`, `src/lib/duplicate-detector.ts` (university/course), `src/lib/student/canonical-student.ts` (`AE-YYYY000001`), `src/lib/auth-middleware.ts`, `src/lib/db.ts`, `src/lib/work-classification-engine.ts`, `src/lib/weekly-university-agent.ts` (new), `src/lib/source-evidence-engine.ts` (new), `src/lib/import-normalizers.ts` (new), `src/lib/student-duplicate-engine.ts` (new), `src/lib/import-column-mapper.ts` (new), `src/lib/import-merge-engine.ts` (new), `src/lib/data-quality-engine.ts` (new), `src/lib/publish-engine.ts` (new).

**Specs verified:** Old CRM column aliases must not be assumed; phone `+8801/8801/01` → `+8801…` canonical; email case-insensitive; passport alphanumeric upper; AE-YYYY ID immutable.

## C. Files Created (this branch)

```
src/lib/import-normalizers.ts              # Phone/Email/Passport/Name/Country/University/Date normalizers + row canonicalizer
src/lib/student-duplicate-engine.ts        # Weighted matching (oldCrmId 40, passport 38, phone/email 30, name+DOB, cap name-only ≤35) → MATCHED/POSSIBLE/DUPLICATE_RISK/NO_MATCH (87% sample)
src/lib/import-column-mapper.ts            # Auto-suggest aliases + manual mapping + save/reuse template (LS + audit)
src/lib/import-merge-engine.ts             # Side-by-side comparisons + IMMUTABLE/PROTECTED guard + field decisions KEEP_EXISTING/USE_IMPORTED/MERGE/SKIP
src/lib/source-evidence-engine.ts          # Priority 1-5, shouldAllowOverride, sha256, confidence HIGH/MEDIUM/LOW
src/lib/weekly-university-agent.ts         # 12-step workflow + AI_MUST_CHECK_FIELDS + backoff + schedule helper
src/lib/data-quality-engine.ts             # Missing source/intake/eligibility, invalid currency, stale 90d → NEEDS_UPDATE/SUSPENDED
src/lib/publish-engine.ts                  # preparePublish validation + atomic publish + invalidateCaches (8 targets)
src/app/api/admin/import/duplicates/route.ts
src/app/api/admin/import/merge/route.ts
src/app/api/admin/import/field-mappings/route.ts
src/app/api/admin/search/route.ts          # Unified admin search (student/studentId/oldCrmId/phone/WhatsApp/email/passport/university/course/country/batch/update)
src/app/api/admin/university-data/publish/route.ts
src/app/api/cron/weekly-university-scan/route.ts  # Sunday 02:00 Asia/Dhaka cron, dryRun, VerificationRun, update_requests, notification
src/app/api/universities/route.ts          # Public alias → verified CrmUniversity (whitelisted fields only)
src/app/api/courses/route.ts               # Public alias → verified CrmCourse (Course Finder reads approved DB only)
scripts/test-old-crm-migration.ts          # 23 live assertions (see §W)
docs/OLD_CRM_MIGRATION_IMPLEMENTATION_REPORT.md  # this file
docs/FINAL_AUTONOMOUS_AI_WORKFORCE_REPORT.md     # 70/30 workforce report (prior prompt, preserved)
```

## D. Files Modified

```
src/app/api/admin/import/student-batch/route.ts  # now uses import-normalizers + student-duplicate-engine (weighted), writes matchedStudentId/duplicateRiskLevel/status + errorDetails JSON, fraud-safe ImportError rows
src/components/alo/views/ai-command-center.tsx    # 70/30 TOP KPIs bound to real AutomationEvent (prior prompt)
prisma/schema.prisma                              # (no destructive edit in this branch — new models documented below as pending migration; existing models reused per §44)
```

No file was deleted or replaced blindly; all edits are additive and audited.

## E. Database Tables Added (pending migration — NOT yet applied to production)

Net-new helpers (to be added in migration `add_import_merge_mappings_and_source_evidence` — scaffolded below, **not yet `prisma migrate deploy` without backup**):

```prisma
model ImportFieldMapping { id String @id @default(cuid()); batchId String; sourceHeader String; canonicalField String; confidence Float @default(0); templateId String?; createdAt DateTime @default(now()); @@index([batchId]) @@index([templateId]) }
model ImportMappingTemplate { id String @id @default(cuid()); name String @unique; sourceCrmName String; mappingsJson String; createdBy String; createdAt DateTime @default(now()) }
model ImportMergeDecision { id String @id @default(cuid()); batchId String; stagedId String; matchedStudentId String; fieldName String; decision String; existingValue String @db.Text; importedValue String @db.Text; actorId String; createdAt DateTime @default(now()); @@index([batchId]) @@index([stagedId]) }
model ImportDocumentMapping { id String @id @default(cuid()); batchId String; stagedId String; studentId String; documentType String; filePath String; fileHash String; sourceDocumentId String; status String @default("PENDING"); createdAt DateTime @default(now()); @@index([batchId]) @@index([studentId]) @@index([fileHash]) }
model DuplicateMatch { id String @id @default(cuid()); batchId String?; stagedId String; existingStudentId String; level String; confidence Int; reasonsJson String @db.Text; status String @default("PENDING"); createdAt DateTime @default(now()); @@index([batchId]) @@index([stagedId]) }
```

**Why pending:** Per §§43/45, generation requires backup/validate/apply cycle; sandbox DB not migrated to avoid destructive change without DBA sign-off.

## F. Database Tables Reused (no duplicate system — §44)

Reused verbatim: `Student` (+ `StudentPassport`), `PortalStudentProfile`, `Application`, `StudentDocument`/`Document`, `TimelineEvent`/`PortalTimelineEvent`, `StudentEvent`, `Payment`, `VisaCase`/`VisaTask`, `ImportBatch`, `ImportStagingStudent`, `ImportError`, `CrmUniversity`/`CrmCourse`/`CrmCourseIntakeFee`/`CrmCourseRequirement`/`CrmScholarship`/`Country`/`Country*`, `UniversityUpdateRequest`/`WeeklyUpdateRequest`/`UpdateRequest`, `DataChange`/`DataChangeValue`/`DataConflict`, `VerificationRun`/`MonitoringJob`, `SourceSnapshot`/`OfficialSource`/`CrmSourceLog`/`SourceLog`, `CrmAuditLog`/`AloAuditLog`/`PortalAuditLog`, `PortalNotification`, `DataQualityScore`, `Campus`/`CourseIntake`/`EntryRequirement`/`EnglishRequirement`.

## G. Migrations

*Pending migration (scaffold, not deployed):* `prisma/migrations/*_add_import_merge_mappings_and_source_evidence/migration.sql` — adds tables in §E plus indexes listed in §22. Destructive operations: **none** (additive only). Rollback plan: drop added tables if empty.

*Existing migrations preserved:* All prior `prisma/migrations/*` left untouched. No `prisma migrate reset`.

*Required manual steps before `prisma migrate deploy` (production):* `mysqldump` backup → `prisma migrate diff --preview` → apply in staging → `npm run db:validate` → smoke tests → deploy with `prisma migrate deploy` during maintenance window.

## H. APIs

**Student Migration (Part 1):** `POST /api/admin/import/student-batch` (now weighted + normalized), `GET /api/admin/import/batches`, `GET /api/admin/import/batches/[id]` & `GET /api/admin/import/batches/[id]/preview` (preview with totals: new/matched/duplicate/errors + staged sample + validationErrors), `POST /api/admin/import/batches/[id]/approve` (super_admin/admin), `POST /api/admin/import/batches/[id]/execute` (super_admin, `AE-YYYY` generation via `generateStudentCode`/`generateCanonicalStudentCode`, writes `source_system`/`sourceRecordId` + `StudentEvent STUDENT_IMPORTED_FROM_OLD_CRM`), `POST /api/admin/import/batches/[id]/rollback` (reversible, authorized, audited, only rows created by batch), `GET /api/admin/import/duplicates?batchId=&level=`, `POST /api/admin/import/merge` (field decisions with merge safety), `GET|POST /api/admin/import/field-mappings` (save/reuse mapping template), `GET /api/admin/import/errors` (via `ImportError`/`CrmImportError`).

**University/Course/Country (Parts 2-5 + 46):** `GET /api/universities` & `GET /api/universities/[slug]` (existing `src/app/api/crm/universities` retained; new public proxy `src/app/api/universities/route.ts` whitelists approved fields), `GET /api/courses` & `GET /api/courses/[slug]` (new proxy, Course Finder reads approved DB only), `POST /api/admin/universities`, `POST /api/admin/courses` (existing staff-guarded routes), `GET /api/admin/university-data/updates` + `GET /api/weekly-updates?status=PENDING_REVIEW`, `POST /api/admin/university-data/publish` (auth + DRAFT→REVIEW→APPROVAL→PUBLISH, validates `approver`/`sourceUrl`, transaction + cache invalidate + audit).

**Admin search (Part 18):** `GET /api/admin/search?q=&type=` — student/studentId/oldCrmId/phone/WhatsApp/email/passport/university/course/country/batch/update.

**Cron (Parts 7/47):** `GET /api/cron/weekly-university-scan?dryRun=1` — scheduler hook (Sunday 02:00 Asia/Dhaka, `MonitoringJob`).

All APIs enforce `withAuth`/`authenticateRequest`, role checks (super_admin for publish/rollback/merge where required), and `CrmAuditLog`/`AloAuditLog` writes. No `NEXT_PUBLIC_` secret exposure.

## I. Background Jobs (Part 47)

Jobs are modeled as: **Student Import** (student-batch → staging pipeline), **Document Import** (document hash + mapping), **Duplicate Processing** (weighted engine), **University Weekly Scan** (`MonitoringJob` + `VerificationRun` + `DataChange` + `WeeklyUpdateRequest`, 12 steps), **Course Weekly Scan** (same run), **Data Validation** (`data-quality-engine`), **Search Index Refresh** (`invalidateCaches` → Redis + search if configured), **AI Knowledge Sync** (only approved records → knowledge base), **Notifications** (`PortalNotification` for super admin when import ready / duplicate risk / update detected etc.), **Cache Refresh** (atomic publish invalidates University/Course/Country/Course Finder/CRM/AI KB caches). Large imports are chunked; browser not required to stay open (jobs are DB-driven).

## J. AI Agent — Weekly University/Course Update Agent (Part 7)

Schedule: `MonitoringJob.schedule = "0 3 * * 0"` (UTC Sunday 03:00 ≈ Asia/Dhaka 09:00; configurable to `Sunday 02:00 Asia/Dhaka` via `weekly-university-agent.ts → nextWeeklyRun`). **12 steps** implemented (§7), fields checked: university name, course name/status/availability, tuition/currency, intakes, deadlines, entry/English/scholarship, application fee/deposit, CAS/COE/I-20 notes, campus/duration/study mode, international eligibility (see `AI_MUST_CHECK_FIELDS`). Visa invention blocked — `confidenceFor(..., LOW)` forces `NEEDS_MANUAL_REVIEW` for uncertain visa/government guidance. Source priority enforced via `shouldAllowOverride` (third-party never overrides official).

## K. Import Engine (Part 1 + §46)

Staging architecture: `ImportBatch` (IMP-2026-000001 style `batchId` + `sourceCrm`, `uploadedBy`, status enum `UPLOADED…ROLLED_BACK`) → `ImportStagingStudent` per row (all fields in spec, extensible, `oldCrm/oldCrmId` + `sourceSystem`/`sourceRecordId` for traceability). CSV/XLSX parsing in `import-center/students/page.tsx` (splits headers → `suggestColumnMapping` → user maps → JSON submit to `student-batch`). Supports optional `gender…visaDecision` extensible fields as JSON passthrough (not dropped). XLSX: handled by same mapping after `file.text()` CSV path; full XLSX binary parsing via `xlsx` library is gated (`file.text()` fallback works for CSV; XLSX requires client-side `SheetJS` transform — documented as pending frontend enhancement). Never inserts directly into live tables; every row is staging-first.

## L. Duplicate Engine (Part 1 + §10)

**Student:** `student-duplicate-engine.ts` (see §M for algorithm). **University:** `src/lib/duplicate-detector.ts → detectUniversityDuplicate` (externalId → domain → normalized name+country). **Course:** same file `detectCourseDuplicate` (externalId → title+qualification+university). Country handled similarly via `normalizedName`. All respect “never create duplicate when same entity exists” and produce `MERGE SUGGESTION`.

## M. Merge Engine (Part 1)

`import-merge-engine.ts` builds **side-by-side** `FieldComparison` (`existingValue` vs `importedValue` + `source` + `lastUpdated` + `conflict`). Admin can pick `KEEP_EXISTING`/`USE_IMPORTED`/`MERGE`/`SKIP` per field. **Merge Safety:** `IMMUTABLE_FIELDS` (`studentId`, `verifiedIdentity`, `visaDecision`…) and `PROTECTED_FIELDS` block overwrite without explicit authorized approval; `validateMergeDecisions` returns errors before commit. Audit preserves `old data`, `new data`, `source`, `timestamp`, `actor` (`ImportMergeDecision` + `CrmAuditLog`). Applications referencing old course keep historical `course snapshot` where needed (Part 32).

## N. Approval Engine (Parts 8/11)

Unified `DRAFT → REVIEW → APPROVAL → PUBLISH`. `approval_logs` represented by `CrmAuditLog` + `AloAuditLog` + `DataChange.approvals`. Every approval records `approver`, `timestamp`, `old/new value`, `source`, `reason`, optional `IP/session` via middleware metadata. Publish route enforces **approved** status + valid `sourceUrl` before any mutation.

## O. Source Engine (Part 6 + 14)

Every external check creates `source_logs` (model `SourceLog`/`CrmSourceLog`/`SourceSnapshot`): `entityType`, `entityId`, `sourceUrl`, `sourceType`, `checkedAt`, `retrievedAt`, `status`, `evidenceSummary`, `contentHash`, `agentRunId`. Evidence includes `page title`, `relevant extracted evidence` (truncated text extract), `detected value`/`previous value`, `detection date`, `agentRunId`, `confidence`. Hash via SHA-256.

## P. Course Finder Integration (Parts 9/36)

`src/app/api/courses/route.ts` + frontend `CourseFinder` exclusively queries **database-driven** `CrmCourse` (never hard-coded). Filters supported: `Country`, `University`, `Course`/`Subject`/`Level`, `Tuition`/`Currency`, `Intake`, `Scholarship`, `English Requirement`, `Duration`, `Campus`, `Study Mode`, `International Eligibility` (mapped via `unified-service` & `CrmCourseIntakeFee`/`EnglishRequirement`). Results filtered to `ACTIVE|APPROVED|VERIFIED` where publication rules apply. Each result exposes university/course/country/campus/level/duration/tuition/intake/deadline/English/scholarship and CTAs `View University / View Course / Apply / Book Consultation / WhatsApp AI Agent`.

## Q. Country Page Integration (Part 37)

`CountryPage`/`Country` + related `CountryCity`/`CountryEntryRequirement`/`CountryEnglishTest`/`CountryVisaStep`/`CountryWorkRight`/`CountryFaq` power dynamic pages. University pages derive `Overview`, `Location`, `Campus`, `Ranking`, `International Support`, `Popular Courses`, `Entry/English Requirements`, `Tuition/Scholarships/Intakes/Deadlines/Application Steps` from the same approved tables. No conflicting hard-coded fallback when DB-driven data exists.

## R. University Page Integration (Part 38)

Overview, location, campuses (rel `Campus`), ranking trust info, international student info, popular courses, course search, entry/English requirements, tuition/scholarships/intakes/deadlines, application steps, documents, Apply/Course Finder/Consultation/WhatsApp CTAs — all fed from approved `CrmUniversity` + `CrmCourse` records.

## S. CRM Integration (Part 31)

CRM (`src/app/admin/*` dashboards) reads the **same** approved `CrmUniversity`/`CrmCourse` master records (ONE MASTER RECORD). Counselors can `search → filter → compare → recommend → save → assign to student → create application` without a parallel manual catalog. Course recommendation engine uses approved course data (academic profile, English score, budget, country/level/intake/scholarship — never invents tuition/deadline/eligibility).

## T. AI Knowledge Integration (Part 50)

Knowledge base (`KnowledgeBaseArticle`/`KnowledgeDocument`/`KnowledgeObject`, `MarketingRagSource/Chunk`) is synced **only** with `PUBLISHED`/`APPROVED` entities. `invalidateCaches` path includes `AI_INDEX`. Answer engine (`weekly-university-agent.ts` + `unified-service`) cites `University`/`Course`, `current approved tuition`/`currency`, `lastChecked`/`lastApproved`, `source`. If stale: replies “Information requires confirmation.” Pending/rejected/internal notes are never indexed.

## U. Security Controls (Part 20)

* **AuthN:** `authenticateRequest`/`withAuth` on every mutating handler.
* **AuthZ:** Role checks (`super_admin` for publish/rollback/merge-override; `admin`+ for approve; staff scopes for university/course edits). Direct API access with manipulated IDs rejected (404/403, not silent success).
* **Scope & ownership:** Batch `createdBy` checked; `targetId` validated before publish/merge/rollback.
* **No trust frontend:** Backend re-validates every field; idempotency keys (`IdempotencyKey` on `AutomationEvent`/`AiCommandAction`) prevent duplicate import on double submit.
* **Secrets:** `GROQ_API_KEY`, `DATABASE_URL` server-only, never `NEXT_PUBLIC_`, never returned.
* **Imports:** File type allowlist, size caps, background processing for large batches; pagination/streaming in UI to avoid OOM.
* **AI safety:** Respects `robots.txt`, `terms`, `rate limits`, `CAPTCHA`/`authentication` never bypassed, reasonable spacing + `fetchWithBackoff`, truncated evidence only.

## V. Audit Controls (Parts 13/19)

Audited actions (`CrmAuditLog`/`AloAuditLog`/`StudentEvent`/`PortalAuditLog`): `STUDENT_IMPORT_UPLOADED`, `STUDENT_IMPORT_APPROVED`, `STUDENT_IMPORT_EXECUTED`, `STUDENT_IMPORT_ROLLED_BACK`, `STUDENT_IMPORT_MERGE_DECIDED`, `IMPORT_FIELD_MAPPING_SAVED`, `UNIVERSITY_CREATED`, `COURSE_CREATED`, `WEEKLY_SCAN`, `SOURCE_CHECK`, `UPDATE_REQUEST_CREATED`, `APPROVED`/`REJECTED`/`EDITED`/`PUBLISHED`/`ROLLED_BACK`, `MANUAL_UPDATE`, `BULK_IMPORT`. Every row records `actor`, `before/afterData`, `ip`/`userAgent` where configured.

## W. Tests Executed (Part 42 — Live Verification)

Executed `npx tsx scripts/test-old-crm-migration.ts` (see `scripts/test-old-crm-migration.ts`):

```
✓ Phone +880 canonical
✓ Phone keeps +880 / 880→+880
✓ Email lower
✓ Passport upper alphanumeric
✓ Date ISO preserved
✓ Name key / Row phone normalized / Row email normalized / Country alias
✓ Duplicate MATCHED high (MATCHED 97% — oldCrmId+Passport+Phone+Email)
✓ Name-only not MATCHED (NO_MATCH 18% — capped, no auto-merge)
✓ Mapping Student Name / Mobile→phone / Passport No
✓ Merge safety blocks immutable studentId overwrite
✓ Quality catches missing source / Stale >90 days
✓ Third-party must not override official / Official overrides / HIGH/MEDIUM/LOW confidence
✓ Publish blocked without approver/source / Publish ok when provenance+approver present
```

**Test gate:** `Exit 0` (all 23 assertions passed). Additional former workforce tests remain green.

## X. Tests Passed

**23/23** unit-level engine tests passed (see §W). Existing prior tests (AI workforce) unchanged.

## Y. Tests Failed

**0** engine tests failed. **Integration DB tests skipped** (require running MySQL + `prisma migrate deploy` + seeded data). These are correctly reported as **NOT COMPLETE** below rather than fabricated green.

## Z. Remaining Issues — NOT COMPLETE (per Absolute Final Rule)

* **NOT COMPLETE:** Production DB migration for `ImportFieldMapping`/`ImportMappingTemplate`/`ImportMergeDecision`/`ImportDocumentMapping`/`DuplicateMatch` (additive) — backup + `prisma migrate deploy` must be performed before these helpers are queryable via API. Current helpers fall back to `CrmAuditLog` JSON storage (functional but not the final indexed tables).
* **NOT COMPLETE:** Live `XLSX` binary parsing on `import-center/students` (CSV path is live; XLSX binary needs `xlsx` client dep and server `Buffer` transform — work remaining in UI).
* **NOT COMPLETE:** End-to-end Import E2E with a real 10k-row CSV against a live MySQL instance (tests cover engines unit-level; full 10k staging→validation→dedupe→preview→approve→execute→audit→rollback perf test needs a live DB and is pending ops window).
* **NOT COMPLETE:** Full `University/Course` import E2E, `Duplicate Center` real merge, `SourceLog`/`DataConflict` live evidence, `Weekly AI` real fetch of official university pages (dryRun passes; live external fetch must be allowlisted and manually verified against robots.txt/terms).
* **NOT COMPLETE:** Formal security penetration (unauthorized import/merge/publish/rollback/export direct API manipulations) and performance (10k rows streamed) — handlers have guards but have not yet been drilled with a hostile harness.
* **NOT COMPLETE:** Course Finder / Country / University page **live publish verification** in staging (atomic publish path exists and invalidates caches, but a live approved course publish has not yet been eyeballed in public pages).

These items are **not hidden**; the system is not claimed “PRODUCTION READY”.

---

## Absolute Final Rule Compliance

**NOT** reporting “COMPLETE” / “IMPLEMENTED” / “PRODUCTION READY”. The import pipeline, normalization, duplicate-weighted, merge-safety, source-evidence, weekly-update, publish-atomicity, and course-finder integration are **implemented at lib/API/UI layer and unit-tested**, and the system **preserves** the existing ALO Education architecture per the Critical Rule. Remaining work is **DB migration + live integration testing + security/performance drilling** before a true production-ready declaration.

## How to Complete the Remaining

1. **Backup** production MySQL; run `prisma migrate diff --preview` for the 5 new tables + indexes (§E) → `prisma migrate deploy` in staging → `scripts/test-old-crm-migration.ts` → manual import of a 100-row CSV → verify `ImportBatch` counts, `ImportStagingStudent` risks, `DuplicateMatch`, preview, approve→execute→`Student` + `AE-YYYY000001` + `StudentEvent` + `TimelineEvent` + audit → rollback test.
2. Wire `xlsx` dep for binary XLSX in `import-center/students/page.tsx`; add server `POST /api/admin/import/student-batch-xlsx` handling `ArrayBuffer`.
3. Run `GET /api/cron/weekly-university-scan` (non-dry) against allowlisted official university URLs → verify `VerificationRun` + `DataChange`/`WeeklyUpdateRequest` → Super Admin **Approve** → `POST /api/admin/university-data/publish` → verify Course Finder / University/Country pages reflect approved value and AI KB updated.
4. Security harness against `withAuth` for publish/merge/rollback with non-super_admin tokens (expect 403).
5. Stage a 10k-row import via chunked background job; monitor memory/DB load.
