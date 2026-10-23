# International University, Course, Admission, Scholarship and CRM Data Catalogue

## Added

A unified CRM landing page with the exact requested title, available through **International Data Catalogue** in the CRM Course & University sidebar and the existing Data navigation registry.

View key: `crm-data-catalogue`. Registered in the portal store, root CRM page map and secondary CRM view router.

The five searchable sections reuse existing destinations:

| Section | Existing destination |
|---|---|
| International universities | `crm-universities` |
| Courses & programmes | `crm-course-finder` |
| Admission information | `crm-course-finder` for course requirements; separate `crm-applications` link for individual admission cases |
| Scholarships & funding | `crm-scholarships` |
| CRM data & admission cases | `crm-students` |

Additional links open the existing source/update centre, admission cases and CRM audit history. Section search filters the navigation cards, not university records; actual record search stays in the existing modules.

No duplicate catalogue database, import pipeline, public header/footer or scheduler was added. No university/course/admission facts were generated or marked verified. The page explicitly distinguishes recorded data from complete university research and academic information from personal CRM case data.

## Scholarship integrity fix

During integration, the existing scholarship page was found generating fictional scholarship names, eligibility and award values from course tuition (20% / 50%). That code has been removed.

The scholarship page now reads actual paginated `/api/crm/scholarships` records. It displays stored award values/currency or percentage, deadlines, eligibility, verification status and HTTPS evidence links. Unrecorded information is labelled as such. It does not default to GBP, mix currencies into an average, infer eligibility or turn a failed fetch into a zero-record success.

Scholarship GET now validates numeric pagination and search length, rejects student/partner access to internal review records using the existing authenticated user-type guard, and returns an error if the table is unavailable rather than falsely reporting a successful empty catalogue. No write API behavior was changed.

## Verification

- 66 focused tests passed across four files: the two new feature tests plus existing catalogue write/security regression tests.
- Scoped ESLint passed for every changed source/test file.
- `git diff --check` passed.
- Prisma client verification remains blocked by the missing generated client. A full application build, real database/API check and authenticated browser session were not certified.
- Previous monitoring verification evidence describes the earlier code checkpoint; it is not a full-suite certification of these later catalogue changes. The broader monitoring task's five complete end-to-end acceptance rounds remain outstanding.

New tests:
- `tests/unit/international-data-catalogue.test.ts`: server-rendered title/sections, destination registration and no fabricated scholarship-generation code.
- `tests/unit/crm-scholarship-catalogue.test.ts`: mocked authenticated GET, invalid pagination, student/partner exclusion, stored values and failure handling. These are handler tests, not database integration proof.
