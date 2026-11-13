# Course catalogue — import validation results

**Date:** 2026-10-25
**Environment:** development sandbox, no MySQL reachable, no outbound access to
university websites.
**Verdict:** the pipeline is functional and its guards pass; the **bulk catalogue is
not publishable** and is quarantined. Numbers below are measured from the files in
the repository, not estimated.

## 1. Commands executed and their real output

| Command | Result |
|---|---|
| `node scripts/test-canonical-import-validation.mjs` | exit 0 — all 8 canonical CSVs parsed clean (see §3) |
| `node scripts/test-import-pipeline.mjs` | exit 0 — formula-injection sanitisation, header-alias mapping, duplicate engine all PASSED |
| `node scripts/audit-catalogue-csv-quality.mjs` | not run in this pass (needs a decision on which dataset is authoritative); available |
| Database-backed `preview → approve → execute` | **BLOCKED** — no MySQL server (`mysqldump`/`mysql` client also absent) |
| Live URL verification of any imported row | **BLOCKED** — sandbox network is limited to package registries and GitHub |

## 2. Inventory of the two catalogue datasets

### A. Bulk master (the one that must not be published)

| File | Rows |
|---|---|
| `01_ALO_UNIVERSITY_MASTER.csv` | **400** institutions, 56 columns |
| `02_ALO_COURSE_MASTER.csv` | **17 653** courses, 40 columns |
| `05_ALO_UNIVERSITY_COVERAGE.csv` | 400 rows |
| `11_ALO_SOURCE_PROVENANCE.csv` | **18 053** provenance rows |

Universities by country: United Kingdom 140; United States 20; Canada 20;
Australia 20; Ireland 20; New Zealand 20; Germany 20; UAE 20; … (a flat 20 per
country pattern, which is itself a signal of generation rather than discovery).

Courses by `degree_level`: Foundation 4 509 · Postgraduate 4 469 ·
Undergraduate 4 450 · PhD 4 225 (near-equal buckets).

### B. Canonical set (the one the import pipeline validates)

| File | Rows |
|---|---|
| `01_universities.csv` | 362 |
| `02_courses.csv` | 1 790 (Postgraduate 1 058 · Undergraduate 732; all rows `VERIFIED`) |
| `03_course_intakes_fees.csv` | 3 580 |
| `04_course_requirements.csv` | 1 790 |
| `05_country_specific_requirements.csv` | 362 |
| `06_scholarships.csv` | 3 411 |
| `07_rankings.csv` | 362 |
| `08_source_evidence.csv` | 1 790 (each with `source_url`, `page_title`, `content_checksum`, `evidence_snippet`, `extracted_at`) |

The canonical set carries the provenance shape the policy requires. Whether those
URLs actually resolve cannot be checked from this sandbox.

## 3. Provenance measurements (bulk master)

| Measure | Count | Share |
|---|---|---|
| Provenance rows whose source is `Seeded Template Website` | **17 581** | 97.4 % of 18 053 |
| Provenance rows whose source is `Official Course Page` | **471** | 2.6 % |
| Provenance rows whose source is `Official Crawled Portal` | 1 | <0.1 % |
| `verification_status = NEEDS_REVIEW` | **17 581** | 97.4 % |
| `verification_status = VERIFIED_OFFICIAL` | **472** | 2.6 % |

Sample seeded row (verbatim, Oxford):

```
source_name    : Seeded Template Website
source_url     : https://www.ox.ac.uk
evidence       : Seeded ranking-based metadata
entity_type    : UNIVERSITY / COURSE
```

### Coverage file

| `coverage_status` | Universities |
|---|---|
| `CATALOGUE_NOT_ACCESSIBLE` | **399** |
| `CATALOGUE_COMPLETE` | 1 |

`programmes_discovered` = `programmes_imported` = `programmes_verified` = **471**
across all 400 institutions.

## 4. URL integrity

* `official_course_url` is non-empty for all 17 653 rows — which is itself
  suspicious, because 17 581 of them have no official page behind them.
* In a 4 000-row sample, **2 464 URLs follow exactly
  `https://<university-root>/courses/<slug-of-course-title>`** (e.g.
  `https://www.ox.ac.uk/courses/foundation-certificate-in-medicine`). That
  mechanical pattern, combined with the seeded provenance and the homepage-only
  `source_url`, is evidence that the URLs were **constructed from titles**, which
  `source-policy.md` §4.1 forbids.
* Course IDs contain an en dash (`UNI-UN-0001-FOU–001` — 17 633 rows), consistent
  with generated identifiers.

## 5. Is any of this reaching the public?

**No.** The public surface is gated by `src/lib/public-catalog.ts`:
`publicCourseWhere()` requires `status = 'active'` **and**
`verificationStatus = 'VERIFIED'` **and** a published `publicationStatus`
**and** a source link, and the parent university must itself be public.
`src/app/api/courses/[slug]/route.ts` returns 404 with an explicit
"No published, verified, source-linked course record is available" for anything
else, and `src/app/sitemap.ts` applies the same rule. Since 17 581 bulk rows are
`NEEDS_REVIEW`, they are not served, not in the sitemap, and not indexable.

## 6. Findings that block publication of the bulk master

| # | Finding | Severity |
|---|---|---|
| 1 | 97.4 % of rows carry a seeded-template provenance and no official page | **Critical** |
| 2 | URLs appear constructed from titles rather than captured | **Critical** |
| 3 | 399 of 400 institutions have no accessible catalogue (coverage: 0 programmes verified) | High |
| 4 | Titles exist that no official evidence in the repository supports (e.g. "Foundation Certificate in Medicine" at Oxford) | **Critical** |
| 5 | Fee/deadline columns are absent from the bulk course file (no `fee`, `tuition`, `deadline` columns), so no fee or deadline can be shown | High |
| 6 | Duplicate concept `Award` vs `degree_level` vs `qualification` is not normalised | Medium |

**Decision:** `02_ALO_COURSE_MASTER.csv` remains a **candidate/discovery** artefact.
It must not be bulk-imported into `CrmCourse` as verified data. Import only the
canonical set, institution by institution, with an official page captured for each
row (471 rows are the current realistic upper bound until more adapters exist).

## 7. What was not verified

* Production database counts (no MySQL). "Universities already in the CRM" must be
  read on the host with a read-only query; it is not claimed here.
* Whether the 1 790 canonical rows' URLs resolve (network blocked).
* Whether the 471 `VERIFIED_OFFICIAL` rows were verified by a human or by an
  automated check — `CrmOfficialSourceCheck` holds that evidence and is unreachable
  from here.
