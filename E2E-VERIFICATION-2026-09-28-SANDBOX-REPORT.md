# E2E Verification & Repair Report — 2026-09-28 (Sandbox Session)

Branch: `arena/01a0e685-alo-education-z-ai` (from `main` @ `992e996`)
Environment: offline Linux sandbox, Next.js 16 dev server against seeded
SQLite dev database (560 universities / 11,200 courses / 145,600 intake-fee
rows / full CMS content). Production deployment remains **BLOCKED** (SSH
secret 403 — unchanged from `MASTER-AUDIT-2026-09-28-COMPLETE-SYSTEM-REPORT.md`).

Every claim below was executed live in this session. Anything not listed as
VERIFIED was not tested.

---

## 1. Defects found and fixed (all verified live after fix)

### 1.1 Public lead intake returned HTTP 500 for every *new* inquiry — CRITICAL
- **Symptom:** `POST /api/leads` (anonymous website inquiry) crashed with 500
  after successfully creating the lead, assignment, and timeline. Duplicate
  submissions worked; only fresh leads failed. On production this means every
  first-time inquiry sees an error page, inviting resubmits (which then land
  as DUPLICATE rows).
- **Root cause:** `AuditLog.userId` was `String @default("")` with a foreign
  key to `User`. System-generated audit rows (no acting user) inserted `""`,
  violating the FK (`P2003`) at `src/app/api/leads/route.ts:128`.
- **Fix:** `prisma/schema.prisma` — `AuditLog.userId` is now `String?`;
  MySQL migration `prisma/migrations/20260928060000_audit_log_nullable_user/`.
- **Evidence:** before fix — `POST /api/leads` → 500, dev-server log shows
  P2003 at route.ts:128. After fix — `POST /api/leads` (synthetic.inquiry3@)
  → **HTTP 200**, lead `ALO-L-10007`, DB shows status CONTACTED, counselor
  auto-assigned ("least workload"), audit row written with `userId: null`.

### 1.2 Schema-wide FK anti-pattern (documented, NOT all fixed)
A scan of `prisma/schema.prisma` found **25 models** using
`@default("")` on a foreign-key scalar. Only `AuditLog` (the one system-written
without a user, and the one crashing in production paths) was changed this
session. The remaining 24 are written from flows that always supply a real id
today, but each is a latent P2003/orphan risk:

NOT-NULL + empty default: `MarketingAuditLog.userId`,
`ImportStagingStudent.batchId`, `VisaInterviewQuestion.interviewId`,
`VisaInterviewAnswer.interviewId`, `CrmCourse.universityId`,
`CrmCourseRequirement.courseId`, `CrmScholarship.universityId`,
`CommunicationMessage.threadId`, `PortalStudentApplication.studentProfileId`,
`StudentEducationRecord.studentProfileId`, `StudentWorkExpRecord.studentProfileId`,
`StudentEnglishTestRecord.studentProfileId`, `StudentVisaRefusal.studentProfileId`,
`CountryStudyReason.countryId`, `EnglishPrepAcceptance.testId`,
`EnglishPrepRequirement.testId`, `EnglishPrepSuccessStory.testId`,
`ApplicationStatusLog.applicationId`, `ApplicationComment.applicationId`,
`ApplicationDocument.applicationId`, `Campus.universityId`,
`EntryRequirement.courseId`.
Nullable but empty-string default: `LoginAttempt.userId`,
`StudentReferral.studentProfileId`.

**Recommendation:** make each nullable or required-without-default in a
follow-up migration, model by model, with data backfill checks.

### 1.3 Middleware blocked 11 public marketing pages — HIGH
- `src/proxy.ts` `PUBLIC_ROUTES` was missing `/news`, `/events`,
  `/eligibility-check`, `/eligibility-checker`, `/compare`,
  `/student-journey`, `/english-test-prep`, `/research-opportunities`,
  `/admission-requirements`, `/application-process`, `/student/login`,
  `/student/register`, `/offline` — all redirected anonymous visitors to
  `/login`.
- **Fix:** 14 entries added to `PUBLIC_ROUTES`.
- **Evidence:** 30-route curl smoke test — before: 307→/login on all of the
  above; after: all 200. Gated routes unchanged (`/student/dashboard`,
  `/admin` still 307→login when anonymous).

### 1.4 `/courses` and `/english-tests` returned 404 — matches live-prod audit defect
- Only `[slug]` children exist for these segments; the index URLs 404'd
  (also observed on live aloeducation.com in the earlier audit).
- **Fix:** permanent redirects in `next.config.ts`:
  `/courses → /course-finder`, `/english-tests → /english-test-prep`.
- **Evidence:** curl now returns 308 to the targets; slug children unaffected.

### 1.5 Lead auto-assignment preferred admins over counselors (fixed earlier this session)
- `src/lib/crm-automation.ts` `autoAssignCounselor` now builds a
  counselor-first pool with role-priority tie-breaking.
- **Evidence:** registration and inquiry leads both assigned to
  `COUNSELOR`-role users with reason "least workload (N active leads)".

