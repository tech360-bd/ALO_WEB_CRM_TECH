# ALO CRM — University Information Pages: Final Check & Catalogue Reconciliation (2026-11-16)

**Scope of the request:** "final check and every university info page build — no miss any single university info page with all course info, with all."

**Headline answer:** All 400 university records in the catalogue are accounted for in the coverage ledger (`docs/university-info-page-coverage-2026-11-16.csv`) — **no university is missing from the data layer or from the page system**. However, **only 1 of 400 (Aston University, UNI-UN-0039) is publishable as an information page with real course data today**. The other 399 must **not** be published as complete pages: their course records in this repository are rejected synthetic template data (17,182 records, all `NEEDS_REVIEW`, "Template pattern fallback" evidence) or absent entirely. Publishing them would present fabricated facts as official information — prohibited by the repository's own data policy and by the engagement honesty constraints. Infrastructure exists; verified data does not.

## 1. How university info pages work in this codebase (verified by inspection)

| Layer | Evidence |
| --- | --- |
| Dynamic detail route | `src/app/universities/[slug]/page.tsx` — `force-dynamic`, DB-backed. Renders `UniversityHub` (Crm catalogue) when a published/VERIFIED CrmUniversity row exists, otherwise legacy `UniversityPage` record. Legacy path **paginates all** international-eligibility course pages (`COURSE_PAGE_SIZE = 30`) — no hidden catalogue cap. |
| CRM course listing API | `src/app/api/universities/[slug]/route.ts` — paginated (`internationalCourseCatalog`): counts candidate/verified/published/international-eligible records separately, source-linked intake rows only, eligibility not confirmed ⇒ hidden; **never claims exhaustiveness**; `includeCourseCatalogue` query param drives the full catalog view. |
| Public visibility policy | `src/lib/public-catalog.ts` (`publicUniversityWhere/publicCourseWhere`) and `src/lib/course-finder/public-content-page-policy.ts` — require `status: active`, `verificationStatus: VERIFIED`, publish status, `sourceUrl`/`officialUrl` starting with `https://`, no open data conflict; fail-closed. |
| Sitemap | `src/app/sitemap.ts` — enumerates `/universities/*` dynamically from the same policies. No hard-coded list ⇒ no missing/duplicate sitemap entries. |
| Directory pages | `/universities`, `/all-university-information`, `/destinations/[slug]/universities` all render `<UniversitiesListing />` live from the database; description text explicitly avoids claiming world-wide completeness. |
| Metadata policy | `generateMetadata` draws only from published DB records — no static fallback. |

**Consequence:** there are no per-university static files to build, and creating 400 static page files would create duplicate/contradictory sources of truth. A university "info page" becomes live automatically when its records pass policy and are published — for all 400 IDs without code changes.

## 2. The 400-university inventory (full list in CSV)

| Country | Universities |
| --- | --- |
| United Kingdom | 140 |
| United States | 20 |
| Canada | 20 |
| Australia | 20 |
| Ireland | 20 |
| New Zealand | 20 |
| Germany | 20 |
| UAE | 20 |
| France | 20 |
| Netherlands | 20 |
| Italy | 20 |
| Malta | 20 |
| Cyprus | 20 |
| South Korea | 20 |
| **Total** | **400** |

| Finding | Count | Evidence |
| --- | --- | --- |
| University skeleton records (master + logistics/URLs) | 400/400 | `ALO_UNIVERSITY_MASTER.csv`,`ALO_UNIVERSITY_COURSE_MASTER.json`; all have official URLs (0 missing) |
| `NEEDS_REVIEW` verification status (catalogue) | 399 | catalogue `verification_status` counter |
| `VERIFIED_OFFICIAL` | 1 (Aston) | same |
| Verified course records (JSON-catalogue) | 471 / 17,653 | Aston only |
| Rejected synthetic course records (template evidence) | 17,182 / 17,653 | `ALO_SYNTHETIC_DATA_REJECTED.csv` (17,183 rows incl. 1 other); all `NEEDS_REVIEW` |
| Course rows in flat CSV (`ALO_COURSE_MASTER.csv`) | 471 unique courses / 823 intake rows | Aston only |
| `ALO_COURSE_COVERAGE_REPORT.csv` claims | 153 COMPLETE, 247 PARTIAL | **unsupported**: 0 of the 153 "COMPLETE" universities have any course rows in the repo |
| Official-source verified staging dataset (2026-10-29) | 10 universities, 8 courses, 30 evidence records, 104 course-month coverage rows, 17-item research queue | `data/verified-2027/dataset.json` |
| Research queue outstanding | 17 | same dataset |
| Missing-info field rows (all 400 universities) | 3,600 | `ALO_MISSING_UNIVERSITY_INFO.csv` |

### The 10 officially-verified institutions (staging, 2026-10-29) — with 400-master IDs where present

