# 4 · DUPLICATE AND CONFLICT REPORT

**Basis:** SHA-256 of all 9,789 inspected files (`inventory.csv`), duplicate-key analysis on all 2,014 dataset files (`datasets.csv`), import-graph analysis of `src/` (`usage-analysis.json`), and targeted value comparisons.

---

## 1. Byte-identical duplication (whole repository)

| Measure | Value |
| --- | --- |
| Duplicate hash groups | **1,576** |
| Redundant copies (files that are a repeat of another file) | **3,372** |
| Reclaimable space | **550.7 MB** (≈14 % of the 3.8 GB checkout) |
| Duplicate groups **inside `src/`** | 4 |

### Largest duplicate groups (all exact SHA-256 matches)

| Size | Copies | Example path |
| --- | --- | --- |
| 51.5 MB | 2 | `ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json` = `alo-education-web-crm-final/ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json` |
| 47.3 MB | 2 | `FULL_PROJECT_MASTER_REPORT.txt` = nested copy |
| 21.7 MB | 3 | `02_ALO_COURSE_MASTER.csv` (root + nested + import package) |
| 21.1 MB | 2 | `docs/import-templates/package/02_ALO_COURSE_MASTER.csv` ×2 |
| 11.6 MB | 4 | `06_ALO_APPLICATION_DEADLINES.csv` |
| 11.4 MB | 2 | `COMPLETE_PROJECT_MANIFEST.txt` |
| 11.0 MB | 2 | `FULL_PROJECT_AUDIT.txt` |
| 10.4 MB | 4 | `04_ALO_UNIVERSITY_COURSE_MASTER.csv` |
| 8.9 MB | 4 | `03_ALO_COURSE_INTAKES_2027.csv` |
| 8.8 MB | 5 | `03_course_intakes_fees.csv` |
| 4.0 MB | 4 | `11_ALO_SOURCE_PROVENANCE.csv` |
| 1.9 MB | 6 | `ALO_UNIVERSITY_COURSE_MASTER.json` |
| 0.9 MB | 48 | migration / config echoes |

**Root cause:** `alo-education-web-crm-final/` is a **full second copy** of the project's data/docs (1,508 files, 385.5 MB) and `docs/import-templates/` re-ships the same CSVs in four "packages".

---

## 2. Duplicates inside `src/` (4 groups) — analysed, not assumed broken

| Group | Files | Verdict |
| --- | --- | --- |
| `src/app/api/admin/university-data/publish`, `.../run-scan`, `admin/university-data/updates/[id]/publish`, `.../rollback` | 4 identical route files | **DEFECT RISK** — four distinct endpoints with byte-identical bodies; indicates a copy-paste route family rather than four behaviours. Needs manual review. |
| `src/app/api/visa/metrics`, `src/app/api/visa/overview` | 2 identical | Same risk: two endpoints, one implementation |
| `src/app/counselor/marketing/{campaigns,content,image,posts,video}/page.tsx` | 5 identical | **Intentional** — each is a 5-line wrapper importing the same shared `components/alo/views/marketing-dashboard`. Note that this shared view is itself an **orphan** (report 8), so the whole family is dead code. |
| `src/app/student/mock-tests/{available,result/[sessionId],session/[sessionId],start/[testId]}/page.tsx` | 4 identical | **Intentional retirement** — each redirects to `/student/mock-tests` with an explanatory comment. Not a defect; safe to remove in a later cleanup. |

---

## 3. Competing implementations of the same feature (structural duplication)

| Feature | Implementations | Mounted from | Risk |
| --- | --- | --- | --- |
| Super-Admin dashboard | **4**: `MasterSuperAdminDashboard.tsx`, `SuperAdminMasterCommandCenter.tsx`, `EnhancedSuperAdminControlCenter.tsx`, `SuperAdminOperatingDashboard.tsx` | `admin/{agent-center,approvals,branch-control,branches,country-control,destinations,employees,security,system-builder}`, `crm/dashboard`, `admin/master-command`, `page.tsx`, `admin/dashboard`, `super-admin/control-center`, `crm/super-admin`, `super-admin/dashboard` | **High** — different users see different dashboards with different data contracts; fixes must be applied 4× |
| Parallel UI library | `src/components/alo/**` — **132 files**, of which **100 are imported by nothing** | only 32 used (by `counselor/marketing/*` and a few routes, themselves unreferenced) | **High** — a second, stale UI implementation of ~40 portal views |
| Catalogue data model | `CrmUniversity/CrmCourse` **and** legacy `UniversityPage/CoursePage` | public pages read CRM first, legacy as fallback | **Medium** — two gates, two status vocabularies |
| Import packages | 5 (`package`, `package-real`, `package-verified`, `uni-package`, `course-package`) | admin import reads whichever file is uploaded | **High** — five "sources of truth" for the same data |
| Catalogue "masters" | 5 course masters, 3 university masters, 5 fee files | scripts/imports | **High** — see report 3 |
| API route aliases | **6 re-export shims** (e.g. `api/partner/marketing` re-exports `api/partner-admin/marketing`) | both URLs live | **Medium** — duplicated surface area, one auth implementation (good) but two entry points to audit |
| Same-basename modules | 40 names collide inside `src/` (e.g. `audit.ts` ×4, `access.ts` ×4, `service.ts` ×4, `validation.ts` ×3) | separate domains | **Low** — by design, but increases review risk |
| Duplicate API route pair with different security | `/api/employee-access/leave` (guarded) **vs** `/api/hr/leave` (no auth token at all) | both live | **High** — see report 9 |