### 1.6 Fabricated statistics removed (content governance)
Hardcoded unverifiable claims ("362+ universities", "98% visa success",
"5000+ success stories", "12,000+ applications") removed from:
`src/components/website/UniversitiesListing.tsx`, `src/app/universities/page.tsx`,
`src/app/student-journey/page.tsx`, `src/app/student/login/page.tsx`,
`src/lib/services-data.ts`, plus `src/app/api/homepage/route.ts` and
`src/app/api/universities/route.ts` now serve DB-driven numbers.
New `src/components/website/LiveUniversityCount.tsx` renders the real count.

### 1.7 Integration-test guard corrected
`tests/integration/consultation-workflow.test.ts` skipped only when
`DATABASE_URL` was unset, but its documented contract requires a disposable
MySQL DB; a sqlite `file:` URL made it run and fail environmentally. Guard now
requires `mysql://`. (No assertions changed.)

---

## 2. E2E scenarios executed this session

| # | Scenario | Result | Evidence |
|---|----------|--------|----------|
| 1 | Student registration → portal user + profile + CRM lead → counselor auto-assignment | **PASS** | synthetic.student2@aloeducation.dev: PortalUser, PortalStudentProfile, Lead (STUDENT_PORTAL_REGISTRATION) assigned to counselor.one ("least workload (0 active leads)"); duplicate email rejected; exactly 1 lead row; login OK; wrong password rejected |
| 2 | Anonymous website inquiry → lead scored/assigned/audited; duplicate detection | **PASS (after fix 1.1)** | fresh POST → 200, ALO-L-10007 CONTACTED + counselor.two + audit row (userId null); duplicate POST → DUPLICATE status with `duplicateOfId` |
| 3 | Course/university search | **PASS** | `/api/course-finder/search?q=data science`, `/api/courses?search=computer` return real seeded Oxford/UK records |
| 4 | Public route access + auth gating | **PASS (after fixes 1.3/1.4)** | all public marketing pages 200; `/courses`,`/english-tests` 308; `/student/dashboard`,`/admin` gated |
| 5 | Admin (SUPER_ADMIN) login via next-auth | **PASS** | credentials sign-in 200 → session `roles:[SUPER_ADMIN]`; `/admin/dashboard` 200 with cookie; wrong password → 401 |
| 6 | RBAC isolation (counselor vs admin areas) | **PASS** | counselor session: `/admin/dashboard` → 307 to `/counselor/dashboard`; own dashboard 200 |
| 7 | Reference pages render from DB | **PASS** | `/destinations/uk` 200 (full country page), `/universities/university-of-oxford` 200; `/api/scholarships` correctly returns "No verified scholarships yet" instead of fabricating |

Not executed this session (remain NOT VERIFIED): document upload/OCR flow,
WhatsApp/SMS/email sending (no provider credentials in sandbox), B2B partner
portal flows, application-submission lifecycle, marketing automation runs,
AI agent execution, payment flows, production deployment.

*(Sandbox note: the seeded super-admin had an empty password hash by design —
`prisma/seed.ts` requires `SEED_SUPER_ADMIN_PASSWORD`. The dev fixture script
now optionally repairs an empty hash via `DEV_ADMIN_PASSWORD`; it never
overwrites an existing hash.)*

---

## 3. Static verification (after all edits)

- `npx tsc --noEmit` — **0 errors**
- `npm run lint` — **0 errors, 0 warnings** (removed one unused
  eslint-disable directive in `src/lib/db.ts`)
- `npx vitest run` — **251 passed, 7 skipped, 0 failed** (23 files)

---

## 4. New development infrastructure (sandbox only, no production impact)

Offline SQLite dev pipeline (docs: `docs/DEV-SQLITE-SANDBOX.md`):
`scripts/dev-sqlite/{generate-dev-schema.mjs, patch-wasm-loader.mjs,
preload.cjs, seed-dev-fixtures.ts}`, `prisma/dev-sqlite.config.ts`.
`src/lib/db.ts` uses the libsql/WASM client **only** for `file:` URLs; the
MySQL path is untouched. Generated artifacts (`prisma/schema.dev.prisma`,
`prisma/dev.db`) are gitignored. Repaired seed scripts
(`prisma/seed-homepage.ts`, `prisma/seed-counselor.ts`) had drifted from the
current schema (renamed fields/models, status-value conventions) and now run
cleanly.

---

## 5. Outstanding work (honest status)

1. **Production deployment** — still blocked on the SSH secret (403). The
   8 IDOR/auth fixes from `cf9f133` and everything in this session are
   undeployed; live aloeducation.com still serves the `/courses` 404 and the
   lead-intake 500 risk.
2. **24 remaining FK-default models** (§1.2) — follow-up migrations needed.
3. Untested subsystems listed in §2 — require provider credentials and/or
   staging MySQL to verify; none should be claimed working.
4. Competitor benchmark matrix and reference-template rollout to all
   country/university/course records — not performed this session.