| Verified institution (dataset.json) | 400-master ID | Courses verified |
| --- | --- | --- |
| The University of Manchester | UNI-UN-0007 | MSc Accounting |
| Centennial College | NOT IN 400 | Biotechnology (Fast-Track) — Centennial is 2027-verified; not in the 400 master catalogue |
| Monash University | UNI-AU-0186 | Construction Project Management |
| Dublin Business School | UNI-IR-0219 | Master of Business |
| Kyoto University | NOT IN 400 | MSc Informatics |
| Ulster University | UNI-UN-0093 | Master of Data Science |
| Technical University of Munich | UNI-GE-0241 | MSc Computer Science |
| The University of Auckland | UNI-NE-0221 | BSc Computer Science & Engineering |
| University of Copenhagen | NOT IN 400 | (coverage rows, no course-level record in dataset) |
| Yonsei University | UNI-SO-0383 | (same) |

Note: Copenhagen and Yonsei are verified at institution/coverage level without course-level records in the staging dataset; Centennial, Kyoto, Copenhagen are absent from the 400-master catalogue entirely (would require a catalogue addition, not just verification).

## 3. Data integrity findings (must be fixed before any bulk publish)

1. **`ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json` (51 MB) is mislabelled** — it contains all 17,182 rejected synthetic rows alongside the 471 real ones; anyone ingesting it wholesale would publish fabricated courses. Do not import without filtering `verification.status === "VERIFIED_OFFICIAL"`.
2. **Coverage report is not corroborated by data**: 153 "COMPLETE" rows with zero shipped course records; even Aston (the data-rich case) shows a claim of 49 programmes vs 471 actual verified courses, and `coverage_status: PARTIAL`. The report cannot be used as publication evidence as-is.
3. **Aston artifacts are internally inconsistent** (823 intake rows for 471 courses; coverage 49/49/0; missing-info 9 field rows). Needs reconciliation against aston.ac.uk official pages before full-page publication sign-off.
4. **`seed-400-universities.ts`** (legacy, destructive `deleteMany` chains) generated the synthetic rows and must never be re-run; it is inventoried as "do not execute".
5. The 400-master catalogue `verification_status` for 399 universities is `NEEDS_REVIEW` — consistent with policy; pages for these must remain unpublished until per-university verification (evidence → ingest → publish) is complete.
6. The `verified-2027` staging dataset README (18 evidence/6 unis/4 courses) is stale vs `dataset.json` (30/10/8) — update docs when the next verified-2027 batch ships.
7. **Database verification is impossible here** (P1001, no `DATABASE_URL`): publication state of CrmUniversity/UniversityPage/CoursePage rows in production was not checked. "Publishable now" in the ledger = eligibility per data policy, not deployment confirmation.

## 4. What was built vs what was deliberately not built

**Built:** the 400-row coverage ledger (`docs/university-info-page-coverage-2026-11-16.csv`); this reconciliation report.

**Not built (and why):**
- No static per-university pages for the 399 — they would publish unverified/fabricated content and duplicate the dynamic route.
- No DB seed of the 400 skeletons into Crm* tables from here — no database reachable; and bulk publication would violate the policy.
- No bulk "APPROVED" flip in any tracked file — statuses changed to VERIFIED without official evidence would be falsification.
- The verified-2027 ingestion path (`scripts/verified-catalogue/ingest.ts`) exists and was not run: it writes to the production DB and needs explicit approval after a backup.

## 5. Exact path to "every university info page live with all course info" — the real work

Per university, the existing pipeline is: (a) official-source research queue (`dataset.researchQueue`, or a fresh batch) → (b) evidence excerpts + SHA-256 → (c) `scripts/verified-catalogue/ingest.ts` → (d) review `NEEDS_REVIEW`→`VERIFIED` via admin → (e) publish → page goes live automatically. Requirements per university: official catalogue traversal, per-course verification, fee/intake records that cite `https://` sources on the institution domain, then publication. **Nothing in this repo replaces steps (a)–(d).**

Blocking inputs:
1. Verification labour or source access for 399 universities (this is a data-research programme, not a coding task; estimates in docs/audit-2026-11-02).
2. Production DB access + backup if/when ingestion is approved (ingestion currently un-run).
3. Decision on whether to add the 3 staging-only verified institutions (Centennial, Kyoto, Copenhagen) to the 400-master catalogue.
4. Reconciliation of the coverage report vs the flat CSVs (replace claims with verified counts).
5. Decision on the 17,182 rejected synthetic records: permanently excluded from publication (recommended), or re-researched per official sources.

## 6. Bottom line

- **"No miss any single university": PASS at the inventory/system level** — 400/400 records exist, are linked to the page system and sitemap, and are all in the CSV ledger with explicit per-university status.
- **"Every info page with all course info, live": FAIL at the data level** — 1/400 eligible today (Aston, 471 verified courses); 10 institutions staged with official-source evidence (2026-10-29); 17,182 course records rejected as synthetic and must never be published.
- **One concrete fix ready now:** when DB access and backup are approved, ingest + publish Aston (reconcile the 823 intake rows) and the 10 verified-2027 staging institutions — that puts real, sourced pages live for up to 11 institutions immediately after human review; the remaining 389-390 require the research programme in §5.

*Prepared 2026-11-16. No production data was changed. No message was sent. No verification status was altered.*