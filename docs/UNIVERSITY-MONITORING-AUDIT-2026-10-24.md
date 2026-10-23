# ALO University & Official Data Monitoring Agent — implementation audit

Date: 2026-10-24 · Branch: `arena/a37d47ac-alo-web-crm-tech`

## Release decision: NOT READY — implementation remains partial

No production deployment, database connection, live university research, newly verified records, or complete end-to-end acceptance rounds occurred. `DATABASE_URL` and `TEST_DATABASE_URL` are absent. Prisma client generation/schema validation/build fail while retrieving the required engine from `binaries.prisma.sh` (TLS/network failure); the generated client is unavailable. Official university/government domains are outside this workspace's outbound-host allowance. A successful HTTP response, a published row, or an exhausted HTML link graph is **not** proof of complete university catalogue research.

Existing Form B, course-finder and brand changes were preserved. This audit is separate from `COURSE-FINDER-FORMS-AUDIT-2026-10-24.md`.

## Audit-first implementation: existing infrastructure reused

The repository already had OfficialSource, SourceSnapshot, OfficialDocument, department/faculty and history models, MonitoringJob/MonitoringLog, VerificationRun, DataChange/DataChangeValue/DataConflict, ApprovalQueueItem/ApprovalAction, a seven-day runner, a cron route, monitoring screens, approval gates, field mapping and cache invalidation. These were not recreated. Existing canonical CRM university/course/scholarship tables and publication predicates remain the catalogue source of truth. Legacy page tables still exist and compatibility monitoring is retained; this work is not a completed data migration.

No Prisma schema changes, new scheduler, migration, competing catalogue tables, or fake seeded university records were introduced.

## Implemented changes

- **Resumable discovery:** bounded same-host HTTPS HTML traversal follows catalogue pagination and candidate faculty, department, programme and document links. Query parameters are preserved except tracking parameters; fragments are removed. MRes/MPhil/PhD/top-up terms have explicit candidate buckets. `data-href` is not treated as a real anchor href.
- **Durable checkpoints:** the existing append-only MonitoringLog holds discovery state and progress. Incomplete frontiers remain due; processing resumes from persisted state. Two catalogue batches per cycle prevent unbounded work. Failed initial source fetches no longer consume those discovery slots.
- **Honest coverage:** discovery always has `catalogueVerified: false`. `LINK_GRAPH_EXHAUSTED` means only that the bounded HTML graph was exhausted, not that all courses, PDFs, dynamic filters, eligibility or alternate official domains were verified. Candidate discoveries do not create public programmes.
- **Evidence UI:** Super Admin-only `GET /api/university-monitoring/catalogue?sourceId=…` and an evidence dialog show checkpoint counts, URLs, blockers and special-programme candidates without claiming verification. Invalid/unavailable evidence fails closed.
- **Monitoring eligibility:** default verified-only scope now includes canonical published/verified CRM records in addition to existing legacy page records, with slug sets avoiding duplicate membership. It still monitors registered official sources; it does not invent sources for an unregistered university.
- **Recheck ownership:** compare-and-set claim and completion/failure guards prevent concurrent or terminal-item rechecks from overwriting another decision. Prior evidence is retained in ApprovalAction metadata. Database/save failures produce a sanitized 503 response. Failed rechecks preserve production data and require review.
- **Canonical Knowledge search:** approved/verified/source-linked CRM publication predicates replace legacy page search. Year-qualified September 2027/January 2028 and MRes/top-up intent have tests. Structured university results must have a course satisfying the same programme/intake constraints. Natural-question punctuation no longer becomes a spurious subject filter. This is deterministic catalogue retrieval, **not** a complete natural-language, policy/document or weekly-change answering agent.
- **Access controls:** student/partner identities cannot gain monitoring mutation access merely through contradictory role labels; impersonated sessions cannot approve. Legacy `/api/official-sources` POST now delegates to the canonical Super Admin source-registration path and strips client-supplied verification claims. Source registration is pending-only. Mutations retain origin checks.
- **Scheduler reliability:** initialization failure now schedules a prompt retry rather than postponing work for seven days. Mocked persistence tests cover due/disabled gates, exclusive leases, expired-lease recovery, successful scheduling/report auditing, retry and empty-coverage PARTIAL status. These tests are not real database concurrency certification.
- **Dashboard integrity:** counts now use canonical CRM university/course rows. No job/run evidence, partial coverage and outstanding review/failure conditions cannot appear healthy. An expired running lease shows error. Counters explicitly describe stored record statuses rather than completed university research. Recheck queue counts use the actual RECHECK_REQUESTED state.
- **Prior brand compatibility:** two outdated design-token assertions were aligned with the already requested blue/orange/black/gray palette; the 17-test design-token file now passes. No brand changes were reverted to satisfy obsolete assertions.

