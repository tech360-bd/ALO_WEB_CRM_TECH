# Course Finder / Forms A–C review — 2026-10-24

## Status

**Partial implementation and targeted verification, not full checklist acceptance.** No live MySQL, email, WhatsApp, or browser end-to-end acceptance was performed. Existing source code was reviewed; this is not a claim that every existing repository module was audited.

## Existing paths reviewed

- `/course-finder`: separate COURSES / UNIVERSITIES forms, text + datalist inputs, Foundation/UG/PG/MRes/PhD, optional multiple-month intake selection. The existing planning window includes all twelve 2027 months and January 2028.
- Result course links target `/course/[slug]`; university links target `/universities/[slug]`; Apply links target `/apply/[slug]`. Result columns include tuition, interview, intake, and ranking, with unknown values distinguished from confirmed values.
- `/apply/[slug]`: authenticated application action and separate lead enquiry capture; `/api/applications` checks student Form B readiness before creating the application draft.
- Course detail rendering already has overview, requirements, fees, scholarship, deadlines and intake surfaces. Whether any particular course has all those facts depends on verified catalogue records.
- Enquiry forms already capture name, email, WhatsApp phone, destination, level and intake, and have CRM/email integration paths. Real delivery is not verified here.
- Registration/verification and private application-document routes have existing security tests; the selected tests were rerun.

## Confirmed defects fixed

1. Student profile used hard-coded sample identity, education, employment, passport and test data. Removed sample defaults and the sample-education fallback; failed loads no longer substitute samples and disable saving.
2. Profile UI called PUT `/api/student-portal/profile`, but that route had only GET. Implemented authenticated GET/PUT using the existing StudentProfileSection table, server-owned student identity, bounded allowlisted payloads and transactional persistence.
3. Student profile used the staff portal store token rather than the student auth context. Switched this screen to the student context and cookie-capable requests.
4. Manual counselling capture marked any supplied section complete. It now validates the shared required fields and conditional details before assigning a complete status.
5. Apply readiness accepted completion flags or minimal derived records (e.g. a student name as complete personal information). It now validates actual section snapshots; malformed JSON and partial records fail closed.
6. Required document presence was not checked by that readiness gate. Added actual stored-file checks, latest-version rejection handling, and conditional passport/test/refusal/work/sponsor evidence requirements. Pending review is permitted; a student upload is not represented as counselor verification.
7. Document UI compared uppercase categories against mixed-case upload API categories. Normalised lookup keys and shared conditional requirements with the server gate.
8. English tests and admission preferences now support additional repeatable entries. Validation checks every entry, including empty added rows.
9. Profile section completion indicators use shared validation instead of the old, inconsistent per-screen booleans.
10. Empty intake strings were incorrectly eligible to be classified as January in the facet parser. Empty values are now skipped.

No schema migration was introduced; all persistence uses existing tables.

## Known gaps / unresolved acceptance items

- **Subjects table:** filter suggestions currently use distinct subject areas from public course records. No dedicated Subject model/table was found in the main Prisma schema. A curated subject-master implementation and migration remain outstanding.
- **Complete field-by-field parity:** the legacy student UI, canonical form schema, and manual counselling UI still need a full parity review, particularly structured country/state/city/zip addresses, country-code selectors, exact selector vocabularies, and all education start/end date requirements. The new adapter connects persistence and validation; it does not prove every requested control exists identically on every screen.
- **Full stitcher parity:** student English/admission entries are repeatable, but manual counselling capture still uses its existing flat-section UI. Do not claim unlimited repeatable parity across every staff/student surface.
- **Draft timing:** existing public Apply Now creates the application draft only after Form B readiness passes. The request also mentions auto-creating a draft at Form A. A separate resumable pre-application draft vs. completed application state needs explicit implementation if both behaviours are required. Existing dedicated create-draft workflow remains separate.
- **Two intakes per course:** cannot be certified from code alone. Only sourced, verified intake dates should be published; no Jan/May/Sep dates were fabricated to satisfy a count.
- **Provider acceptance:** email confirmation, team notifications, WhatsApp delivery, optional SMS verification and n8n need configured-provider integration checks. Optional phone OTP was not added.
- **Legacy profiles:** readiness deliberately no longer trusts old complete flags without valid section payloads. Affected profiles need review/re-save rather than automatic completion.
- **Database/browser integration:** transaction behaviour, student/counselor/partner journeys, private file storage and complete application flow still need acceptance against a configured MySQL database and browser.

## Verification executed

- 108 tests passed across 11 selected test files: new Form B completion/profile-route tests, registration acquisition/verification/client routing, phone normalisation, university intake window, application document review/security, student create-draft and public course routes.
- Standalone TypeScript check passed for the four shared form helper modules.
- Scoped ESLint passed for changed form/profile/readiness/facet modules and new tests.
- `git diff --check` passed.
- `npx prisma generate` failed while fetching the schema engine from `binaries.prisma.sh` (network unavailable). Consequently no full production build or complete application typecheck was certified.

Tests use mocks/synthetic records; they are not evidence of live provider delivery or production data completeness.
