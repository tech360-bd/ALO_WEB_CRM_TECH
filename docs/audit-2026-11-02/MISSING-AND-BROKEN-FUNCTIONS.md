# 8 · MISSING AND BROKEN FUNCTIONS

Severity: **P0** = blocks go-live or risks data/security · **P1** = user-visible defect · **P2** = waste/maintainability · **P3** = cosmetic housekeeping.
Every item below is evidenced; none is inferred from a document's claim.

---

## A. Broken at runtime or structurally

| # | Sev | Finding | Evidence | Impact |
| --- | --- | --- | --- | --- |
| A1 | **P0** | **7 endpoints have no authentication of any kind**: `/api/hr/leave`, `/api/hr/devices`, `/api/official-emails`, `/api/university-agreements`, `/api/b2b-contacts`, `/api/communications/templates`, `/api/interview-questions` | zero auth/session/role/token tokens in the files (`api-auth-scan.json`) | Any anonymous caller can read/write leave records, contracts, contacts and templates. Guarded duplicates exist (`/api/employee-access/*`), so these look like superseded legacy routes left live |
| A2 | **P0** | **22 unit test files fail** (31 tests) — pre-existing, present on base commit | re-run after `git stash`; `tests/unit/{accounting-ledger, ai-security-remediation, application-risk-score, brand-chrome-partner-footer, business-hours-policy, cms-revisions, critical-safety-remediation, erp-routes-authz-regression, journal-integrity, language-prep-requirements, public-brand-guideline, student-success-score, ucc-acceptance-steps, employee-access-acceptance, alo-study-steps, email-marketing/broadcast-send, phd/auth-access, phd/storage-security, whatsapp-{employee-communication,numbers-route,routing-route,webhook-handler}}.test.ts` | CI "Tests" gate cannot be green; two of them touch authz and storage security |
| A3 | **P1** | **4 API routes share a byte-identical body** under 4 different paths (`admin/university-data/{publish,run-scan}`, `admin/university-data/updates/[id]/{publish,rollback}`) | SHA-256 match | Impossible for all four to be correct; publish/rollback semantics likely wrong |
| A4 | **P1** | `/api/visa/metrics` and `/api/visa/overview` are the same file | SHA-256 match | Duplicate surface, ambiguous ownership |
| A5 | **P1** | Approved catalogue data previously could not become public (`status:'published_verified'`) — **fixed in unmerged commit `7e4c3922`** | `publish.ts` diff | Until that commit is merged, Super-Admin approvals do not surface on the website |
| A6 | **P2** | `src/cron/worker.ts` exists but nothing imports it; cron is driven by `vercel.json` (17 jobs) instead | import graph + `vercel.json` | Confusing dead entry point |
| A7 | **P2** | `admin/university-data/sources|coverage|review` importer pages and 2 admin import routes are unreferenced | `unreferenced-api-routes.txt`, portal linkage | Feature present, not reachable |

---

## B. Implemented but not connected (dead surface)

| # | Sev | Finding | Count | Detail |
| --- | --- | --- | --- | --- |
| B1 | **P1** | Entire parallel UI library unused | **100 dead files** | `src/components/alo/**` — ~40 portal views (`crm-dashboard`, `application-manager-portal`, `approval-center`, `audit-logs`, `auth-login/register/reset`, `super-admin-dashboard`, `command-palette`, `card-system`, …) imported by nothing. The 5 `counselor/marketing/*` pages that do import one of its views are themselves unreferenced |
| B2 | P2 | Orphan modules elsewhere | 126 dead (+33 test-only) | `components/ui` 20, `components/communication` 13, `components/course-finder` 8, `lib/video-engine` 7, `components/website` 6, `lib/ai-agents` 4, `lib/communications` 4, plus 96 singles |
| B3 | P1 | Portal pages with no inbound link | **95** | admin 31, crm 19, counselor 18, employee 11, student 10, super-admin 3 (list in report 5 §2) |
| B4 | P2 | API routes with no first-party caller | **123** | incl. all `/api/agentos/*`, `/api/brains/*`, `/api/course-import/*`, `/api/visa/checklist|reports`, `/api/employee-learning/*` |
| B5 | P2 | Prisma models referenced by no code | **212 of 618** | `usage-analysis.json` |
| B6 | P1 | **Finance has 9 API routes and 0 pages**; **PhD has 54 routes, 52 lib files and 0 pages**; **AI/agents 100 routes, 0 pages** | domain matrix | Three whole domains are API-only — no user can operate them |
| B7 | P2 | 6 API alias shims (e.g. `/api/partner/marketing` re-exports `/api/partner-admin/marketing`) | `api-auth-scan.json` | Two URLs, one behaviour |