## Verification evidence

Machine-readable record: `docs/UNIVERSITY-MONITORING-FOCUSED-VERIFICATION-2026-10-24.json`.

| Check | Observed result |
|---|---|
| Five consecutive focused unit runs after the final code fixes | **171 passed, 0 failed per run**, 16 files, 5 runs |
| Full final `npm test` | **2698 passed, 3 failed, 28 skipped**; 227 files passed, 14 failed, 2 skipped |
| Remaining full-suite failures | Missing `.prisma/client/default` causes suite import failures and three individual failures; these are NOT recorded as passing |
| Full final `npm run lint` | Passed, exit 0 |
| `tsc --project tsconfig.monitoring-pure.json --noEmit` | Passed for pure discovery/source-policy/publication helpers |
| `npm run typecheck` | Failed generated-client preflight; not certified |
| Scoped monitoring TypeScript | Failed: `src/lib/db.ts` cannot import unavailable `PrismaClient` |
| `npm run build` | Blocked at required Prisma engine download |
| `npx prisma validate` | Blocked at required Prisma engine download |
| `git diff --check` | Passed |
| Real DB migrations/API concurrency/browser/integration/public–CRM–Knowledge synchronization | Not verified |
| Five COMPLETE requested acceptance rounds | **0**; five focused unit runs do not satisfy this requirement |

Vitest emits a nonfatal ESM/CommonJS configuration warning. No placeholder Prisma client, skipped failing unit assertions, fake database credentials or fabricated live records were used to force a green result.

Reproduce the focused selection:

```sh
npx vitest run tests/unit/university-monitoring-*.test.ts tests/unit/catalogue-*.test.ts tests/unit/design-tokens.test.ts
npm run lint
npx tsc --project tsconfig.monitoring-pure.json --noEmit
```

After configuring secure database/test-database environments and resolving engine availability, run the repository's real client generation, client verification, typecheck, schema validation/migration checks, full tests and production build. Do not apply migrations without inspecting the existing database and migration state. Then perform real API/browser/RBAC/scheduler/approval/history/cache/surface synchronization testing and five complete rounds, restarting the rounds after fixes.

## Requested 29-item evidence/status register

“0 new” below means no live research/verification or production mutation in this session. It is **not** a claim that the existing database is empty. Existing live totals are unknown without DB access.

| # | Metric / deliverable | Evidence-based status |
|---|---|---|
| 1 | Independently verified universities | 0 new; live total unknown; no completed university catalogue attestations |
| 2 | Verified faculties | 0 new; live total unknown |
| 3 | Verified departments | 0 new; live total unknown |
| 4 | Verified programmes | 0 new; live total unknown; discovery links are not programmes |
| 5 | Verified scholarships | 0 new; live total unknown |
| 6 | Official sources researched/verified | 0 new; registered-source live total unknown |
| 7 | Official documents researched/verified | 0 new; live total unknown; no PDF ingestion implemented |
| 8 | Top-up programmes | 0 newly verified; live total unknown; candidate recognition tested |
| 9 | MRes programmes | 0 newly verified; live total unknown; candidate/search recognition tested |
| 10 | MPhil programmes | 0 newly verified; live total unknown; candidate recognition only |
| 11 | PhD programmes | 0 newly verified; live total unknown; candidate recognition only |
| 12 | Postgraduate programmes | 0 newly verified; live total unknown |
| 13 | Undergraduate programmes | 0 newly verified; live total unknown |
| 14 | January 2027–January 2028 and future intakes | 0 newly verified; live total unknown; September 2027/January 2028 query tests are synthetic, not availability evidence |
| 15 | Fees | 0 newly verified/updated; live total unknown |
| 16 | Entry/language/application requirements | 0 newly verified/updated; live total unknown |
| 17 | Scheduled jobs / executed jobs | Existing stable job ID `university-monitor-7d` reused in code; actual job rows unknown; 0 real monitoring jobs executed here |
| 18 | History/document versions | 0 new live versions; live total unknown; recheck audit-history behavior unit-tested; document capture/version pipeline remains absent |
| 19 | Pending approvals | Live total unknown; 0 real pending items created here |
| 20 | Conflicts | Live total unknown; 0 real conflicts created here |
| 21 | Failed sources | Live total unknown; no official sources fetched; full-suite/tool failures are listed separately above |
| 22 | Last monitoring run | Unknown; no DB-backed run executed here |
| 23 | Next monitoring run | Unknown; do not substitute a calculated date for persisted nextRunAt |
| 24 | Tests / five rounds | 171 focused tests passed in each of 5 runs; full suite not green; 0 complete end-to-end acceptance rounds |
| 25 | Changed/new monitoring files | Inventory below; separate prior Form B/brand work preserved |
| 26 | Schema/migrations | No schema change or new migration; real schema validation/migration compatibility not verified |
| 27 | APIs | New admin catalogue-evidence GET; existing dashboard/recheck/search and legacy source POST hardened; full authenticated DB-backed API certification outstanding |
| 28 | Permanent scheduler | Existing persisted seven-day job, lease/recovery/cron runner reused; initialization-retry bug fixed and behavior mocked-tested; deployment/cron invocation/real lease fencing unproven |
| 29 | Deployment/readiness and remaining requirements | Not deployed; NOT READY; blockers and unfinished implementation listed below |

