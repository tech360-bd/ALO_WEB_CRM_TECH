# CSV Import Guide — ALO Education Data Management Platform

> **Note (2026-10-12):** the numbered files in `docs/import-templates/` were generated and contain synthetic rows, so they are not blank templates and not verified data. Use the header-only `docs/catalogue-import/catalogue-import-TEMPLATE.csv` as the template; see `docs/catalogue-import/README.md`. An import never verifies or publishes a record by itself.

## Overview
This document outlines the standard CSV import procedure for university directories, course catalogues, tuition fees, entry criteria, rankings, and source verification metadata.

## Standard CSV Templates
1. `01_universities.csv`
2. `02_courses.csv`
3. `03_course_intakes_fees.csv`
4. `04_course_requirements.csv`
5. `05_rankings.csv`
6. `06_sources_verification.csv`
7. `07_change_approval_queue.csv`

## Execution Sequence
1. Upload file at `/admin/data-import/new`.
2. Header & column validation.
3. Automated auto-normalization (Degree aliases, ISO country codes, currency formats).
4. Duplicate detection & conflict classification.
5. Super Admin preview & batch approval.
