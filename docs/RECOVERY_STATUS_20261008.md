# ALO Education recovery audit — 2026-10-08 UTC

## Release status: NOT READY

This is an evidence report, not a completion certificate. The repository contains implementation files, historical copies, seeds and readiness documents; their presence does not establish successful deployment, database migration, provider setup or working user journeys.

## Source and coverage

- Current remote main: `c8f1db1f84da2b7b22cf2add8493dd42d217f626` (PR #41).
- Full recursive remote inventory: 6,086 blob files, 8,023 entries including directories; not truncated.
- Local source-focused static audit: 2,623 files inventoried, 2,502 text-scanned, 121 metadata-only; 2,108 active source files, 392 canonical pages, 892 API files, 1,442 API methods. Generated/static pages in a build have a different meaning from canonical page files.
- Static analysis found 6,320 risk-marker occurrences. These are review candidates, not 6,320 proven defects or executed tests.
- Large historical copies and stored documents were inventoried remotely rather than fully downloaded and reviewed. No claim is made that every file or guideline has received a semantic review.
- Current deployment guidance reviewed: `HOSTINGER-RUNTIME-STANDARD.md`, `PRODUCTION-READINESS.md`, `docs/PRODUCTION-READINESS-RECONCILIATION.md`, master audit/requirements traceability and student-ID guide. The large cumulative `CLAUDE.md` was sampled and requirement-indexed; it was not fully reviewed line by line.

## Live observations

Read-only checks of https://aloeducation.com on 2026-10-08 UTC:

| Surface | Observed result | What this establishes |
| --- | --- | --- |
| Homepage document | HTTP 200; rendered headings; no captured browser page exception | The document loads; this does not prove its data-backed sections work |
| `/api/health` | HTTP 200, `database.connected: true` | A simple SQL connectivity probe passes |
| `/api/course-finder/universities?limit=3` | HTTP 500, `Failed to fetch universities` | University directory is failing at runtime |
| `/api/course-finder/courses?limit=3` | HTTP 500, `Failed to fetch details` | Course directory is failing at runtime |
| `/api/website/homepage` | HTTP 500 in actual browser requests | Homepage data fails despite the document returning 200 |
| `/api/website/cms-content` | HTTP 503 in actual browser requests | Managed content is unavailable |
| `/api/universities`, `/api/course-finder` | HTTP 500 in actual browser requests | Additional directory requests fail |

The exact production database/provider exception is unavailable in public responses. Missing tables/columns, migration drift and other database-query failures are possible, but are not confirmed. A connection check alone cannot distinguish them. Server logs immediately following these requests and a production migration-status/schema inspection are required.

The supplied successful Hostinger build was for `4d2d39c...`. It is not evidence that `c8f1db1...` has deployed. No currently callable Hostinger hosting tool was available in this session; no production migration, seed or deployment was performed.

## Confirmed source integration defects

- The legacy WhatsApp Command Center expects `key`, `messages` and `totalMessages` from `/api/inbox/unified`; that route returns `id`, thread summaries and `total`. The route and screen exist, but their contracts do not match.
- Its document action submits JSON filename/type/size, not file bytes. A metadata record is not an uploaded document. The authenticated canonical UCC upload screen/API already use multipart bytes; the legacy screen still requires integration work.
- Historical service-worker caching can retain API/session responses. The prepared replacement limits caching to public assets and uses the network for navigation and APIs.
- The existing live readiness check probes SQL connectivity without checking the critical models used by failed pages. The prepared readiness change checks university, course, student, staff, document and CMS models and returns 503 on any failure.
- CSV/seed files in GitHub do not prove their rows are imported, current, verified and published in the production database. No all-universities/all-courses import claim is made.

## Prepared local changes

Public route aliases, university ID/hero improvements, portal root navigation, PWA cache restrictions, stronger readiness checks and signed WhatsApp media ingestion have been prepared locally. Media ingestion downloads real provider bytes, bounds size, checks MIME and SHA-256, stores private files, uses actual database student matches, records review-pending documents and queues OCR rather than claiming OCR has completed.

Recovered partner-tenant changes require a new production migration: partner roles, tenant multi-user profiles and seat overrides. Authentication now selects the new role field. **Do not deploy these changes before applying and verifying the migration on the actual provisioned database.** No fallback to a production SQLite database is authorized or implemented.

Partner invitation/activation is implemented locally, but invitation resend and SMTP/provider integration still require completion and testing. Real messages were not sent during this audit.

## Local validation

- Node 22.23.3 used for the final direct validation commands; generated MySQL Prisma client verified against all 531 models.
- TypeScript `tsc --noEmit`: passed with a 4 GB heap.
- Unit suite: 107 test files, 1,169 tests passed. New tests cover readiness schema failure, private/API cache exclusions, obsolete cache eviction, WhatsApp media authentication, URL trust, size, MIME, hash and document classification, and rejection of empty/truncated runtime manifests.
- Partner B2B and university RBAC integration: 36 tests passed against a disposable local SQLite verification mirror. University monitoring: 15 tests passed separately. These do not prove MySQL concurrency/migration behavior.
- First full production build exited 0 and generated all 988 static pages, but standalone browser startup then failed with a JSON parse error. Its `server/pages-manifest.json` was zero bytes despite the previous verifier reporting success. The verifier now checks build ID and parses runtime manifests. A second complete Next build succeeded; the pages manifest was 58 bytes and valid both before and after standalone preparation, and the strengthened verifier passed. The first corruption was not reproduced and its exact cause remains unknown. An isolated browser smoke test of the rebuilt artifact passed eight pages (homepage, universities, course finder, English tests, visa, partner activation and student/staff login), with no captured page exceptions or failed HTTP responses. Readiness returned 200 with all six module probes passing against the disposable SQLite mirror. Desktop/mobile university hero screenshots were inspected; two low-contrast badges were subsequently corrected and a final build is running. This is not authenticated portal acceptance or production MySQL proof.
- No complete authenticated student/staff/partner browser journeys, production provider exercise, production migration verification or full route-by-route visual acceptance has passed.

## Remaining release gates

1. Obtain actual Hostinger runtime error logs for the failing requests; inspect and reconcile production schema/migration state without destructive reseeding.
2. Verify which commit Hostinger is running and deploy the reviewed current source with Node 22/npm and persistent private-upload storage.
3. Repair the remaining UI/API contract mismatches, including legacy WhatsApp inbox/upload actions; complete and test invitation resend.
4. Import only evidence-backed university/course records, verify source provenance and publication state, and verify the API counts against the production database.
5. Complete MySQL transaction tests and authenticated student/staff/partner journeys with isolated authorized test accounts.
6. Scroll and inspect every public/linked page at desktop/mobile widths; verify hero images, asset loading, forms, button destinations and error/empty states.
7. Exercise WhatsApp webhook verification/media persistence/download access with configured provider credentials; verify OCR worker and other scheduled jobs actually execute.
8. Merge only after migration dependencies and required checks pass; verify the resulting live commit and critical journeys after deployment.

Do not describe this site as complete, fully operational or successfully relaunched based solely on compilation, static generation, a file listing or a README readiness claim.