## File inventory for this monitoring work

New source files:
- `src/lib/official-crawlers/catalogue-traversal.ts`
- `src/lib/official-crawlers/catalogue-monitoring.ts`
- `src/app/api/university-monitoring/catalogue/route.ts`

Modified source files:
- `src/lib/university-monitoring-auth.ts`
- `src/lib/university-monitoring-engine.ts`
- `src/lib/university-monitoring-runner.ts`
- `src/app/api/university-monitoring/dashboard/route.ts`
- `src/app/api/university-monitoring/recheck/route.ts`
- `src/app/api/university-monitoring/search/route.ts`
- `src/app/api/official-sources/route.ts`
- `src/components/alo/views/university-monitoring.tsx`

New unit tests:
- `tests/unit/catalogue-traversal.test.ts`
- `tests/unit/catalogue-monitoring-persistence.test.ts`
- `tests/unit/university-monitoring-access.test.ts`
- `tests/unit/university-monitoring-dashboard.test.ts`
- `tests/unit/university-monitoring-knowledge.test.ts`
- `tests/unit/university-monitoring-recheck-race.test.ts`
- `tests/unit/university-monitoring-runner.test.ts`

Other changes: `tsconfig.monitoring-pure.json`, this audit and its verification JSON; `tests/unit/design-tokens.test.ts` updated for the prior requested brand palette. No commits or deployment were needed to preserve workspace changes.

## Unfinished work and release blockers

1. **Environment:** real database/test database, generated Prisma client/engine availability, official-site outbound research access and a production scheduler/deployment target. No secrets should be entered in chat.
2. **Research completeness:** independent official catalogue checks, all relevant faculty/department/programme directories, filtered/dynamic pagination, international eligibility, alternate official domains and evidence-backed reconciliation. No university has been marked catalogue-verified.
3. **Documents and immutable evidence:** actual PDF download, extraction, reuse of central OFFICIAL storage/version metadata, immutable full-page snapshots, document hashes/versions and document-to-field provenance. Current traversal stores metadata, text hashes and candidate URLs, not immutable HTML/PDF bodies.
4. **Discovery-to-review workflow:** candidate programme/faculty/department links need verified structured extraction, canonical identity/dedup reconciliation and an approved materialization process. Unsupported manual catalogue fields continue to fail publication closed.
5. **Rechecks/conflicts:** independent alternative-official-source comparisons, date-aware conflicts and administrative resolution need fuller implementation. Current rechecks refresh the configured source only.
6. **Runtime hardening:** DNS-to-connection pinning, production retry/lease fencing and recovery under real database concurrency/restarts require completion/certification. A lease check before finalization is not proof that all intermediate external work was fenced.
7. **Knowledge breadth:** complete approved policy/document/requirements/weekly-change answers, source citations and consistent retrieval through every student/partner/counselor/marketing/AI consumer remain unverified. Deterministic catalogue search is not a substitute for these capabilities.
8. **Reports and publication:** existing report/audit persistence is reused, but actual Super Admin delivery and every AI/Knowledge/Audit surface, immutable field histories, rejection/no-op guarantees and cache fan-out must be tested against real data. There is no claim of complete cross-platform synchronization.
9. **Acceptance:** full TypeScript, migration/schema, build, API, RBAC, browser, scheduler restart, dedup, detection, approval/rejection/recheck, failures/conflicts, history and cross-surface checks, followed by five complete consecutive verification rounds after the final fix. These remain mandatory before claiming completion.
