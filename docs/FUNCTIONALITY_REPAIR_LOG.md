# Functionality repair log — 2026-10-01, local working tree

Status: **PARTIAL**. No production deployment/write, migration, send, worker activation or historical-data repair. Source defects were reproduced with isolated tests; database/provider doubles are test-only, never production fallbacks. Full browser/database journeys remain unverified.

## Reproduced and minimally repaired

| ID | Defect / root cause | Repair | Regression evidence | Impact / remaining gate |
|---|---|---|---|---|
| F-01 | Student payment POST trusts status=paid and sets paidAt | Strict pending-only positive finite numeric request; reject extra target/settlement fields; preserve own profile.id | payment-functionality: paid/forged ID/invalid amounts denied; own pending accepted | Prevents self-attested settlement. Pending row is not provider proof, invoice or ledger obligation |
| F-02 | Student payment mutation and best-effort audit separate | Same interactive transaction + existing writePortalAudit; failure propagates, generic error | Required audit failure leaves zero committed test-double writes | Real rollback/column capacity needs DB rehearsal. No global audit policy changed |
| F-03 | CRM finance generic authentication exposes organization payments | Existing withAuth role gate; FINANCE/finance/finance_officer/CEO/ceo + retained admin bypass | Legacy and seeded EMPLOYEE-role positive tests; student/partner/counselor/HR/branch denial | Read/create role gate only; branch-specific finance policy and full lifecycle unresolved |
| F-04 | CRM missing-table returns success=true and [] | Generic 500 failure; no database detail in response/log for GET | Unknown-table test asserts failure | Existing consumers still need complete error/empty state work |
| F-05 | Student list accepts NaN/unbounded pagination/arbitrary sort | Bounds and allowlisted sort; own-profile scope preserved | Invalid page/limit/sort denied; valid page-2 query retained | Not global query/pagination certification |
| F-06 | Student payment UI fake history on empty/error, wrong date/amount/status shape, bearer-only fetch, stale records | Strict real API mapping; cookie/Bearer support; loading/error/retry/empty; page navigation; abort and owner-key isolation; explicit currency; no fabricated guides/payment status | student-payment-history: empty, error, malformed, pagination/auth/signal/format; source guard against fake history | Unit/request contracts, NOT browser execution. Receipt upload/download explicitly unavailable; counselor button uses existing messages view |
| F-07 | Weekly AI endpoint invents tuition changes/evidence and claims official scan | Auth preserved, explicit 503 DISABLED; no DB read/write or completed scan | false-success-quarantine: failure reproduced then authenticated disabled + no writes | Quarantine, not implemented scanning. Historical fabricated rows require approved investigation, not automatic deletion |
| F-08 | Storage upload creates metadata but never persists bytes; fabricates metadata on DB error | Auth preserved, GET/POST explicit 503 DISABLED | false-success-quarantine: failure reproduced; no metadata write, anonymous rejected | Quarantines only this incomplete endpoint. Does not wire arbitrary entity IDs into another storage service or erase existing records |
| F-09 | CEO dashboard fabricated revenue fallback, fixed conversion/growth/ROI and counselor performance; generic auth | Executive role gate; honest DB counts with accurate labels; unavailable financial/ROI/ranking metadata; DB error propagates | ceo-dashboard-functionality: 8 failures before repair, 8 pass after; actual zero/counts, denied roles, high-risk error | Counts are not enrollment/conversion proof; no invented accounting. UI displays unavailable/error, maps icon strings, suppresses fictional growth and disables unwired export |

| F-10 | CRM finance POST partially parses amounts and best-effort audit may fail after record commit | Strict input contract (numeric or complete decimal string), generic errors, required same-transaction audit | Extended payment tests: 4 new failures before fix; all 42 payment handler tests now pass | Existing staff status contract retained, not settlement proof; canonical target, due-date semantics and lifecycle still blocked |
| F-11 | Document handler assumes every portal session is staff, allowing portal students global reads/reviews | Treat portal STUDENT and StudentSession consistently; derive canonical owner by authenticated user; reject forged target and all student review | document-portal-student-scope: 5 fail/2 pass before, expanded 9 pass after; own/other/missing/admin/anonymous/bearer | Only ownership defect repaired. Non-student staff/partner assignment scope, metadata-only upload and audit atomicity still unresolved |

