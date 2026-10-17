# Catalogue review queues (2026-10-14)

These CSVs are **review queues, not verified catalogue data**. They were generated from repository evidence only. No live database was queried or changed, and no new university/course page was fetched during this queue build.

| File | Size | What it represents |
| --- | ---: | --- |
| `aston-course-discovery-candidates.csv` | 471 course-link candidates | Aston directory links matched to the existing ALO course IDs by exact official URL. |
| `uk-university-profile-review-queue.csv` | 140 university candidates | Existing UK ALO IDs and candidate homepage/ranking text, with provider/edition/rank/source URL left blank for verification. |
| `bangladesh-destination-review-shortlist.csv` | 24 university candidates | Existing ALO university IDs and unreviewed homepage URLs, for a destination-market/source review. |

## Aston course-link queue

`data/official-source-audit/aston_course_discovery.csv` contains 471 unique course URLs from Aston’s A-to-Z directory; the same URL set exists in `ALO_COURSE_MASTER.csv`. The generated queue preserves each existing `course_id`, the official link text, course URL, directory source URL, and discovery content hash. It intentionally leaves course level, code, intake, deadline, fee, requirement and eligibility facts blank. The five repeated directory titles remain separate rows because each has a different URL; determine from the source whether these are separate projects/offers or duplicates before merging.

The discovery crawl report states **3 individual course pages checked, 3 pages parsed, 0 courses verified**. Directory-link discovery does not prove the linked page is currently active, open to international students, or complete. Rows therefore say `international_eligibility=not_verified`, `verification_status=NEEDS_REVIEW`, `publication_status=draft`, and `individual_course_page_checked=false`.

The queue can be loaded through Admin → Data Import → Preview, then staged as draft/unverified rows if the IDs do not already map to reviewed course records. The import now accepts course-only records without intake years/months and creates no intake, fee, or requirements row when those facts are absent. It will not overwrite protected/published course records; inspect preview errors and proposals rather than changing IDs or inventing intakes to force an import.

## UK profile and ranking review queue

`uk-university-profile-review-queue.csv` contains 140 rows with the existing UK university IDs and candidate official-homepage URLs from `ALO_UNIVERSITY_MASTER.csv`. The source-master verification labels are recorded separately; they are not promoted to queue verification. The current source audit has 139 rows marked `NEEDS_REVIEW` and one marked `VERIFIED_OFFICIAL`, but neither a status label nor a text claim establishes that a ranking or profile is verified.

Candidate ranking text is preserved for audit only. `ranking_provider`, `ranking_edition`, `world_rank` and `ranking_source_url` are intentionally blank; verify each rank against an official ranking-provider page and store provider, edition/year, rank/band, exact source URL and retrieval date before populating `CrmRanking`. This prevents template values such as a repeated “QS World University Rankings 2027” string from being mistaken for full ranking evidence. All 140 course catalogues remain `NOT_CHECKED` in this queue. The 140 count is a review scope, not verified full-spectrum ranking coverage or proof that each profile is detailed/accurate.

These university-only rows can be previewed and, when absent from the CRM, staged as draft/unverified profiles. Existing verified/published institutions are not overwritten. The ranking review metadata is not applied as a ranking record by the importer.

## Bangladesh destination-market shortlist

This shortlist contains **24 total candidates**, not 20 per country:

- Australia: 8
- New Zealand: 6
- Canada: 6
- Ireland: 2
- United States: 2

All IDs and candidate homepage URLs are carried over from `ALO_UNIVERSITY_MASTER.csv`. That file’s international rows are unreviewed; copying them does not verify the URL, current institution status, course inventory, ranking, or Bangladesh-market popularity. Every row is marked `NEEDS_REVIEW`, `NOT_VERIFIED`, and `NOT_CHECKED`; ranking fields and course-catalogue URLs are blank. The current repository contains no independent enrolment, application, or source citation that substantiates “popular among Bangladeshi students.” Treat these as candidates to research, not a popularity ranking.

The CSV includes blank `course_id` and `course_title` columns so university-only candidates can be previewed and staged through the same safe draft-import workflow. University-only staging creates a draft/unverified university record and does not create a course or intake. If a same-ID row already exists, review its current data; the importer will not overwrite a verified/published university.

## Publication and coverage gates

A row becomes public only after an authorized reviewer has checked the official source, filled the source-backed fields, recorded explicit course international eligibility (where relevant), and completed the independent verification/publication workflow. The CRM university/course public catalogues require verified, published, active, source-linked rows; the international course list additionally requires an explicit positive eligibility status. Intakes and fees are shown only when the intake/fee records themselves are verified and source-backed. A missing intake does not hide an otherwise verified international course.

Neither candidate count is a coverage certificate. The 471 links are Aston directory discoveries, not 471 verified eligible courses; the 24 university candidates are not database-ready verified profiles. The separate 140-UK-university requirement and ranking-level coverage remain unverified until each institution’s official details and a provider/edition-specific ranking source are reconciled.

Regenerate with:

```bash
python3 scripts/build-catalogue-review-queues.py
```

The script fails if Aston URL reconciliation changes, an existing ID is missing/repeated, or a requested shortlist institution is absent from the source master. It never connects to a database or upgrades verification/publication status.
