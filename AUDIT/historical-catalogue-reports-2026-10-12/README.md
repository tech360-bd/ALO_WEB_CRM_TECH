# Historical catalogue reports (unverified) — moved out of public/ on 2026-10-12

These files were previously served publicly from `public/docs/`. They contain verification totals or instructions that no evidence supports. They are preserved here **verbatim below a warning banner** as historical evidence only. Do not quote their numbers as facts and do not restore them to `public/`.

Current, evidence-based reports: `AUDIT/course-finder-2026-10-12/` (data quality, initial launch data, synthetic catalogue archive).

| File | Unsupported claims |
| --- | --- |
| `ALO_DATA_COLLECTION_REPORT.md` | Claims "153 verified universities", "11,185 verified courses" and a "source-verified" database. No verification evidence (reviewer, date, database query) exists in the repository; the underlying CSV/JSON datasets are generated (17,182 of 18,053 URLs in ALO_URL_VERIFICATION_REPORT.csv are PLACEHOLDER_URL). Contradicted by ALO_FINAL_MASTER_DATA_REPORT.md, which reports 1 verified university. |
| `ALO_FINAL_MASTER_DATA_REPORT.md` | Claims 1 verified university (Aston University) and 471 verified courses. Official-page fetch results for Aston exist under data/official-source-audit/, but no human reviewer verification or database record backs the "verified" label, and the counts were not reproduced against any database. Treat as unverified research evidence only. |
| `UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md` | Claims 27 universities and 26 courses with VERIFIED status in CrmUniversity/CrmCourse, with per-country counts. No database query output supports these numbers (no MySQL database has been inspected in this repository's evidence). Superseded by AUDIT/course-finder-2026-10-12/UNIVERSITY-COURSE-DATA-QUALITY-REPORT.md. |
| `INITIAL-LAUNCH-DATA-REPORT.md` | Claims the site went live with "27 Verified Institutions" from genuine verified CRM data. There is no live deployment or database evidence; the launch remains BLOCKED. Superseded by AUDIT/course-finder-2026-10-12/INITIAL-LAUNCH-DATA-REPORT.md. |
| `COUNTRY-UNIVERSITY-COURSE-COVERAGE-REPORT.md` | Lists a "Current Verified Seed Count" per country (e.g. United Kingdom: 9). No verification evidence or database query supports these counts; none of the coverage floors (140 UK / 20 per country) is met by verified data. |
| `ALO_IMPORT_REPORT.md` | Instructs operators to import ALO_UNIVERSITY_COURSE_DATA_PACKAGE.zip (generated, unverified catalogue data) with `npm run db:import` and to roll back with `npm run db:rollback`. Neither npm script exists in package.json. Real imports use /admin/data-import (preview, approval, Super Admin apply); see docs/catalogue-import/README.md. |
| `FINAL-AUDIT-REPORT.md` | Section 4 lists per-country database totals (for example United Kingdom: 150 universities, 3,120 courses; 7 published countries) and states route/handler counts and server checks as verified. No database query output, reviewer or run log backs these figures; the catalogue rows behind such counts are generated synthetic data (see AUDIT/course-finder-2026-10-12/synthetic-catalogue-manifest.json). |
| `PRODUCTION-DELIVERY-REPORT.md` | States database contents such as '400 Universities', 13 students and 34 leads as 'preserved'. No database query output backs these counts, and the 400 university rows correspond to generated synthetic catalogue data, not verified records. |

Identical copies remain at the repository root and in `alo-education-web-crm-final/`; those are not served by the web app and now carry the same banner.