---

## C. Missing capability (nothing implements it)

| # | Sev | Missing | Why it matters |
| --- | --- | --- | --- |
| C1 | **P1** | Faculty/department structure per institution | `Department` model has **no university link**; `UniversityFaculty` joins by string slug. Requirement "faculty/school/department coverage" cannot be met or measured |
| C2 | **P1** | Fee metadata: academic year, fee basis (annual/semester/credit/total), indicative vs confirmed, deposit conditions, refund URL | `CrmCourseIntakeFee` has none of these → fees cannot be compared safely |
| C3 | **P1** | Separate English-requirement entity (accepted tests, validity, exemptions, UKVI) | Currently a handful of numeric columns inside `CrmCourseRequirement` |
| C4 | P1 | Course document requirements | No model links required documents to a course |
| C5 | P1 | Institution alias **table** with merge history | Only a JSON `aliases` string |
| C6 | P2 | Structured accreditation entity | Free text only |
| C7 | P2 | Duplicate-merge execution | `catalog-review` explicitly reports `mergeAvailable: false`; duplicates can only be corrected manually |
| C8 | P1 | Coverage reporting by institution/department | Only course-month coverage exists (`CrmCourseMonthlyCoverage`) |
| C9 | P2 | Admin portal layout | No `src/app/admin/layout.tsx` → no consistent admin chrome or navigation |

---

## D. Broken data (see report 3 for the full analysis)

| # | Sev | Finding |
| --- | --- | --- |
| D1 | **P0** | Every generated course URL is fabricated — e.g. `https://www.ox.ac.uk/courses/foundation-certificate-in-medicine` returns **404**; the pattern is `<site>/courses/<slug-of-generated-title>` |
| D2 | **P0** | 153 universities carry **conflicting** `verification_status` between `01_ALO_UNIVERSITY_MASTER.csv` and `universities.csv` |
| D3 | P1 | 145,600-row fee/intake files are 92 % duplicate rows (11,200 real) |
| D4 | P1 | `05_ALO_TUITION_FEES.csv` has no verification column at all |
| D5 | P1 | `02_ALO_COURSE_MASTER.csv` silently drops fee/intake values that `04_ALO_UNIVERSITY_COURSE_MASTER.csv` holds for the same titles |
| D6 | P2 | Evidence files that exist but are empty: `data/official-source-audit/{courses_discovered,courses_verified,rankings_verified,rejected_records}.csv` (0 rows) |

---

## E. Documentation that contradicts the code (P1)

| Document | Claim | Reality |
| --- | --- | --- |
| `ALO_FINAL_MASTER_PRODUCTION_READY.md`, `ALO_WEB_CRM_100X_COMPLETE_READY.md`, `FULL_PROJECT_MASTER_REPORT.txt` (46 MB), `ALO_FINAL_DATA_AUDIT.md` | catalogue complete / production ready | 70 identity-verified institutions, 8 verified courses, 0 destinations with course coverage; synthetic data already rejected once (`ALO_SYNTHETIC_DATA_REJECTED.csv`) |
| `ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json` (filename) | verified master | same generated set, 404 URLs |
| `docs/ARENA-*` manifests | complete file inventory | covered 5,287 of 9,789 files |

---

## F. Verified-clean areas (so effort is not wasted)

- **ESLint:** 0 errors across 2,699 files.
- **Catalogue public gate:** consistent — one helper pair used by every public surface, 57 passing tests.
- **Catalogue import safety:** dry-run, quarantine, synthetic-host rejection (`isSyntheticHost`), batch/error models, approval queue, Super-Admin re-resolution in the publish library.
- **Backups:** three implementations present (`backup-mysql.sh`, `backup_agentos.sh`, cron endpoint) — untested but not missing.
- **No lost branch work:** 47 of 48 non-PR branches contain nothing that is not already in `main`.
- **No removed API routes** since the last audit (+281 added, 0 removed).