Payment test reproduction before first repair: **18 failures / 9 passes**. Expanded payment and presentation tests: **46 pass**. Quarantine reproduction: **2 failures / 1 pass**, then **3 pass**. Executive reproduction: **8 failures**, then **8 pass**. These subsets overlap the full suite; do not add again.

## Confirmed source defects still open

These are repository defects, not merely missing credentials. No assertion they were exploited in production.

| ID | File/path | Finding | Status / next action |
|---|---|---|---|
| O-01 | student-portal/dashboard + payments + crm/finance | profile code vs profile.id vs Student.id payment key inconsistency | BLOCKED: production identity/namespace reconciliation; preserve keys until reviewed mapping |
| O-02 | crm/finance POST | Remaining arbitrary staff status/target; no settlement reference/idempotency (amount parsing and transactional audit repaired F-10) | BLOCKED: approved canonical target/financial transitions, settlement/refund/idempotency and real DB tests |
| O-03 | crm/finance summary | Sums currencies together; overdue counts any non-empty due date, not actually overdue | BLOCKED: per-currency totals, approved date semantics; do not invent FX |
| O-04 | CrmFinancePage/CrmCommissionsPage | Silent failed fetch, first-100/page-only counts, unwired Eye button; commissions view fetches payments, not commission lifecycle; completed vs paid status mismatch | BLOCKED: trace intended commission entity and API, UI transaction/error/pagination tests |
| O-05 | crm/leads route | Generic auth/no assignment scope; table failure→empty success; ID and lifecycle race/atomicity risks in alternative /api/leads | BLOCKED: role/scope/identity policy and transaction-level tests; no Create Lead PASS |
| O-06 | documents route | Portal-student ownership repaired F-11; non-student assignment scope and metadata-only “uploaded” state remain; non-atomic timeline/audit; review status broad | BLOCKED: staff/partner scope, bytes/checksum/access path, transaction/reversal policy |
| O-07 | student-portal/mock-tests | DB credit failure grants 3 fictional credits; credit check/deduct/session non-atomic; missing-credit/failure allows test start | BLOCKED: approved free-tier/credit ownership, atomic consume/start/idempotency, fail closed on persistence failure |
| O-08 | storage-service.ts | cwd-relative private storage and arbitrary entity association require runtime persistence/owner verification | BLOCKED: provider private root + path/permission/retention/restore plan; no root guessed |
| O-09 | super-admin-dashboard.tsx and wider dashboards | Branch revenue allocated from fixed share; numerous static/demo marker candidates elsewhere | BLOCKED / NOT VERIFIED: trace each KPI to real model, query, time window and permissions |
| O-10 | HR/payroll/commission/ledger | Overlapping payroll entry points, graph-free legacy transitions, no integrated settlement/journal/refund chain | BLOCKED: see financial audit; no accounting fabricated |
| O-11 | worker.ts and independent HTTP automation | Race-prone lock, swallowed outcomes, placeholders; several cron paths do not exist | DISABLED worker definitions; other paths NOT VERIFIED; no jobs enabled |
| O-12 | graded question/session builder | No traced end-to-end question builder with Jaccard duplicate and answer-leakage guarantees found | NOT VERIFIED: distinguish interview guidance from graded answers, complete static/runtime trace; don't claim feature absent solely from text search |
| O-13 | remaining inventory signals | Thousands of lexical TODO/mock/null/catch/suppression markers include legitimate tests/static content and true defects | NOT VERIFIED: per-file semantic triage still required; no blanket deletion |

## Verification and deployment boundary

Current command results live in [verification.json](functionality/verification.json) and [FINAL_PRODUCTION_STATUS.md](FINAL_PRODUCTION_STATUS.md). Initial local gate was 422 pass/7 skip; it preceded the final quarantine/executive changes and is historical, not final coverage. Final rerun after F-10/F-11: npm test **449 pass / 7 skip**; integration **22 pass / 7 skip** (overlapping); lint **0 errors / 23 warnings**; npm audit **0 vulnerabilities**. Typecheck/build are locally blocked by Prisma engine TLS download; earlier CI success verifies only `9e504ad2`.

All changes stay in the session branch working tree. No new commit/push/CI/deploy claim until recorded explicitly. An unknown external Hostinger deploy-on-push integration must be ruled out before pushing repaired code. No history/migration/dependency/workflow rewrites made in this batch.
