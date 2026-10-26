# Language Prep implementation and verification

Review date: 26 October 2026 (Asia/Dhaka). Base: `5f031d8fc62d35f2c51bb13ebb9b12760fab13b3`.

## Scope and reuse

The existing desktop and mobile `PublicNavbar` already link to `/language-prep`. Existing landing, dynamic detail, comparison, counselling-lead API, EnglishPrepTest model, requirement explorers, exam CTAs and course-finder workflows are extended rather than replaced. Student Dashboard files are unchanged. No dependency was added.

The catalogue now includes all fourteen requested families: IELTS, IELTS UKVI, PTE Academic, OIETC–ELLT, TOEFL iBT, Duolingo, LanguageCert, Kaplan, OET, Cambridge CAE/CPE, GRE, GMAT, SAT and ACT. Existing Oxford ELLT and MOI guidance remain, for sixteen entries total. MOI is not described as an English test.

Shared cards use a white background, blue border, accessible orange heading, orange CTA, real local photographs and canonical detail links. Landing and detail pages include a fourteen-family comparison with duration, result schedule, scoring, provider fee guidance and qualified university/visa acceptance. Detail pages include five preparation steps with test-specific focus. Existing planners and operational preparation resources remain.

Three existing, visually inspected 1920px photographs are reused. They are illustrative photography, not evidence of ALO students or outcomes. No provider video is embedded. Each major landing/detail content section uses a photograph. Browser screenshots and device interaction are separate acceptance checks; HTTP rendering alone does not verify these.

Published student stories require both `published` status and approved consent. Public queries select only display fields. No supplied hypothetical score/visa story is published as a real case. Empty story sections explain the absence of approved records.

## Data and migration

`20261026153000_language_prep_catalog/migration.sql` adds missing reference records to the existing `english_tests` table. Each insert checks both slug and ID; existing content, IDs, status and history are preserved. No table is duplicated and no record is deleted or updated by this migration. Newer verified database facts take precedence over the dated editorial reference.

Apply with the existing `npm run db:deploy` only after the normal database backup and deployment review. Existing migrations must already be applied. This audit has not applied the migration to production. The isolated database integration test checks all fourteen requested slugs after migrations, but skips explicitly without an approved test database URL.

Rollback: revert the application commit and rebuild. Keep inserted catalogue rows and history; archive an entry through the established administrative workflow if required. Do not delete employee, student, lead or historical records. The schema itself is unchanged.

## Sources and editorial corrections

The supplied Edvoy exams page could not be retrieved during this review. Its contents are not claimed as inspected or copied. ALO copy is original and uses the requested structure with current primary-provider facts. Source links and a review date are attached to test records.

- IELTS: https://ielts.org/take-a-test/why-choose-ielts/ways-to-take-ielts
- IELTS UKVI: https://ielts.org/take-a-test/test-types/ielts-for-ukvi
- PTE: https://www.pearsonpte.com/pte-academic/
- ELLT: https://oxfordellt.com/ellt-global/test-takers/
- TOEFL 2026 scoring: https://www.ets.org/toefl/test-takers/ibt/scores/understand-scores.html
- TOEFL content: https://www.ets.org/toefl/test-takers/ibt/about/content.html
- Duolingo: https://englishtest.duolingo.com/
- LanguageCert: https://www.languagecert.org/en/about-us/faq/languagecert-academic-faq
- Kaplan: https://www.kaplanenglishtest.com/test-guide/
- OET: https://oet.com/test/results-and-scoring (direct page access restricted; no unverified result-day promise added)
- Cambridge: https://www.cambridgeenglish.org/exams-and-tests/qualifications/results/
- GRE: https://www.ets.org/gre/test-takers/general-test/scores/get-scores.html
- GMAT: https://www.mba.com/exams/gmat-exam/register
- SAT: https://satsuite.collegeboard.org/sat/whats-on-the-test/structure
- ACT: https://www.act.org/content/dam/act/unsecured/documents/act-enhancements-educator-guide.pdf
- UK evidence requirements: https://www.gov.uk/student-visa/knowledge-of-english

TOEFL's 2026 reporting is distinguished from the old scale; ELLT is not described as simply pass/fail; test timings/results are qualified by version and delivery mode. Prices are linked to provider booking information instead of inventing local fees. Admission acceptance is not presented as automatic visa eligibility.

## Verification at this checkpoint

- Lockfile installation: passed.
- Prisma generation: passed; existing generated client contains 604 models.
- Changed-file ESLint: passed, zero diagnostics.
- Focused tests: 31 passed, one database test explicitly skipped without a test connection.
- `git diff --check`: passed.
- Production webpack compilation: passed. Complete build/typecheck is still running at this checkpoint; this is not a full-build PASS claim.
- Read-only production HTTP smoke: pending the final build. Reusable runner: `python3 scripts/verification/language-prep-http-smoke.py http://127.0.0.1:3211`.
- Live database migration/persistence, counselling delivery, browser/mobile interaction and production deployment: not verified in this environment.

An initial 4GB standalone typecheck exhausted its heap. Later checks use Node 22 and a larger heap; this is reported rather than labelled as a code/typecheck pass.

This report covers Language Prep. It is not an assertion that every earlier CRM, HR, partner or external integration requirement has passed a repository-wide production acceptance audit.
