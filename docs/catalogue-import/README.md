# Catalogue CSV import: templates and rules

There are two files in this folder:

| File | What it is |
| --- | --- |
| `catalogue-import-TEMPLATE.csv` | Header row only. Copy it and fill in **official** data. |
| `catalogue-import-EXAMPLE-SYNTHETIC.csv` | A **synthetic** example that shows the format. The institution, course, URLs and numbers are invented: the IDs start with `SAMPLE-` and the URLs use the reserved `.invalid` domain. The importer **rejects** these rows, so the example cannot enter the database. |

Neither file contains real university data, and neither is a source of truth.

## Where to upload

Admin → **Data Import** (`/admin/data-import/new`), which calls `POST /api/admin/data-import`.

1. **Preview** (`mode=preview`). Classifies every row and writes nothing.
2. **Queue changes** (`mode=queue_changes`):
   - Material changes to existing records become field-level proposals in the approval queue (`UniversityUpdateRequest`, status `pending_approval`).
   - A new intake on an existing course becomes `intake_new:YYYY-MM:<field>` proposals.
   - New universities and courses are listed for **draft staging**, which creates unverified, unpublished records.

## Same-data rule

| Row result | Meaning |
| --- | --- |
| SKIP | Identical to the stored record. Nothing changes. |
| NORMALIZE | Only the formatting differs. Nothing changes. |
| PENDING_CHANGE | A material change. It is queued for review, and the live value is kept. |
| NEW_PENDING_REVIEW | A new record. It is staged as a draft, unverified record. |
| BLOCK_DUPLICATE | A probable duplicate of an existing university. It is not imported. |
| INVALID | Validation failed (see below). It is not imported. |

A blank cell never clears a stored value.

## Columns

The CSV header must include `university_id`, `university_name`, `course_id`, and `course_title`. For a university-only candidate, leave both course cells blank; otherwise provide both course fields. `intake_year` (four digits) and `intake_month` (for example `September` or `09`) are optional, but they must either both be provided or both be blank. A university/course discovery can therefore be staged without inventing a course, intake, or fee.

All other columns are optional:

- **University:** `country`, `city`, `campus_name`, `university_type`, `founded`
- **University URLs:** `website`, `official_url`, `source_url`, or the unambiguous `university_website`, `university_official_url`, `university_source_url`
- **Course:** `study_level`, `program_level`, `subject_area`, `discipline_area`, `duration_months`
- **Course URLs and eligibility:** `course_official_url`, `course_source_url`, `international_eligibility`
- **Intake:** `intake_name`, `application_deadline`
- **Fees:** `tuition_currency`, `yearly_tuition`, `total_tuition`, `deposit_currency`, `deposit_amount`, `app_fee_currency`, `app_fee_amount`
- **Academic requirements:** `academic_req`, `grading_system`, `min_score`
- **English scores:** `ielts_overall`, `ielts_min_band`, `pte_overall`, `pte_min_band`, `toefl_overall`, `det_overall`
- **Yes/no flags:** `moi_accepted`, `portfolio_required`, `interview_required`

Validation rules:

- At most 500 rows per file.
- At most 191 characters per cell, except `course_title` (up to 512 characters to preserve official research-project titles).
- URLs must be `http(s)`.
- `SAMPLE-` IDs and reserved example domains (`example.com/org/net`, `.example`, `.invalid`, `.test`, `localhost`) are rejected.
- Formula-like cells are neutralised.

Rankings are **not** in the template. A ranking may only be shown with its provider and edition, which a single CSV cell cannot carry. Rankings also cannot be applied through the approval queue.

## Approval → apply

1. **Review.** An Admin or Super Admin approves or rejects each proposal in the CRM University Data Update Center or at `/admin/change-approval`. Approval records a SHA-256 hash of the exact payload. It changes **no** live data and never marks anything verified.
2. **Apply.** A Super Admin applies the approved proposals at `/admin/change-approval`, which calls `POST /api/admin/catalog-changes/apply`. At apply time the server re-checks:
   - the approval hash;
   - the field allowlist;
   - the value type;
   - the evidence URL (HTTPS, real domain);
   - the target identity;
   - duplicates;
   - that the live value still equals the reviewed old value.

   The whole batch is written in one transaction, or nothing is written. Stale proposals go back to review with the current live value. Re-sending an applied batch does nothing.
3. **Verification and publication** are separate steps. New intakes are created as `NEEDS_REVIEW` and are not public until they are verified.
4. **Verified records that change.** If an applied change materially alters a university, course, intake or requirement that is currently verified, that record moves to `NEEDS_REVIEW` in the same transaction. It leaves the public catalogue until someone re-verifies it. The prior and new verification state are written to the audit log (`CATALOG_RECORD_VERIFICATION_DOWNGRADED`). Publication fields and `lastVerifiedAt` are not changed, and nothing is ever marked verified by approval or apply.
5. **Historical approvals.** Approvals made before fingerprints existed (including rows labelled `approved`) show **Re-approval required** and cannot be applied until they are approved again.

The full audit trail is at `/admin/change-approval/history`.

## Blank templates, synthetic examples and verified data (added 2026-10-12)

Three kinds of file exist in this repository. Only the third kind is real data, and it only exists in the database.

| Kind | Where | Status |
| --- | --- | --- |
| **Blank template** | `docs/catalogue-import/catalogue-import-TEMPLATE.csv`; header-only files such as `docs/import-templates/conflict_log.csv` | Headers only. No facts. |
| **Synthetic or example data** | `docs/catalogue-import/catalogue-import-EXAMPLE-SYNTHETIC.csv`; the generated `docs/import-templates/01_…08_*.csv` and repository-root catalogue CSVs (listed in `AUDIT/course-finder-2026-10-12/synthetic-catalogue-manifest.json`); output of `scripts/generate-canonical-templates.mjs` (its example rows, including the Aston row and checksum `a1b2c3d4e5f6`, are illustrative only) and of every other generator guarded by `scripts/lib/synthetic-output-guard.mjs` / `scripts/lib/synthetic_output_guard.py` | Invented or unreviewed. **Never** a source of truth, never importable as verified, never publishable. |
| **Verified data** | Database rows whose `verificationStatus` is `VERIFIED` after a reviewer checked an official source, with the source URL and review history recorded | Only this may appear on public pages. No CSV file in this repository is verified data. |

The generated `docs/import-templates/01_…08_*.csv` files have rows in them, so they are **not** blank templates despite their folder name. Use `catalogue-import-TEMPLATE.csv` as the blank template.

Synthetic generators now refuse to run unless `ALO_SYNTHETIC_OUTPUT_DIR` points under `fixtures/synthetic-catalogue/` or `staging/synthetic/`, and never with `NODE_ENV=production`. Generators that rewrote `src/lib/` source files, wrote into `data/`, or changed database rows are permanently disabled.
