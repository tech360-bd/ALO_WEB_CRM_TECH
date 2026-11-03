# STUDENT PROFILE, B2B PARTNER & ALO STAFF DOCUMENT MANAGEMENT — IMPLEMENTATION REPORT
**Date:** 2026-11-02 · **Repository:** `tech360-bd/ALO_WEB_CRM_TECH` · **Working branch:** `arena/e8f597eb-alo-web-crm-tech`
**Starting HEAD:** `f9cb8851` (*Merge pull request #50*, main) · **Working tree at start:** clean
**Git state at the end of this pass: changes are LOCAL ONLY — not committed, not pushed, not deployed (as instructed).**

---

## 1. Repository confirmation

| Item | Value |
|---|---|
| Remote | `https://github.com/tech360-bd/ALO_WEB_CRM_TECH.git` (`origin`, confirmed via `git remote -v` and a `gh` API call) |
| Branch checked out | `arena/e8f597eb-alo-web-crm-tech` |
| HEAD commit | `f9cb8851` = merge of PR #50 into `main` |
| Working tree at start | clean (`git status --porcelain` empty) |
| Branch protections | **Not readable.** `GET /repos/tech360-bd/ALO_WEB_CRM_TECH/branches/main/protection` returned `403 Resource not accessible by integration`. Unverified, not assumed either way. |
| Requester change | The change was not made and nothing was pushed, so no protection is exercised in this pass. |

---

## 2. Root causes established by code inspection

The three document models (`StudentDocument`, `PortalStudentDocument`, `Document`) are **not accidental duplicates**; they serve different owners:

* `StudentDocument` — student self-service uploads (and staff uploads on a student's behalf). Already had private storage, hash, `version`, `previousVersionId`, `isArchived`.
* `PortalStudentDocument` — portal-originated uploads, i.e. the B2B partner portal and the student portal UI. **Had no version or archive columns at all.**
* `Document` (+ `DocumentVersion`, `DocumentChecklist`) — the application/visa checklist layer, with its own version table.

Because of that split, the defects below were real and are not "role mismatch by assumption" — each is anchored to a file and a code path.

| # | File | Observed behaviour | Confirmed defect | Security implication | Minimal change |
|---|---|---|---|---|---|
| 1 | `src/app/api/crm/documents/route.ts` (GET) | Ran under `withAuth` alone and returned `portalStudentDocument.findMany()` for the whole platform, including `studentProfile.user.email` / `phone` | **Yes — the staff document queue was readable by any authenticated identity**, including partner and student portal accounts | Cross-tenant PII disclosure (names, emails, phones, document statuses) | Require a document-read role; scope non-reviewer readers to their assigned students; drop contact fields; exclude archived rows; expose `scope` in the response |
| 2 | `src/app/api/crm/documents/verification-queue/route.ts` | `requireUserTypes: ["ADMIN","SUPER_ADMIN"]` | **Yes — the review queue was admin-only**, so the document / application / visa officers who actually review could not open it, while the PUT review endpoint already allowed them | Availability of the review control (and it pushed reviewers to the unguarded list route in #1) | Guard with `canReviewDocuments(auth.roles)` — the same policy the review action uses |
| 3 | `src/app/api/counselor/documents/upload-on-behalf/route.ts` | Authorised only when the caller was a *counselor*, against `counselorId` | **Yes — any other staff role** (`application_team`, `document_officer`, `visa_officer`, …) **could upload into any student**, including a partner student with no application submitted through ALO | Write access to another tenant's records; the "partner student needs an ALO application" rule was bypassed on the write path | Use the shared `authorizeStaffDocumentRead` policy (same rule as reads) |
| 4 | *(missing route)* | The counselor list merged both document tables, but the only download endpoints for a portal row were the partner and student-portal ones, both of which correctly refuse staff | **Yes — staff could list a portal document but never open it** | None (fail-closed) but the review workflow was blocked | New `src/app/api/counselor/documents/[id]/download/route.ts` covering both tables with the shared policy, hash re-verification and audit |
| 5 | `src/app/api/messages/document-auto-upload/route.ts` | Took `studentId` + arbitrary `fileUrl` from any authenticated account and wrote `StudentDocument` **and** `PortalStudentDocument` for that student | **Yes — no ownership, no role check, no URL validation** | Cross-tenant writes into student records; `javascript:`/`data:` URL could be stored and later rendered as a link | Role gate + per-student policy + URL allow-list (relative path or `https:`) |
| 6 | `prisma/schema.prisma` → `PortalStudentDocument` | No `version`, `previousVersionId`, `isArchived`, `archivedAt` | **Yes — partner re-uploads were unrelated rows**: no "three versions in one slot", no history link, and `documents/manage` faked archival by **overwriting the review status** to `'archived'` | Loss of review history semantics | Additive migration (4 columns + 2 indexes) + version chaining + real archive columns |
| 7 | `src/lib/documents/document-access.ts` (`fromPortalDocument`) | Hardcoded `version: 1`, `previousVersionId: null`, `isArchived: false` with a comment saying the portal table could not version | **Yes — the merged staff view could not distinguish versions** | None, but it hid replacements | Read the real columns |
| 8 | `src/app/api/student/documents/route.ts` (POST) | Every retry created a new row and consumed a version number | **Yes — no idempotency** ("prevent duplicate submissions caused by retries") | Duplicate review items | Hash-first duplicate check scoped to student + slot + hash, excluding rejected uploads |
| 9 | `src/app/api/partner/documents/route.ts` (GET/POST) | No versioning, no dedupe, archived rows indistinguishable | **Yes** (same as #6, partner-facing) | — | Version chain, idempotency, `isCurrentVersion`, archive exclusion |
| 10 | `src/app/api/crm/documents/dashboard/route.ts` | Aggregated every student's document KPIs under `withAuth` alone | **Yes — platform-wide document KPIs readable by any signed-in account** | Aggregate disclosure across tenants | `canReadDocumentsByRole` + archived exclusion |

**Not defects (verified, left alone):** the student routes (`/api/student/documents/**`) already scope every read to `auth.studentId`, refuse metadata-only creation, reject double-extension/MIME-signature mismatches, verify SHA-256 before streaming and audit both upload and download. Students and partners have **no delete endpoint at all**; `documents/manage` already restricted archive/delete to Admin/Super Admin (`canDeleteDocuments`) with a ≥10-character reason.

---

## 3. Files modified / added, and why

**Modified (13)**

| File | Reason |
|---|---|
| `src/app/api/crm/documents/route.ts` | Queue role guard + assignment scoping + PII removal + archive filter + staff `downloadUrl`; on approval, supersede earlier versions of the same slot (review-time only) |
| `src/app/api/crm/documents/verification-queue/route.ts` | Reviewer policy instead of admin-only; archived excluded |
| `src/app/api/crm/documents/dashboard/route.ts` | Document-read role required; archived excluded |
| `src/app/api/counselor/documents/route.ts` | Merged list now returns a staff-usable `downloadUrl` per document |
| `src/app/api/counselor/documents/upload-on-behalf/route.ts` | Shared authorization policy (partner-application rule now applies to writes) |
| `src/app/api/partner/documents/route.ts` | Version chain, idempotency, `isCurrentVersion`, archive exclusion, version in audit |
| `src/app/api/student/documents/route.ts` | Idempotent retry handling; `isCurrentVersion` per slot |
| `src/app/api/student-portal/documents/route.ts` | Archive exclusion, version + `isCurrentVersion`, ordering by slot/version |
| `src/app/api/documents/manage/route.ts` | Portal archive now uses `isArchived`/`archivedAt` instead of rewriting `status` |
| `src/app/api/messages/document-auto-upload/route.ts` | Role gate, per-student policy, URL allow-list, length checks |
| `src/lib/documents/document-access.ts` | `fromPortalDocument` reads real version/archive fields; row type extended |
| `prisma/schema.prisma` | `PortalStudentDocument`: + `version`, `previousVersionId`, `isArchived`, `archivedAt`, 2 indexes |
| `tests/unit/partner-documents-route.test.ts` | +4 tests (dedupe, version chain, `isCurrentVersion`, archive exclusion) |

**Added (7)**

| File | Why |
|---|---|
| `src/app/api/counselor/documents/[id]/download/route.ts` | The missing staff download for both document tables |
| `prisma/migrations/20261102180000_portal_student_document_versioning/migration.sql` | Additive migration for the four new columns + two indexes |
| `tests/unit/crm-documents-list-authz.test.ts` | 7 tests: partner/student/marketing refused; counselor scoped; reviewer/admin full; no PII in the query |
| `tests/unit/counselor-document-download.test.ts` | 8 tests: assignment, partner-application gate, archive visibility, hash mismatch, 401 |
| `tests/unit/student-documents-versioning.test.ts` | 5 tests: dedupe, scoped duplicate check, version chain, `isCurrentVersion`, MIME rejection |
| `tests/unit/document-review-version-policy.test.ts` | 6 tests: supersede only on approval, rejection reason, reviewer role gate, archive via `isArchived`, admin-only, reason required |
| `tests/unit/message-document-upload-authz.test.ts` | 5 tests: partner/student refused, unassigned staff refused, `javascript:`/`data:`/protocol-relative URLs rejected, https accepted |
| `tsconfig.documents-check.json` | Scoped typecheck project for these files (the full project build OOMs in this sandbox; mirrors the repo's existing `tsconfig.*-check.json` pattern) |

---

## 4. Database / migration changes

One additive migration; **no table, column or row is dropped, renamed or rewritten.**

```sql
ALTER TABLE `PortalStudentDocument`
  ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN `previousVersionId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `archivedAt` DATETIME(3) NULL;
UPDATE `PortalStudentDocument` SET `version` = 1 WHERE `version` IS NULL OR `version` < 1;
CREATE INDEX `PortalStudentDocument_studentProfileId_category_idx` ON `PortalStudentDocument` (`studentProfileId`, `category`);
CREATE INDEX `PortalStudentDocument_isArchived_idx` ON `PortalStudentDocument` (`isArchived`);
```

*Existing rows stay valid:* every new column has a default, so historical portal documents read as version 1, not archived, with no previous version — exactly their real state. Historical downloads keep working because the authorization rules and the storage/hash columns are untouched.

**The migration has NOT been applied** — there is no MySQL server in this environment (see §9). `npx prisma validate` passes and `npx prisma generate` produces the client (618 models).

---

## 5. Student Profile fields

The profile is **not** a greenfield feature in this repository: `src/components/student/StudentProfilePage.tsx` (2,593 lines) already implements a sectioned profile that persists through `POST/PUT /api/student-portal/profile` into `StudentProfileSection` snapshots, and `src/lib/student-profile/profile-sections.ts` holds a typed validation library for repeatable records (`/api/student-portal/profile/sections`).

Verified present in code (not re-built):

| Requirement | Status |
|---|---|
| Full name, DOB, gender, passport number/expiry, nationality, present/permanent address, emergency contact | Present in the profile page and the `PortalStudentProfile` model |
| Visa refusal Yes/No + conditional repeatable details; immigration history optional | Present (`hasVisaRefusal`, `visaRefusals[]`, `hasImmigration`, `immigrations[]`), with `visaRefusalConsistency()` keeping the flag and the records in step |
| Education: SSC/O Level, HSC/A Level, Diploma, Bachelor, Master, with per-type fields, add-another, no overwrite | Present both in the UI (add/remove rows, level-driven fields) and in `QUALIFICATION_TYPES` / `QUALIFICATION_FIELDS` / `validateEducation` |
| Work experience repeatable, current position with no end date | Present — `validateWork` explicitly allows `currentlyWorking` with an empty end date and rejects an end date in that case |
| English: IELTS, IELTS UKVI, PTE, Duolingo, TOEFL, Kaplan; date, overall, optional sub-scores, expiry; repeatable | Present — `ENGLISH_TEST_NAMES` keeps `IELTS_UKVI` distinct from `IELTS` |
| Documents per profile section | Present — the profile posts to `/api/student/documents` with `documentType`, which is the versioned, hash-verified, private-storage path |

**Not done, and it must not be claimed as done:** the referenced workbook **`Data for Student Profile_CRM (6).xlsx` is not present anywhere in this environment** (`find` over the whole workspace returned no `.xlsx`/`.xls`). Workbook-specific worksheets, headers and field names therefore could **not** be inspected or implemented. Everything above is aligned to the written requirements only.

---

## 6. Permission behaviour (server-side, every route)

| Actor | List | Upload | Download | Review (verify/reject) | Delete/archive |
|---|---|---|---|---|---|
| **Student (own)** | own rows only (`auth.studentId`), archived hidden | own records, MIME + signature + 20 MB + hash, versioned | own only, hash re-checked, `private, no-store` | refused (no endpoint, and `PUT` refuses) | **refused** (no endpoint exists) |
| **B2B partner** | own tenant only (`studentProfile.partnerId`) | own tenant only, cross-tenant student → 404 **before** storage | own tenant only | refused (`403`, explicit) | refused |
| **ALO staff — counselor** | assigned students only | assigned students only | assigned students only | refused unless the role reviews | refused |
| **ALO staff — application/visa/document officer** | whole pipeline, **except** a partner student with no submitted ALO application | same rule as reads | same rule as reads | allowed | refused |
| **Admin / Super Admin** | all (archived visible to admin) | all | all, including archived | allowed | **allowed** (archive default, reason ≥ 10 chars, audited) |
| **Any other authenticated identity** (marketing, partner, student, unknown) | `403` **before any query** | `403` | `403` | `403` | `403` |

Partner-student rule is enforced by `canStaffAccessStudentDocuments` → `facts.isPartnerStudent && hasActiveAloApplication === false` denies unless the caller is that student's assigned counselor; the fact is resolved from `Application.stage` against the submitted-stage list in `document-access-resolver.ts`.

---

## 7. Document lifecycle behaviour

1. Upload → bytes validated (extension ↔ extension map ↔ actual signature ↔ declared MIME), stored via the existing private store (`storePrivateFile`, path outside the web root).
2. SHA-256 computed **before** storage; a retry of the same bytes into the same slot returns the existing row (`deduplicated: true`, HTTP 200) and writes nothing.
3. New row gets `version = max(version of slot) + 1`, `previousVersionId = previous row`, `status = pending` — a replacement **never** inherits `verified`.
4. Review: `PUT /api/crm/documents` (reviewer roles only, same-origin) — rejection requires a written reason; **approval** of version *N* supersedes earlier unverified/approved rows of that slot, and only at that moment.
5. `isCurrentVersion` marks the newest upload per slot in every list (student, student-portal, partner, merged staff view); every older row stays listed with its own status and comments.
6. Download: ownership re-derived server-side, archived rows hidden from staff (admin may open), SHA-256 re-verified against the record before streaming, `Content-Disposition: attachment`, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, audit row written before bytes.
7. Delete: `POST /api/documents/manage` — Admin/Super Admin only; default action is **archive** (`isArchived` + `archivedAt`, file retained); `hard_delete` additionally removes the private file and is audited with actor, reason and result.
8. Every material change is written to `DocumentAudit` / `AuditLog` / `portalAuditLog` with actor, action, document/version and result — never file contents or storage paths.

**Version-count interpretation (reported as required):** the brief's "upload the same document three times" is implemented as **three retained versions in the same slot**, with **no hard maximum** — the policy helper `versionReviewImpact()` documents the intent and there is no cap in code. Nothing rejects a fourth correction.

---

## 8. Tests actually executed

| Command | Result |
|---|---|
| `npx vitest run` (whole unit suite) | ✅ **335 files passed / 13 skipped; 3,683 tests passed / 148 skipped; 0 failed** |
| ↳ of which document/profile/security subset (12 files) | ✅ **95 passed** |
| ↳ new tests added by this pass | ✅ **31 passed** (7 + 8 + 5 + 6 + 5) |
| `npx tsc --project tsconfig.documents-check.json --noEmit` | ✅ **0 errors** (all changed source + new tests) |
| `npx eslint <all changed files>` | ✅ **0 errors, 0 warnings** |
| `npx prisma validate` | ✅ schema valid |
| `npx prisma generate` | ✅ client generated, `verify-prisma-client.mjs` → 618 models |

Behaviour actually exercised by the new tests: tenant isolation (partner A vs B), student-vs-student ID guessing, staff assignment enforcement, the partner-student-without-application rule (denied and then allowed once an application exists), archived visibility, hash mismatch, MIME forgery, idempotent retries, three-version retention, `isCurrentVersion`, supersede-on-approval, reason-required rejection, admin-only archive, reviewer-role gating, and `javascript:`/`data:` URL rejection.

---

## 9. Blocked / not executed

| Item | Exact command | Blocker |
|---|---|---|
| Migration apply + isolated integration test DB | `npx prisma migrate deploy` | **No MySQL server and no test database in this environment**; Prisma engine binaries cannot be downloaded (`binaries.prisma.sh` blocked — engines borrowed from `imports/alo-education-full/node_modules/@prisma/engines` for validate/generate only). Nothing was pointed at production. |
| Full project typecheck | `npm run typecheck` | Node heap exhausted (`FATAL ERROR: Ineffective mark-compacts near heap limit`) on the 3.9 GB sandbox; scoped project used instead |
| Production build | `npm run build` | Known to be OOM-killed in this sandbox (documented in the prior Super Admin report); not attempted again |
| E2E (Playwright) | `npm run test:e2e` | Needs the app running against a real database; unavailable |
| Branch-protection verification | `gh api .../branches/main/protection` | `403 Resource not accessible by integration` |
| Workbook-driven profile fields | — | **`Data for Student Profile_CRM (6).xlsx` is not in the environment** |

**Nothing in this pass was verified in staging or production.** Only code-level (static + unit) verification was possible.

---

## 10. Remaining risks / unverified behaviour

1. **Migration is written but never executed** — column types/index names are unverified against a live MySQL. Apply on a staging copy first.
2. **UI paths were not exercised.** `CrmDocumentsPage` passes no `studentProfileId`, so a counselor now sees an assignment-scoped queue; that is the intended behaviour but it has not been visually confirmed. Components were not modified.
3. **`PortalStudentProfile.counselorId` is treated as a user id** when scoping counselors (the same convention used by `applications/deadlines`). If any historical rows store an employee id there, those counselors will see an empty queue (fail-closed, not a leak).
4. **Partner documents uploaded before the migration** all read as version 1 with no previous-version link; earlier history for those rows cannot be reconstructed because it was never stored.
5. **`messages/document-auto-upload` still trusts a client-supplied `studentId` + URL** within the caller's authorised scope; it does not verify that the URL belongs to the platform's storage. It is now bounded to authorised staff and safe schemes, but a reviewer-grade follow-up could require an internal storage key instead of a URL.
6. **The supersede-on-approve rule is new policy.** It is additive and reversible (no file is deleted) but it does change visible statuses for older versions of a slot.
7. **`whatsapp/document-upload` and `documents/auto-upload`** were inspected but not modified; they already carry role/counselor/partner checks, though they use their own local logic rather than the shared policy.

---

## 11. Git diff summary and working-tree status

```
 M prisma/schema.prisma
 M src/app/api/counselor/documents/route.ts
 M src/app/api/counselor/documents/upload-on-behalf/route.ts
 M src/app/api/crm/documents/dashboard/route.ts
 M src/app/api/crm/documents/route.ts
 M src/app/api/crm/documents/verification-queue/route.ts
 M src/app/api/documents/manage/route.ts
 M src/app/api/messages/document-auto-upload/route.ts
 M src/app/api/partner/documents/route.ts
 M src/app/api/student-portal/documents/route.ts
 M src/app/api/student/documents/route.ts
 M src/lib/documents/document-access.ts
 M tests/unit/partner-documents-route.test.ts
?? prisma/migrations/20261102180000_portal_student_document_versioning/
?? src/app/api/counselor/documents/[id]/
?? tests/unit/counselor-document-download.test.ts
?? tests/unit/crm-documents-list-authz.test.ts
?? tests/unit/document-review-version-policy.test.ts
?? tests/unit/student-documents-versioning.test.ts
?? tests/unit/message-document-upload-authz.test.ts
?? tsconfig.documents-check.json
```
`13 files changed, 383 insertions(+), 44 deletions(-)` in tracked files, plus the new route, migration and five test files.
Nothing was deleted. No existing component, route or model was removed or renamed.

---

## 12. Explicit confirmation of state

* **Changes are local only.**
* **Nothing was committed.**
* **Nothing was pushed** — the remote branch still points at `f9cb8851`.
* **No pull request was opened.**
* **Nothing was deployed.**
* No database was written to, no seeder was run, no configuration, secret, credential or repository setting was touched.

Waiting for explicit authorization before any commit, push, PR or deployment.

**Status: PARTIAL — implemented and unit-verified; not COMPLETE**, because the migration has not been executed against a real database, no isolated integration/E2E run was possible, and the Student Profile could not be checked against the supplied workbook, which is absent from this environment.