---

## 4. Value conflicts in the data (measured)

### 4.1 Verification labels disagree for 153 universities

399 universities appear in both `01_ALO_UNIVERSITY_MASTER.csv` and `universities.csv`. **153 rows carry a different `verification_status` in each file:**

| University | `01_ALO_UNIVERSITY_MASTER.csv` | `universities.csv` |
| --- | --- | --- |
| University of Oxford | NEEDS_REVIEW | VERIFIED_OFFICIAL |
| University of Cambridge | NEEDS_REVIEW | VERIFIED_OFFICIAL |
| Imperial College London | NEEDS_REVIEW | VERIFIED_OFFICIAL |
| University College London (UCL) | NEEDS_REVIEW | VERIFIED_OFFICIAL |
| London School of Economics (LSE) | NEEDS_REVIEW | VERIFIED_OFFICIAL |
| University of Edinburgh | NEEDS_REVIEW | VERIFIED_OFFICIAL |
| *(147 more)* | | |

Neither label is independently verified (report 3 §4). This is a **CONFLICTING SOURCES** finding.

### 4.2 The two course masters disagree on completeness, not on titles

For `University of Oxford`: 24 distinct course titles in **both** `04_ALO_UNIVERSITY_COURSE_MASTER.csv` (182 rows) and `02_ALO_COURSE_MASTER.csv` (104 rows). Title sets are identical, but:

- `04_…` carries fees (`49000`/`28000`/`17500`), study level and intake month/year, verification `NEEDS_REVIEW`;
- `02_…` carries **empty** tuition, level-month and year for the same titles.

So one file silently loses fee and intake data that the other has. Importing the "wrong" master produces a catalogue with no prices.

### 4.3 Intake vocabularies disagree

`intake_month` appears as a **text month** (`September`) and as a **numeric month** in different files. `src/lib/course-finder/intake-window.ts` supports both, but an importer that assumes one form will drop the other's rows.

### 4.4 Regulatory conflict recorded in the prior Phase-1 audit (carry forward, do not resolve silently)

TEQSA currently returns **three active** rows for the Adelaide succession: `The University of Adelaide` (PRV12105), `University of South Australia` (PRV12107), `Adelaide University` (PRV14404). The prior audit recommends preserving all three pending official reconciliation. Separately, TEQSA's page reports **221** providers while the linked data.gov.au resource reports **273** — unresolved count discrepancy, category count (44) agrees.

### 4.5 Documentation conflicts with the repository

| Claim in repository docs | Repository reality |
| --- | --- |
| Multiple docs/reports assert a "complete" or "production-ready" catalogue | **8 verified courses**, 0 destinations with completed course coverage |
| `ALO_FINAL_MASTER_PRODUCTION_READY.md` (545 KB), `ALO_WEB_CRM_100X_COMPLETE_READY.md`, `FULL_PROJECT_MASTER_REPORT.txt` (46 MB) | Aggregate marketing-style claims; contradicted by §4.1–§4.3 and by `ALO_SYNTHETIC_DATA_REJECTED.csv` |
| Filename `ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json` | content is the same generated set; 404 URLs (report 3 §4) |

**These documents must not be used as evidence of data completeness.**

---

## 5. Recommended handling (proposal, nothing executed)

1. **Freeze** `alo-education-web-crm-final/` and the four `docs/import-templates/*` packages as read-only; nominate one import package after mapping review.
2. **Archive** the synthetic masters (keep `ALO_SYNTHETIC_DATA_REJECTED.csv` as the audit trail).
3. **Resolve** the 153 verification-label conflicts by policy (one vocabulary), not by preferring whichever file was read last.
4. **Merge** the 4 super-admin dashboards into one, or document explicitly which role sees which.
5. **Delete** the orphaned `components/alo` library only after confirming no route imports it (100 files; verified zero importers).
6. **Fix** the 4 duplicated `admin/university-data` route bodies after review — identical bodies on different paths is a behaviour bug waiting to happen.
